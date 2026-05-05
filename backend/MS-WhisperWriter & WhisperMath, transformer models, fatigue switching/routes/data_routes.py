"""
================================================================================
DATA API ROUTES
================================================================================

REST API endpoints for patient progress data CRUD operations.
These routes connect the React Native frontend to MongoDB Atlas.

Endpoints:
    POST /api/data/attempts              - Save attempt(s)
    POST /api/data/sessions              - Save a session
    GET  /api/data/attempts/<patient_id> - Get attempts for a patient
    GET  /api/data/sessions/<patient_id> - Get sessions for a patient
    GET  /api/data/summary/<patient_id>  - Get aggregated patient summary
    POST /api/data/sync                  - Bulk sync (offline queue flush)

Author: Research Team 25-26J-333
================================================================================
"""

from flask import Blueprint, request, jsonify
from services.data_service import DataService

data_bp = Blueprint('data', __name__, url_prefix='/api/data')


# ============================================================================
# SAVE ENDPOINTS
# ============================================================================

@data_bp.route('/attempts', methods=['POST'])
def save_attempts():
    """
    Save one or more attempt records.
    
    Body (single): { activity, expected, predicted, isCorrect, ... }
    Body (batch):  [{ ... }, { ... }, ...]
    
    Returns:
        201: { status: "saved", id/count }
        400: { error: "..." }
    """
    data = request.json

    if data is None:
        return jsonify({"error": "Request body is required"}), 400

    if isinstance(data, list):
        result = DataService.save_attempts_batch(data)
    else:
        result = DataService.save_attempt(data)

    if result.get('status') == 'saved':
        status_code = 201
    elif result.get('status') == 'skipped':
        status_code = 503  # Service Unavailable — DB not configured
    else:
        status_code = 500
    return jsonify(result), status_code


@data_bp.route('/sessions', methods=['POST'])
def save_session():
    """
    Save a session summary record.
    
    Body: { patientId, startTime, endTime, durationMs, ... }
    
    Returns:
        201: { status: "saved", id }
    """
    data = request.json

    if data is None:
        return jsonify({"error": "Request body is required"}), 400

    result = DataService.save_session(data)
    if result.get('status') == 'saved':
        status_code = 201
    elif result.get('status') == 'skipped':
        status_code = 503
    else:
        status_code = 500
    return jsonify(result), status_code


# ============================================================================
# READ ENDPOINTS
# ============================================================================

@data_bp.route('/attempts/<patient_id>', methods=['GET'])
def get_attempts(patient_id):
    """
    Get attempts for a specific patient.
    
    Query params:
        activity (optional): Filter by activity type
        limit (optional):    Max records to return (default: 500)
    
    Returns:
        200: { attempts: [...], count: N }
    """
    activity = request.args.get('activity')
    limit = int(request.args.get('limit', 500))

    attempts = DataService.get_attempts(patient_id, activity, limit)
    return jsonify({
        "attempts": attempts,
        "count": len(attempts),
        "patientId": patient_id
    })


@data_bp.route('/sessions/<patient_id>', methods=['GET'])
def get_sessions(patient_id):
    """
    Get sessions for a specific patient.
    
    Query params:
        limit (optional): Max records to return (default: 100)
    
    Returns:
        200: { sessions: [...], count: N }
    """
    limit = int(request.args.get('limit', 100))

    sessions = DataService.get_sessions(patient_id, limit)
    return jsonify({
        "sessions": sessions,
        "count": len(sessions),
        "patientId": patient_id
    })


@data_bp.route('/summary/<patient_id>', methods=['GET'])
def get_summary(patient_id):
    """
    Get aggregated patient summary with per-activity breakdown.
    
    Returns:
        200: { patientId, activities: [...], overallStats: {...} }
    """
    summary = DataService.get_patient_summary(patient_id)
    return jsonify(summary)


# ============================================================================
# SYNC ENDPOINT
# ============================================================================

@data_bp.route('/sync', methods=['POST'])
def sync_data():
    """
    Bulk sync endpoint for flushing the offline queue.
    
    Called when the app comes back online after offline usage.
    Receives all queued attempts and sessions in one request.
    
    Body: {
        attempts: [{ ... }, ...],    (optional)
        sessions: [{ ... }, ...]     (optional)
    }
    
    Returns:
        201: { attempts: { status, count }, sessions: { status, count } }
    """
    data = request.json

    if data is None:
        return jsonify({"error": "Request body is required"}), 400

    results = {}

    # Sync attempts
    if 'attempts' in data and data['attempts']:
        results['attempts'] = DataService.save_attempts_batch(data['attempts'])

    # Sync sessions
    if 'sessions' in data and data['sessions']:
        saved_count = 0
        for session in data['sessions']:
            result = DataService.save_session(session)
            if result.get('status') == 'saved':
                saved_count += 1
        results['sessions'] = {"status": "saved", "count": saved_count}

    return jsonify(results), 201
