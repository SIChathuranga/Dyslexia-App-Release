@echo off
REM ==============================================
REM Setup Script for Letter Recognition API
REM ==============================================

echo.
echo ============================================
echo   Letter Recognition API - Setup Script
echo ============================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in PATH
    echo Please install Python 3.8+ from https://python.org
    pause
    exit /b 1
)

REM Prefer Python 3.11 launcher when available
set "PYTHON_CMD=python"
py -3.11 --version >nul 2>&1
if %errorlevel% equ 0 (
    set "PYTHON_CMD=py -3.11"
)

REM Enforce Python version compatible with TensorFlow/TFLite runtime
%PYTHON_CMD% -c "import sys; ok=((sys.version_info.major, sys.version_info.minor) in [(3,11),(3,12)]); sys.exit(0 if ok else 1)"
if %errorlevel% neq 0 (
    echo [ERROR] Unsupported Python version for real model inference.
    echo         Detected:
    python --version
    echo.
    echo Please install Python 3.11 or 3.12 and run setup again.
    echo Python 3.14 currently cannot install tensorflow/tflite-runtime for this project.
    pause
    exit /b 1
)

echo [1/5] Creating virtual environment...
%PYTHON_CMD% -m venv venv311
if %errorlevel% neq 0 (
    echo [ERROR] Failed to create virtual environment
    pause
    exit /b 1
)
echo       Virtual environment created successfully!

echo.
echo [2/5] Activating virtual environment...
call venv311\Scripts\activate.bat
echo       Virtual environment activated!

echo.
echo [3/5] Upgrading pip...
python -m pip install --upgrade pip
echo       Pip upgraded!

echo.
echo [4/5] Installing dependencies...
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install dependencies
    pause
    exit /b 1
)
echo       Dependencies installed successfully!

echo.
echo [5/5] Setting up environment file...
if not exist .env (
    copy .env.example .env
    echo       Created .env file from template
) else (
    echo       .env file already exists, skipping...
)

echo.
echo ============================================
echo   Setup Complete!
echo ============================================
echo.
echo Next steps:
echo   1. Make sure letter_model.tflite is in the models/ folder
echo   2. Run: python run.py
echo   3. Server will start at http://0.0.0.0:5000
echo.
echo To activate the virtual environment later:
echo   venv311\Scripts\activate
echo.

pause
