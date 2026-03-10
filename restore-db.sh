#!/bin/bash
# Script para restaurar el backup de la base de datos en PostgreSQL Docker

echo "🔄 Restaurando backup de base de datos..."

# Esperar a que PostgreSQL esté listo
echo "Esperando a que PostgreSQL esté listo..."
until docker-compose exec -T postgres pg_isready -U postgres; do
  echo "PostgreSQL no está listo, esperando..."
  sleep 2
done

echo "✅ PostgreSQL está listo"

# Restaurar el backup
echo "📦 Restaurando backup..."
docker-compose exec -T postgres psql -U postgres -d jeanmonnet < "db_cluster-19-07-2024@07-16-59.backup (1)"

if [ $? -eq 0 ]; then
    echo "✅ Backup restaurado exitosamente"
else
    echo "❌ Error al restaurar backup"
    exit 1
fi

echo "🎉 Base de datos lista para usar"
