# Jean Monnet Serious Game

Sistema de gamificación educativa para oposiciones, construido con Next.js 14, Supabase, Redis y BullMQ.

---

## 🚀 Setup Rápido (Recomendado)

### Opción 1: Setup Automático Completo

**Windows:**
```cmd
setup-complete.bat
```

Este script hace TODO automáticamente:
1. ✅ Crea estructura de directorios
2. ✅ Instala dependencias (npm install)
3. ✅ Configura .env.local
4. ✅ Inicia Docker (PostgreSQL, Redis, App, Worker, Bull Board)
5. ✅ Espera a que PostgreSQL esté listo
6. ✅ Restaura el backup de la base de datos

**Linux/Mac:**
```bash
chmod +x setup-complete.sh
./setup-complete.sh
```

### Opción 2: Setup Manual Paso a Paso

Ver [QUICK-START.md](./QUICK-START.md) para instrucciones detalladas paso a paso.

---

## 📝 Configuración de Supabase

Después del setup, **debes editar** el archivo `.env.local` con tus credenciales de Supabase:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-aqui
```

Obtén estas credenciales en: https://app.supabase.com/project/_/settings/api

---

## 🌐 Acceder a la Aplicación

Una vez completado el setup:

- **App**: http://localhost:3000
- **Bull Board** (Dashboard de jobs): http://localhost:3001
- **PostgreSQL**: localhost:5432 (usuario: postgres, password: postgres)
- **Redis**: localhost:6379

---

## 🛠️ Comandos de Desarrollo

### Docker:
```bash
# Ver logs de todos los servicios
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f app
docker-compose logs -f worker

# Reiniciar un servicio
docker-compose restart app

# Parar todos los servicios
docker-compose down

# Reset completo (elimina volúmenes)
docker-compose down -v
```

### Desarrollo Local:
```bash
# Modo desarrollo con hot reload
npm run dev

# Build de producción
npm run build

# Ejecutar en producción
npm start

# Compilar worker
npm run build:worker

# Ejecutar worker localmente
npm run worker
```

### Base de Datos:
```bash
# Generar migraciones desde schema
npm run generate

# Aplicar migraciones
npm run push

# Abrir Drizzle Studio
npm run studio

# Restaurar backup (primera vez)
restore-db.bat  # Windows
bash restore-db.sh  # Linux/Mac
```

---

## 📚 Arquitectura y Stack

### Stack Tecnológico:
- **Framework**: Next.js 14 (App Router)
- **Base de Datos**: PostgreSQL 15
- **Autenticación**: Supabase Auth
- **Caché**: Redis 7
- **Job Queue**: BullMQ
- **ORM**: Drizzle ORM
- **Styling**: TailwindCSS + shadcn/ui
- **Containerización**: Docker & Docker Compose

### Arquitectura:
```
┌─────────────────────────────────────────────────────────┐
│                    Browser/Cliente                       │
└─────────────────────┬───────────────────────────────────┘
                      │ HTTP/HTTPS
┌─────────────────────▼───────────────────────────────────┐
│              Next.js App (puerto 3000)                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐          │
│  │ API      │  │ Server   │  │ Server       │          │
│  │ Routes   │  │ Components│  │ Actions      │          │
│  └──────────┘  └──────────┘  └──────────────┘          │
└────┬─────────┬──────────┬──────────┬───────────────────┘
     │         │          │          │
     │         │          │          └────────┐
┌────▼─────┐ ┌▼────────┐ ┌▼──────────┐ ┌─────▼─────────┐
│ Supabase │ │PostgreSQL│ │   Redis   │ │ BullMQ Worker │
│   Auth   │ │ (5432)   │ │  (6379)   │ │   + Queue     │
└──────────┘ └──────────┘ └───────────┘ └───────────────┘
                                              │
                                         ┌────▼──────┐
                                         │ Bull Board│
                                         │  (3001)   │
                                         └───────────┘
```

### Estructura del Proyecto:
```
├── app/                    # Next.js App Router
├── components/             # React components
├── controllers/            # Business logic
├── lib/
│   ├── redis/             # Redis services (cache, sessions, rate limiting)
│   └── queues/            # BullMQ queue definitions
├── workers/
│   ├── index.ts           # Worker entry point
│   └── processors/        # Job processors
├── Evolucion/             # Documentation
├── docker-compose.yml     # Docker services configuration
├── Dockerfile             # Next.js app Docker image
└── Dockerfile.worker      # Worker Docker image
```

---

## 📖 Documentación

### Guías Rápidas:
- **[QUICK-START.md](./QUICK-START.md)** - Guía de inicio paso a paso
- **[REWORKS-STATUS.md](./Evolucion/REWORKS-STATUS.md)** - Estado de implementación

### Documentación Técnica:
- **[Architecture.md](./Evolucion/Architecture.md)** - Arquitectura detallada con Redis y BullMQ
- **[ROADMAP.md](./Evolucion/ROADMAP.md)** - Roadmap de desarrollo (13 sprints)
- **[CasosDeUso.md](./Evolucion/CasosDeUso.md)** - Casos de uso del sistema
- **[ModeloDeDatos.md](./Evolucion/ModeloDeDatos.md)** - Modelo de datos completo

---

## 🎯 Próximos Pasos de Desarrollo

Ver [ROADMAP.md](./Evolucion/ROADMAP.md) para el plan completo de 3 meses:

**Sprint 1-2** (Semanas 1-2): ✅ Infraestructura (COMPLETADO)
- ✅ Dockerización
- ✅ Redis para caché
- ✅ BullMQ para jobs asíncronos
- ⏳ Migración de BD (PENDIENTE)

**Sprint 3-4** (Semanas 3-4): Backend de Gamificación
- Sistema de XP y niveles
- Sistema de rachas (streaks)
- Sistema de puntos y badges
- Rankings/leaderboards

**Sprint 5-7** (Semanas 5-7): Frontend de Gamificación
- Dashboard de progreso
- UI de badges
- Leaderboards
- Exámenes mejorados (timer, navegación)

---

## ❓ Troubleshooting

### "Puerto ya está en uso"
```bash
# Ver qué proceso usa el puerto 3000
netstat -ano | findstr :3000

# Matar proceso (reemplaza PID)
taskkill /PID <PID> /F
```

### "No puedo conectar con PostgreSQL"
```bash
# Verificar que el contenedor esté corriendo
docker-compose ps postgres

# Ver logs
docker-compose logs postgres

# Reiniciar
docker-compose restart postgres
```

### "Redis connection failed"
```bash
# Probar conexión
docker-compose exec redis redis-cli ping
# Debe responder: PONG

# Si falla, reiniciar
docker-compose restart redis
```

### Reset Completo
```bash
# Parar todo y eliminar datos
docker-compose down -v

# Ejecutar setup de nuevo
setup-complete.bat
```

---

## 📞 Soporte

Para problemas o preguntas:
1. Revisa la documentación en [Evolucion/](./Evolucion/)
2. Ve los logs: `docker-compose logs -f`
3. Verifica que todos los servicios estén corriendo: `docker-compose ps`

---

## 📄 Licencia

Este proyecto está desarrollado para Jean Monnet.
