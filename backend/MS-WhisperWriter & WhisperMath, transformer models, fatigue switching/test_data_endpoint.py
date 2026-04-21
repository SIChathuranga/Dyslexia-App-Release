"""Test the data routes end-to-end: Flask app → data route → MongoDB."""
import json
import sys
import os

# Ensure the backend root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Mock the ML services so we don't need TensorFlow
import services
services.load_model = lambda path: None
services.load_digit_model = lambda path: None

from app import create_app

app = create_app()

with app.test_client() as client:
    print("=== Testing POST /api/data/attempts ===")
    payload = {
        "id": "test_attempt_001",
        "activity": "letter_practice",
        "timestamp": 1700000000000,
        "expected": "A",
        "predicted": "A",
        "isCorrect": True,
        "responseTimeMs": 3500,
        "retryCount": 0,
        "patientId": "test_patient_debug",
        "context": "Test from debug script"
    }
    
    resp = client.post(
        '/api/data/attempts',
        data=json.dumps(payload),
        content_type='application/json'
    )
    print(f"Status: {resp.status_code}")
    print(f"Body: {resp.get_json()}")
    
    print("\n=== Testing POST /api/data/sessions ===")
    session_payload = {
        "id": "test_session_001",
        "patientId": "test_patient_debug",
        "startTime": 1700000000000,
        "endTime": 1700000060000,
        "durationMs": 60000
    }
    
    resp2 = client.post(
        '/api/data/sessions',
        data=json.dumps(session_payload),
        content_type='application/json'
    )
    print(f"Status: {resp2.status_code}")
    print(f"Body: {resp2.get_json()}")
    
    print("\n=== Testing GET /api/data/attempts/test_patient_debug ===")
    resp3 = client.get('/api/data/attempts/test_patient_debug')
    print(f"Status: {resp3.status_code}")
    data = resp3.get_json()
    print(f"Count: {data.get('count')}")
    if data.get('attempts'):
        print(f"First attempt: {data['attempts'][0]}")
    
    print("\n=== Cleanup: removing test data ===")
    from config.database import get_database
    db = get_database()
    if db is not None:
        r1 = db.attempts.delete_many({"patientId": "test_patient_debug"})
        r2 = db.sessions.delete_many({"patientId": "test_patient_debug"})
        print(f"Cleaned up {r1.deleted_count} attempts, {r2.deleted_count} sessions")
    
    print("\n=== DONE ===")
