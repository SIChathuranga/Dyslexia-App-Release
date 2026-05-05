import asyncio
import hashlib
import io
import os
import secrets
import shutil
import string
import tempfile
import threading
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional

from dotenv import load_dotenv
load_dotenv()  # No-op if .env doesn't exist (HF Spaces uses Secrets UI)

# Ensure ffmpeg is available for Whisper
if shutil.which("ffmpeg") is None:
    # On Windows/local dev, fall back to the imageio-ffmpeg bundled binary
    try:
        import imageio_ffmpeg
        _ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
        _ffmpeg_dir = os.path.dirname(_ffmpeg_exe)
        if _ffmpeg_dir not in os.environ.get("PATH", ""):
            os.environ["PATH"] = _ffmpeg_dir + os.pathsep + os.environ.get("PATH", "")
        _ffmpeg_alias = os.path.join(_ffmpeg_dir, "ffmpeg.exe" if os.name == "nt" else "ffmpeg")
        if not os.path.exists(_ffmpeg_alias):
            shutil.copy2(_ffmpeg_exe, _ffmpeg_alias)
    except ImportError:
        print("⚠️ ffmpeg not found on PATH and imageio-ffmpeg not installed")

import certifi

from bson import ObjectId
from fastapi import Depends, FastAPI, File, Header, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image, ImageOps
from pydantic import BaseModel, Field
from pymongo import ASCENDING, DESCENDING, MongoClient
from pymongo.errors import DuplicateKeyError
from ultralytics import YOLO
import uvicorn
from difflib import SequenceMatcher
from faster_whisper import WhisperModel

# Initialize App
app = FastAPI(title="Dyslexia Learning Assistant Backend")

# Separate thread pools prevent Whisper and YOLO from starving each other
_whisper_executor = ThreadPoolExecutor(max_workers=1)
_yolo_executor = ThreadPoolExecutor(max_workers=1)

# CORS Middleware to allow requests from React Native (IP might vary)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict this to specific domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- CONFIGURATION ----------------
PBKDF2_ITERATIONS = 210_000
SESSION_TTL_DAYS = int(os.environ.get("SESSION_TTL_DAYS", "30"))
MONGODB_URI = os.environ.get("MONGODB_URI")
MONGODB_DB_NAME = os.environ.get("MONGODB_DB_NAME", "dyslearnapp")

# ---------------- HEARTBEAT / KEEP-ALIVE ----------------
# Hugging Face free-tier Spaces sleep after 48h of inactivity.
# This self-ping thread sends a GET request to the app's own health
# endpoint every HEARTBEAT_INTERVAL_SECONDS to keep it awake.
HEARTBEAT_INTERVAL_SECONDS = int(os.environ.get("HEARTBEAT_INTERVAL_SECONDS", "840"))  # 14 min default
SPACE_URL = os.environ.get("SPACE_URL", "")  # e.g. https://<user>-<space>.hf.space

_heartbeat_stop = threading.Event()


def _heartbeat_worker(url: str, interval: int) -> None:
    """Background daemon thread that pings the health endpoint periodically."""
    print(f"💓 Heartbeat started → pinging {url} every {interval}s")
    while not _heartbeat_stop.is_set():
        try:
            req = urllib.request.Request(url, method="GET")
            with urllib.request.urlopen(req, timeout=30) as resp:
                print(f"💓 Heartbeat ping OK ({resp.status})")
        except Exception as exc:
            print(f"💓 Heartbeat ping failed: {exc}")
        _heartbeat_stop.wait(interval)


@app.on_event("startup")
def start_heartbeat() -> None:
    url = SPACE_URL.rstrip("/") if SPACE_URL else ""
    if not url:
        # Auto-detect Hugging Face Space URL from environment
        space_id = os.environ.get("SPACE_ID", "")  # HF sets this automatically
        if space_id:
            url = f"https://{space_id.replace('/', '-')}.hf.space"
    if url:
        health_url = url.rstrip("/") + "/health"
        t = threading.Thread(target=_heartbeat_worker, args=(health_url, HEARTBEAT_INTERVAL_SECONDS), daemon=True)
        t.start()
    else:
        print("💓 Heartbeat disabled — SPACE_URL / SPACE_ID not set (local dev)")


@app.on_event("shutdown")
def stop_heartbeat() -> None:
    _heartbeat_stop.set()


@app.get("/health")
def health_check():
    """Dedicated health-check endpoint used by the heartbeat and external monitors."""
    return {
        "status": "healthy",
        "timestamp": utc_now().isoformat(),
        "model_loaded": model is not None,
    }


def init_mongodb() -> tuple[Optional[MongoClient], Optional[Any]]:
    """Connect to MongoDB and ensure required indexes exist."""
    if not MONGODB_URI:
        print("⚠️ MONGODB_URI not set. Auth and MongoDB progress sync are disabled.")
        return None, None

    try:
        client = MongoClient(
            MONGODB_URI,
            serverSelectionTimeoutMS=30000,
            connectTimeoutMS=20000,
            socketTimeoutMS=20000,
            retryWrites=True,
            tz_aware=True,
            tlsCAFile=certifi.where(),
        )
        client.admin.command("ping")
        db = client[MONGODB_DB_NAME]

        db.sec2_users.create_index([("email", ASCENDING)], unique=True)
        db.sec2_sessions.create_index(
            [("token", ASCENDING)],
            unique=True,
            partialFilterExpression={"token": {"$exists": True, "$type": "string"}},
        )
        db.sec2_sessions.create_index([("expires_at", ASCENDING)], expireAfterSeconds=0)
        db.sec2_attempts.create_index([("user_id", ASCENDING), ("timestamp", DESCENDING)])

        print(f"✅ MongoDB connected ({MONGODB_DB_NAME})")
        return client, db
    except Exception as e:
        print(f"❌ Failed to connect to MongoDB: {e}")
        return None, None


mongo_client, mongo_db = init_mongodb()


def require_db() -> Any:
    if mongo_db is None:
        raise HTTPException(
            status_code=503,
            detail="MongoDB is not configured. Set MONGODB_URI and restart backend.",
        )
    return mongo_db

# Load Whisper Model (faster-whisper: CTranslate2-based, 4x faster, int8 quantization)
WHISPER_MODEL_SIZE = os.environ.get("WHISPER_MODEL_SIZE", "base")
print(f"Loading Whisper model ({WHISPER_MODEL_SIZE}, int8)...")
speech_model = WhisperModel(WHISPER_MODEL_SIZE, device="cpu", compute_type="int8")
print(f"✅ Whisper model loaded ({WHISPER_MODEL_SIZE})")

# Load the trained YOLOv8 model used by the app.
MODEL_PATH = os.environ.get("MODEL_PATH", "best_yolov8_openimages_plus_roboflow_v2-3.pt")

try:
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(f"Required model file not found: {MODEL_PATH}")

    model = YOLO(MODEL_PATH)
    print(f"✅ Model loaded from {MODEL_PATH}")
except Exception as e:
    print(f"❌ Error loading model: {e}")
    model = None

# ---------------- MODELS ----------------
class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=80)
    email: str = Field(..., min_length=5, max_length=120)
    password: str = Field(..., min_length=6, max_length=128)


class LoginRequest(BaseModel):
    email: str = Field(..., min_length=5, max_length=120)
    password: str = Field(..., min_length=6, max_length=128)


class ProgressAttemptRequest(BaseModel):
    word: str = Field(default="", max_length=120)
    isCorrect: bool
    timestamp: Optional[int] = None  # epoch milliseconds


class ProgressImportRequest(BaseModel):
    attempts: list[ProgressAttemptRequest] = Field(default_factory=list)


# ---------------- UTILS ----------------
def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def now_ms() -> int:
    return int(utc_now().timestamp() * 1000)


def normalize_email(email: str) -> str:
    return (email or "").strip().lower()


def validate_email(email: str) -> None:
    if "@" not in email or email.startswith("@") or email.endswith("@"):
        raise HTTPException(status_code=400, detail="Invalid email address.")


def hash_password(raw_password: str, salt_hex: Optional[str] = None) -> tuple[str, str]:
    salt = os.urandom(16) if salt_hex is None else bytes.fromhex(salt_hex)
    digest = hashlib.pbkdf2_hmac(
        "sha256",
        raw_password.encode("utf-8"),
        salt,
        PBKDF2_ITERATIONS,
    )
    return salt.hex(), digest.hex()


def verify_password(raw_password: str, salt_hex: str, expected_hash_hex: str) -> bool:
    _, candidate = hash_password(raw_password, salt_hex=salt_hex)
    return secrets.compare_digest(candidate, expected_hash_hex)


def create_session(db: Any, user_id: ObjectId) -> tuple[str, datetime]:
    token = secrets.token_urlsafe(48)
    expires_at = utc_now() + timedelta(days=SESSION_TTL_DAYS)
    db.sec2_sessions.insert_one(
        {
            "user_id": user_id,
            "token": token,
            "created_at": utc_now(),
            "expires_at": expires_at,
        }
    )
    return token, expires_at


def parse_bearer_token(authorization: Optional[str]) -> str:
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing authorization header.")
    prefix = "Bearer "
    if not authorization.startswith(prefix):
        raise HTTPException(status_code=401, detail="Invalid authorization format.")
    token = authorization[len(prefix):].strip()
    if not token:
        raise HTTPException(status_code=401, detail="Missing access token.")
    return token


def get_auth_context(
    authorization: Optional[str] = Header(default=None),
    db: Any = Depends(require_db),
) -> Dict[str, Any]:
    token = parse_bearer_token(authorization)
    session = db.sec2_sessions.find_one({"token": token})
    if not session:
        raise HTTPException(status_code=401, detail="Session not found. Please log in again.")

    if session.get("expires_at") and session["expires_at"] <= utc_now():
        db.sec2_sessions.delete_one({"_id": session["_id"]})
        raise HTTPException(status_code=401, detail="Session expired. Please log in again.")

    user = db.sec2_users.find_one({"_id": session["user_id"]})
    if not user:
        db.sec2_sessions.delete_one({"_id": session["_id"]})
        raise HTTPException(status_code=401, detail="User account no longer exists.")

    return {"token": token, "user": user}


def serialize_user(user: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": str(user["_id"]),
        "name": user.get("name", ""),
        "email": user.get("email", ""),
    }


def auth_response(user: Dict[str, Any], token: str, expires_at: datetime) -> Dict[str, Any]:
    return {
        "token": token,
        "expiresAt": int(expires_at.timestamp() * 1000),
        "user": serialize_user(user),
    }


def normalize_text(text: str) -> str:
    """Normalize text for comparison: lower, strip, remove basic punctuation."""
    text = text.lower().strip()
    return text.translate(str.maketrans("", "", string.punctuation))


def normalize_word(word: str) -> str:
    return (word or "").strip().upper()


def empty_stats() -> Dict[str, Any]:
    return {
        "wordsLearned": 0,
        "wordsTotal": 0,
        "spellingAccuracy": 0,
        "weeklyStars": 0,
        "weeklyStarsMax": 0,
        "totalAttempts": 0,
        "correctAttempts": 0,
        "weeklyProgress": [],
        "isEmpty": True,
    }


def calculate_progress_stats(attempts: list[Dict[str, Any]]) -> Dict[str, Any]:
    if not attempts:
        return empty_stats()

    normalized_attempts = []
    for attempt in attempts:
        timestamp = int(attempt.get("timestamp") or 0)
        if timestamp <= 0:
            continue
        normalized_attempts.append(
            {
                "word": normalize_word(attempt.get("word", "")),
                "is_correct": bool(attempt.get("is_correct")),
                "timestamp": timestamp,
            }
        )

    if not normalized_attempts:
        return empty_stats()

    word_set = set()
    learned_set = set()
    correct_count = 0

    for attempt in normalized_attempts:
        word = attempt["word"]
        if word:
            word_set.add(word)
        if attempt["is_correct"]:
            correct_count += 1
            if word:
                learned_set.add(word)

    current_ms = now_ms()
    week_ago_ms = current_ms - (7 * 24 * 60 * 60 * 1000)
    week_attempts = [a for a in normalized_attempts if a["timestamp"] >= week_ago_ms]
    week_correct = sum(1 for a in week_attempts if a["is_correct"])

    weekly_progress = []
    today = utc_now()

    for i in range(6, -1, -1):
        day_date = (today - timedelta(days=i)).date()
        day_start = datetime(day_date.year, day_date.month, day_date.day, tzinfo=timezone.utc)
        day_start_ms = int(day_start.timestamp() * 1000)
        day_end_ms = day_start_ms + (24 * 60 * 60 * 1000) - 1

        day_attempts = [
            a
            for a in normalized_attempts
            if day_start_ms <= a["timestamp"] <= day_end_ms
        ]

        day_correct = sum(1 for a in day_attempts if a["is_correct"])
        accuracy = int(round((day_correct / len(day_attempts)) * 100)) if day_attempts else 0

        weekly_progress.append(
            {
                "day": day_start.strftime("%a"),
                "accuracy": accuracy,
                "attempts": len(day_attempts),
            }
        )

    total_attempts = len(normalized_attempts)
    spelling_accuracy = int(round((correct_count / total_attempts) * 100)) if total_attempts else 0

    return {
        "wordsLearned": len(learned_set),
        "wordsTotal": len(word_set),
        "spellingAccuracy": spelling_accuracy,
        "weeklyStars": week_correct,
        "weeklyStarsMax": len(week_attempts),
        "totalAttempts": total_attempts,
        "correctAttempts": correct_count,
        "weeklyProgress": weekly_progress,
        "isEmpty": False,
    }

def contains_whole_phrase(spoken_text: str, phrase: str) -> bool:
    """Match phrase using full token boundaries to avoid partial-word false positives."""
    spoken_tokens = spoken_text.split()
    phrase_tokens = phrase.split()

    if not spoken_tokens or not phrase_tokens:
        return False

    if len(phrase_tokens) == 1:
        return phrase_tokens[0] in spoken_tokens

    window = len(phrase_tokens)
    for i in range(len(spoken_tokens) - window + 1):
        if spoken_tokens[i : i + window] == phrase_tokens:
            return True

    return False


def fuzzy_word_match(spoken: str, expected: str) -> tuple:
    """Multi-strategy fuzzy matching for single-word speech recognition.
    Returns (is_match, best_similarity_score)."""
    THRESHOLD = 0.60
    best_score = 0.0

    # Strategy 1: Direct fuzzy match
    score = SequenceMatcher(None, spoken, expected).ratio()
    best_score = max(best_score, score)
    if score >= THRESHOLD:
        return True, score

    # Strategy 2: Join spoken tokens — handles word-splitting
    # ("left top" → "lefttop" ≈ "laptop")
    spoken_joined = spoken.replace(" ", "")
    expected_joined = expected.replace(" ", "")
    score = SequenceMatcher(None, spoken_joined, expected_joined).ratio()
    best_score = max(best_score, score)
    if score >= THRESHOLD:
        return True, score

    # Strategy 3: Consonant skeleton (phonetic approximation)
    def consonants(w):
        return "".join(c for c in w.lower() if c not in "aeiou ")

    spoken_cons = consonants(spoken_joined)
    expected_cons = consonants(expected_joined)
    if spoken_cons and expected_cons:
        cons_score = SequenceMatcher(None, spoken_cons, expected_cons).ratio()
        best_score = max(best_score, cons_score)
        if cons_score >= 0.75:
            return True, cons_score

    # Strategy 4: Check each spoken token individually against expected
    spoken_tokens = spoken.split()
    if len(spoken_tokens) > 1:
        for token in spoken_tokens:
            score = SequenceMatcher(None, token, expected).ratio()
            best_score = max(best_score, score)
            if score >= THRESHOLD:
                return True, score

    return False, best_score


# Minimum confidence threshold for YOLO detections
MIN_DETECTION_CONFIDENCE = 0.40

# ---------------- ENDPOINTS ----------------

@app.get("/")
def home():
    return {"message": "Dyslexia Learning App API is running"}


@app.post("/auth/register")
def register_user(payload: RegisterRequest, db: Any = Depends(require_db)):
    email = normalize_email(payload.email)
    validate_email(email)
    password = payload.password.strip()
    if len(password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters.")

    now = utc_now()
    salt_hex, password_hash_hex = hash_password(password)
    user_doc = {
        "name": payload.name.strip(),
        "email": email,
        "password_salt": salt_hex,
        "password_hash": password_hash_hex,
        "created_at": now,
        "updated_at": now,
    }

    try:
        result = db.sec2_users.insert_one(user_doc)
    except DuplicateKeyError:
        raise HTTPException(status_code=409, detail="Email is already registered.")

    user = db.sec2_users.find_one({"_id": result.inserted_id})
    token, expires_at = create_session(db, user["_id"])
    return auth_response(user, token, expires_at)


@app.post("/auth/login")
def login_user(payload: LoginRequest, db: Any = Depends(require_db)):
    email = normalize_email(payload.email)
    validate_email(email)
    password = payload.password.strip()

    user = db.sec2_users.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    if not verify_password(password, user.get("password_salt", ""), user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    db.sec2_users.update_one({"_id": user["_id"]}, {"$set": {"updated_at": utc_now()}})
    token, expires_at = create_session(db, user["_id"])
    return auth_response(user, token, expires_at)


@app.get("/auth/me")
def get_me(auth: Dict[str, Any] = Depends(get_auth_context)):
    return {"user": serialize_user(auth["user"])}


@app.post("/auth/logout")
def logout(auth: Dict[str, Any] = Depends(get_auth_context), db: Any = Depends(require_db)):
    db.sec2_sessions.delete_one({"token": auth["token"]})
    return {"message": "Logged out"}


@app.post("/progress/attempt")
def save_progress_attempt(
    payload: ProgressAttemptRequest,
    auth: Dict[str, Any] = Depends(get_auth_context),
    db: Any = Depends(require_db),
):
    event_timestamp = payload.timestamp if payload.timestamp and payload.timestamp > 0 else now_ms()
    attempt_doc = {
        "user_id": auth["user"]["_id"],
        "word": normalize_word(payload.word),
        "is_correct": bool(payload.isCorrect),
        "timestamp": int(event_timestamp),
        "created_at": utc_now(),
    }
    db.sec2_attempts.insert_one(attempt_doc)
    return {"message": "Progress saved"}


@app.post("/progress/import")
def import_progress(
    payload: ProgressImportRequest,
    auth: Dict[str, Any] = Depends(get_auth_context),
    db: Any = Depends(require_db),
):
    if not payload.attempts:
        return {"imported": 0}

    current_ms = now_ms()
    now = utc_now()
    docs = []
    for attempt in payload.attempts:
        timestamp = attempt.timestamp if attempt.timestamp and attempt.timestamp > 0 else current_ms
        docs.append(
            {
                "user_id": auth["user"]["_id"],
                "word": normalize_word(attempt.word),
                "is_correct": bool(attempt.isCorrect),
                "timestamp": int(timestamp),
                "created_at": now,
            }
        )

    if docs:
        db.sec2_attempts.insert_many(docs)

    return {"imported": len(docs)}


@app.get("/progress/stats")
def get_progress_stats(
    auth: Dict[str, Any] = Depends(get_auth_context),
    db: Any = Depends(require_db),
):
    attempts = list(
        db.sec2_attempts.find(
            {"user_id": auth["user"]["_id"]},
            {"word": 1, "is_correct": 1, "timestamp": 1},
        )
    )
    return calculate_progress_stats(attempts)

@app.post("/detect-object")
async def detect_object(file: UploadFile = File(...)):
    """
    Receives an image file, runs YOLOv8 detection.
    Returns the object with the highest confidence.
    """
    if not model:
        raise HTTPException(status_code=500, detail="Model not loaded")

    try:
        # Read image 
        contents = await file.read()
        image = ImageOps.exif_transpose(Image.open(io.BytesIO(contents)))

        # Run YOLO inference in a thread so it doesn't block the event loop (Run in separate thread because YOLO is blocking and takes time to process)
        loop = asyncio.get_event_loop()
        results = await loop.run_in_executor(_yolo_executor, lambda: model(image)) 
        
        # Process results — take the detection with highest confidence above threshold
        best_box = None
        max_conf = -1.0 
        
        for r in results:
            boxes = r.boxes
            for box in boxes:
                conf = float(box.conf[0])
                cls_id = int(box.cls[0])
                label = model.names[cls_id]
                #find the object with the highest confidence above threshold (if detected more than one object)
                if conf > max_conf and conf >= MIN_DETECTION_CONFIDENCE:
                    max_conf = conf
                    best_box = label
        #return the object with the highest confidence above threshold
        if best_box:
            return {
                "label": best_box,
                "confidence": max_conf,
                "message": "Object detected"
            }
        else:
            return {
                "label": None,
                "confidence": 0.0,
                "message": "No object detected"
            }

    except Exception as e:
        print(f"Error in /detect-object: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/speech-to-text")
async def speech_to_text(file: UploadFile = File(...)):
    """
    Get an audio file from the app.
    Convert the child's voice into English text.
    Send the text back to the app.
    """
    if not speech_model:
        raise HTTPException(status_code=500, detail="Speech model not loaded")
        
    try:
        # Take the file extension from the uploaded audio file.
        # If the file has no name, use ".m4a" as the default extension.
        safe_ext = os.path.splitext(file.filename or "audio.m4a")[1] or ".m4a"

        # Only allow a short normal extension. 
        # This avoids unsafe or strange file names.
        safe_ext = safe_ext if safe_ext.isascii() and len(safe_ext) <= 10 else ".m4a"

        # Create a temporary audio file on the server.
        # Whisper needs a real file path, so we save the upload first.
        fd, filename = tempfile.mkstemp(suffix=safe_ext, prefix="whisper_")
        try:
            # Copy the uploaded audio into the temporary file.
            with os.fdopen(fd, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
        except Exception:
            # Close the file if copying fails.
            os.close(fd)
            raise
        
        # Get the current async event loop.
        loop = asyncio.get_event_loop()

        def _do_transcribe():
            # Ask Whisper to listen to the audio file and return English text.
            segments, _info = speech_model.transcribe(
                filename,
                language="en",
                beam_size=5,
                vad_filter=True,
                vad_parameters=dict(min_silence_duration_ms=300),
                condition_on_previous_text=False,
                initial_prompt="A single spoken English word.",
            )

            # Join all text parts into one sentence.
            return " ".join(seg.text for seg in segments)

        # Run Whisper in a background thread.
        # This keeps the API server free to handle other requests.
        text = await loop.run_in_executor(_whisper_executor, _do_transcribe)
        
        # Delete the temporary audio file after transcription.
        os.remove(filename)
        
        # Send the final text back to the frontend.
        return {"text": text.strip()}

    except Exception as e:
        print(f"Error in /speech-to-text: {e}")

        # If an error happens, delete the temporary file if it was created.
        if 'filename' in locals() and os.path.exists(filename):
            os.remove(filename)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/verify-answer")
async def verify_answer(detected_label: str, spoken_text: str):
    """
    Check if the child said the correct word.
    Compare the word found in the photo with the word from speech-to-text.
    Return true if they match closely enough.
    """
    # Clean both words before comparing them.
    # Example: "Apple!" becomes "apple".
    norm_detected = normalize_text(detected_label)
    norm_spoken = normalize_text(spoken_text)

    if not norm_detected or not norm_spoken:
        # If one of the words is empty, the answer is not correct.
        is_correct = False
        match_type = "none"
        similarity = 0.0
    else:
        # Exact match means both words are the same.
        # Example: "apple" and "apple".
        is_exact_match = norm_spoken == norm_detected

        # Phrase match means the expected word is inside the spoken text.
        # Example: spoken text "I said apple", expected word "apple".
        is_phrase_match = not is_exact_match and contains_whole_phrase(norm_spoken, norm_detected)

        # Fuzzy match is used for small spelling or speech-to-text mistakes.
        # Example: "appel" can still be close to "apple".
        is_fuzzy = False
        similarity = 1.0 if is_exact_match else 0.0

        # Only use fuzzy match if exact and phrase match both failed.
        if not is_exact_match and not is_phrase_match:
            is_fuzzy, similarity = fuzzy_word_match(norm_spoken, norm_detected)

        # The answer is correct if any match type passed.
        is_correct = is_exact_match or is_phrase_match or is_fuzzy

        # Save which match method worked.
        match_type = (
            "exact" if is_exact_match
            else "phrase" if is_phrase_match
            else "fuzzy" if is_fuzzy
            else "none"
        )

    # Send the result back to the frontend.
    return {
        "correct": is_correct,
        "input_label": detected_label,
        "spoken_text": spoken_text,
        "similarity": round(similarity, 2),
        "match_type": match_type,
    }

if __name__ == "__main__":
    host = os.environ.get("HOST", "0.0.0.0")
    port = int(os.environ.get("PORT", "8000"))
    uvicorn.run(app, host=host, port=port)
