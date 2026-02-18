# MakeIt Backend — Microservice Architecture Design

## Executive Summary

This document analyzes the MakeIt monolith and produces a concrete recommendation for how far to decompose it. The short answer: **do not split into microservices yet**. Instead, evolve the monolith into a well-structured **modular monolith** now, and extract at most one optional sidecar (the AI assistant) when it justifies the operational cost. This document explains why, shows what a full microservice split would look like, and gives an honest accounting of the trade-offs at this scale.

---

## Current State Analysis

### What the Monolith Does

The backend is a single Spring Boot 4.0.1 / Kotlin 2.2.21 / Java 21 process that serves every domain through one deployment unit. All five domains share a single PostgreSQL database, and all share the same JVM heap, thread pool, and transaction manager.

**Dependency graph between domains (runtime, not import-level):**

```
AuthService
  |- UserRepository      (owns: users, refresh_tokens)
  |- RefreshTokenRepository
  |- InviteCodeRepository (reads invite codes during registration)

InviteService
  |- InviteCodeRepository (owns: invite_codes)
  |- UserRepository      (reads user for code creation)

ProgramService
  |- ProgramRepository   (owns: programs)
  |- SessionRepository   (reads session counts for response DTOs)
  |- UserRepository      (reads user to verify existence)

SessionService
  |- SessionRepository   (owns: sessions)
  |- UserRepository      (reads user to verify existence)

AI / AssistantController
  |- FitnessAssistant    (LangChain4j proxy, calls external LLM APIs)
  |- PersistentChatMemoryStore -> ChatMessageRepository (owns: chat_messages)
  |- SessionTools        -> SessionService + ProgramService (direct in-process calls)
```

**Key coupling observations:**

1. `ProgramController` directly injects `SessionService` to serve the `/api/programs/{id}/sessions` endpoint — a cross-domain call within one process.
2. `SessionTools` (AI layer) directly calls both `SessionService` and `ProgramService` — the AI feature depends on both the Session and Program domains at the service layer.
3. `AuthService` directly reads from `InviteCodeRepository` during registration — Auth and Invite domains are tightly coupled.
4. All domains read `UserRepository`. The User entity is a shared dependency throughout.
5. `Session.programId` is stored as a bare UUID column (not a JPA foreign-key entity reference), but a real FK constraint `fk_sessions_program` with `ON DELETE SET NULL` exists in the database.
6. The JWT is self-contained (HMAC-SHA, verified stateless). No database lookup is needed for request auth — this is critical for any future microservice split.

### Current Database Schema (logical groupings)

```
Auth domain:
  users           (id, email, password_hash, display_name, role, enabled, created_at, updated_at)
  refresh_tokens  (id, user_id FK->users, token, expires_at, revoked, created_at)
  invite_codes    (id, code, created_by_user_id FK->users, used_by_user_id FK->users, expires_at, created_at)

Training domain:
  programs        (id, user_id FK->users, name, goal, tag, start_date, period_type, period_length, created_at)
  sessions        (id, user_id FK->users, program_id FK->programs ON DELETE SET NULL, type,
                   scheduled_date, completed, completed_at, notes, duration_minutes, created_at)

AI domain:
  chat_messages   (id, memory_id [user UUID as string], messages_json TEXT, updated_at)
```

---

## Proposed Service Decomposition

### Option A: Full Microservices (Three Services)

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT (React PWA)                           │
└──────────────────────────────┬──────────────────────────────────────┘
                               │  HTTPS
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   NGINX (Reverse Proxy / API Gateway)                │
│   /api/auth/*      → auth-service:8081                              │
│   /api/invites/*   → auth-service:8081                              │
│   /api/programs/*  → training-service:8082                          │
│   /api/sessions/*  → training-service:8082                          │
│   /api/assistant/* → ai-service:8083                                │
│   /*               → frontend:80                                     │
└──────┬───────────────────┬───────────────────────────┬──────────────┘
       │                   │                           │
       ▼                   ▼                           ▼
┌─────────────┐   ┌────────────────┐         ┌──────────────────┐
│ auth-service│   │training-service│         │  ai-service      │
│  (port 8081)│   │  (port 8082)   │         │  (port 8083)     │
│             │   │                │         │                  │
│ Users       │   │ Programs       │         │ FitnessAssistant │
│ RefreshToken│   │ Sessions       │         │ ChatMemory       │
│ InviteCodes │   │                │         │ SessionTools     │
│ JwtService  │   │ JWT validation │         │ JWT validation   │
│             │   │ (shared secret)│         │ (shared secret)  │
└──────┬──────┘   └──────┬─────────┘         └──────┬───────────┘
       │                 │                          │
       ▼                 ▼                          │ HTTP REST calls
┌─────────────┐   ┌────────────────┐               │ to training-service
│  auth_db    │   │  training_db   │               │
│  PostgreSQL │   │  PostgreSQL    │               ▼
│             │   │                │        ┌──────────────────┐
│ users       │   │ programs       │        │  ai_db           │
│ refresh_    │   │ sessions       │        │  PostgreSQL      │
│  tokens     │   │                │        │  chat_messages   │
│ invite_codes│   │                │        └──────────────────┘
└─────────────┘   └────────────────┘

           External LLM APIs: Anthropic / Google Gemini / OpenAI
                  ↑
           ai-service calls these directly
```

### Option B: Modular Monolith (Recommended for Current Scale)

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT (React PWA)                           │
└──────────────────────────────┬──────────────────────────────────────┘
                               │  HTTPS
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   NGINX (Reverse Proxy)                              │
│   /api/*  → backend:8080                                            │
│   /*      → frontend:80                                              │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      backend (port 8080)                             │
│                                                                      │
│  ┌──────────────┐  ┌───────────────────┐  ┌────────────────────┐   │
│  │  auth module │  │  training module  │  │    ai module       │   │
│  │              │  │                   │  │                    │   │
│  │  AuthService │  │  ProgramService   │  │  FitnessAssistant  │   │
│  │  InviteService│  │  SessionService   │  │  SessionTools      │   │
│  │  JwtService  │  │                   │  │  ChatMemoryStore   │   │
│  └──────────────┘  └───────────────────┘  └────────────────────┘   │
│                                                                      │
│  Shared: UserRepository, JPA, Security, Liquibase, Actuator         │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │  Single PostgreSQL DB │
                    │  (makeit_db)         │
                    └──────────────────────┘
```

---

## Each Service Detailed (Full Microservice Design)

### Service 1: auth-service

**Responsibilities:**
- User registration (with invite code validation)
- Login / logout
- Access token (JWT) issuance — HMAC-SHA, self-verifiable
- Refresh token rotation
- Invite code lifecycle (create, list, validate)

**API surface (unchanged from monolith):**
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh
POST   /api/auth/logout
GET    /api/auth/me
POST   /api/invites
GET    /api/invites
GET    /api/invites/{code}/validate
```

**Database schema (auth_db):**
```sql
users           (id UUID PK, email, password_hash, display_name, role, enabled, created_at, updated_at)
refresh_tokens  (id UUID PK, user_id FK->users, token, expires_at, revoked, created_at)
invite_codes    (id UUID PK, code, created_by_user_id FK->users, used_by_user_id FK->users, expires_at, created_at)
```

**JWT claims (the shared contract across all services):**
```json
{
  "sub": "<userId>",
  "userId": "<userId>",
  "email": "user@example.com",
  "role": "USER",
  "iat": 1234567890,
  "exp": 1234568790
}
```

JWT is signed with `JWT_SECRET` (HMAC-SHA256). Every other service validates the signature locally using the same secret — no auth-service network call per request. This is already how the monolith works.

---

### Service 2: training-service

**Responsibilities:**
- Training program CRUD
- Training session CRUD
- Session completion toggle
- Upcoming sessions query
- Sessions-by-program query

**API surface (unchanged):**
```
POST   /api/programs
GET    /api/programs
GET    /api/programs/{id}
PUT    /api/programs/{id}
DELETE /api/programs/{id}
GET    /api/programs/{id}/sessions

POST   /api/sessions
GET    /api/sessions
GET    /api/sessions/{id}
PUT    /api/sessions/{id}
PATCH  /api/sessions/{id}/complete
DELETE /api/sessions/{id}
GET    /api/sessions/upcoming
```

**Database schema (training_db):**
```sql
programs  (id UUID PK, user_id UUID NOT NULL, name, goal, tag, start_date, period_type, period_length, created_at)
sessions  (id UUID PK, user_id UUID NOT NULL, program_id UUID NULL, type, scheduled_date,
           completed, completed_at, notes, duration_minutes, created_at)
```

Note: `user_id` is no longer a FK referencing a users table (that lives in auth_db). The service trusts `userId` from the JWT claim. No cross-service FK enforcement at the DB level — an inherent trade-off of microservices.

**Auth validation:** `JwtAuthenticationFilter` runs in this service with the same shared JWT secret. No network hop needed.

---

### Service 3: ai-service

**Responsibilities:**
- AI fitness assistant chat endpoint
- Chat history persistence (per-user conversation memory)
- Tool execution: creates/updates/deletes sessions on behalf of the LLM by calling training-service HTTP API

**API surface:**
```
POST   /api/assistant/chat
DELETE /api/assistant/chat
```

**Database schema (ai_db):**
```sql
chat_messages  (id BIGINT PK, memory_id VARCHAR(255) UNIQUE, messages_json TEXT, updated_at)
```

**Inter-service call: ai-service → training-service**

This is the most significant architectural change. `SessionTools` currently calls `SessionService` and `ProgramService` as direct in-process Kotlin function calls. In microservices this becomes HTTP REST:

```kotlin
// Current (in-process):
sessionService.createSession(userId, request)

// In microservices (HTTP via RestClient, forwarding user's JWT):
trainingServiceClient.post("/api/sessions", request, userJwt)
```

**LangChain4j tools become HTTP adapters:**
```
LLM decision to call "createSession"
  -> LangChain4j @Tool method
  -> TrainingServiceClient.createSession()
  -> HTTP POST /api/sessions (with JWT forwarded)
  -> training-service creates the session
  -> HTTP 201 response
  -> @Tool returns result string to LLM
```

**ai-service is optional** — if no API key is configured it returns 503. It can be excluded from docker-compose entirely for users who don't need it.

---

## Communication Patterns

### Synchronous (REST)
All inter-service calls are synchronous REST. No message broker is needed at this scale. Adding Kafka or RabbitMQ would triple operational complexity with zero user-visible benefit.

### Service-to-Service Auth (ai-service → training-service)

**Recommended: forward the user's JWT**

The user sends their JWT to ai-service. ai-service extracts the token from the `Authorization` header and forwards it when calling training-service. training-service validates it the same way it does for any other request. No additional infrastructure needed. This works because JWT access tokens are valid for 15 minutes — well within the typical chat response window.

---

## Shared Concerns

### JWT Validation
`JWT_SECRET` environment variable is shared across all services. Each service runs identical `JwtService` + `JwtAuthenticationFilter` implementations. For a small team, copy-paste the ~100-line JWT code into each service and document that it must stay in sync. Extracting a shared library is correct but adds build pipeline complexity.

### CORS
If Nginx is the sole entry point and routes to services internally, configure CORS at the Nginx layer and disable it in individual Spring Boot services.

### Error Response Format
Each service replicates `GlobalExceptionHandler` and the `ErrorResponse` structure.

---

## Migration Strategy (Strangler Fig Pattern)

### Step 0 — Modular Monolith (Do This Now)

Reorganize the existing monolith into packages that mirror intended service boundaries. Zero behavior change, zero new infrastructure.

**Proposed package structure:**
```
org.make_it.backend/
  auth/
    controller/  AuthController, InviteController
    service/     AuthService, InviteService
    model/       User, RefreshToken, InviteCode
    repository/  UserRepository, RefreshTokenRepository, InviteCodeRepository
    dto/         AuthDtos, InviteDtos
    security/    JwtService, JwtAuthenticationFilter, UserPrincipal, ...
  training/
    controller/  ProgramController, SessionController
    service/     ProgramService, SessionService
    model/       Program, Session
    repository/  ProgramRepository, SessionRepository
    dto/         ProgramDtos, SessionDtos
  ai/
    controller/  AssistantController
    service/     FitnessAssistant, PersistentChatMemoryStore, SessionTools
    model/       ChatMessageRecord
    repository/  ChatMessageRepository
    config/      AiConfig, AiProperties
    dto/         AssistantDtos
  shared/
    config/      SecurityConfig, CorsConfig, JwtProperties, InviteProperties
    exception/   GlobalExceptionHandler, Exceptions, AuthExceptions
    security/    AuthenticatedUser, CustomUserDetailsService
```

### Step 1 — Extract ai-service (When AI Features Grow)

Best first extraction candidate because:
1. Already has optional availability (returns 503 if unconfigured)
2. Owns its own data (`chat_messages`) with no FK dependencies on other tables
3. LangChain4j dependencies (~150+ MB including model client libraries) inflate the main JAR unnecessarily

**Extraction steps:**
1. Create `ai-service` as a new Gradle/Spring Boot project
2. Move `ai/` package contents into it
3. Replace `SessionTools` in-process calls with `TrainingServiceClient` HTTP calls (forwarding user JWT)
4. Add Nginx routing rule: `/api/assistant/*` → `ai-service:8083`
5. Remove AI code from main backend; remove LangChain4j dependencies from `build.gradle.kts`
6. Add `ai-service` to docker-compose as an optional profile

### Step 2 — Extract auth-service (Only If Genuinely Needed)

Only makes sense if you need to reuse auth across multiple unrelated projects or add OAuth2/social login. The coupling between auth and invite codes is tight — extraction adds operational cost for limited benefit at this scale.

### Step 3 — Split training-service (Essentially Never Justified)

Programs and Sessions are strongly cohesive. Splitting them would require cross-service calls on every session fetch. Do not do this.

---

## Docker Compose Layout

### Current Recommended (Modular Monolith + Nginx)

```yaml
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: makeit_db
      POSTGRES_USER: makeit
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U makeit -d makeit_db"]
      interval: 10s
      retries: 5

  backend:
    build: ./backend
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/makeit_db
      JWT_SECRET: ${JWT_SECRET}
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY:-}
      # ... other AI keys
    depends_on:
      postgres:
        condition: service_healthy

  frontend:
    build: ./frontend

  nginx:   # ADD: single entry point
    image: nginx:alpine
    ports: ["80:80", "443:443"]
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf:ro
    depends_on: [backend, frontend]

volumes:
  postgres_data:
```

### Future Microservices Layout (For Reference)

```yaml
services:
  postgres-auth:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: auth_db
      POSTGRES_USER: makeit_auth
      POSTGRES_PASSWORD: ${AUTH_DB_PASSWORD}
    volumes:
      - auth_postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U makeit_auth -d auth_db"]
      interval: 10s
      retries: 5

  postgres-training:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: training_db
      POSTGRES_USER: makeit_training
      POSTGRES_PASSWORD: ${TRAINING_DB_PASSWORD}
    volumes:
      - training_postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U makeit_training -d training_db"]
      interval: 10s
      retries: 5

  postgres-ai:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: ai_db
      POSTGRES_USER: makeit_ai
      POSTGRES_PASSWORD: ${AI_DB_PASSWORD}
    volumes:
      - ai_postgres_data:/var/lib/postgresql/data

  auth-service:
    build: ./auth-service
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres-auth:5432/auth_db
      SPRING_DATASOURCE_USERNAME: makeit_auth
      SPRING_DATASOURCE_PASSWORD: ${AUTH_DB_PASSWORD}
      JWT_SECRET: ${JWT_SECRET}
    depends_on:
      postgres-auth:
        condition: service_healthy

  training-service:
    build: ./training-service
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres-training:5432/training_db
      SPRING_DATASOURCE_USERNAME: makeit_training
      SPRING_DATASOURCE_PASSWORD: ${TRAINING_DB_PASSWORD}
      JWT_SECRET: ${JWT_SECRET}
    depends_on:
      postgres-training:
        condition: service_healthy

  ai-service:
    build: ./ai-service
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres-ai:5432/ai_db
      SPRING_DATASOURCE_USERNAME: makeit_ai
      SPRING_DATASOURCE_PASSWORD: ${AI_DB_PASSWORD}
      JWT_SECRET: ${JWT_SECRET}
      TRAINING_SERVICE_URL: http://training-service:8082
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY:-}
    depends_on:
      postgres-ai:
        condition: service_healthy
      training-service:
        condition: service_started
    profiles:
      - ai  # Optional: only starts with --profile ai

  nginx:
    image: nginx:alpine
    ports: ["80:80", "443:443"]
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf:ro
    depends_on: [auth-service, training-service, frontend]

  frontend:
    build: ./frontend

volumes:
  auth_postgres_data:
  training_postgres_data:
  ai_postgres_data:
```

**Nginx routing config for microservices:**
```nginx
server {
    listen 80;

    location / {
        proxy_pass http://frontend:80;
        proxy_set_header Host $host;
    }

    location /api/auth/ {
        proxy_pass http://auth-service:8081/api/auth/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api/invites/ {
        proxy_pass http://auth-service:8081/api/invites/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api/programs/ {
        proxy_pass http://training-service:8082/api/programs/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api/sessions/ {
        proxy_pass http://training-service:8082/api/sessions/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api/assistant/ {
        proxy_pass http://ai-service:8083/api/assistant/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## Considerations for Remaining TODOs

### Phase 4 — PWA (manifest.json, service worker, offline caching, app icons)
Entirely a frontend concern — unaffected by backend decomposition. With Nginx as reverse proxy, the frontend always hits `/api/*` regardless of how many backend services exist. Recommended order:
1. Add `manifest.json` with `display: standalone`, `theme_color`, `background_color`
2. Generate icons (192×192, 512×512, maskable variants)
3. Configure Workbox via `vite-plugin-pwa` — precache static assets, `NetworkFirst` for API responses
4. Test installation on iOS Safari and Chrome Android

### Phase 5 — Docker Deployment
The missing pieces in the current docker-compose are:
- Nginx container as the single external entry point
- `nginx.conf` for reverse-proxying `/api` to the backend (so the frontend uses relative `/api` paths)
- HTTPS/TLS termination (Let's Encrypt + Certbot, or Caddy as an alternative)

This work is identical regardless of monolith vs microservices.

### Phase 6 — E2E Tests, Loading States, Optimistic UI
E2E tests (Playwright or Cypress) test through HTTP and are architecture-agnostic — they talk to Nginx and don't care what's behind it. Loading states and optimistic UI (e.g., instant session completion toggle) are frontend-only changes.

### AI Roadmap (User Knowledge Base, RAG)
- **User Knowledge Base / Digital Twin:** In the modular monolith, this is a new Kotlin class and a Liquibase changeset. In a microservices split, user profile data could live in auth-service (user data) or ai-service (AI context) — the monolith defers this decision cleanly.
- **RAG / Training Studies KB:** Requires vector storage (`pgvector` or a dedicated Qdrant/Chroma instance). This is the strongest genuine argument for eventually extracting ai-service — vector stores are a different operational concern from the training DB.

---

## Trade-off Summary

| Concern | Modular Monolith | Microservices (3 services) |
|---|---|---|
| Deployable units | 1 | 3–4 |
| Database instances | 1 | 3 |
| docker-compose services | 4 (pg, backend, frontend, nginx) | 8+ (3×pg, 3×backend, nginx, frontend) |
| Network hops per AI chat | 0 (in-process) | 2–3 (nginx→ai-service→training-service) |
| Failure modes | JVM crash kills everything | ai-service failure leaves core app intact |
| Operational knowledge | Docker basics | Distributed systems, service discovery |
| VPS RAM (estimate) | ~600 MB | ~1.8 GB |
| Time to add a feature | Edit one codebase | Coordinate across 2–3 repos |
| Independent deployment | No | Yes (rarely valuable at this scale) |

---

## Recommendation

```
NOW (correct choice):
  Modular Monolith → one backend, one PostgreSQL, organized by domain packages
  + Nginx reverse proxy added to docker-compose
  + Frontend as PWA with Workbox

WHEN AI FEATURES EXPAND (User KB, RAG):
  Extract ai-service → two backends, two PostgreSQL databases
  ai-service calls training-service via REST (forwarding user JWT)
  ai-service as an optional docker-compose profile

NEVER (for this scale):
  Full three-service microservice split
  Event messaging (Kafka / RabbitMQ)
  Service mesh (Istio, Linkerd)
  Kubernetes
```

### Critical Files for Any Future Extraction

| File | Relevance |
|---|---|
| `service/SessionTools.kt` | In-process calls to SessionService/ProgramService → must become HTTP calls to training-service when extracting ai-service |
| `config/AiConfig.kt` | LangChain4j wiring → becomes the entire ai-service configuration on extraction |
| `docker-compose.yml` | Infrastructure entry point for all changes |
| `security/JwtService.kt` | JWT validation logic that must be replicated to every service |
| `controller/ProgramController.kt` | Demonstrates cross-domain coupling (injects SessionService) — the seam to cut when defining the training module boundary |
