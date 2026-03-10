@echo off
REM Script para restaurar el backup de la base de datos en PostgreSQL Docker

echo 🔄 Restaurando backup de base de datos...

REM Esperar a que PostgreSQL esté listo
echo Esperando a que PostgreSQL esté listo...
:wait_postgres
docker-compose exec -T postgres pg_isready -U postgres >nul 2>&1
if errorlevel 1 (
    echo PostgreSQL no está listo, esperando...
    timeout /t 2 /nobreak >nul
    goto wait_postgres
)

echo ✅ PostgreSQL está listo

REM Restaurar el backup
echo 📦 Restaurando backup...
docker-compose exec -T postgres psql -U postgres -d jeanmonnet < "db_cluster-19-07-2024@07-16-59.backup (1)"

if %errorlevel% equ 0 (
    echo ✅ Backup restaurado exitosamente
) else (
    echo ❌ Error al restaurar backup
    exit /b 1
)

echo 🎉 Base de datos lista para usar
