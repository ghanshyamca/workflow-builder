# Docker Setup Guide

Complete Docker configuration for the Workflow Builder platform with backend API, frontend UI, PostgreSQL database, and Redis cache.

## Prerequisites

- **Docker** (v20.10+) - [Install Docker](https://docs.docker.com/get-docker/)
- **Docker Compose** (v2.0+) - Usually included with Docker Desktop

## Services

The docker-compose.yml includes:

1. **PostgreSQL** - Database service (port 5432)
2. **Redis** - Cache & job queue (port 6379)
3. **Backend API** - Node.js/Express (port 3000)
4. **Frontend UI** - React app (port 3001)

## Quick Start

### 1. Build and Start All Services

```bash
cd workflow-builder
docker-compose up --build
```

This will:
- Build backend and frontend images
- Create and start all 4 containers
- Initialize PostgreSQL database
- Connect all services

**Output should show:**
```
workflow-builder-db   | database system is ready to accept connections
workflow-builder-redis | * Ready to accept connections
workflow-builder-api | Server running on port 3000
workflow-builder-ui | Accepting connections at http://localhost:3001
```

### 2. Access the Application

- **Frontend UI**: http://localhost:3001
- **Backend API**: http://localhost:3000
- **Health Check**: http://localhost:3000/health
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

### 3. Stop Services

```bash
docker-compose down
```

### 4. Stop and Remove Data

```bash
docker-compose down -v
```

The `-v` flag removes named volumes (database and redis data).

## Available Commands

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
docker-compose logs -f redis
```

### Rebuild Services

```bash
# Rebuild all
docker-compose up --build

# Rebuild specific service
docker-compose up --build backend
docker-compose up --build frontend
```

### Execute Commands in Container

```bash
# Backend container
docker exec -it workflow-builder-api bash

# Frontend container
docker exec -it workflow-builder-ui sh

# Database container
docker exec -it workflow-builder-db psql -U postgres

# Redis container
docker exec -it workflow-builder-redis redis-cli
```

### Run Database Queries

```bash
# Connect to PostgreSQL
docker exec -it workflow-builder-db psql -U postgres -d workflow_builder

# Example queries
SELECT * FROM users;
SELECT COUNT(*) FROM workflows;
\dt  # List all tables
```

## Configuration

### Environment Variables

Create `.env` file in project root:

```bash
cp .env.docker .env
```

Edit `.env` with your values:

```env
# Database
DB_USER=postgres
DB_PASSWORD=your-password
DB_NAME=workflow_builder

# JWT Secrets (Change these!)
JWT_SECRET=your-super-secret-key
JWT_REFRESH_SECRET=your-refresh-secret

# CORS
CORS_ORIGIN=http://localhost:3001

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
```

### Ports

Default ports (change in docker-compose.yml if needed):
- PostgreSQL: 5432
- Redis: 6379
- Backend API: 3000
- Frontend UI: 3001

## Development vs Production

### Development Mode

For development, use the original setup:

```bash
cd backend && npm run dev
# In another terminal
cd frontend && npm run dev
```

### Production Mode (Docker)

```bash
docker-compose up --build
```

The Docker setup uses:
- Multi-stage builds for smaller images
- Alpine Linux images for efficiency
- Health checks for automatic restarts
- Proper signal handling

## Image Sizes

### Backend
- ~200MB (Node.js Alpine + dependencies)
- Multi-stage build reduces final size

### Frontend
- ~150MB (Build stage) → ~50MB (Production stage)
- Served via `serve` package

## Volumes

### Persistent Data

- `postgres_data` - PostgreSQL database files
- `redis_data` - Redis persistence

### Logs

Backend logs available at `backend/logs/` on host machine.

## Networking

All services communicate via `workflow-network` bridge:
- Backend connects to PostgreSQL and Redis by hostname
- Frontend connects to Backend API
- All services isolated and secure

## Health Checks

Each service has health checks:

```bash
# Check service health
docker-compose ps

# Shows status like:
# workflow-builder-api   ... (healthy)
# workflow-builder-db    ... (healthy)
# workflow-builder-redis ... (healthy)
# workflow-builder-ui    ... (healthy)
```

## Troubleshooting

### Port Already in Use

```bash
# Find process using port
lsof -i :3000
netstat -ano | findstr :3000  # Windows

# Kill process or change port in docker-compose.yml
```

### Database Connection Error

```bash
# Check database logs
docker-compose logs postgres

# Ensure database is healthy
docker-compose ps
```

### Frontend Can't Connect to API

```bash
# Check backend is running
curl http://localhost:3000/health

# Verify CORS settings in backend .env
# Check VITE_API_BASE_URL in frontend build
```

### Out of Memory

```bash
# Clean up Docker resources
docker system prune -a

# Remove all containers
docker-compose down -v

# Rebuild
docker-compose up --build
```

## Performance Tips

### Reduce Image Size

```bash
# Remove unused images
docker image prune

# Remove all stopped containers
docker container prune
```

### Speed Up Builds

```bash
# Use BuildKit
DOCKER_BUILDKIT=1 docker-compose up --build

# Only rebuild changed services
docker-compose up --build backend
```

### Optimize Docker Compose

- Use `depends_on` with health checks (prevents premature starts)
- Set appropriate resource limits
- Use Alpine Linux for smaller images

## Production Deployment

For production deployment:

1. **Security**
   - Change all default secrets in .env
   - Use strong passwords
   - Enable HTTPS

2. **Scaling**
   - Use orchestration (Kubernetes)
   - Set resource limits
   - Use load balancer

3. **Monitoring**
   - Use logging service (ELK stack)
   - Monitor container health
   - Set up alerting

4. **Backup**
   - Backup PostgreSQL regularly
   - Backup Redis data
   - Keep git history

## Docker Hub Push (Optional)

```bash
# Build for release
docker build -t yourusername/workflow-builder-api:1.0.0 ./backend
docker build -t yourusername/workflow-builder-ui:1.0.0 ./frontend

# Push to Docker Hub
docker push yourusername/workflow-builder-api:1.0.0
docker push yourusername/workflow-builder-ui:1.0.0
```

## Docker Compose Best Practices

1. ✅ Use `.dockerignore` to exclude unnecessary files
2. ✅ Use multi-stage builds to reduce image size
3. ✅ Set health checks for each service
4. ✅ Use named volumes for persistence
5. ✅ Use environment variables for configuration
6. ✅ Order services with `depends_on`
7. ✅ Use descriptive container names
8. ✅ Include restart policies

## Useful Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Best Practices for Dockerfiles](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/)
- [Alpine Linux Docker Images](https://alpinelinux.org/)

## Quick Reference

```bash
# Start services
docker-compose up

# Start in background
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# Execute command
docker-compose exec backend bash

# Rebuild images
docker-compose up --build

# Remove everything
docker-compose down -v

# Check status
docker-compose ps

# Pull latest images
docker-compose pull
```

---

**Next Steps:**
1. Ensure Docker is installed
2. Run `docker-compose up --build`
3. Access http://localhost:3001
4. Implement Phase 2: Authentication
