import os
from dotenv import load_dotenv

# Load environment variables from backend/.env (works regardless of CWD)
_backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(_backend_dir, '.env'))

class Config:
    """Base configuration."""
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    DEBUG = False
    TESTING = False
    
    # Server
    HOST = os.getenv('HOST', '0.0.0.0')
    PORT = int(os.getenv('PORT', 5000))
    
    # Model paths
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    MODEL_PATH = os.getenv('MODEL_PATH', os.path.join(BASE_DIR, 'models', 'letter_model.tflite'))
    
    # CORS
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', '*').split(',')

    # MongoDB Atlas
    MONGODB_URI = os.getenv('MONGODB_URI', '')
    MONGODB_DB_NAME = os.getenv('MONGODB_DB_NAME', 'dyslearn')

    # Keepalive / heartbeat (useful for platforms that idle sleeping services)
    KEEPALIVE_ENABLED = os.getenv('KEEPALIVE_ENABLED', 'false').lower() in ('1', 'true', 'yes', 'on')
    KEEPALIVE_INTERVAL_SECONDS = int(os.getenv('KEEPALIVE_INTERVAL_SECONDS', 600))
    KEEPALIVE_TARGET_URL = os.getenv('KEEPALIVE_TARGET_URL', '').strip()
    KEEPALIVE_ENDPOINT_PATH = os.getenv('KEEPALIVE_ENDPOINT_PATH', '/heartbeat').strip()


class DevelopmentConfig(Config):
    """Development configuration."""
    DEBUG = True
    ENV = 'development'


class ProductionConfig(Config):
    """Production configuration."""
    DEBUG = False
    ENV = 'production'
    
    # Require SECRET_KEY to be set via environment variable in production
    SECRET_KEY = os.getenv('SECRET_KEY')
    
    @classmethod
    def init_app(cls):
        if not cls.SECRET_KEY:
            raise ValueError("SECRET_KEY environment variable must be set in production")


class TestingConfig(Config):
    """Testing configuration."""
    TESTING = True
    DEBUG = True


# Configuration mapping
config_by_name = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}


def get_config():
    """Get configuration based on FLASK_ENV environment variable."""
    env = os.getenv('FLASK_ENV', 'development')
    return config_by_name.get(env, DevelopmentConfig)
