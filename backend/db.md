# Database Notes

This document provides information on how to connect to and manage the MakeIt PostgreSQL database.

## Connection Details

**Docker Environment:**
```
Host:     localhost (or postgres from within Docker network)
Port:     5432
Database: makeit_db
User:     makeit
Password: makeit_password
```

## Connecting to the Database

### Option 1: Command Line (Quickest)

Connect directly via psql:

```bash
# Connect to PostgreSQL
docker compose exec postgres psql -U makeit -d makeit_db

# Common psql commands:
\dt                              # List all tables
\d sessions                      # Describe sessions table
\d programs                      # Describe programs table
SELECT * FROM sessions;          # View all sessions
SELECT * FROM programs;          # View all programs
\q                              # Quit
```

**Quick one-liner queries:**

```bash
# View all sessions
docker compose exec postgres psql -U makeit -d makeit_db -c "SELECT * FROM sessions;"

# View all programs
docker compose exec postgres psql -U makeit -d makeit_db -c "SELECT * FROM programs;"

# Count sessions
docker compose exec postgres psql -U makeit -d makeit_db -c "SELECT COUNT(*) FROM sessions;"

# View Liquibase changelog
docker compose exec postgres psql -U makeit -d makeit_db -c "SELECT * FROM databasechangelog;"
```

### Option 2: IntelliJ Database Tools (Recommended)

IntelliJ IDEA has built-in database tools that work great with PostgreSQL:

1. **Open Database Tool Window**
   - View → Tool Windows → Database
   - Or press `⌘ + Shift + D` (Mac) / `Ctrl + Shift + D` (Windows/Linux)

2. **Add PostgreSQL Data Source**
   - Click `+` (New) → Data Source → PostgreSQL
   - Or right-click in Database panel → New → Data Source → PostgreSQL

3. **Configure Connection**
   ```
   Host:     localhost
   Port:     5432
   Database: makeit_db
   User:     makeit
   Password: makeit_password
   ```

4. **Download Drivers** (if prompted)
   - IntelliJ will prompt to download PostgreSQL JDBC drivers
   - Click "Download" and wait for completion

5. **Test Connection**
   - Click "Test Connection" button
   - Should show "Succeeded" with green checkmark

6. **Apply and Connect**
   - Click "OK" to save
   - Database will appear in the Database tool window

**Using IntelliJ Database Tools:**

- **Browse tables**: Expand `makeit_db → public → tables`
- **View data**: Double-click any table to see contents
- **Run queries**: Right-click database → New → Query Console
- **Edit data**: Double-click a cell to edit inline
- **Export data**: Right-click table → Export Data
- **Generate DDL**: Right-click table → SQL Scripts → SQL Generator

**Useful keyboard shortcuts:**
- `⌘ + Enter` (Mac) / `Ctrl + Enter` (Win) - Execute query
- `⌘ + ⌥ + L` (Mac) / `Ctrl + Alt + L` (Win) - Format SQL
- `⌘ + /` (Mac) / `Ctrl + /` (Win) - Comment/uncomment line

## Database Schema

### Tables

**programs**
- `id` (UUID, PK) - Unique identifier
- `name` (VARCHAR) - Program name (e.g., "Marathon Training")
- `goal` (TEXT) - Program goal description
- `start_date` (DATE) - When the program starts
- `period_type` (VARCHAR) - WEEKLY, TEN_DAY, or CUSTOM
- `period_length` (INTEGER) - Length in days for custom periods
- `created_at` (TIMESTAMP) - Record creation time

**sessions**
- `id` (UUID, PK) - Unique identifier
- `program_id` (UUID, FK → programs) - Parent program
- `type` (VARCHAR) - Session type (run, boulder, gym, etc.)
- `scheduled_date` (DATE) - When the session is scheduled
- `completed` (BOOLEAN) - Completion status
- `completed_at` (TIMESTAMP) - When marked complete
- `notes` (TEXT) - Session notes
- `duration_minutes` (INTEGER) - Session duration
- `created_at` (TIMESTAMP) - Record creation time

### Indexes
- `idx_sessions_program_id` on `sessions(program_id)`
- `idx_sessions_scheduled_date` on `sessions(scheduled_date)`
- `idx_sessions_completed` on `sessions(completed)`

## Useful SQL Queries

### View sessions with program details
```sql
SELECT
    s.id,
    s.type,
    s.scheduled_date,
    s.completed,
    s.notes,
    s.duration_minutes,
    p.name as program_name
FROM sessions s
LEFT JOIN programs p ON s.program_id = p.id
ORDER BY s.scheduled_date;
```

### Count sessions by type
```sql
SELECT type, COUNT(*)
FROM sessions
GROUP BY type
ORDER BY COUNT(*) DESC;
```

### View upcoming incomplete sessions
```sql
SELECT * FROM sessions
WHERE completed = false
  AND scheduled_date >= CURRENT_DATE
ORDER BY scheduled_date;
```

### Get program statistics
```sql
SELECT
    p.name,
    COUNT(s.id) as total_sessions,
    SUM(CASE WHEN s.completed THEN 1 ELSE 0 END) as completed_sessions,
    ROUND(100.0 * SUM(CASE WHEN s.completed THEN 1 ELSE 0 END) / COUNT(s.id), 2) as completion_rate
FROM programs p
LEFT JOIN sessions s ON s.program_id = p.id
GROUP BY p.id, p.name;
```

### Sessions completed this week
```sql
SELECT * FROM sessions
WHERE completed = true
  AND completed_at >= date_trunc('week', CURRENT_DATE)
ORDER BY completed_at DESC;
```

## Database Migrations

Migrations are managed by **Liquibase** and located in:
```
src/main/resources/db/changelog/
├── changelog-master.yaml          # Master changelog
└── changes/
    └── v1.0.0-initial-schema.yaml # Initial schema
```

### View migration history
```sql
SELECT * FROM databasechangelog ORDER BY dateexecuted DESC;
```

### Rollback (if needed)
```bash
# From backend directory
./gradlew liquibaseRollbackCount -PliquibaseCommandValue=1
```

## Backup and Restore

### Backup
```bash
# Full database backup
docker compose exec postgres pg_dump -U makeit makeit_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Specific table backup
docker compose exec postgres pg_dump -U makeit -t sessions makeit_db > sessions_backup.sql
```

### Restore
```bash
# Restore from backup
cat backup.sql | docker compose exec -T postgres psql -U makeit -d makeit_db
```

## Troubleshooting

### Connection refused
```bash
# Check if PostgreSQL is running
docker compose ps postgres

# Check logs
docker compose logs postgres

# Restart PostgreSQL
docker compose restart postgres
```

### Reset database (WARNING: deletes all data)
```bash
# Stop services and remove volumes
docker compose down -v

# Start fresh
docker compose up -d
```

### View active connections
```sql
SELECT * FROM pg_stat_activity
WHERE datname = 'makeit_db';
```

### Kill stuck queries
```sql
-- Find the pid of stuck query from pg_stat_activity
SELECT pg_terminate_backend(pid);
```
