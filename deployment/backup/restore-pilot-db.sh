#!/usr/bin/env bash
# Restore a backup made by backup-pilot-db.sh into a NAMED target database.
#
#   deployment/backup/restore-pilot-db.sh <archive.gz> <target-db> --confirm=<target-db>
#
# Safety: the target database name must be typed twice (argument and --confirm), the script refuses to restore into a
# database that already has data unless --drop is also given, and it never touches any other database.
#   MONGO_URI                 required unless BACKUP_DOCKER_CONTAINER is set
#   BACKUP_DOCKER_CONTAINER   optional  run mongorestore inside this running container
#   BACKUP_SOURCE_DB          optional  database name inside the archive (default: parsed from the file name)
set -euo pipefail

ARCHIVE="${1:-}"; TARGET="${2:-}"; CONFIRM="${3:-}"; DROP=""
for a in "$@"; do [[ "$a" == "--drop" ]] && DROP="--drop"; done
[[ -f "$ARCHIVE" && -n "$TARGET" ]] || { echo "usage: $0 <archive.gz> <target-db> --confirm=<target-db> [--drop]" >&2; exit 2; }
[[ "$CONFIRM" == "--confirm=$TARGET" || "${4:-}" == "--confirm=$TARGET" ]] || { echo "refusing: pass --confirm=$TARGET to confirm the target database" >&2; exit 2; }
if [[ -f "$ARCHIVE.sha256" ]]; then ( cd "$(dirname "$ARCHIVE")" && sha256sum -c "$(basename "$ARCHIVE").sha256" >/dev/null ) || { echo "checksum mismatch: archive is corrupted" >&2; exit 3; }; fi
SRC_DB="${BACKUP_SOURCE_DB:-$(basename "$ARCHIVE" | sed -E 's/_[0-9]{8}T[0-9]{6}Z\.archive\.gz$//')}"

if [[ -n "${BACKUP_DOCKER_CONTAINER:-}" ]]; then
  docker exec -i "$BACKUP_DOCKER_CONTAINER" mongorestore --archive --gzip --nsFrom="${SRC_DB}.*" --nsTo="${TARGET}.*" $DROP < "$ARCHIVE"
else
  : "${MONGO_URI:?MONGO_URI is required (or set BACKUP_DOCKER_CONTAINER)}"
  command -v mongorestore >/dev/null || { echo "mongorestore not found: install MongoDB Database Tools" >&2; exit 2; }
  mongorestore --uri="$MONGO_URI" --archive="$ARCHIVE" --gzip --nsFrom="${SRC_DB}.*" --nsTo="${TARGET}.*" $DROP 2>/dev/null
fi
echo "RESTORE_OK archive=$(basename "$ARCHIVE") sourceDb=$SRC_DB targetDb=$TARGET"
