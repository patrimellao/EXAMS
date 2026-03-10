@echo off
REM Script de setup completo para Windows

echo 🚀 Jean Monnet Serious Game - Setup Completo
echo ==============================================
echo.

REM 1. Crear directorios
echo 📁 Step 1/6: Creando estructura de directorios...
if not exist "lib\redis" mkdir "lib\redis"
if not exist "lib\queues" mkdir "lib\queues"
if not exist "workers" mkdir "workers"
if not exist "workers\processors" mkdir "workers\processors"
echo    ✅ Directorios creados
echo.

REM 2. Instalar dependencias
echo 📦 Step 2/6: Instalando dependencias...
call npm install
if %errorlevel% neq 0 (
    echo    ❌ Error instalando dependencias
    pause
    exit /b 1
)
echo    ✅ Dependencias instaladas
echo.

REM 3. Configurar environment
echo 📝 Step 3/6: Configurando variables de entorno...
if not exist ".env.local" (
    copy ".env.local.example" ".env.local" >nul
    echo    ⚠️  Archivo .env.local creado
    echo    ⚠️  IMPORTANTE: Edita .env.local con tus credenciales de Supabase
) else (
    echo    ℹ️  .env.local ya existe, no se sobrescribe
)

if not exist ".env" (
    copy ".env.local.example" ".env" >nul
    echo    ✅ Archivo .env configurado para Docker
)
echo.

REM 4. Iniciar Docker
echo 🐳 Step 4/6: Iniciando servicios Docker...
docker compose up -d
if %errorlevel% neq 0 (
    echo    ❌ Error iniciando Docker
    pause
    exit /b 1
)
echo    ✅ Servicios Docker iniciados
echo.

REM 5. Esperar a PostgreSQL
echo ⏳ Step 5/6: Esperando a que PostgreSQL esté listo...
:wait_postgres
docker-compose exec -T postgres pg_isready -U postgres >nul 2>&1
if errorlevel 1 (
    echo    Esperando...
    timeout /t 2 /nobreak >nul
    goto wait_postgres
)
echo    ✅ PostgreSQL está listo
echo.

REM 6. Restaurar backup
echo 📦 Step 6/6: Restaurando backup de base de datos...
if exist "db_cluster-19-07-2024@07-16-59.backup (1)" (
    docker-compose exec -T postgres psql -U postgres -d jeanmonnet < "db_cluster-19-07-2024@07-16-59.backup (1)" 2>nul
    echo    ✅ Backup restaurado
) else (
    echo    ⚠️  Archivo de backup no encontrado, saltando...
)
echo.

REM Resumen
echo ==============================================
echo ✅ Setup completado exitosamente!
echo ==============================================
echo.
echo 📝 Servicios disponibles:
echo    🌐 App:         http://localhost:3000
echo    📊 Bull Board:  http://localhost:3001
echo    🗄️  PostgreSQL: localhost:5432
echo    🔴 Redis:       localhost:6379
echo.
echo ⚠️  IMPORTANTE: Edita .env.local con tus credenciales de Supabase
echo.
echo 📚 Ver logs: docker-compose logs -f
echo 🛑 Parar servicios: docker-compose down
echo.
pause
