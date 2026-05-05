"""
================================================================================
MONGODB DATABASE CONNECTION MANAGER
================================================================================

Provides a singleton connection to MongoDB Atlas for persistent data storage.
Used by the data_service to store patient progress, attempts, and sessions.

Connection is configured via the MONGODB_URI environment variable.
If not set, the app runs without cloud storage (local-only mode).

Author: Research Team 25-26J-333
================================================================================
"""

import os
import logging
from dotenv import load_dotenv

# Load .env from backend directory (works regardless of CWD)
_backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(_backend_dir, '.env'))
logger = logging.getLogger(__name__)

# ============================================================================

# ============================================================================

_client = None
_db = None


def _connect():
    """
    Establish a fresh MongoDB connection and return (client, db).
    Raises on failure.
    """
    from pymongo import MongoClient

    uri = os.getenv('MONGODB_URI')
    db_name = os.getenv('MONGODB_DB_NAME', 'dyslearn')

    if not uri:
        logger.warning(
            "MONGODB_URI not set in .env — cloud data persistence is disabled. "
            "The app will still work with local storage only."
        )
        return None, None

    client = MongoClient(uri, serverSelectionTimeoutMS=5000)
    client.admin.command('ping')
    db = client[db_name]
    logger.info(f"✅ Connected to MongoDB Atlas — database: '{db_name}'")
    _ensure_indexes(db)
    return client, db


def get_database():
    """
    Get the MongoDB database instance (singleton pattern with auto-reconnect).
    
    Returns the cached database connection on subsequent calls.
    If the cached connection is stale, reconnects automatically.
    If MONGODB_URI is not configured, returns None (graceful degradation).
    
    Returns:
        pymongo.database.Database or None
    """
    global _client, _db

    # Fast path: return cached connection if alive
    if _db is not None:
        try:
            _client.admin.command('ping')
            return _db
        except Exception:
            logger.warning("⚠️ MongoDB connection lost — reconnecting...")
            _client = None
            _db = None

    try:
        _client, _db = _connect()
        return _db
    except ImportError:
        logger.error(
            "pymongo is not installed. Run: pip install pymongo dnspython"
        )
        return None
    except Exception as e:
        logger.error(f"❌ MongoDB connection failed: {e}")
        _client = None
        _db = None
        return None


def _ensure_indexes(db):
    """
    Create indexes for frequently queried fields.
    MongoDB ignores createIndex calls if the index already exists.
    """
    try:
        # Attempts collection — query by patient + activity + timestamp
        db.attempts.create_index([("patientId", 1), ("activity", 1)])
        db.attempts.create_index([("patientId", 1), ("timestamp", -1)])
        db.attempts.create_index("component")

        # Sessions collection — query by patient + time
        db.sessions.create_index([("patientId", 1), ("startTime", -1)])
        db.sessions.create_index("component")

        logger.info("📇 MongoDB indexes verified")
    except Exception as e:
        logger.warning(f"Index creation warning (non-fatal): {e}")


def close_database():
    """Close the MongoDB connection gracefully."""
    global _client, _db
    if _client:
        _client.close()
        _client = None
        _db = None
        logger.info("MongoDB connection closed")
