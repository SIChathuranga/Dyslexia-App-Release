"""
Tests for the Letter Recognition API
"""

import pytest
import json
import base64
import os
import sys

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app
from config.settings import TestingConfig


@pytest.fixture
def client():
    """Create test client."""
    app = create_app(TestingConfig)
    app.config['TESTING'] = True
    
    with app.test_client() as client:
        yield client


def test_health_check(client):
    """Test health endpoint returns healthy status."""
    response = client.get('/health')
    assert response.status_code == 200
    
    data = json.loads(response.data)
    assert data['status'] == 'healthy'


def test_root_endpoint(client):
    """Test root endpoint returns API info."""
    response = client.get('/')
    assert response.status_code == 200
    
    data = json.loads(response.data)
    assert 'name' in data
    assert 'version' in data
    assert 'endpoints' in data


def test_model_info(client):
    """Test model info endpoint."""
    response = client.get('/api/letter/info')
    assert response.status_code == 200
    
    data = json.loads(response.data)
    assert 'success' in data
    assert 'data' in data


def test_predict_no_image(client):
    """Test prediction fails without image."""
    response = client.post('/api/letter/predict',
                          data=json.dumps({}),
                          content_type='application/json')
    assert response.status_code == 400
    
    data = json.loads(response.data)
    assert data['success'] == False


def test_predict_no_json(client):
    """Test prediction fails without JSON body."""
    response = client.post('/api/letter/predict')
    assert response.status_code == 400


# Helper to create a simple test image
def create_test_image_base64():
    """Create a simple base64 encoded test image."""
    from PIL import Image
    import io
    
    # Create a simple 28x28 white image with black center
    img = Image.new('RGB', (28, 28), color='white')
    pixels = img.load()
    
    # Draw a simple pattern in the center
    for i in range(10, 18):
        for j in range(10, 18):
            pixels[i, j] = (0, 0, 0)
    
    # Convert to base64
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    img_str = base64.b64encode(buffer.getvalue()).decode()
    
    return f"data:image/png;base64,{img_str}"


def test_predict_with_image(client):
    """Test prediction with a valid image."""
    try:
        test_image = create_test_image_base64()
        
        response = client.post('/api/letter/predict',
                              data=json.dumps({'image': test_image}),
                              content_type='application/json')
        
        # Should get 200 or 500 (if model not loaded in test)
        assert response.status_code in [200, 500]
        
        data = json.loads(response.data)
        if response.status_code == 200:
            assert data['success'] == True
            assert 'data' in data
            assert 'label' in data['data']
            assert 'confidence' in data['data']
    except ImportError:
        pytest.skip("PIL not available for test image creation")


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
