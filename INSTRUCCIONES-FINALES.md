# 📋 INSTRUCCIONES FINALES - Setup Completo

## ✅ Estado Actual

Has completado exitosamente:
- ✅ Instalación de dependencias (npm install)
- ✅ Configuración de variables de entorno (.env.local)
- ✅ Docker Compose configurado
- ✅ Archivos Docker (Dockerfile, docker-compose.yml) creados

## 🔧 Pasos Finales para Completar el Setup

### Paso 1: Crear Directorios
```cmd
create-dirs.bat
```

### Paso 2: Copiar Código TypeScript

Los archivos de código están listos pero necesitan copiarse a las carpetas. 

**OPCIÓN A (Recomendada): Copiar archivos manualmente**

Necesitas crear 14 archivos TypeScript con el código que está en `REWORKS-STATUS.md`:

**Archivos Redis (lib/redis/):**
1. `client.ts` - Cliente Redis
2. `leaderboard.ts` - Servicio de rankings  
3. `quiz-session.ts` - Sesiones de quiz
4. `rate-limiter.ts` - Rate limiting

**Archivos Queues (lib/queues/):**
5. `connection.ts` - Conexión Redis para BullMQ
6. `ranking.queue.ts` - Queue de rankings
7. `streak.queue.ts` - Queue de streaks
8. `achievement.queue.ts` - Queue de achievements
9. `email.queue.ts` - Queue de emails

**Archivos Workers (workers/):**
10. `index.ts` - Entry point del worker
11. `processors/ranking.processor.ts` - Procesador de rankings
12. `processors/streak.processor.ts` - Procesador de streaks
13. `processors/achievement.processor.ts` - Procesador de achievements
14. `processors/email.processor.ts` - Procesador de emails

**OPCIÓN B: Usar Git Bash (si tienes instalado)**
```bash
bash create-all-files.sh
```

### Paso 3: Editar Credenciales de Supabase

Abre `.env.local` y añade tus credenciales:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-aqui
```

Obtén estas credenciales en: https://app.supabase.com/project/_/settings/api

### Paso 4: Iniciar Docker

```cmd
docker-compose up -d
```

Esto iniciará:
- PostgreSQL (puerto 5432)
- Redis (puerto 6379)  
- Next.js App (puerto 3000) - **Requiere los archivos TypeScript**
- BullMQ Worker - **Requiere los archivos TypeScript**
- Bull Board (puerto 3001)

### Paso 5: Restaurar Base de Datos

**Espera 30 segundos** después de iniciar Docker, luego:

```cmd
restore-db.bat
```

Esto restaura el backup `db_cluster-19-07-2024@07-16-59.backup (1)`.

### Paso 6: Verificar que Todo Funciona

```cmd
# Ver servicios corriendo
docker-compose ps

# Ver logs
docker-compose logs -f

# Probar Redis
docker-compose exec redis redis-cli ping
# Debe responder: PONG

# Probar PostgreSQL  
docker-compose exec postgres psql -U postgres -d jeanmonnet -c "\dt"
# Debe mostrar las tablas
```

### Paso 7: Acceder a la Aplicación

- **App**: http://localhost:3000
- **Bull Board**: http://localhost:3001

---

## ⚠️ IMPORTANTE: Sobre los Archivos TypeScript

Los servicios `app` y `worker` en Docker **NO FUNCIONARÁN** hasta que copies los archivos TypeScript, porque:

1. El `Dockerfile` intenta hacer `npm run build` que requiere los archivos en `lib/` y `workers/`
2. El `Dockerfile.worker` intenta compilar TypeScript con `npm run build:worker`

**Solución temporal**: Puedes comentar los servicios `app` y `worker` en `docker-compose.yml` y ejecutar la app localmente:

```cmd
# Solo levantar PostgreSQL y Redis
docker-compose up -d postgres redis bull-board

# Ejecutar app localmente (después de copiar los archivos TS)
npm run dev
```

---

## 📁 Donde Copiar el Código

El código completo de los 14 archivos está documentado en:
- **`Evolucion/REWORKS-STATUS.md`** - Contiene TODO el código

O puedes crear archivos vacíos temporalmente con:
```cmd
create-source-files.bat
```

Luego copiar el contenido desde `REWORKS-STATUS.md`.

---

## 🎯 Checklist Final

- [ ] Directorios creados (`create-dirs.bat`)
- [ ] Archivos TypeScript copiados (14 archivos)
- [ ] `.env.local` editado con credenciales Supabase
- [ ] `npm install` ejecutado
- [ ] Docker iniciado (`docker-compose up -d`)
- [ ] Backup restaurado (`restore-db.bat`)
- [ ] App accesible en http://localhost:3000
- [ ] Bull Board accesible en http://localhost:3001

---

## 🆘 Si Algo Falla

### Docker no inicia app o worker:
```cmd
# Solo levantar BD y Redis
docker-compose up -d postgres redis bull-board

# Ejecutar app localmente
npm run dev
```

### Error de TypeScript:
```cmd
# Verificar que existen los archivos
dir lib\redis
dir lib\queues  
dir workers\processors
```

### Reset completo:
```cmd
docker-compose down -v
create-dirs.bat
REM Copiar archivos TypeScript de nuevo
docker-compose up -d
```

---

## 📞 Siguiente Paso

**AHORA**: Ejecuta `create-dirs.bat` y copia los archivos TypeScript.

**DESPUÉS**: Todo está listo para comenzar el desarrollo! 🚀

Ver [ROADMAP.md](./Evolucion/ROADMAP.md) para los próximos sprints de desarrollo.
