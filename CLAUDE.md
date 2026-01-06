# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**MakeIt** is a training program management application (work in progress). The goal is to create a simple, self-hostable application that allows users to create and manage training programs for various activities (running, bouldering, gym workouts, etc.).

### Primary Use Case
- Users can set athletic goals (e.g., "run a marathon")
- Create structured training plans with customizable periods (weekly, 10-day cycles, etc.)
- Manage multiple sports/activities in one place
- Access via mobile phone for day-to-day workout tracking

### Secondary Goal
Build a deployable application that can be used by the developer and friends - a practical learning project for full-stack development and deployment.

## Technology Stack

### Backend
- **Framework**: Spring Boot 3.x + Kotlin
- **Database**: PostgreSQL 15+
- **Build Tool**: Gradle (Kotlin DSL)
- **Migrations**: Liquibase
- **API**: RESTful JSON API

### Frontend
- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS
- **PWA**: Workbox for service worker and offline capability
- **State Management**: React Context/Hooks (start simple, add Redux if needed)

### Deployment
- **Containerization**: Docker + Docker Compose
- **Web Server**: Nginx (reverse proxy + static file serving)
- **Target**: Self-hosted VPS/home server

## MVP Core Features

### 1. Training Program Management
- Create training programs with name, goal, start date, and period type (weekly, 10-day, custom)
- List all programs
- View program details
- Delete programs

### 2. Session Scheduling
- Add training sessions to a program with type (run, boulder, gym, swim, etc.)
- Edit session details (type, notes, scheduled date, duration)
- Delete sessions
- View sessions in calendar/list format

### 3. Session Tracking
- Mark sessions as complete/incomplete
- View upcoming sessions (next 7 days)
- Calendar view showing scheduled sessions
- Simple statistics (sessions completed this week/month)

### 4. PWA Features
- Installable on iPhone/Mac home screen
- Offline viewing of scheduled sessions
- Mobile-first responsive design

## Project Structure

```
make_it/
├── backend/                 # Spring Boot application
│   ├── src/
│   │   ├── main/
│   │   │   ├── kotlin/
│   │   │   │   └── com/makeit/
│   │   │   │       ├── controller/    # REST endpoints
│   │   │   │       ├── service/       # Business logic
│   │   │   │       ├── repository/    # Data access
│   │   │   │       ├── model/         # Domain entities
│   │   │   │       └── dto/           # Data transfer objects
│   │   │   └── resources/
│   │   │       ├── application.yml
│   │   │       └── db/changelog/      # Liquibase changelogs
│   │   │           └── db.changelog-master.yaml
│   │   └── test/
│   ├── build.gradle.kts
│   └── Dockerfile
├── frontend/                # React PWA
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API client
│   │   ├── hooks/           # Custom React hooks
│   │   ├── types/           # TypeScript types
│   │   └── App.tsx
│   ├── public/
│   │   ├── manifest.json    # PWA manifest
│   │   └── icons/           # App icons for PWA
│   ├── package.json
│   ├── vite.config.ts
│   └── Dockerfile
├── docker-compose.yml       # Orchestration
└── nginx.conf              # Reverse proxy config
```

## Database Schema

### Core Entities

**programs**
- id (UUID, primary key)
- name (VARCHAR, not null) - "Marathon Training", "Boulder Program"
- goal (TEXT) - "Run a marathon in under 4 hours"
- start_date (DATE, not null)
- period_type (VARCHAR: WEEKLY, TEN_DAY, CUSTOM)
- period_length (INTEGER, nullable) - days in custom period
- created_at (TIMESTAMP)

**sessions**
- id (UUID, primary key)
- program_id (UUID, foreign key → programs)
- type (VARCHAR, not null) - "run", "boulder", "gym", "swim", etc.
- scheduled_date (DATE, not null)
- completed (BOOLEAN, default false)
- completed_at (TIMESTAMP, nullable)
- notes (TEXT)
- duration_minutes (INTEGER, nullable)
- created_at (TIMESTAMP)

## Development Commands

### Backend (from backend/ directory)

```bash
# Run development server (port 8080)
./gradlew bootRun

# Run tests
./gradlew test

# Build JAR
./gradlew build

# Run specific test
./gradlew test --tests "com.makeit.service.ProgramServiceTest"

# Clean build
./gradlew clean build
```

### Frontend (from frontend/ directory)

```bash
# Install dependencies
npm install

# Run development server (port 5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm test

# Type check
npm run type-check

# Lint
npm run lint
```

### Docker Deployment (from root directory)

See [DOCKER.md](DOCKER.md) for complete Docker documentation.

```bash
# Build and start all services (PostgreSQL, backend, frontend)
docker-compose up -d

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres

# Rebuild after code changes
docker-compose up -d --build backend   # Backend only
docker-compose up -d --build frontend  # Frontend only
docker-compose up -d --build           # Everything

# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: deletes database)
docker-compose down -v

# Access database
docker-compose exec postgres psql -U makeit -d makeit_db
```

**Access URLs (Docker mode):**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8080/api
- Backend Health: http://localhost:8080/actuator/health

## API Endpoints

### Programs
- `GET /api/programs` - List all programs
- `POST /api/programs` - Create program
- `GET /api/programs/{id}` - Get program details
- `PUT /api/programs/{id}` - Update program
- `DELETE /api/programs/{id}` - Delete program

### Sessions
- `GET /api/programs/{programId}/sessions` - List program sessions
- `POST /api/programs/{programId}/sessions` - Create session
- `GET /api/sessions/{id}` - Get session details
- `PUT /api/sessions/{id}` - Update session
- `PATCH /api/sessions/{id}/complete` - Toggle session completion
- `DELETE /api/sessions/{id}` - Delete session
- `GET /api/sessions/upcoming` - Get upcoming sessions (next 7 days)

## Implementation Roadmap

### Phase 1: Backend Foundation
1. Initialize Spring Boot project with Kotlin
2. Set up PostgreSQL with Liquibase migrations
3. Create domain entities and repositories
4. Implement service layer for Programs
5. Create REST controllers with basic CRUD
6. Add validation and error handling
7. Write unit tests for services

### Phase 2: Frontend Foundation
1. Initialize React + TypeScript + Vite project
2. Set up TailwindCSS
3. Create basic routing (React Router)
4. Build API client service with fetch/axios
5. Implement Program management UI (list, create, view)
6. Add responsive mobile-first layout

### Phase 3: Session Management
1. Implement Session entity and repository (backend)
2. Build session CRUD operations (backend + frontend)
3. Create calendar/list view component
4. Add session completion toggle
5. Implement upcoming sessions dashboard

### Phase 4: PWA Features
1. Configure PWA manifest.json
2. Add service worker with Workbox
3. Implement offline data caching
4. Add app icons for iOS/Mac
5. Test installation on iPhone/Mac

### Phase 5: Docker Deployment
1. Create Dockerfiles for backend and frontend
2. Set up docker-compose.yml with PostgreSQL
3. Configure Nginx reverse proxy
4. Test full stack locally
5. Deploy to VPS and test mobile access

### Phase 6: Polish & Testing
1. Add loading states and error handling
2. Implement optimistic UI updates
3. Add E2E tests for critical flows
4. Performance optimization
5. PWA offline experience refinement
