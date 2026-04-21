@echo off
REM ==============================================
REM Run Script for Letter Recognition API
REM ==============================================

echo.
echo ============================================
echo   Starting Letter Recognition API Server
echo ============================================
echo.

REM Check if virtual environment exists
if exist venv311\Scripts\activate.bat (
    set "VENV_DIR=venv311"
) else (
    set "VENV_DIR=venv"
)

if not exist %VENV_DIR%\Scripts\activate.bat (
    echo [ERROR] Virtual environment not found!
    echo Please run setup.bat first.
    pause
    exit /b 1
)

REM Activate virtual environment
call %VENV_DIR%\Scripts\activate.bat

REM Verify Python version in this venv before running
python -c "import sys; ok=((sys.version_info.major, sys.version_info.minor) in [(3,11),(3,12)]); sys.exit(0 if ok else 1)"
if %errorlevel% neq 0 (
    echo [ERROR] This backend environment is not Python 3.11/3.12.
    echo         Real model inference will run in MOCK mode.
    echo         Recreate venv using Python 3.11 or 3.12.
    pause
    exit /b 1
)

REM Run the application
python run.py

pause
