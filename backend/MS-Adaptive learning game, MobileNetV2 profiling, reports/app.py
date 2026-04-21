"""
Dyslexia Stage Prediction — Flask Backend
==========================================
Games: PhonemePop | SoundPictureMatch | VisualSequence | WordBuilder

Endpoints:
  POST /predict          → predict stage from single session
  POST /predict/batch    → predict from last N sessions (aggregate)
  GET  /progress/<uid>   → full progress report + trend
  GET  /history/<uid>    → raw session history
  GET  /users            → list all users
  GET  /health           → health check

Deployment:
  Render: gunicorn app:app
  Local:  python app.py
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from dotenv import load_dotenv
import joblib, json, numpy as np, pandas as pd
from datetime import datetime
import os, traceback, logging
import threading
import urllib.request

load_dotenv()

# ── Logging ──────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger(__name__)

# ── App setup ────────────────────────────────────────────────────
app = Flask(__name__)

# CORS: allow specific origins in production, all in development
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*")
if ALLOWED_ORIGINS == "*":
    CORS(app)
else:
    CORS(app, origins=[o.strip() for o in ALLOWED_ORIGINS.split(",")])

# ── Configuration ────────────────────────────────────────────────
MODEL_PATH   = os.getenv("MODEL_PATH",   "dyslexia_stage_model.pkl")
SCALER_PATH  = os.getenv("SCALER_PATH",  "feature_scaler.pkl")
FEAT_PATH    = os.getenv("FEAT_PATH",    "feature_cols.json")
MONGO_URI    = os.getenv("MONGO_URI",    "mongodb://localhost:27017/")
DB_NAME      = os.getenv("DB_NAME",      "dyslexia")

# Collection prefix for this backend (Section 3: Multi-Skill Learning Game)
COLLECTION_PREFIX = "sec_3_"

STAGE_LABELS = {0: "No Dyslexia", 1: "Mild", 2: "Moderate", 3: "Severe"}
STAGE_COLORS = {0: "#2ecc71",     1: "#f39c12", 2: "#e67e22", 3: "#e74c3c"}

RECOMMENDATIONS = {
    0: "No dyslexia detected. Keep playing to maintain skills!",
    1: "Mild dyslexia. Focus on phoneme and sound-matching games daily.",
    2: "Moderate dyslexia. Increase session frequency. Practice letter reversal exercises.",
    3: "Severe dyslexia. Recommend professional assessment alongside daily game practice.",
}

# ── Load models ──────────────────────────────────────────────────
model, scaler, FEATURE_COLS = None, None, []

try:
    model  = joblib.load(MODEL_PATH)
    scaler = joblib.load(SCALER_PATH)
    with open(FEAT_PATH) as f:
        FEATURE_COLS = json.load(f)
    logger.info(f"Models loaded successfully. Features: {len(FEATURE_COLS)}")
except FileNotFoundError as e:
    logger.warning(f"Model files not found: {e}")
    logger.warning("Run the Colab notebook first to generate model files.")
except Exception as e:
    logger.error(f"Error loading models: {e}")


# ── Database ─────────────────────────────────────────────────────
mongo_client = None
db = None
sessions_col = None


def get_db():
    """Lazy-initialize MongoDB connection. Returns (db, sessions_col) tuple."""
    global mongo_client, db, sessions_col

    if sessions_col is not None:
        return db, sessions_col

    logger.info(f"Connecting to MongoDB...")
    try:
        mongo_client = MongoClient(
            MONGO_URI,
            serverSelectionTimeoutMS=5000,
            connectTimeoutMS=10000,
            socketTimeoutMS=10000,
            retryWrites=True,
        )
        # Force a connection test
        mongo_client.admin.command("ping")
        logger.info("Successfully connected to MongoDB!💕💕💕💕❤️❤️")

        db = mongo_client[DB_NAME]
        sessions_col = db[f"{COLLECTION_PREFIX}sessions"]

        # Create index for faster queries
        try:
            sessions_col.create_index("user_id")
            logger.info("Database index created/verified.")
        except Exception as e:
            logger.warning(f"MongoDB Index Warning: {e}")

        return db, sessions_col

    except Exception as e:
        logger.error(
            f"MongoDB Connection Failed! "
            f"Ensure your IP is whitelisted in Atlas and the URI is correct.\n"
            f"Error: {e}"
        )
        # Reset so the next call will retry
        mongo_client = None
        db = None
        sessions_col = None
        raise


def check_db():
    """Check if MongoDB is available. Returns True/False."""
    try:
        _, _ = get_db()
        return True
    except Exception:
        return False


# Try connecting at startup (non-fatal)
try:
    get_db()
except Exception:
    logger.warning("MongoDB not available at startup. Will retry on first request.")


def get_session_num(user_id: str) -> int:
    _, col = get_db()
    return col.count_documents({"user_id": user_id}) + 1


def save_session(user_id, session_num, stage, features):
    _, col = get_db()
    col.insert_one({
        "user_id": user_id,
        "session_num": session_num,
        "timestamp": datetime.utcnow().isoformat(),
        "predicted_stage": stage,
        "features": json.dumps(features)
    })


def load_user_sessions(user_id: str) -> list:
    _, col = get_db()
    docs = col.find({"user_id": user_id}).sort("session_num", 1)
    rows = []
    for doc in docs:
        rows.append((
            doc["session_num"],
            doc["predicted_stage"],
            doc["features"],
            doc["timestamp"]
        ))
    return rows


# ── ML helpers ───────────────────────────────────────────────────
def predict_from_features(feat_dict: dict) -> dict:
    """Run model inference on a feature dict."""
    if model is None:
        raise RuntimeError("Model not loaded")

    X = np.array([[feat_dict[k] for k in FEATURE_COLS]])
    X_sc = scaler.transform(X)
    stage = int(model.predict(X_sc)[0])
    proba = model.predict_proba(X_sc)[0].tolist()
    return {
        "predicted_stage": stage,
        "stage_label": STAGE_LABELS[stage],
        "stage_color": STAGE_COLORS[stage],
        "probabilities": {STAGE_LABELS[i]: round(p, 4) for i, p in enumerate(proba)},
        "recommendation": RECOMMENDATIONS[stage],
    }


def compute_trend(stages: list) -> dict:
    """Compute improvement trend over stage history."""
    if len(stages) < 2:
        return {"trend": "insufficient_data", "delta": 0}
    first_avg = np.mean(stages[:3])
    last_avg  = np.mean(stages[-3:])
    delta = first_avg - last_avg   # positive = stage went DOWN = improving
    if delta > 0.5:
        trend = "improving"
    elif delta < -0.5:
        trend = "worsening"
    else:
        trend = "stable"
    return {"trend": trend, "delta": round(float(delta), 3)}


# ══════════════════════════════════════════════════════════════════
# KEEP-ALIVE HEARTBEAT (prevents Render free-tier sleep)
# ══════════════════════════════════════════════════════════════════
# Render free tier spins down after 15 min of inactivity.
# This self-ping runs every 14 min to keep the service awake.
# Uses RENDER_EXTERNAL_URL (auto-set by Render) or SELF_PING_URL.
# On local dev, heartbeat is disabled (no external URL).
# ══════════════════════════════════════════════════════════════════

HEARTBEAT_INTERVAL = int(os.getenv("HEARTBEAT_INTERVAL", "840"))  # 14 min = 840 sec
_heartbeat_started = False


def _heartbeat_worker(url):
    """Background thread that pings the health endpoint periodically."""
    import time
    logger.info(f"💓 Heartbeat started: pinging {url} every {HEARTBEAT_INTERVAL}s")
    while True:
        time.sleep(HEARTBEAT_INTERVAL)
        try:
            req = urllib.request.Request(url, method="GET")
            with urllib.request.urlopen(req, timeout=30) as resp:
                logger.info(f"💓 Heartbeat ping OK (status {resp.status})")
        except Exception as e:
            logger.warning(f"💓 Heartbeat ping failed: {e}")


def start_heartbeat():
    """Start the keep-alive heartbeat if running on Render."""
    global _heartbeat_started
    if _heartbeat_started:
        return

    # Determine the self-ping URL
    #   - RENDER_EXTERNAL_URL is auto-set by Render (e.g., https://my-service.onrender.com)
    #   - SELF_PING_URL can override manually
    self_url = os.getenv("SELF_PING_URL") or os.getenv("RENDER_EXTERNAL_URL")

    if not self_url:
        logger.info("💓 Heartbeat disabled (not on Render / no SELF_PING_URL set)")
        return

    ping_url = f"{self_url.rstrip('/')}/health"

    t = threading.Thread(target=_heartbeat_worker, args=(ping_url,), daemon=True)
    t.start()
    _heartbeat_started = True


# Start heartbeat on import (works with gunicorn)
start_heartbeat()


# ── Routes ───────────────────────────────────────────────────────

@app.route("/", methods=["GET"])
def root():
    """Root endpoint — confirms API is running."""
    return jsonify({
        "service": "Multi-Skill Learning Game API",
        "version": "1.0.0",
        "status": "running",
        "database": DB_NAME,
        "collection_prefix": COLLECTION_PREFIX,
        "collections": {
            "sessions": f"{COLLECTION_PREFIX}sessions",
        },
        "endpoints": {
            "health": "GET /health",
            "predict": "POST /predict",
            "predict_batch": "POST /predict/batch",
            "progress": "GET /progress/<user_id>",
            "history": "GET /history/<user_id>",
            "users": "GET /users",
        }
    })


@app.route("/health", methods=["GET"])
def health():
    """Health check with MongoDB connectivity status."""
    db_ok = check_db()
    status = "ok" if (model is not None and db_ok) else "degraded"

    response = {
        "status": status,
        "model_loaded": model is not None,
        "database_connected": db_ok,
        "database_name": DB_NAME,
        "collection_prefix": COLLECTION_PREFIX,
        "features": len(FEATURE_COLS),
        "heartbeat_active": _heartbeat_started,
        "timestamp": datetime.utcnow().isoformat()
    }

    # Return 503 if critical services are down
    http_code = 200 if status == "ok" else 503
    return jsonify(response), http_code


@app.route("/predict", methods=["POST"])
def predict():
    """
    Predict dyslexia stage from a single game session.

    Body (JSON):
    {
      "user_id": "U0001",
      "phoneme_accuracy": 0.72,
      "phoneme_avg_response_ms": 2100,
      "phoneme_wrong_taps": 3,
      "phoneme_levels_cleared": 3,
      "sound_match_accuracy": 0.68,
      "sound_avg_time_s": 14.5,
      "sound_retry_count": 2,
      "sound_correct_first_try": 0.55,
      "visual_seq_accuracy": 0.60,
      "visual_seq_errors": 4,
      "visual_seq_time_s": 28.0,
      "visual_reversal_errors": 2,
      "word_builder_score": 65,
      "word_builder_time_s": 35.0,
      "word_letter_swap_errors": 2,
      "word_attempts": 2,
      "hint_used_ratio": 0.3,
      "total_session_time_min": 12.0,
      "session_completion_rate": 0.75,
      "frustration_exits": 1
    }
    """
    if model is None:
        return jsonify({"error": "Model not loaded. Deploy model files first."}), 503

    try:
        data = request.json
        if not data:
            return jsonify({"error": "Request body must be valid JSON."}), 400

        user_id = data.get("user_id", "anonymous")

        # Validate features
        missing = [k for k in FEATURE_COLS if k not in data]
        if missing:
            return jsonify({"error": f"Missing fields: {missing}"}), 400

        features = {k: float(data[k]) for k in FEATURE_COLS}
        result = predict_from_features(features)

        session_num = get_session_num(user_id)
        save_session(user_id, session_num, result["predicted_stage"], features)

        return jsonify({
            "user_id": user_id,
            "session_num": session_num,
            **result
        })

    except Exception as e:
        logger.error(f"Prediction error: {traceback.format_exc()}")
        return jsonify({"error": str(e)}), 500


@app.route("/predict/batch", methods=["POST"])
def predict_batch():
    """
    Predict dyslexia stage from the last N sessions (aggregate).

    Body (JSON):
    {
      "user_id": "U0001",
      "last_n": 5
    }
    """
    if model is None:
        return jsonify({"error": "Model not loaded. Deploy model files first."}), 503

    try:
        data = request.json
        if not data:
            return jsonify({"error": "Request body must be valid JSON."}), 400

        user_id = data.get("user_id")
        if not user_id:
            return jsonify({"error": "user_id is required."}), 400

        last_n = int(data.get("last_n", 5))

        rows = load_user_sessions(user_id)
        if not rows:
            return jsonify({"error": "No sessions found for this user."}), 404

        # Take last N sessions
        recent = rows[-last_n:]
        all_features = [json.loads(r[2]) for r in recent]

        # Average the features
        df = pd.DataFrame(all_features)
        avg_features = df.mean().to_dict()

        result = predict_from_features(avg_features)

        return jsonify({
            "user_id": user_id,
            "sessions_used": len(recent),
            "aggregation": "mean",
            **result
        })

    except Exception as e:
        logger.error(f"Batch prediction error: {traceback.format_exc()}")
        return jsonify({"error": str(e)}), 500


@app.route("/progress/<user_id>", methods=["GET"])
def progress(user_id):
    """
    Return full progress report for a user.
    Includes stage history, trend, and per-metric improvement.
    """
    try:
        rows = load_user_sessions(user_id)
        if not rows:
            return jsonify({"error": "User not found"}), 404

        stages     = [r[1] for r in rows]
        timestamps = [r[3] for r in rows]

        # Per-session feature data
        all_features = [json.loads(r[2]) for r in rows]
        df_u = pd.DataFrame(all_features)

        # Metric trends (last 3 vs first 3)
        key_metrics = [
            "phoneme_accuracy", "sound_match_accuracy",
            "visual_seq_accuracy", "word_builder_score"
        ]
        metric_trends = {}
        for m in key_metrics:
            if m in df_u.columns:
                first = df_u[m].head(3).mean()
                last  = df_u[m].tail(3).mean()
                delta = last - first
                metric_trends[m] = {
                    "first_avg": round(float(first), 3),
                    "latest_avg": round(float(last), 3),
                    "delta": round(float(delta), 3),
                    "improving": bool(delta > 0.02)
                }

        trend_info = compute_trend(stages)
        overall_improving = trend_info["trend"] == "improving"

        # Predict current stage from latest session
        latest_result = predict_from_features(all_features[-1])

        return jsonify({
            "user_id": user_id,
            "total_sessions": len(stages),
            "current_stage": stages[-1],
            "current_stage_label": STAGE_LABELS[stages[-1]],
            "initial_stage": stages[0],
            "initial_stage_label": STAGE_LABELS[stages[0]],
            "stage_history": stages,
            "timestamps": timestamps,
            "trend": trend_info["trend"],
            "stage_delta": trend_info["delta"],
            "overall_improving": overall_improving,
            "metric_trends": metric_trends,
            "recommendation": RECOMMENDATIONS[stages[-1]],
            "latest_prediction": latest_result,
        })

    except Exception as e:
        logger.error(f"Progress error: {traceback.format_exc()}")
        return jsonify({"error": str(e)}), 500


@app.route("/history/<user_id>", methods=["GET"])
def history(user_id):
    """Return raw session history for a user."""
    try:
        rows = load_user_sessions(user_id)
        if not rows:
            return jsonify({"error": "User not found"}), 404

        sessions = []
        for snum, stage, feat_json, ts in rows:
            sessions.append({
                "session_num": snum,
                "predicted_stage": stage,
                "stage_label": STAGE_LABELS[stage],
                "timestamp": ts,
                "features": json.loads(feat_json)
            })

        return jsonify({"user_id": user_id, "sessions": sessions})

    except Exception as e:
        logger.error(f"History error: {traceback.format_exc()}")
        return jsonify({"error": str(e)}), 500


@app.route("/users", methods=["GET"])
def list_users():
    """List all users in the database."""
    try:
        _, col = get_db()
        pipeline = [
            {
                "$group": {
                    "_id": "$user_id",
                    "sessions": {"$sum": 1},
                    "last_session": {"$max": "$timestamp"}
                }
            },
            {"$sort": {"last_session": -1}}
        ]
        docs = list(col.aggregate(pipeline))
        return jsonify({
            "users": [
                {"user_id": doc["_id"], "sessions": doc["sessions"], "last_session": doc["last_session"]}
                for doc in docs
            ]
        })

    except Exception as e:
        logger.error(f"Users list error: {traceback.format_exc()}")
        return jsonify({"error": str(e)}), 500


# ── Error handlers ───────────────────────────────────────────────

@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": "Endpoint not found"}), 404


@app.errorhandler(405)
def method_not_allowed(e):
    return jsonify({"error": "Method not allowed"}), 405


@app.errorhandler(500)
def internal_error(e):
    return jsonify({"error": "Internal server error"}), 500


# ── Entry point ──────────────────────────────────────────────────

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    debug = os.environ.get("FLASK_DEBUG", "false").lower() == "true"

    logger.info(f"\n{'='*50}")
    logger.info(f"Dyslexia Prediction API")
    logger.info(f"{'='*50}")
    logger.info(f"  POST /predict          -> predict stage")
    logger.info(f"  POST /predict/batch    -> batch predict")
    logger.info(f"  GET  /progress/<uid>   -> progress report")
    logger.info(f"  GET  /history/<uid>    -> session history")
    logger.info(f"  GET  /users            -> list all users")
    logger.info(f"  GET  /health           -> health check")
    logger.info(f"  Port: {port} | Debug: {debug}")
    logger.info(f"{'='*50}\n")

    app.run(debug=debug, host="0.0.0.0", port=port)
