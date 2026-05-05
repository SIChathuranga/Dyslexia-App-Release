"""
================================================================================
DYSLEXIA-FRIENDLY LEARNING APP - BACKEND SERVER
================================================================================

Main Entry Point for the Flask Application
-------------------------------------------

This file serves as the main entry point for the backend server that provides
ML-powered letter and digit recognition capabilities for dyslexic children.

FEATURES:
---------
1. Letter Recognition API - Predicts handwritten letters using TFLite model
2. Digit Recognition API - Predicts handwritten digits for math practice
3. Dyslexia-Friendly Matching - Accepts visually similar letters to be forgiving
4. Health Check Endpoint - Monitor server status

USAGE:
------
    python run.py

    Or with the batch script:
    start.bat

REQUIREMENTS:
-------------
- Python 3.11 or 3.12 (for TensorFlow support)
- Flask and dependencies (see requirements.txt)
- TFLite models in the /models directory

API ENDPOINTS:
--------------
    GET  /              - API information and welcome message
    GET  /health        - Server health check (returns {"status": "healthy"})
    
    Letter Recognition:
    POST /api/letter/predict              - Basic letter prediction
    POST /api/letter/predict-dyslexia     - Dyslexia-friendly prediction
    GET  /api/letter/info                 - Letter model information
    
    Digit Recognition:
    POST /api/digit/predict    - Digit prediction for math answers
    GET  /api/digit/info       - Digit model information

ARCHITECTURE:
-------------
    run.py          - This file (entry point)
    app/            - Flask app factory
    config/         - Configuration settings
    routes/         - API route handlers
    services/       - ML model and business logic
    models/         - TFLite model files

Author: Research Team 25-26J-333
Project: Dyslexia-Friendly Learning Application
================================================================================
"""

import os
import sys

# ============================================================================
# PATH SETUP
# ============================================================================
# Add the backend directory to Python path to enable imports from subdirectories
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# ============================================================================
# APP INITIALIZATION
# ============================================================================
from app import create_app
from config import get_config

# Create the Flask application instance using the factory pattern
app = create_app()

# ============================================================================
# MAIN EXECUTION
# ============================================================================
if __name__ == '__main__':
    # Load configuration settings
    config = get_config()
    
    # Print startup banner with server information
    print("\n" + "=" * 60)
    print("  Dyslexia-Friendly Learning App - Backend Server")
    print("=" * 60)
    print(f"   Mode: {getattr(config, 'ENV', 'development')}")
    print(f"   Host: {config.HOST}")
    print(f"   Port: {config.PORT}")
    print(f"   Debug: {config.DEBUG}")
    print(f"   Python: {sys.version.split()[0]}")
    py_major, py_minor = sys.version_info.major, sys.version_info.minor
    if (py_major, py_minor) not in [(3, 11), (3, 12)]:
        print("   WARNING: Python version is not 3.11/3.12.")
        print("            Letter/digit models may run in MOCK mode.")
    print("=" * 60)
    print("\nAvailable Endpoints:")
    print("   GET  /              - API info")
    print("   GET  /health        - Health check")
    print("\n   Letter Recognition:")
    print("   POST /api/letter/predict           - Basic prediction")
    print("   POST /api/letter/predict-dyslexia  - Dyslexia-friendly")
    print("   GET  /api/letter/info              - Model info")
    print("\n   Digit Recognition (Math):")
    print("   POST /api/digit/predict  - Predict digit")
    print("   GET  /api/digit/info     - Model info")
    print("\n   Patient Data (MongoDB):")
    print("   POST /api/data/attempts           - Save attempt(s)")
    print("   POST /api/data/sessions           - Save session")
    print("   GET  /api/data/attempts/<id>      - Get patient attempts")
    print("   GET  /api/data/sessions/<id>      - Get patient sessions")
    print("   GET  /api/data/summary/<id>       - Get patient summary")
    print("   POST /api/data/sync               - Bulk sync")
    print("=" * 60 + "\n")

    # Start the Flask development server
    # In production, use a WSGI server like Gunicorn instead
    app.run(
        host=config.HOST,      # 0.0.0.0 allows external connections
        port=config.PORT,      # Default: 5000
        debug=config.DEBUG     # Enable hot reload in development
    )
