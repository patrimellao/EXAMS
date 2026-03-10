#!/bin/bash
# Script de setup completo para Linux/Mac

set -e  # Exit on error

echo "🚀 Jean Monnet Serious Game - Setup Completo"
echo "=============================================="
echo ""

# 1. Crear directorios
echo "📁 Step 1/6: Creando estructura de directorios..."
mkdir -p lib/redis
mkdir -p lib/queues
mkdir -p workers/processors
echo "   ✅ Directorios creados"
echo ""

# 2. Instalar dependencias
echo "📦 Step 2/6: Instalando dependencias..."
npm install
echo "   ✅ Dependencias instaladas"
echo ""

# 3. Configurar environment
echo "📝 Step 3/6: Configurando variables de entorno..."
if [ ! -f .env.local ]; then
    cp .env.local.example .env.local
    echo "   ⚠️  Archivo .env.local creado"
    echo "   ⚠️  IMPORTANTE: Edita .env.local con tus credenciales de Supabase"
else
    echo "   ℹ️  .env.local ya existe, no se sobrescribe"
fi

if [ ! -f .env ]; then
    cp .env .env
    echo "   ✅ Archivo .env configurado para Docker"
fi
echo ""

# 4. Iniciar Docker
echo "🐳 Step 4/6: Iniciando servicios Docker..."
docker-compose up -d
echo "   ✅ Servicios Docker iniciados"
echo ""

# 5. Esperar a PostgreSQL
echo "⏳ Step 5/6: Esperando a que PostgreSQL esté listo..."
until docker-compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1; do
  printf "."
  sleep 2
done
echo ""
echo "   ✅ PostgreSQL está listo"
echo ""

# 6. Restaurar backup
echo "📦 Step 6/6: Restaurando backup de base de datos..."
if [ -f "db_cluster-19-07-2024@07-16-59.backup (1)" ]; then
    docker-compose exec -T postgres psql -U postgres -d jeanmonnet < "db_cluster-19-07-2024@07-16-59.backup (1)" 2>/dev/null
    echo "   ✅ Backup restaurado"
else
    echo "   ⚠️  Archivo de backup no encontrado, saltando..."
fi
echo ""

# Resumen
echo "=============================================="
echo "✅ Setup completado exitosamente!"
echo "=============================================="
echo ""
echo "📝 Servicios disponibles:"
echo "   🌐 App:         http://localhost:3000"
echo "   📊 Bull Board:  http://localhost:3001"
echo "   🗄️  PostgreSQL: localhost:5432"
echo "   🔴 Redis:       localhost:6379"
echo ""
echo "⚠️  IMPORTANTE: Edita .env.local con tus credenciales de Supabase"
echo ""
echo "📚 Ver logs: docker-compose logs -f"
echo "🛑 Parar servicios: docker-compose down"
echo ""
