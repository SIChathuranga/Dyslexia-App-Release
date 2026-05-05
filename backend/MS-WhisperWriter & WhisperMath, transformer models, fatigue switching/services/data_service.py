"""
================================================================================
DATA SERVICE
================================================================================

Handles CRUD operations for patient progress data in MongoDB Atlas.
This is the data layer for the progress tracking component.

Collections used:
    - attempts:  Individual attempt records (correct/incorrect, response time)
    - sessions:  Session summaries (start/end time, duration)

All documents are tagged with:
    - patientId:  Identifies the child
    - component:  "progress_tracking" (to distinguish from other research parts)

Author: Research Team 25-26J-333
================================================================================
"""

from datetime import datetime, timezone
import logging
from config.database import get_database

logger = logging.getLogger(__name__)


class DataService:
    """Service for managing patient progress data in MongoDB."""

    # ========================================================================
    # SAVE OPERATIONS
    # ========================================================================

    @staticmethod
    def save_attempt(attempt_data: dict) -> dict:
        """
        Save a single attempt record to MongoDB.
        
        Args:
            attempt_data: Dict containing attempt fields
                          (activity, expected, predicted, isCorrect, etc.)
        
        Returns:
            Dict with status and inserted document ID
        """
        db = get_database()
        if db is None:
            return {"status": "skipped", "message": "Database not available"}

        # Add server-side metadata
        attempt_data['serverTimestamp'] = datetime.now(timezone.utc)
        attempt_data.setdefault('component', 'progress_tracking')

        try:
            result = db.attempts.insert_one(attempt_data)
            return {"status": "saved", "id": str(result.inserted_id)}
        except Exception as e:
            logger.error(f"Failed to save attempt: {e}")
            return {"status": "error", "message": str(e)}

    @staticmethod
    def save_attempts_batch(attempts: list) -> dict:
        """
        Save multiple attempt records at once (used for offline sync).
        
        Args:
            attempts: List of attempt dicts
        
        Returns:
            Dict with status and count of inserted documents
        """
        db = get_database()
        if db is None:
            return {"status": "skipped", "message": "Database not available"}

        if not attempts:
            return {"status": "saved", "count": 0}

        now = datetime.now(timezone.utc)
        for attempt in attempts:
            attempt['serverTimestamp'] = now
            attempt.setdefault('component', 'progress_tracking')

        try:
            result = db.attempts.insert_many(attempts)
            count = len(result.inserted_ids)
            logger.info(f"Batch saved {count} attempts")
            return {"status": "saved", "count": count}
        except Exception as e:
            logger.error(f"Failed to batch save attempts: {e}")
            return {"status": "error", "message": str(e)}

    @staticmethod
    def save_session(session_data: dict) -> dict:
        """
        Save a session summary record to MongoDB.
        
        Args:
            session_data: Dict containing session fields
                          (startTime, endTime, durationMs, etc.)
        
        Returns:
            Dict with status and inserted document ID
        """
        db = get_database()
        if db is None:
            return {"status": "skipped", "message": "Database not available"}

        session_data['serverTimestamp'] = datetime.now(timezone.utc)
        session_data.setdefault('component', 'progress_tracking')

        try:
            result = db.sessions.insert_one(session_data)
            return {"status": "saved", "id": str(result.inserted_id)}
        except Exception as e:
            logger.error(f"Failed to save session: {e}")
            return {"status": "error", "message": str(e)}

    # ========================================================================
    # READ OPERATIONS
    # ========================================================================

    @staticmethod
    def get_attempts(patient_id: str, activity: str = None, limit: int = 500) -> list:
        """
        Get attempts for a specific patient.
        
        Args:
            patient_id: The patient identifier
            activity:   Optional activity filter (e.g., 'letter_practice')
            limit:      Maximum number of records to return
        
        Returns:
            List of attempt dicts (newest first)
        """
        db = get_database()
        if db is None:
            return []

        query = {"patientId": patient_id}
        if activity:
            query["activity"] = activity

        try:
            attempts = list(
                db.attempts.find(query, {"_id": 0})
                .sort("timestamp", -1)
                .limit(limit)
            )
            return attempts
        except Exception as e:
            logger.error(f"Failed to get attempts: {e}")
            return []

    @staticmethod
    def get_sessions(patient_id: str, limit: int = 100) -> list:
        """
        Get sessions for a specific patient.
        
        Args:
            patient_id: The patient identifier
            limit:      Maximum number of records to return
        
        Returns:
            List of session dicts (newest first)
        """
        db = get_database()
        if db is None:
            return []

        try:
            sessions = list(
                db.sessions.find({"patientId": patient_id}, {"_id": 0})
                .sort("startTime", -1)
                .limit(limit)
            )
            return sessions
        except Exception as e:
            logger.error(f"Failed to get sessions: {e}")
            return []

    @staticmethod
    def get_patient_summary(patient_id: str) -> dict:
        """
        Get aggregated summary statistics for a patient.
        Uses MongoDB aggregation pipeline for efficient server-side computation.
        
        Args:
            patient_id: The patient identifier
        
        Returns:
            Dict with per-activity breakdown:
            {
                "patientId": "...",
                "activities": [
                    {
                        "_id": "letter_practice",
                        "totalAttempts": 45,
                        "correctAttempts": 32,
                        "accuracy": 71.1,
                        "avgResponseTime": 4200,
                        "lastAttempt": 1709450000000
                    },
                    ...
                ],
                "overallStats": {
                    "totalAttempts": 120,
                    "correctAttempts": 85,
                    "accuracy": 70.8
                }
            }
        """
        db = get_database()
        if db is None:
            return {"patientId": patient_id, "activities": [], "overallStats": {}}

        try:
            # Per-activity aggregation
            pipeline = [
                {"$match": {"patientId": patient_id}},
                {"$group": {
                    "_id": "$activity",
                    "totalAttempts": {"$sum": 1},
                    "correctAttempts": {
                        "$sum": {"$cond": ["$isCorrect", 1, 0]}
                    },
                    "avgResponseTime": {"$avg": "$responseTimeMs"},
                    "lastAttempt": {"$max": "$timestamp"},
                }},
                {"$addFields": {
                    "accuracy": {
                        "$round": [
                            {"$multiply": [
                                {"$divide": ["$correctAttempts", "$totalAttempts"]},
                                100
                            ]},
                            1
                        ]
                    }
                }},
                {"$sort": {"totalAttempts": -1}}
            ]

            activities = list(db.attempts.aggregate(pipeline))

            # Overall stats
            total = sum(a['totalAttempts'] for a in activities)
            correct = sum(a['correctAttempts'] for a in activities)

            return {
                "patientId": patient_id,
                "activities": activities,
                "overallStats": {
                    "totalAttempts": total,
                    "correctAttempts": correct,
                    "accuracy": round((correct / total) * 100, 1) if total > 0 else 0
                }
            }
        except Exception as e:
            logger.error(f"Failed to get patient summary: {e}")
            return {"patientId": patient_id, "activities": [], "overallStats": {}}
