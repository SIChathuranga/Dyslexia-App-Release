try:
    print("Attempting to import numpy...")
    import numpy
    print(f"✅ Numpy version: {numpy.__version__}")
    
    print("Attempting to import torch...")
    import torch
    print(f"✅ Torch version: {torch.__version__}")
    
    print("Attempting to import ultralytics...")
    from ultralytics import YOLO
    print(f"✅ Ultralytics imported")
    
    print("Attempting to load model...")
    model = YOLO("yolov8n.pt")
    print("✅ Model loaded successfully")
    
except Exception as e:
    print(f"❌ ERROR: {e}")
    import traceback
    traceback.print_exc()
