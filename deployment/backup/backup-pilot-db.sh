#!/usr/bin/env bash
# Full, timestamped backup of the pilot MongoDB database: users, refresh tokens, enrollments/progress, XP/reward events,
# notes, curriculum versions + snapshots, drafts and animation package revisions. (Contains personal data and password
# hashes: NEVER commit the output; copy it off this machine - see docs/PILOT_DEPLOYMENT.md "Backups".)
#
#   MONGO_DB_NAME=reagvis_prod MONGO_URI=... deployment/backup/backup-pilot-db.sh
#
# Environment (nothing is printed except the database name and the output path):
#   MONGO_DB_NAME   required  database to back up
#   MONGO_URI       required unless BACKUP_DOCKER_CONTAINER is set (the connection string is passed via the
#                             environment of the child process, never on a command line or in the log)
#   BACKUP_DOCKER_CONTAINER   optional  run mongodump inside this running container (local Docker Mongo)
#   BACKUP_DIR      optional  output directory (default: deployment/backups, which is git-ignored)
set -euo pipefail

: "${MONGO_DB_NAME:?MONGO_DB_NAME is required}"
BACKUP_DIR="${BACKUP_DIR:-$(cd "$(dirname "$0")/.." && pwd)/backups}"
mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR" 2>/dev/null || true
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="$BACKUP_DIR/${MONGO_DB_NAME}_${STAMP}.archive.gz"
umask 077

if [[ -n "${BACKUP_DOCKER_CONTAINER:-}" ]]; then
  docker exec "$BACKUP_DOCKER_CONTAINER" mongodump --db "$MONGO_DB_NAME" --archive --gzip > "$OUT"
else
  : "${MONGO_URI:?MONGO_URI is required (or set BACKUP_DOCKER_CONTAINER)}"
  command -v mongodump >/dev/null || { echo "mongodump not found: install MongoDB Database Tools or set BACKUP_DOCKER_CONTAINER" >&2; exit 2; }
  mongodump --uri="$MONGO_URI" --db "$MONGO_DB_NAME" --archive="$OUT" --gzip 2>/dev/null
fi

SIZE=$(wc -c < "$OUT")
if [[ "$SIZE" -lt 1024 ]]; then echo "backup looks empty ($SIZE bytes): $OUT" >&2; rm -f "$OUT"; exit 3; fi
( cd "$BACKUP_DIR" && sha256sum "$(basename "$OUT")" > "$(basename "$OUT").sha256" )
echo "BACKUP_OK database=$MONGO_DB_NAME file=$OUT bytes=$SIZE"
echo "NEXT copy this file (and its .sha256) to storage OUTSIDE this machine."
