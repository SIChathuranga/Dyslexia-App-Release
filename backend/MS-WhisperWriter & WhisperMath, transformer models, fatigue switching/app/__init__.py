"""
Flask Application Factory
"""

import os
import logging
from flask import Flask
from flask_cors import CORS

# Suppress TensorFlow C++ INFO logs (e.g., cpu_feature_guard) unless explicitly overridden
os.environ.setdefault('TF_CPP_MIN_LOG_LEVEL', '1')

from config import get_config
from routes import letter_bp, health_bp, digit_bp, data_bp
from services import load_model, load_digit_model, start_keepalive_worker


def create_app(config_class=None):
    """
    Application factory for creating Flask app instance.
    
    Args:
        config_class: Configuration class to use. Defaults to auto-detect from environment.
        
    Returns:
        Flask application instance
    """
    app = Flask(__name__)
    
    # Load configuration
    if config_class is None:
        config_class = get_config()
    
    app.config.from_object(config_class)
    
    # Run production-specific initialization if available
    if hasattr(config_class, 'init_app'):
        config_class.init_app()
    
    # Setup logging
    setup_logging(app)
    
    # Initialize CORS using configured origins
    allowed_origins = app.config.get('CORS_ORIGINS', ['*'])
    CORS(app, resources={
        r"/api/.*": {
            "origins": allowed_origins,
            "methods": ["GET", "POST", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"]
        },
        r"/health": {
            "origins": allowed_origins,
            "methods": ["GET", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"]
        },
        r"/heartbeat": {
            "origins": allowed_origins,
            "methods": ["GET", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"]
        },
        r"/": {
            "origins": allowed_origins,
            "methods": ["GET", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    })
    
    # Register blueprints
    app.register_blueprint(health_bp)
    app.register_blueprint(letter_bp)
    app.register_blueprint(digit_bp)
    app.register_blueprint(data_bp)
    
    # Load ML models on startup
    with app.app_context():
        # Load letter model
        try:
            letter_model_path = get_model_path(app, 'letter_model.tflite')
            load_model(letter_model_path)
            app.logger.info(f"Letter model loaded successfully from {letter_model_path}")
        except Exception as e:
            app.logger.error(f"Failed to load letter model: {e}")
            # Don't crash the app, but log the error
        
        # Load digit model
        try:
            digit_model_path = get_model_path(app, 'digits_model.tflite')
            load_digit_model(digit_model_path)
            app.logger.info(f"Digit model loaded successfully from {digit_model_path}")
        except Exception as e:
            app.logger.error(f"Failed to load digit model: {e}")
            # Don't crash the app, but log the error
        
        # Initialize MongoDB connection
        try:
            from config.database import get_database
            db = get_database()
            if db is not None:
                app.logger.info("MongoDB Atlas connected successfully❤️❤️💕")
            else:
                app.logger.warning("MongoDB not configured — running with local storage only")
        except Exception as e:
            app.logger.warning(f"MongoDB initialization skipped: {e}")
    
    app.logger.info(f"Application created in {config_class.ENV if hasattr(config_class, 'ENV') else 'default'} mode")

    # Optional background keepalive pinger
    try:
        start_keepalive_worker(app)
    except Exception as e:
        app.logger.warning(f"Keepalive worker initialization skipped: {e}")
    
    return app


def get_model_path(app, model_name='letter_model.tflite'):
    """Get the model path, checking multiple locations.
    
    Args:
        app: Flask application instance
        model_name: Name of the model file (default: 'letter_model.tflite')
    
    Returns:
        Path to the model file
    """
    # Check configured path first (for backward compatibility)
    if model_name == 'letter_model.tflite':
        model_path = app.config.get('MODEL_PATH')
        if model_path and os.path.exists(model_path):
            return model_path
    
    # Check in models directory relative to backend
    backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    candidates = [
        os.path.join(backend_dir, 'models', model_name),
        os.path.join(os.path.dirname(os.path.abspath(__file__)), 'models', model_name),
        os.path.join(os.path.dirname(os.path.abspath(__file__)), model_name),
    ]
    
    for candidate in candidates:
        if os.path.exists(candidate):
            return candidate
    
    raise FileNotFoundError(f"Model file '{model_name}' not found. Checked: {candidates}")


def setup_logging(app):
    """Setup application logging."""
    log_level = logging.DEBUG if app.config.get('DEBUG') else logging.INFO
    
    logging.basicConfig(
        level=log_level,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    
    # Set Flask logger level
    app.logger.setLevel(log_level)

    # Suppress noisy pymongo heartbeat/topology DEBUG logs
    logging.getLogger('pymongo').setLevel(logging.WARNING)
