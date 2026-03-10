# Jean Monnet Serious Game

This is a serious game developed for studying for competitive exams (oposiciones).

## 🚀 Quick Start with Docker

### Prerequisites
- Docker and Docker Compose installed
- Node.js 20+ (for local development)
- PowerShell 6+ or Git Bash (for running setup scripts)

### Setup

1. **Run setup script**:
```bash
# On Linux/Mac:
chmod +x setup.sh
./setup.sh

# On Windows:
.\setup.ps1
```

2. **Configure environment variables**:
Edit `.env` with your Supabase credentials

3. **Start all services with Docker**:
```bash
docker-compose up -d
```

4. **Access the application**:
- App: http://localhost:3000
- Bull Board (job dashboard): http://localhost:3001
- PostgreSQL: localhost:5432
- Redis: localhost:6379

### Development Commands

```bash
# Start development server (local)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Build worker (TypeScript compilation)
npm run build:worker

# Run worker locally
npm run worker

# Database migrations
npm run generate
npm run push

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Reset everything (including volumes)
docker-compose down -v
```

### Architecture

This project uses:
- **Next.js 14** with App Router
- **Supabase** for authentication and PostgreSQL
- **Redis** for caching and sessions
- **BullMQ** for async job processing
- **Docker** for containerization

See [Evolucion/Architecture.md](./Evolucion/Architecture.md) for detailed architecture documentation.

### Project Structure

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

## 📚 Documentation

- [Architecture](./Evolucion/Architecture.md) - Technical architecture with Redis and BullMQ
- [Roadmap](./Evolucion/ROADMAP.md) - Development roadmap and sprints
- [Use Cases](./Evolucion/CasosDeUso.md) - Use cases and requirements
- [Data Model](./Evolucion/ModeloDeDatos.md) - Database schema
