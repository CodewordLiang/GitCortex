#!/usr/bin/env bash
# upgrade-sonar.sh — Upgrade SonarQube in Docker Compose
# Usage: ./upgrade-sonar.sh [new_image_tag]
# Run from the docker/compose/ directory (or pass -f path).
set -euo pipefail

COMPOSE_DIR="$(cd "$(dirname "$0")/../compose" && pwd)"
NEW_TAG="${1:-latest}"
BACKUP_DIR="${COMPOSE_DIR}/../backups/sonar-$(date +%Y%m%d-%H%M%S)"
SONAR_URL="http://localhost:9000"
MAX_WAIT=300
POLL_INTERVAL=5

echo "=== SonarQube Upgrade ==="
echo "  Compose dir : ${COMPOSE_DIR}"
echo "  New tag     : ${NEW_TAG}"
echo "  Backup dir  : ${BACKUP_DIR}"
echo ""

# ── Step 1: Back up current configuration ─────────────────────────
echo "[upgrade] Backing up current config ..."
mkdir -p "${BACKUP_DIR}"

# Export docker volume data
for vol in sonarqube-data sonarqube-extensions sonarqube-logs; do
    full_vol="compose_${vol}"
    if docker volume inspect "${full_vol}" > /dev/null 2>&1; then
        echo "[upgrade]   Backing up volume ${full_vol} ..."
        docker run --rm \
            -v "${full_vol}:/source:ro" \
            -v "${BACKUP_DIR}:/backup" \
            alpine tar czf "/backup/${vol}.tar.gz" -C /source .
    fi
done

# Save current compose config
cp "${COMPOSE_DIR}/docker-compose.yml" "${BACKUP_DIR}/docker-compose.yml.bak"
echo "[upgrade] Backup complete -> ${BACKUP_DIR}"

# ── Step 2: Pull new image ────────────────────────────────────────
echo "[upgrade] Pulling sonarqube:${NEW_TAG} ..."
docker pull "sonarqube:${NEW_TAG}"

# ── Step 3: Stop SonarQube and run database migration ─────────────
echo "[upgrade] Stopping SonarQube ..."
docker compose -f "${COMPOSE_DIR}/docker-compose.yml" stop sonarqube

echo "[upgrade] Starting SonarQube with new image (DB migration runs automatically) ..."
# SonarQube runs migrations on startup automatically
SONARQUBE_IMAGE="sonarqube:${NEW_TAG}" \
    docker compose -f "${COMPOSE_DIR}/docker-compose.yml" up -d sonarqube

# ── Step 4: Verify health ─────────────────────────────────────────
echo "[upgrade] Waiting for SonarQube to become healthy ..."
elapsed=0
while true; do
    status=$(curl -sf "${SONAR_URL}/api/system/status" 2>/dev/null \
        | grep -o '"status":"[^"]*"' | cut -d'"' -f4 || true)
    if [[ "$status" = "UP" ]]; then
        echo "[upgrade] SonarQube is UP after ${elapsed}s"
        break
    fi
    if [[ "$status" = "DB_MIGRATION_RUNNING" ]]; then
        echo "[upgrade]   DB migration in progress (${elapsed}s) ..."
    fi
    if [[ "$elapsed" -ge "$MAX_WAIT" ]]; then
        echo "[upgrade] ERROR: SonarQube not healthy after ${MAX_WAIT}s (status=${status:-unknown})" >&2
        echo "[upgrade] To rollback, restore from: ${BACKUP_DIR}"
        exit 1
    fi
    sleep "$POLL_INTERVAL"
    elapsed=$((elapsed + POLL_INTERVAL))
done

# Print version info
version=$(curl -sf "${SONAR_URL}/api/system/status" | grep -o '"version":"[^"]*"' | cut -d'"' -f4 || echo "unknown")
echo ""
echo "=== Upgrade Complete ==="
echo "  Version : ${version}"
echo "  Backup  : ${BACKUP_DIR}"
echo ""
