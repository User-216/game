@echo off
cd /d "%~dp0"
if exist "Game.exe" (
    start "" "Game.exe"
    exit /b
)
where pythonw >nul 2>&1
if %errorlevel% equ 0 (
    start "" pythonw app.py
    exit /b
)
start "" python app.py
