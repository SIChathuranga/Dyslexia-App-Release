"""
================================================================================
DIGIT RECOGNITION API ROUTES
================================================================================

This module defines the Flask API endpoints for digit recognition (0-9).
Used by the Math Practice feature where children draw their answers.

ENDPOINTS:
----------
    POST /api/digit/predict  - Predict digit from hand-drawn image
    GET  /api/digit/info     - Get digit model information

HOW IT WORKS:
-------------
1. Child sees a math problem (e.g., "2 + 3 = ?")
2. Child draws the answer on the canvas
3. Frontend captures the canvas as base64 image
4. Image is sent to this endpoint
5. ML model predicts the digit (0-9)
6. Result is compared with the expected answer

USAGE EXAMPLE:
--------------
    POST /api/digit/predict
    Body: {
        "image": "data:image/png;base64,iVBORw0KGgoAAAANSU..."
    }
    
    Response: {
        "success": true,
        "data": {
            "label": "5",
            "confidence": 0.95,
            "index": 5
        }
    }

PREPROCESSING:
--------------
The image is preprocessed before prediction:
1. Converted to grayscale
2. Inverted (white drawing on black background → black on white)
3. Cropped to bounding box of content
4. Resized to 28x28 pixels (MNIST format)
5. Normalized to 0-1 range

Author: Research Team 25-26J-333
================================================================================
"""

from flask import Blueprint, request, jsonify
import logging

# Import digit prediction services
from services import predict_digit, get_digit_model_info

# Setup logging for this module
logger = logging.getLogger(__name__)

# ============================================================================
# BLUEPRINT SETUP
# ============================================================================
# Create a Flask Blueprint for digit-related routes
# All routes will be prefixed with /api/digit
digit_bp = Blueprint('digit', __name__, url_prefix='/api/digit')


# ============================================================================
# PREDICTION ENDPOINT
# ============================================================================

@digit_bp.route('/predict', methods=['POST'])
def predict():
    """
    Predict Digit from Hand-Drawn Image
    ------------------------------------
    Takes a base64 encoded image of a hand-drawn digit and returns
    the predicted digit (0-9) with confidence score.
    
    This endpoint is used by the Math Practice screen to verify
    if the child's drawn answer matches the expected result.
    
    Request Body (JSON):
        {
            "image": "base64_encoded_image_string"  // Required: canvas capture
        }
    
    Response Success (JSON):
        {
            "success": true,
            "data": {
                "label": "5",          // Predicted digit as string
                "confidence": 0.95,    // Confidence score (0.0 - 1.0)
                "index": 5             // Digit value as integer
            }
        }
    
    Response Error (JSON):
        {
            "success": false,
            "error": "Error message describing what went wrong"
        }
    
    HTTP Status Codes:
        200 - Success
        400 - Bad Request (missing image or invalid JSON)
        500 - Server Error (prediction failed)
    
    Example Usage (JavaScript):
        const response = await fetch('/api/digit/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: canvasBase64 })
        });
        const result = await response.json();
        if (result.success) {
            console.log('Predicted digit:', result.data.label);
        }
    """
    try:
        # Parse JSON request body
        data = request.get_json()
        
        # Validate request has data
        if not data:
            return jsonify({
                'success': False,
                'error': 'No JSON data provided'
            }), 400
        
        # Validate image is present
        if 'image' not in data:
            return jsonify({
                'success': False,
                'error': 'No image provided in request body'
            }), 400
        
        # Call ML service to make prediction
        # The predict_digit function handles preprocessing and model inference
        result = predict_digit(data['image'])
        
        return jsonify({
            'success': True,
            'data': result
        })
        
    except Exception as e:
        # Log the full error with stack trace for debugging
        logger.error(f"Digit prediction error: {str(e)}", exc_info=True)
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


# ============================================================================
# MODEL INFORMATION ENDPOINT
# ============================================================================

@digit_bp.route('/info', methods=['GET'])
def model_info():
    """
    Get Digit Model Information
    ---------------------------
    Returns metadata about the loaded digit recognition TFLite model.
    Useful for debugging and monitoring the model status.
    
    Response Success (JSON):
        {
            "success": true,
            "data": {
                "loaded": true,
                "mode": "inference",          // or "mock" if TensorFlow unavailable
                "input_shape": [1, 28, 28, 1],
                "output_shape": [1, 10],      // 10 classes (0-9)
                "num_classes": 10
            }
        }
    
    Response when using Mock Mode (no TensorFlow):
        {
            "success": true,
            "data": {
                "loaded": true,
                "mode": "mock",
                "message": "Using mock predictions (TensorFlow not available)",
                "num_classes": 10
            }
        }
    """
    try:
        # Get digit model metadata from the ML service
        info = get_digit_model_info()
        
        return jsonify({
            'success': True,
            'data': info
        })
    except Exception as e:
        logger.error(f"Error getting digit model info: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
