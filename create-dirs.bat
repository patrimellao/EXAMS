@echo off
echo 🚀 Creating directory structure for Jean Monnet Serious Game...

REM Create lib directories
if not exist "lib\redis" mkdir "lib\redis"
if not exist "lib\queues" mkdir "lib\queues"

REM Create workers directories
if not exist "workers" mkdir "workers"
if not exist "workers\processors" mkdir "workers\processors"

echo ✅ Directory structure created!
echo.
echo Now run: npm install
