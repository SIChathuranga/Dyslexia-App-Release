"""
================================================================================
LETTER RECOGNITION API ROUTES
================================================================================

This module defines the Flask API endpoints for letter recognition functionality.
It's specifically designed to support dyslexic children's handwriting practice.

ENDPOINTS:
----------
    POST /api/letter/predict              - Basic letter prediction
    POST /api/letter/predict-dyslexia     - Dyslexia-friendly prediction (recommended)
    GET  /api/letter/info                 - Model information
    GET  /api/letter/similar-letters/<L>  - Get similar letters for a given letter
    GET  /api/letter/similarity-groups    - Get all similarity groups

DYSLEXIA-FRIENDLY FEATURES:
---------------------------
1. Similar Letter Acceptance
   - Letters that look alike (W/V, F/E, B/D) are grouped
   - When a child draws a similar letter, it's accepted with feedback
   
2. Encouraging Feedback
   - "excellent" - exact match
   - "good" - similar letter accepted
   - "try_again" - needs another attempt
   
3. Adjusted Confidence
   - Boosts confidence for similar letters
   - Makes the experience less frustrating for dyslexic children

USAGE EXAMPLE:
--------------
    # Basic prediction
    POST /api/letter/predict
    Body: {"image": "data:image/png;base64,iVBORw0..."}
    
    # Dyslexia-friendly (recommended for practice screens)
    POST /api/letter/predict-dyslexia
    Body: {"image": "data:image/png;base64,iVBORw0...", "expected_letter": "W"}

Author: Research Team 25-26J-333
================================================================================
"""

from flask import Blueprint, request, jsonify
import logging

# Import ML services
from services import (
    predict_letter,                    # Basic letter prediction
    predict_letter_dyslexia_friendly,  # Enhanced dyslexia-friendly prediction
    get_model_info,                    # Get model metadata
    get_similar_letters,               # Get similar letters for a given letter
    SIMILAR_LETTER_GROUPS              # All similarity groupings
)

# Setup logging for this module
logger = logging.getLogger(__name__)

# ============================================================================
# BLUEPRINT SETUP
# ============================================================================
# Create a Flask Blueprint for letter-related routes
# All routes will be prefixed with /api/letter
letter_bp = Blueprint('letter', __name__, url_prefix='/api/letter')


# ============================================================================
# PREDICTION ENDPOINTS
# ============================================================================

@letter_bp.route('/predict', methods=['POST'])
def predict():
    """
    Basic Letter Prediction Endpoint
    --------------------------------
    Predicts the letter from a hand-drawn image without any dyslexia-specific handling.
    
    Use this endpoint when you just need raw prediction results.
    For practice screens, use /predict-dyslexia instead.
    
    Request Body (JSON):
        {
            "image": "base64_encoded_image_string"  // Required: drawing capture
        }
    
    Response (JSON):
        {
            "success": true,
            "data": {
                "label": "A",           // Predicted letter (uppercase)
                "confidence": 0.95,     // Confidence score (0.0 - 1.0)
                "index": 0,             // Index in alphabet (A=0, B=1, ...)
                "top_predictions": [    // Top 3 predictions for flexibility
                    {"label": "A", "confidence": 0.95, "index": 0},
                    {"label": "H", "confidence": 0.03, "index": 7},
                    {"label": "R", "confidence": 0.01, "index": 17}
                ]
            }
        }
    
    Error Response:
        {
            "success": false,
            "error": "Error description"
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
        result = predict_letter(data['image'])
        
        # Remove internal fields not meant for API response
        result.pop('_preprocessed', None)
        
        return jsonify({
            'success': True,
            'data': result
        })
        
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}", exc_info=True)
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@letter_bp.route('/predict-dyslexia', methods=['POST'])
def predict_dyslexia():
    """
    Dyslexia-Friendly Letter Prediction Endpoint (RECOMMENDED)
    ----------------------------------------------------------
    This is the main endpoint for the letter practice screen.
    It provides enhanced feedback designed for dyslexic children.
    
    KEY FEATURES:
    - Accepts visually similar letters (W/V, F/E, B/D, M/N, etc.)
    - Provides encouraging feedback messages
    - Calculates adjusted confidence based on similarity
    - Returns detailed analysis for frontend use
    
    Request Body (JSON):
        {
            "image": "base64_encoded_image_string",  // Required: canvas capture
            "expected_letter": "W"                   // Optional but recommended
        }
    
    Response (JSON):
        {
            "success": true,
            "data": {
                // Basic prediction info
                "label": "V",              // What the model predicted
                "confidence": 0.85,        // Model's confidence
                "index": 21,               // Alphabet index
                
                // Dyslexia-specific fields
                "dyslexia_friendly": true,
                "expected_letter": "W",
                "is_exact_match": false,            // Was it exactly correct?
                "is_similar_letter": true,          // Is it a similar letter?
                "similar_letters": ["W", "V", "U"], // All similar letters
                "should_accept": true,              // Should we count this as correct?
                "adjusted_confidence": 0.68,        // Boosted confidence for similar
                "feedback_level": "good",           // excellent/good/try_again
                "feedback_message": "Good try! Your 'V' looks similar to 'W'."
            }
        }
    
    SIMILAR LETTER GROUPS:
        - W, V, U (open bottom)
        - F, E, T (horizontal lines)
        - B, D, P, R (bumps/curves)
        - M, N, W (peaks)
        - C, G, O, Q (round)
        - I, L, T, J (vertical)
    """
    try:
        # Parse JSON request body
        data = request.get_json()
        
        # Validate request
        if not data:
            return jsonify({
                'success': False,
                'error': 'No JSON data provided'
            }), 400
        
        if 'image' not in data:
            return jsonify({
                'success': False,
                'error': 'No image provided in request body'
            }), 400
        
        # Get the expected letter (what the child was asked to draw)
        # This enables similarity checking
        expected_letter = data.get('expected_letter', None)
        
        # Call the dyslexia-friendly prediction service
        result = predict_letter_dyslexia_friendly(data['image'], expected_letter)
        
        return jsonify({
            'success': True,
            'data': result
        })
        
    except Exception as e:
        logger.error(f"Dyslexia-friendly prediction error: {str(e)}", exc_info=True)
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


# ============================================================================
# INFORMATION ENDPOINTS
# ============================================================================

@letter_bp.route('/info', methods=['GET'])
def model_info():
    """
    Get Model Information
    ---------------------
    Returns metadata about the loaded TFLite model.
    Useful for debugging and monitoring.
    
    Response:
        {
            "success": true,
            "data": {
                "loaded": true,
                "mode": "inference",       // or "mock" if TensorFlow unavailable
                "input_shape": [1, 28, 28, 1],
                "output_shape": [1, 26],
                "num_classes": 26          // A-Z
            }
        }
    """
    try:
        info = get_model_info()
        return jsonify({
            'success': True,
            'data': info
        })
    except Exception as e:
        logger.error(f"Error getting model info: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@letter_bp.route('/similar-letters/<letter>', methods=['GET'])
def similar_letters(letter):
    """
    Get Similar Letters
    -------------------
    Returns all letters that are visually similar to the given letter.
    These are letters commonly confused by dyslexic children.
    
    URL Parameter:
        letter - The letter to find similar letters for (e.g., "W")
    
    Example:
        GET /api/letter/similar-letters/W
        
    Response:
        {
            "success": true,
            "data": {
                "letter": "W",
                "similar_letters": ["W", "V", "U", "M", "N"]
            }
        }
    """
    try:
        # Convert to uppercase for consistency
        letter = letter.upper()
        
        # Get all similar letters
        similar = list(get_similar_letters(letter))
        
        return jsonify({
            'success': True,
            'data': {
                'letter': letter,
                'similar_letters': similar
            }
        })
    except Exception as e:
        logger.error(f"Error getting similar letters: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@letter_bp.route('/similarity-groups', methods=['GET'])
def similarity_groups():
    """
    Get All Similarity Groups
    -------------------------
    Returns all letter similarity groups used for dyslexia-friendly matching.
    These groups are based on research about letters commonly confused by
    dyslexic children.
    
    Response:
        {
            "success": true,
            "data": {
                "groups": [
                    ["W", "V", "U"],    // Open-bottom letters
                    ["F", "E", "T"],    // Horizontal line letters
                    ["B", "D", "P", "R"],  // Letters with bumps
                    ["M", "N", "W"],    // Multi-stroke peaks
                    ["C", "G", "O", "Q"],  // Round letters
                    ["I", "L", "T", "J"],  // Vertical line letters
                    ...
                ],
                "description": "Letters in the same group are commonly confused..."
            }
        }
    """
    try:
        # Convert sets to lists for JSON serialization
        groups = [list(group) for group in SIMILAR_LETTER_GROUPS]
        
        return jsonify({
            'success': True,
            'data': {
                'groups': groups,
                'description': 'Letters in the same group are commonly confused by dyslexic children'
            }
        })
    except Exception as e:
        logger.error(f"Error getting similarity groups: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
