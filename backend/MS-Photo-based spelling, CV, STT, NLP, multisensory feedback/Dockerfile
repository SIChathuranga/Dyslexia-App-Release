# ---- Hugging Face Spaces: Docker SDK ----
FROM python:3.11-slim

# Install system dependencies (ffmpeg for audio processing, libgl for OpenCV/ultralytics)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# HF Spaces runs as user "user" with home /home/user
RUN useradd -m -u 1000 user
WORKDIR /home/user/app

# Install Python deps first (layer caching)
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy application code and model files
COPY main.py .
COPY best_yolov8_openimages_plus_roboflow_v2-3.pt .

# Give the non-root user ownership of the app directory
RUN chown -R user:user /home/user/app

# Switch to non-root user
USER user

# Writable dirs for Ultralytics config and temp audio files
ENV YOLO_CONFIG_DIR=/tmp/Ultralytics
ENV TMPDIR=/tmp

# HF Spaces exposes port 7860 by default
ENV PORT=7860
EXPOSE 7860

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
