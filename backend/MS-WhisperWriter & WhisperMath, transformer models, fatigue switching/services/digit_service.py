"""
Digit ML Service Module - Handles digit recognition model operations

This service handles the digits_model.tflite for recognizing handwritten digits (0-9).
"""

import os
import numpy as np
from PIL import Image, ImageFilter
import io
import base64
import logging

# Setup logging
logger = logging.getLogger(__name__)

# Save debug images for preprocessing troubleshooting (disabled in production)
DEBUG_SAVE_IMAGES = os.getenv('FLASK_ENV', 'development') != 'production'
_debug_counter = 0

# Try to import scipy for morphological operations
try:
    from scipy import ndimage
    SCIPY_AVAILABLE = True
    logger.info("scipy available for digit morphological operations")
except ImportError:
    SCIPY_AVAILABLE = False
    logger.warning("scipy not available for digit service — morphological ops disabled")

# Model interpreter (will be initialized when needed)
_digit_interpreter = None
_digit_input_details = None
_digit_output_details = None
_digit_model_loaded = False
_digit_using_mock = False

# Class labels for digit recognition (0-9)
DIGIT_LABELS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']


def get_interpreter():
    """
    Lazy load TensorFlow Lite interpreter. Tries multiple backends.
    Returns None if no TFLite interpreter is available.
    """
    # Try AI Edge LiteRT first (Google's new lightweight package)
    try:
        from ai_edge_litert import interpreter as litert
        logger.info("Using AI Edge LiteRT for digit interpretation")
        return litert.Interpreter
    except ImportError:
        pass
    
    # Try full TensorFlow
    try:
        import tensorflow as tf
        logger.info("Using TensorFlow for digit TFLite interpretation")
        return tf.lite.Interpreter
    except ImportError:
        pass
    
    # Try tflite-runtime
    try:
        import tflite_runtime.interpreter as tflite
        logger.info("Using TFLite Runtime for digit interpretation")
        return tflite.Interpreter
    except ImportError:
        pass
    
    logger.warning(
        "No TFLite interpreter found for digit model. Install one of: "
        "tensorflow (Python 3.9-3.12), tflite-runtime, or ai-edge-litert"
    )
    return None


def load_digit_model(model_path: str):
    """
    Load TFLite digit model from the given path.
    Falls back to mock mode if TensorFlow is not available.
    
    Args:
        model_path: Path to the .tflite model file
        
    Returns:
        tuple: (interpreter, input_details, output_details) or (None, None, None) for mock mode
    """
    global _digit_interpreter, _digit_input_details, _digit_output_details, _digit_model_loaded, _digit_using_mock
    
    if _digit_model_loaded:
        logger.info("Digit model already loaded")
        return _digit_interpreter, _digit_input_details, _digit_output_details
    
    # Try to load with TFLite interpreter
    Interpreter = get_interpreter()
    
    if Interpreter is None:
        logger.warning("=" * 60)
        logger.warning("DIGIT MOCK MODE ENABLED - No TensorFlow installation found")
        logger.warning("Digit predictions will be simulated for testing purposes.")
        logger.warning("To use real predictions, install Python 3.11/3.12 with TensorFlow")
        logger.warning("=" * 60)
        _digit_using_mock = True
        _digit_model_loaded = True
        return None, None, None
    
    if not os.path.exists(model_path):
        logger.error(f"Digit model file not found: {model_path}")
        logger.warning("Falling back to digit mock mode")
        _digit_using_mock = True
        _digit_model_loaded = True
        return None, None, None
    
    logger.info(f"Loading digit model from: {model_path}")
    
    try:
        _digit_interpreter = Interpreter(model_path=model_path)
        _digit_interpreter.allocate_tensors()
        
        _digit_input_details = _digit_interpreter.get_input_details()
        _digit_output_details = _digit_interpreter.get_output_details()
        
        logger.info(f"Digit model loaded successfully")
        logger.info(f"Digit input shape: {_digit_input_details[0]['shape']}")
        logger.info(f"Digit output shape: {_digit_output_details[0]['shape']}")
        
        _digit_model_loaded = True
        _digit_using_mock = False
        
    except Exception as e:
        logger.error(f"Failed to load digit model: {e}")
        logger.warning("Falling back to digit mock mode")
        _digit_using_mock = True
        _digit_model_loaded = True
    
    return _digit_interpreter, _digit_input_details, _digit_output_details


def preprocess_digit_image(image_data: str, invert_colors: bool = True) -> np.ndarray:
    """
    Preprocess base64 image data for digit model prediction.
    
    Full MNIST-style pipeline for children's handwriting:
    - RGBA compositing on white background
    - Adaptive Otsu thresholding
    - Morphological closing to fill gaps in children's strokes
    - Connected-component noise removal
    - MNIST-style 20x20 digit in 28x28 frame with center-of-mass centering
    - Anti-aliasing Gaussian blur
    
    Args:
        image_data: Base64 encoded image string
        invert_colors: If True, produces white-on-black (MNIST-style)
        
    Returns:
        numpy array ready for model input [1, 28, 28, 1]
    """
    global _debug_counter
    _debug_counter += 1
    debug_id = _debug_counter
    
    # Ensure debug directory exists
    if DEBUG_SAVE_IMAGES:
        os.makedirs('debug_images', exist_ok=True)
    
    # Remove base64 header if present
    if ',' in image_data:
        image_data = image_data.split(',')[-1]
    
    # Decode base64
    image_bytes = base64.b64decode(image_data)
    img = Image.open(io.BytesIO(image_bytes))
    
    logger.info(f"[D{debug_id}] Original digit image: size={img.size}, mode={img.mode}")
    
    # =========================================================================
    # STEP 1: RGBA → Grayscale with proper alpha compositing
    # =========================================================================
    if img.mode == 'RGBA':
        # Composite on white background (canvas background is white)
        background = Image.new('RGBA', img.size, (255, 255, 255, 255))
        background.paste(img, mask=img.split()[3])
        img_gray = background.convert('L')
        logger.info(f"[D{debug_id}] RGBA composited on white background → grayscale")
    else:
        img_gray = img.convert('L')
    
    img_array = np.array(img_gray, dtype=np.float32)
    
    if DEBUG_SAVE_IMAGES:
        Image.fromarray(img_array.astype(np.uint8)).save(f'debug_images/d{debug_id:03d}_1_grayscale.png')
    
    # =========================================================================
    # STEP 2: Determine stroke polarity and normalize to white-on-black
    # =========================================================================
    # Auto-detect: if mean > 128, background is light (strokes are dark)
    mean_val = img_array.mean()
    if mean_val > 128:
        # Dark strokes on light background → invert to white-on-black
        img_normalized = 255.0 - img_array
        logger.info(f"[D{debug_id}] Inverted dark-on-light (mean={mean_val:.1f})")
    else:
        img_normalized = img_array.copy()
        logger.info(f"[D{debug_id}] Already light-on-dark (mean={mean_val:.1f})")
    
    if DEBUG_SAVE_IMAGES:
        Image.fromarray(img_normalized.astype(np.uint8)).save(f'debug_images/d{debug_id:03d}_2_normalized.png')
    
    # =========================================================================
    # STEP 3: Adaptive threshold (Otsu's method)
    # =========================================================================
    # Compute Otsu threshold for clean binarization
    histogram, _ = np.histogram(img_normalized.ravel(), bins=256, range=(0, 256))
    total_pixels = img_normalized.size
    
    sum_total = np.dot(np.arange(256), histogram)
    sum_bg = 0.0
    weight_bg = 0
    max_variance = 0
    threshold = 0
    
    for t in range(256):
        weight_bg += histogram[t]
        if weight_bg == 0:
            continue
        weight_fg = total_pixels - weight_bg
        if weight_fg == 0:
            break
        sum_bg += t * histogram[t]
        mean_bg = sum_bg / weight_bg
        mean_fg = (sum_total - sum_bg) / weight_fg
        variance = weight_bg * weight_fg * (mean_bg - mean_fg) ** 2
        if variance > max_variance:
            max_variance = variance
            threshold = t
    
    # Apply a minimum threshold to avoid noise
    threshold = max(threshold, 20)
    
    img_binary = np.where(img_normalized > threshold, 1.0, 0.0).astype(np.float32)
    
    logger.info(f"[D{debug_id}] Otsu threshold: {threshold}, stroke pixels: {img_binary.sum():.0f}")
    
    if DEBUG_SAVE_IMAGES:
        Image.fromarray((img_binary * 255).astype(np.uint8)).save(f'debug_images/d{debug_id:03d}_3_binary.png')
    
    # =========================================================================
    # STEP 4: Morphological operations (fill gaps + remove noise)
    # =========================================================================
    if SCIPY_AVAILABLE:
        img_h, img_w = img_binary.shape
        max_side = max(img_h, img_w)
        
        # Scale kernel/iterations to image resolution
        if max_side > 400:
            kern_size = 5
            dilate_iter = 2
        elif max_side > 200:
            kern_size = 4
            dilate_iter = 2
        else:
            kern_size = 3
            dilate_iter = 1
        
        struct_close = np.ones((kern_size, kern_size))
        
        # Closing: dilation then erosion — fills gaps in children's strokes
        img_closed = ndimage.binary_dilation(img_binary > 0, structure=struct_close, iterations=dilate_iter)
        img_closed = ndimage.binary_erosion(img_closed, structure=struct_close, iterations=dilate_iter)
        img_closed = img_closed.astype(np.float32)
        
        # Slight extra dilation to thicken thin child strokes
        struct_thicken = np.ones((3, 3))
        img_closed = ndimage.binary_dilation(img_closed > 0, structure=struct_thicken, iterations=1).astype(np.float32)
        
        # Connected-component noise removal
        labeled, num_features = ndimage.label(img_closed)
        if num_features > 1:
            component_sizes = ndimage.sum(img_closed, labeled, range(1, num_features + 1))
            total_stroke = img_closed.sum()
            min_component_size = max(total_stroke * 0.01, 15)
            
            img_cleaned = np.zeros_like(img_closed)
            for i, size in enumerate(component_sizes):
                if size >= min_component_size:
                    img_cleaned[labeled == (i + 1)] = 1.0
            img_morphed = img_cleaned
            removed = num_features - int((component_sizes >= min_component_size).sum())
            logger.info(f"[D{debug_id}] Removed {removed} noise components")
        else:
            img_morphed = img_closed
        
        logger.info(f"[D{debug_id}] Morphological closing (kern={kern_size}, iter={dilate_iter})")
    else:
        img_morphed = img_binary
    
    if DEBUG_SAVE_IMAGES:
        Image.fromarray((img_morphed * 255).astype(np.uint8)).save(f'debug_images/d{debug_id:03d}_4_morphed.png')
    
    # =========================================================================
    # STEP 5: Bounding box crop with padding
    # =========================================================================
    non_zero = np.nonzero(img_morphed > 0)
    
    if len(non_zero[0]) == 0:
        logger.warning(f"[D{debug_id}] No digit content detected — returning blank")
        blank = np.zeros((1, 28, 28, 1), dtype=np.float32)
        return blank
    
    top = non_zero[0].min()
    bottom = non_zero[0].max()
    left = non_zero[1].min()
    right = non_zero[1].max()
    
    height = bottom - top + 1
    width = right - left + 1
    max_dim = max(height, width)
    padding = int(max_dim * 0.05)  # 5% tight padding (MNIST-style)
    
    top = max(0, top - padding)
    bottom = min(img_morphed.shape[0] - 1, bottom + padding)
    left = max(0, left - padding)
    right = min(img_morphed.shape[1] - 1, right + padding)
    
    img_cropped = img_morphed[top:bottom + 1, left:right + 1]
    
    logger.info(f"[D{debug_id}] Cropped: {img_cropped.shape}")
    
    if DEBUG_SAVE_IMAGES:
        Image.fromarray((img_cropped * 255).astype(np.uint8)).save(f'debug_images/d{debug_id:03d}_5_cropped.png')
    
    # =========================================================================
    # STEP 6: MNIST-style 20×20 in 28×28 with center-of-mass centering
    # =========================================================================
    # Resize to fit in 20×20 box preserving aspect ratio
    h, w = img_cropped.shape
    if h > w:
        new_h = 20
        new_w = max(1, int(w * 20 / h))
    else:
        new_w = 20
        new_h = max(1, int(h * 20 / w))
    
    img_pil = Image.fromarray((img_cropped * 255).astype(np.uint8))
    img_resized = img_pil.resize((new_w, new_h), Image.Resampling.LANCZOS)
    img_20 = np.array(img_resized, dtype=np.float32)
    
    # Normalize stroke intensity: scale max to 255
    if img_20.max() > 0:
        img_20 = img_20 * (255.0 / img_20.max())
    
    # Center-of-mass centering in 28×28 frame
    if SCIPY_AVAILABLE and img_20.sum() > 0:
        cy, cx = ndimage.center_of_mass(img_20)
        # Offset so center-of-mass lands at (14, 14)
        offset_y = int(round(14 - cy))
        offset_x = int(round(14 - cx))
    else:
        # Geometric center fallback
        offset_y = (28 - new_h) // 2
        offset_x = (28 - new_w) // 2
    
    img_28 = np.zeros((28, 28), dtype=np.float32)
    
    # Compute paste region with bounds clipping
    src_y_start = max(0, -offset_y)
    src_x_start = max(0, -offset_x)
    dst_y_start = max(0, offset_y)
    dst_x_start = max(0, offset_x)
    
    copy_h = min(new_h - src_y_start, 28 - dst_y_start)
    copy_w = min(new_w - src_x_start, 28 - dst_x_start)
    
    if copy_h > 0 and copy_w > 0:
        img_28[dst_y_start:dst_y_start + copy_h, dst_x_start:dst_x_start + copy_w] = \
            img_20[src_y_start:src_y_start + copy_h, src_x_start:src_x_start + copy_w]
    
    if DEBUG_SAVE_IMAGES:
        Image.fromarray(img_28.astype(np.uint8)).save(f'debug_images/d{debug_id:03d}_6_centered28.png')
    
    # =========================================================================
    # STEP 7: Anti-aliasing Gaussian blur + final normalization
    # =========================================================================
    img_pil_final = Image.fromarray(img_28.astype(np.uint8))
    img_pil_final = img_pil_final.filter(ImageFilter.GaussianBlur(radius=0.5))
    img_final = np.array(img_pil_final, dtype=np.float32)
    
    # Normalize to 0-1
    img_norm = img_final / 255.0
    
    # Suppress faint noise below threshold
    img_norm = np.where(img_norm > 0.1, img_norm, 0.0)
    
    # Final output: if model expects black-on-white, invert back
    if not invert_colors:
        img_norm = 1.0 - img_norm
    
    logger.info(f"[D{debug_id}] Final digit stats — min: {img_norm.min():.3f}, max: {img_norm.max():.3f}, mean: {img_norm.mean():.3f}")
    
    if DEBUG_SAVE_IMAGES:
        save_img = (img_norm * 255).astype(np.uint8)
        Image.fromarray(save_img).save(f'debug_images/d{debug_id:03d}_7_final.png')
    
    # Reshape for model input: [1, 28, 28, 1]
    input_data = img_norm.reshape(1, 28, 28, 1).astype(np.float32)
    
    return input_data


def mock_predict_digit(input_data: np.ndarray) -> dict:
    """
    Generate a mock prediction for testing when TensorFlow is not available.
    Uses a simple heuristic based on image pixel values.
    """
    # Simple heuristic: use mean pixel value to generate a deterministic-ish result
    mean_val = np.mean(input_data)
    std_val = np.std(input_data)
    
    # Create a pseudo-random but deterministic index based on image content
    index = int((mean_val * 1000 + std_val * 100) % len(DIGIT_LABELS))
    
    # Simulate confidence
    confidence = 0.7 + (std_val * 0.3)  # Higher variation = higher "confidence"
    confidence = min(0.95, max(0.5, confidence))
    
    label = DIGIT_LABELS[index]
    
    logger.info(f"[DIGIT MOCK] Predicted: {label} (index: {index}, confidence: {confidence:.4f})")
    
    return {
        'label': label,
        'confidence': float(confidence),
        'index': index,
        'mock': True  # Flag indicating this is a mock prediction
    }


def predict_digit(image_data: str) -> dict:
    """
    Predict digit from base64 encoded image.
    
    Uses INVERTED color mode (MNIST-style: white digit on black background).
    The model was trained on this format.
    
    Args:
        image_data: Base64 encoded image string
        
    Returns:
        dict with 'label', 'confidence', and 'index'
    """
    global _digit_using_mock
    
    if not _digit_model_loaded:
        raise RuntimeError("Digit model not loaded. Call load_digit_model() first.")
    
    # Use mock prediction if no interpreter available
    if _digit_using_mock or _digit_interpreter is None:
        input_data = preprocess_digit_image(image_data, invert_colors=True)
        return mock_predict_digit(input_data)
    
    # Use INVERTED mode (MNIST-style: white on black)
    # This is the format the model was trained on
    logger.info("Using INVERTED color mode (MNIST-style: white digit on black)")
    
    # Preprocess image with color inversion
    input_data = preprocess_digit_image(image_data, invert_colors=True)
    
    # Run inference
    _digit_interpreter.set_tensor(_digit_input_details[0]['index'], input_data)
    _digit_interpreter.invoke()
    output_data = _digit_interpreter.get_tensor(_digit_output_details[0]['index'])
    
    # Get prediction results
    predictions = output_data[0]
    
    # Get top 3 predictions for more flexible matching
    top_indices = np.argsort(predictions)[::-1][:3]
    
    top_predictions = []
    for idx in top_indices:
        label = DIGIT_LABELS[idx] if idx < len(DIGIT_LABELS) else str(idx)
        conf = float(predictions[idx])
        top_predictions.append({
            'label': label,
            'confidence': conf,
            'index': int(idx)
        })
    
    # Primary prediction
    max_idx = int(top_indices[0])
    confidence = float(predictions[max_idx])
    
    if max_idx < len(DIGIT_LABELS):
        label = DIGIT_LABELS[max_idx]
    else:
        label = str(max_idx)
    
    # Log all top predictions for debugging
    pred_str = ', '.join([f"{p['label']}({p['confidence']:.2f})" for p in top_predictions])
    logger.info(f"Top digit predictions: {pred_str}")
    
    return {
        'label': label,
        'confidence': confidence,
        'index': max_idx,
        'top_predictions': top_predictions
    }


def get_digit_model_info() -> dict:
    """Get information about the loaded digit model."""
    if not _digit_model_loaded:
        return {'loaded': False}
    
    if _digit_using_mock:
        return {
            'loaded': True,
            'mode': 'mock',
            'message': 'Using mock digit predictions (TensorFlow not available)',
            'num_classes': len(DIGIT_LABELS),
            'python_version_note': 'Install Python 3.11/3.12 for actual model inference'
        }
    
    return {
        'loaded': True,
        'mode': 'inference',
        'input_shape': _digit_input_details[0]['shape'].tolist(),
        'output_shape': _digit_output_details[0]['shape'].tolist(),
        'input_dtype': str(_digit_input_details[0]['dtype']),
        'output_dtype': str(_digit_output_details[0]['dtype']),
        'num_classes': len(DIGIT_LABELS)
    }
