"""
Health Check Routes
"""

from flask import Blueprint, jsonify
from services import get_model_info, get_digit_model_info

health_bp = Blueprint('health', __name__)


@health_bp.route('/health', methods=['GET'])
def health_check():
    """
    Health check endpoint for monitoring.
    
    Response:
        {
            "status": "healthy",
            "message": "Server is running"
        }
    """
    letter_info = get_model_info()
    digit_info = get_digit_model_info()

    return jsonify({
        'status': 'healthy',
        'message': 'Server is running',
        'models': {
            'letter': {
                'loaded': letter_info.get('loaded', False),
                'mode': letter_info.get('mode', 'unknown')
            },
            'digit': {
                'loaded': digit_info.get('loaded', False),
                'mode': digit_info.get('mode', 'unknown')
            }
        }
    })


@health_bp.route('/heartbeat', methods=['GET'])
def heartbeat():
    """Ultra-light heartbeat endpoint for uptime monitors and keepalive pings."""
    return jsonify({
        'status': 'ok'
    })


@health_bp.route('/', methods=['GET'])
def root():
    """Root endpoint with API information."""
    return jsonify({
        'name': 'Letter Recognition API',
        'version': '1.0.0',
        'endpoints': {
            '/health': 'Health check',
            '/api/letter/predict': 'POST - Predict letter from image',
            '/api/letter/info': 'GET - Get model information'
        }
    })
