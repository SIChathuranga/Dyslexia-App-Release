"""
Diagnostic script to determine the correct image orientation for the model.
Tests synthetic letter images against all orientations to find which one
the model was trained on.
"""
import sys
sys.path.insert(0, '.')

import numpy as np
from PIL import Image, ImageDraw, ImageFont
import os

# Load model
import tensorflow as tf

model_path = 'models/letter_model.tflite'
interpreter = tf.lite.Interpreter(model_path=model_path)
interpreter.allocate_tensors()
input_details = interpreter.get_input_details()
output_details = interpreter.get_output_details()

LABELS = list('ABCDEFGHIJKLMNOPQRSTUVWXYZ')

def create_test_letter(letter, size=28):
    """Create a synthetic 28x28 image of a letter (white on black)."""
    img = Image.new('L', (size * 4, size * 4), 0)  # Black background
    draw = ImageDraw.Draw(img)
    
    # Try to use a font, fall back to default
    try:
        font = ImageFont.truetype("arial.ttf", size * 3)
    except:
        font = ImageFont.load_default()
    
    # Draw letter in white
    bbox = draw.textbbox((0, 0), letter, font=font)
    w = bbox[2] - bbox[0]
    h = bbox[3] - bbox[1]
    x = (size * 4 - w) // 2 - bbox[0]
    y = (size * 4 - h) // 2 - bbox[1]
    draw.text((x, y), letter, fill=255, font=font)
    
    # Resize to 28x28
    img = img.resize((size, size), Image.Resampling.LANCZOS)
    return np.array(img, dtype=np.float32) / 255.0

def predict_with_orientation(img_28, orientation_name):
    """Run prediction with a specific orientation."""
    if orientation_name == "base":
        processed = img_28
    elif orientation_name == "transpose":
        processed = img_28.T
    elif orientation_name == "flip_lr":
        processed = np.fliplr(img_28)
    elif orientation_name == "flip_ud":
        processed = np.flipud(img_28)
    elif orientation_name == "transpose_flip_lr":
        processed = np.fliplr(img_28.T)
    elif orientation_name == "transpose_flip_ud":
        processed = np.flipud(img_28.T)
    elif orientation_name == "rot90_cw":
        processed = np.rot90(img_28, k=3)
    elif orientation_name == "rot90_ccw":
        processed = np.rot90(img_28, k=1)
    elif orientation_name == "rot180":
        processed = np.rot90(img_28, k=2)
    elif orientation_name == "flip_lr_flip_ud":
        processed = np.flipud(np.fliplr(img_28))
    else:
        processed = img_28
    
    input_data = np.expand_dims(processed, axis=(0, -1)).astype(np.float32)
    interpreter.set_tensor(input_details[0]['index'], input_data)
    interpreter.invoke()
    output = interpreter.get_tensor(output_details[0]['index'])[0]
    
    top_idx = np.argmax(output)
    return LABELS[top_idx], float(output[top_idx])

# Test letters that are orientation-sensitive
test_letters = ['L', 'F', 'W', 'M', 'P', 'R', 'E', 'A', 'B', 'D', 'N', 'Z', 'K', 'J']

orientations = [
    "base",
    "transpose", 
    "flip_lr",
    "flip_ud",
    "transpose_flip_lr",
    "transpose_flip_ud",
    "rot90_cw",
    "rot90_ccw",
    "rot180",
    "flip_lr_flip_ud",
]

print("=" * 100)
print("MODEL ORIENTATION DIAGNOSTIC TEST")
print("=" * 100)
print()

# Track correct predictions per orientation
orientation_scores = {o: 0 for o in orientations}
orientation_details = {o: [] for o in orientations}

for letter in test_letters:
    img = create_test_letter(letter)
    
    print(f"\nExpected Letter: {letter}")
    print(f"{'Orientation':<25} {'Predicted':<12} {'Confidence':<12} {'Correct?'}")
    print("-" * 60)
    
    for orient in orientations:
        pred_label, pred_conf = predict_with_orientation(img, orient)
        correct = pred_label == letter
        if correct:
            orientation_scores[orient] += 1
        orientation_details[orient].append((letter, pred_label, pred_conf, correct))
        
        marker = "OK" if correct else "WRONG"
        print(f"  {orient:<23} {pred_label:<12} {pred_conf:<12.4f} {marker}")

print("\n" + "=" * 100)
print("ORIENTATION ACCURACY SUMMARY")
print("=" * 100)

sorted_orientations = sorted(orientation_scores.items(), key=lambda x: x[1], reverse=True)
for orient, score in sorted_orientations:
    pct = score / len(test_letters) * 100
    print(f"  {orient:<25} {score:2d}/{len(test_letters):2d} ({pct:5.1f}%)")

best_orientation = sorted_orientations[0][0]
best_score = sorted_orientations[0][1]
print(f"\n{'='*50}")
print(f"  BEST ORIENTATION: {best_orientation} ({best_score}/{len(test_letters)} correct)")
print(f"{'='*50}")

# Show details for the best orientation
print(f"\nDetails for '{best_orientation}':")
for letter, pred, conf, correct in orientation_details[best_orientation]:
    marker = "OK" if correct else "WRONG"
    print(f"  {letter} -> {pred} ({conf:.4f}) {marker}")
