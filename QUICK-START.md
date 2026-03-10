# 🚀 Quick Start Guide - Jean Monnet Serious Game

## Paso 1: Crear directorios necesarios

```cmd
create-dirs.bat
```

## Paso 2: Instalar dependencias de Node.js

```bash
npm install
```

## Paso 3: Configurar variables de entorno

### Opción A: Desarrollo Local (sin Docker)
```bash
# Copia el archivo de ejemplo
copy .env.local.example .env.local

# Edita .env.local y añade tus credenciales de Supabase:
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### Opción B: Desarrollo con Docker (Recomendado)
```bash
# Copia el archivo de ejemplo
copy .env.local.example .env.local

# Las variables de DATABASE_URL y REDIS_URL ya están configuradas para Docker
# Solo necesitas añadir tus credenciales de Supabase para la autenticación
```

## Paso 4: Iniciar servicios con Docker

```bash
# Iniciar todos los servicios (PostgreSQL, Redis, App, Worker, Bull Board)
docker-compose up -d

# Ver logs en tiempo real
docker-compose logs -f
```

## Paso 5: Restaurar backup de base de datos

**PRIMERA VEZ ÚNICAMENTE** - Restaura el backup existente:

```cmd
# Windows
restore-db.bat

# Linux/Mac
bash restore-db.sh
```

Este script:
1. Espera a que PostgreSQL esté listo
2. Restaura el backup `db_cluster-19-07-2024@07-16-59.backup (1)`
3. Deja la base de datos lista para usar

## Paso 6: Verificar que todo funciona

### Verificar servicios:
```bash
docker-compose ps
```

Deberías ver 5 servicios corriendo:
- ✅ jeanmonnet-postgres (puerto 5432)
- ✅ jeanmonnet-redis (puerto 6379)
- ✅ jeanmonnet-app (puerto 3000)
- ✅ jeanmonnet-worker
- ✅ jeanmonnet-bull-board (puerto 3001)

### Acceder a la aplicación:
- 🌐 **App**: http://localhost:3000
- 📊 **Bull Board** (Dashboard de jobs): http://localhost:3001
- 🗄️ **PostgreSQL**: localhost:5432 (usuario: postgres, password: postgres)
- 🔴 **Redis**: localhost:6379

### Probar conexión a Redis:
```bash
docker-compose exec redis redis-cli ping
# Debe responder: PONG
```

### Probar conexión a PostgreSQL:
```bash
docker-compose exec postgres psql -U postgres -d jeanmonnet -c "\dt"
# Debe mostrar las tablas de la base de datos
```

## Paso 7: (Opcional) Aplicar migraciones de Drizzle

Si necesitas aplicar nuevas migraciones después de restaurar el backup:

```bash
# Generar migraciones desde el schema actual
npm run generate

# Aplicar migraciones
npm run push
```

---

## 🛠️ Comandos Útiles

### Docker:
```bash
# Ver logs de un servicio específico
docker-compose logs -f app
docker-compose logs -f worker
docker-compose logs -f postgres

# Reiniciar un servicio
docker-compose restart app

# Parar todos los servicios
docker-compose down

# Parar y eliminar volúmenes (reset completo)
docker-compose down -v

# Reconstruir imágenes
docker-compose build --no-cache
```

### Base de Datos:
```bash
# Entrar a PostgreSQL
docker-compose exec postgres psql -U postgres -d jeanmonnet

# Ver tablas
docker-compose exec postgres psql -U postgres -d jeanmonnet -c "\dt"

# Hacer backup manual
docker-compose exec postgres pg_dump -U postgres jeanmonnet > backup-$(date +%Y%m%d).sql
```

### Redis:
```bash
# Entrar a Redis CLI
docker-compose exec redis redis-cli

# Ver todas las keys
docker-compose exec redis redis-cli KEYS "*"

# Limpiar Redis
docker-compose exec redis redis-cli FLUSHALL
```

### Desarrollo Local (sin Docker):
```bash
# Desarrollo con hot reload
npm run dev

# Build de producción
npm run build

# Iniciar en producción
npm start

# Build del worker
npm run build:worker

# Ejecutar worker localmente
npm run worker
```

---

## ❓ Troubleshooting

### "Puerto 3000 ya está en uso"
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

### "Error al conectar con PostgreSQL"
```bash
# Verificar que el contenedor esté corriendo
docker-compose ps

# Revisar logs
docker-compose logs postgres

# Reiniciar PostgreSQL
docker-compose restart postgres
```

### "Redis connection failed"
```bash
# Verificar que Redis esté corriendo
docker-compose ps redis

# Revisar logs
docker-compose logs redis

# Reiniciar Redis
docker-compose restart redis
```

### "No puedo acceder a Bull Board"
```bash
# Verificar que el contenedor esté corriendo
docker-compose ps bull-board

# Si no está corriendo, levantarlo
docker-compose up -d bull-board
```

### Reset completo del entorno:
```bash
# Parar todo y eliminar volúmenes
docker-compose down -v

# Eliminar node_modules y package-lock
rm -rf node_modules package-lock.json

# Reinstalar dependencias
npm install

# Levantar servicios
docker-compose up -d

# Restaurar backup
restore-db.bat  # o restore-db.sh en Linux/Mac
```

---

## 📚 Documentación Adicional

- [Architecture.md](./Evolucion/Architecture.md) - Arquitectura técnica detallada
- [ROADMAP.md](./Evolucion/ROADMAP.md) - Roadmap de desarrollo
- [REWORKS-STATUS.md](./Evolucion/REWORKS-STATUS.md) - Estado de implementación
- [CasosDeUso.md](./Evolucion/CasosDeUso.md) - Casos de uso del sistema

---

## 🎯 Próximos Pasos

Una vez que tengas todo corriendo:

1. **Verificar autenticación**: Prueba el login/registro en http://localhost:3000
2. **Explorar Bull Board**: Ve los jobs programados en http://localhost:3001
3. **Revisar logs del worker**: `docker-compose logs -f worker`
4. **Implementar REWORK-4**: Migración de BD con campos de gamificación (ver ROADMAP.md)

---

## 💡 Tips

- Usa **Bull Board** para monitorear jobs en tiempo real
- Los workers se reinician automáticamente si fallan
- Redis guarda datos en volumen persistente
- PostgreSQL guarda datos en volumen persistente
- El hot reload funciona en modo desarrollo (`npm run dev`)
