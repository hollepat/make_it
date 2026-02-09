#!/usr/bin/env bash
set -e

cd "$(dirname "$0")"

echo "Stopping running containers..."
docker compose down

echo "Rebuilding and starting all services..."
docker compose up -d --build

echo "Waiting for services to be ready..."
docker compose logs -f --tail=0 &
LOGS_PID=$!

# Wait for backend to be healthy (max 60s)
for i in $(seq 1 60); do
  if curl -sf http://localhost:8080/actuator/health > /dev/null 2>&1; then
    echo ""
    echo "All services are up!"
    echo "  Frontend: http://localhost:3000"
    echo "  Backend:  http://localhost:8080/api"
    kill $LOGS_PID 2>/dev/null || true
    exit 0
  fi
  sleep 1
done

echo ""
echo "Warning: Backend did not become healthy within 60s. Check logs with: docker compose logs backend"
kill $LOGS_PID 2>/dev/null || true
exit 1
