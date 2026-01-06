# Docker Deployment Guide

This guide explains how to run the MakeIt application using Docker.

## Prerequisites

- Docker installed (version 20.10+)
- Docker Compose installed (version 2.0+)

## Quick Start

### 1. Build and Start All Services

From the project root directory:

```bash
docker-compose up -d
```

This will:
- Start PostgreSQL database on port 5432
- Build and start the backend on port 8080
- Build and start the frontend on port 3000

### 2. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080/api
- **Backend Health**: http://localhost:8080/actuator/health

### 3. View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### 4. Stop Services

```bash
# Stop but keep data
docker-compose down

# Stop and remove all data (WARNING: deletes database)
docker-compose down -v
```

## Development Workflow

### Rebuild After Code Changes

**Backend changes:**
```bash
docker-compose up -d --build backend
```

**Frontend changes:**
```bash
docker-compose up -d --build frontend
```

**Rebuild everything:**
```bash
docker-compose up -d --build
```

### Access Database

```bash
# Connect to PostgreSQL container
docker-compose exec postgres psql -U makeit -d makeit_db

# Common queries
\dt                          # List tables
\d sessions                  # Describe sessions table
SELECT * FROM sessions;      # View all sessions
```

## Services Overview

### PostgreSQL (postgres)
- **Image**: postgres:15-alpine
- **Port**: 5432
- **Database**: makeit_db
- **User**: makeit
- **Password**: makeit_password
- **Data**: Persisted in Docker volume `postgres_data`

### Backend (backend)
- **Build**: Multi-stage Gradle build
- **Runtime**: Eclipse Temurin JRE 21
- **Port**: 8080
- **Health Check**: `/actuator/health`
- **Depends On**: PostgreSQL

### Frontend (frontend)
- **Build**: Node 20 + Vite
- **Runtime**: Nginx Alpine
- **Port**: 3000 (mapped to container's 80)
- **Health Check**: `/health`
- **Depends On**: Backend

## Environment Variables

### Backend
- `SPRING_DATASOURCE_URL`: PostgreSQL connection URL
- `SPRING_DATASOURCE_USERNAME`: Database username
- `SPRING_DATASOURCE_PASSWORD`: Database password
- `APP_CORS_ALLOWED_ORIGINS`: Allowed CORS origins

### Frontend
- `VITE_API_URL`: Backend API URL (build-time)

## Customization

### Change Ports

Edit `docker-compose.yml`:

```yaml
services:
  frontend:
    ports:
      - "8000:80"  # Change host port from 3000 to 8000

  backend:
    ports:
      - "9000:8080"  # Change host port from 8080 to 9000
```

### Change Database Credentials

Edit `docker-compose.yml`:

```yaml
services:
  postgres:
    environment:
      POSTGRES_DB: your_db_name
      POSTGRES_USER: your_username
      POSTGRES_PASSWORD: your_secure_password

  backend:
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/your_db_name
      SPRING_DATASOURCE_USERNAME: your_username
      SPRING_DATASOURCE_PASSWORD: your_secure_password
```

## Production Deployment

For production deployment on a VPS:

### 1. Clone Repository on Server

```bash
git clone <your-repo-url>
cd make_it
```

### 2. Update Environment Variables

Create a `.env` file:

```bash
cat > .env << 'EOF'
POSTGRES_PASSWORD=your_secure_random_password
BACKEND_CORS_ORIGINS=http://yourdomain.com,https://yourdomain.com
EOF
```

Update `docker-compose.yml` to use environment variables:

```yaml
services:
  postgres:
    environment:
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}

  backend:
    environment:
      SPRING_DATASOURCE_PASSWORD: ${POSTGRES_PASSWORD}
      APP_CORS_ALLOWED_ORIGINS: ${BACKEND_CORS_ORIGINS}
```

### 3. Run with Production Settings

```bash
docker-compose up -d
```

### 4. Set Up Reverse Proxy (Optional)

For HTTPS and custom domain, use Nginx or Caddy as a reverse proxy:

```nginx
# /etc/nginx/sites-available/makeit
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Troubleshooting

### Backend Won't Start

```bash
# Check logs
docker-compose logs backend

# Common issues:
# - PostgreSQL not ready: Wait for health check to pass
# - Port already in use: Change port in docker-compose.yml
# - Build errors: Check Java/Kotlin syntax
```

### Frontend Build Fails

```bash
# Check logs
docker-compose logs frontend

# Common issues:
# - Node modules: Delete node_modules and rebuild
# - TypeScript errors: Fix type errors in src/
```

### Database Connection Errors

```bash
# Verify PostgreSQL is running
docker-compose ps postgres

# Check PostgreSQL logs
docker-compose logs postgres

# Test connection
docker-compose exec postgres psql -U makeit -d makeit_db -c "SELECT 1;"
```

### Reset Everything

```bash
# Stop all services
docker-compose down -v

# Remove all images
docker-compose down --rmi all

# Remove build cache
docker builder prune -a

# Start fresh
docker-compose up -d --build
```

## Monitoring

### Check Service Health

```bash
# Backend health
curl http://localhost:8080/actuator/health

# Frontend health
curl http://localhost:3000/health

# Database health
docker-compose exec postgres pg_isready -U makeit
```

### View Resource Usage

```bash
docker stats
```

## Backup and Restore

### Backup Database

```bash
docker-compose exec postgres pg_dump -U makeit makeit_db > backup.sql
```

### Restore Database

```bash
cat backup.sql | docker-compose exec -T postgres psql -U makeit -d makeit_db
```
