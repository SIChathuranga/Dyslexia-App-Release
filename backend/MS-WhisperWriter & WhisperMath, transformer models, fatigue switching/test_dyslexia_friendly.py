"""
Test predict_letter_dyslexia_friendly for all 26 letters.
Verifies that the new rank-based acceptance logic works correctly,
especially for the I/L confusion pair.
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from services.ml_service import predict_letter_dyslexia_friendly, load_model
from PIL import Image, ImageDraw, ImageFont
import base64, io

load_model('models/letter_model.tflite')

def make_letter_image(letter, size=200, font_size=120):
    img = Image.new('RGB', (size, size), 'white')
    draw = ImageDraw.Draw(img)
    try:
        font = ImageFont.truetype('arial.ttf', font_size)
    except:
        font = ImageFont.load_default()
    bbox = draw.textbbox((0, 0), letter, font=font)
    x = (size - (bbox[2] - bbox[0])) // 2 - bbox[0]
    y = (size - (bbox[3] - bbox[1])) // 2 - bbox[1]
    draw.text((x, y), letter, fill='black', font=font)
    buf = io.BytesIO()
    img.save(buf, format='PNG')
    return base64.b64encode(buf.getvalue()).decode()

print("=" * 60)
print("DYSLEXIA-FRIENDLY ACCEPTANCE TEST")
print("=" * 60)

results = []
for letter in 'ABCDEFGHIJKLMNOPQRSTUVWXYZ':
    b64 = make_letter_image(letter)
    r = predict_letter_dyslexia_friendly(b64, expected_letter=letter)
    status = 'ACCEPT' if r['should_accept'] else 'REJECT'
    fb_level = r.get('feedback_level', '?')
    msg = r['feedback_message'][:65]
    results.append((letter, status, fb_level))
    print(f"  {letter}: {status:6s} ({fb_level:10s}) - {msg}")

accepted = sum(1 for _, s, _ in results if s == 'ACCEPT')
rejected = [letter for letter, s, _ in results if s != 'ACCEPT']

print()
print("=" * 60)
print(f"RESULT: {accepted}/26 accepted ({100*accepted/26:.1f}%)")
if rejected:
    print(f"Rejected: {', '.join(rejected)}")
else:
    print("All 26 letters accepted!")
print("=" * 60)
