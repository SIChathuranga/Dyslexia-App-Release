# Letter & Digit Recognition API Backend

A Python Flask backend for letter/character and digit recognition using TensorFlow Lite models.

## 📁 Project Structure

```
backend/
├── app/                    # Flask application factory
│   └── __init__.py
├── config/                 # Configuration management
│   ├── __init__.py
│   └── settings.py
├── models/                 # ML model files (.tflite)
│   ├── letter_model.tflite
│   └── digits_model.tflite
├── routes/                 # API route blueprints
│   ├── __init__.py
│   ├── health_routes.py
│   ├── letter_routes.py
│   └── digit_routes.py
├── services/               # Business logic / ML services
│   ├── __init__.py
│   ├── ml_service.py
│   └── digit_service.py
├── tests/                  # Test files
│   ├── __init__.py
│   └── test_api.py
├── .env.example           # Environment variables template
├── .gitignore
├── requirements.txt       # Python dependencies
├── run.py                 # Application entry point
├── setup.bat              # Windows setup script (creates venv, installs deps)
├── start.bat              # Windows quick start script (activates venv, runs server)
└── README.md
```

## 🚀 Quick Start

### Option A: Windows Quick Setup (Recommended for Windows)

```batch
# First-time setup
setup.bat

# Start the server (after setup)
start.bat
```

### Option B: Manual Setup

#### 1. Create Virtual Environment

```bash
# Windows (Command Prompt)
cd backend
python -m venv venv
venv\Scripts\activate

# Windows (PowerShell)
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1

# macOS/Linux
cd backend
python3 -m venv venv
source venv/bin/activate
```

#### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

#### 3. Setup Environment

```bash
# Copy example environment file
copy .env.example .env    # Windows
cp .env.example .env      # macOS/Linux

# Edit .env with your settings if needed
```

#### 4. Place Your Models

Copy your model files to the `models/` directory:
- `letter_model.tflite` - For letter recognition (A-Z)
- `digits_model.tflite` - For digit recognition (0-9)

#### 5. Run the Server

```bash
python run.py
```

The server will start at `http://0.0.0.0:5000`

## 📡 API Endpoints

### Health Check
```
GET /health
```
Response:
```json
{
  "status": "healthy",
  "message": "Server is running"
}
```

### Heartbeat
```
GET /heartbeat
```
Response:
```json
{
  "status": "ok"
}
```

### Letter Recognition

#### Predict Letter
```
POST /api/letter/predict
Content-Type: application/json

{
  "image": "base64_encoded_image_string"
}
```
Response:
```json
{
  "success": true,
  "data": {
    "label": "A",
    "confidence": 0.95,
    "index": 0,
    "top_predictions": [
      {"label": "A", "confidence": 0.95, "index": 0},
      {"label": "H", "confidence": 0.03, "index": 7},
      {"label": "M", "confidence": 0.01, "index": 12}
    ]
  }
}
```

#### Letter Model Info
```
GET /api/letter/info
```
Response:
```json
{
  "success": true,
  "data": {
    "loaded": true,
    "input_shape": [1, 28, 28, 1],
    "output_shape": [1, 26],
    "num_classes": 26
  }
}
```

#### 🧠 Dyslexia-Friendly Prediction (NEW)
```
POST /api/letter/predict-dyslexia
Content-Type: application/json

{
  "image": "base64_encoded_image_string",
  "expected_letter": "W"
}
```
Response:
```json
{
  "success": true,
  "data": {
    "label": "V",
    "confidence": 0.85,
    "dyslexia_friendly": true,
    "expected_letter": "W",
    "is_exact_match": false,
    "is_similar_letter": true,
    "similar_letters": ["W", "V", "U", "M", "N"],
    "should_accept": true,
    "adjusted_confidence": 0.68,
    "feedback_level": "good",
    "feedback_message": "Good try! Your 'V' looks similar to 'W'. Keep practicing!"
  }
}
```

**Similar Letter Groups for Dyslexia:**
- W, V, U - Open-bottom letters
- F, E, T - Horizontal line letters
- M, N, W - Multi-stroke letters with peaks
- B, D, P, R - Letters with bumps/curves
- C, G, O, Q - Round letters
- I, L, T, J - Vertical line based letters

#### Get Similar Letters
```
GET /api/letter/similar-letters/<letter>
```
Example: `GET /api/letter/similar-letters/W`

Response:
```json
{
  "success": true,
  "data": {
    "letter": "W",
    "similar_letters": ["W", "V", "U", "M", "N"]
  }
}
```


### Digit Recognition (Math Practice)

#### Predict Digit
```
POST /api/digit/predict
Content-Type: application/json

{
  "image": "base64_encoded_image_string"
}
```
Response:
```json
{
  "success": true,
  "data": {
    "label": "5",
    "confidence": 0.92,
    "index": 5,
    "top_predictions": [
      {"label": "5", "confidence": 0.92, "index": 5},
      {"label": "6", "confidence": 0.05, "index": 6},
      {"label": "8", "confidence": 0.02, "index": 8}
    ]
  }
}
```

#### Digit Model Info
```
GET /api/digit/info
```
Response:
```json
{
  "success": true,
  "data": {
    "loaded": true,
    "input_shape": [1, 28, 28, 1],
    "output_shape": [1, 10],
    "num_classes": 10
  }
}
```
```

## 🔧 Configuration

Environment variables (in `.env` file):

| Variable | Default | Description |
|----------|---------|-------------|
| `FLASK_ENV` | `development` | Environment mode |
| `FLASK_DEBUG` | `1` | Enable debug mode |
| `HOST` | `0.0.0.0` | Server host |
| `PORT` | `5000` | Server port |
| `MODEL_PATH` | `models/letter_model.tflite` | Path to model file |
| `KEEPALIVE_ENABLED` | `false` | Enable background keepalive pings |
| `KEEPALIVE_INTERVAL_SECONDS` | `600` | Seconds between keepalive pings |
| `KEEPALIVE_ENDPOINT_PATH` | `/heartbeat` | Endpoint path to ping |
| `KEEPALIVE_TARGET_URL` | `` | Public base URL to ping (Render URL) |

## Render Sleep / Keepalive

If your Render instance sleeps after inactivity, you can reduce cold starts with the built-in keepalive worker:

1. In Render environment variables set:
  - `KEEPALIVE_ENABLED=true`
  - `KEEPALIVE_TARGET_URL=https://<your-service>.onrender.com`
  - Optional: `KEEPALIVE_INTERVAL_SECONDS=600`
2. Redeploy.

Important notes:
- On free-tier Render plans, true "always on" behavior may still require an upgraded instance type.
- For best reliability, also configure an external uptime monitor (e.g., UptimeRobot) to call `GET /heartbeat` every 5–10 minutes.

## 📱 Connect from React Native

In your React Native app, update the API URL:

```typescript
// For development (use your computer's IP address)
const API_URL = 'http://YOUR_COMPUTER_IP:5000/api/letter/predict';

// Example fetch call
const response = await fetch(API_URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    image: base64ImageData
  })
});

const result = await response.json();
console.log('Predicted letter:', result.data.label);
```

## 🧪 Testing

```bash
# Install dev dependencies
pip install pytest

# Run tests
pytest tests/
```

## 📦 Production Deployment

For production, use Gunicorn:

```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 "app:create_app()"
```

## 🏷️ Supported Characters

The model recognizes 62 characters:
- Digits: 0-9
- Uppercase letters: A-Z
- Lowercase letters: a-z

## 📝 License

This project is part of a research application.
