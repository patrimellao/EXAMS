@echo off
echo 📝 Creando archivos de código TypeScript...
echo.

REM Verificar que existen los directorios
if not exist "lib\redis" (
    echo ❌ Error: El directorio lib\redis no existe
    echo Ejecuta primero: create-dirs.bat
    pause
    exit /b 1
)

echo Creando archivos Redis...
call :CREATE_FILE "lib\redis\client.ts"
call :CREATE_FILE "lib\redis\leaderboard.ts"
call :CREATE_FILE "lib\redis\quiz-session.ts"
call :CREATE_FILE "lib\redis\rate-limiter.ts"

echo Creando archivos de Queues...
call :CREATE_FILE "lib\queues\connection.ts"
call :CREATE_FILE "lib\queues\ranking.queue.ts"
call :CREATE_FILE "lib\queues\streak.queue.ts"
call :CREATE_FILE "lib\queues\achievement.queue.ts"
call :CREATE_FILE "lib\queues\email.queue.ts"

echo Creando archivos de Workers...
call :CREATE_FILE "workers\index.ts"
call :CREATE_FILE "workers\processors\ranking.processor.ts"
call :CREATE_FILE "workers\processors\streak.processor.ts"
call :CREATE_FILE "workers\processors\achievement.processor.ts"
call :CREATE_FILE "workers\processors\email.processor.ts"

echo.
echo ✅ Todos los archivos creados!
echo.
echo Próximos pasos:
echo 1. Verifica los archivos en lib\redis, lib\queues y workers
echo 2. Ejecuta: npm install
echo 3. Ejecuta: docker-compose up -d
pause
exit /b 0

:CREATE_FILE
echo    - %~1
type nul > "%~1"
exit /b 0
