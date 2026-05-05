"""
Quick verification test: Send synthetic letter images through the full
predict_letter pipeline and verify correct recognition.
"""
import sys
sys.path.insert(0, '.')

import numpy as np
from PIL import Image, ImageDraw, ImageFont
import base64
import io
from services.ml_service import predict_letter, load_model

# Load the model first
load_model('models/letter_model.tflite')

def create_test_image_base64(letter, size=200):
    """Create a test image (black letter on white bg) and return as base64."""
    img = Image.new('RGB', (size, size), (255, 255, 255))  # White background
    draw = ImageDraw.Draw(img)
    
    try:
        font = ImageFont.truetype("arial.ttf", int(size * 0.7))
    except:
        font = ImageFont.load_default()
    
    bbox = draw.textbbox((0, 0), letter, font=font)
    w = bbox[2] - bbox[0]
    h = bbox[3] - bbox[1]
    x = (size - w) // 2 - bbox[0]
    y = (size - h) // 2 - bbox[1]
    draw.text((x, y), letter, fill=(0, 0, 0), font=font)
    
    buf = io.BytesIO()
    img.save(buf, format='PNG')
    b64 = base64.b64encode(buf.getvalue()).decode('utf-8')
    return f"data:image/png;base64,{b64}"

# Test all 26 letters
test_letters = list('ABCDEFGHIJKLMNOPQRSTUVWXYZ')
correct = 0
wrong = []

print("=" * 60)
print("FULL PIPELINE VERIFICATION TEST")
print("=" * 60)

for letter in test_letters:
    b64 = create_test_image_base64(letter)
    result = predict_letter(b64)
    predicted = result['label']
    confidence = result['confidence']
    
    if predicted == letter:
        correct += 1
        status = "OK"
    else:
        wrong.append((letter, predicted, confidence))
        status = "WRONG"
    
    top_3 = ', '.join([f"{p['label']}({p['confidence']:.2f})" for p in result.get('top_predictions', [])])
    print(f"  {letter} -> {predicted} ({confidence:.4f}) [{status}]  Top3: {top_3}")

print(f"\n{'='*60}")
print(f"RESULT: {correct}/{len(test_letters)} correct ({correct/len(test_letters)*100:.1f}%)")
if wrong:
    print(f"\nMismatches:")
    for expected, got, conf in wrong:
        print(f"  Expected '{expected}' but got '{got}' (conf: {conf:.4f})")
else:
    print("ALL LETTERS CORRECT!")
print(f"{'='*60}")
