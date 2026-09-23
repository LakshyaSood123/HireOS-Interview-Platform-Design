#!/usr/bin/env bash
#
# Day 3 verification — docs/05-DAY-WISE-CHECKPOINTS.md "Day 3 · Verification".
#
# The notes API over HTTP, then the frontend adapters (verify:adapters), then
# the reward ledger — imported completions must reconcile like any other.
# Runs against a server that is already running. Needs `curl` and `jq`.
#
#   npm run dev            # in one terminal
#   npm run verify:day3    # in another
#
# Override the target with BASE=https://… npm run verify:day3
set -uo pipefail

BACKEND="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BASE="${BASE:-http://localhost:4883/api/v1}"
COURSE="dsa-foundations"
STAMP="$(date +%s)"
PASS="correct-horse-battery"
PASSED=0; FAILED=0

command -v jq >/dev/null || { echo "jq is required (brew install jq)"; exit 2; }
curl -sf -o /dev/null "$BASE/health" || { echo "No server at $BASE — start it with 'npm run dev'"; exit 2; }

BODY_FILE="$(mktemp)"; LOG_DIR="$(mktemp -d)"
trap 'rm -rf "$BODY_FILE" "$LOG_DIR"' EXIT

# Two registrations here and five sign-ins in verify:adapters; the contract
# allows 10 auth calls per 15 minutes per IP.
rate_limited() {
  printf '\n  \033[33mAuth rate limit reached.\033[0m %s\n\n' "$1"
  printf '  The counter is in memory, so restarting the server resets it:\n\n'
  printf '    \033[1mkill $(lsof -ti:4883) && npm run dev\033[0m   # terminal 1\n'
  printf '    \033[1mnpm run verify:day3\033[0m                    # terminal 2\n\n'
  exit 2
}

hr()   { printf '\n\033[1m%s\033[0m\n' "$1"; }
note() { printf '       \033[2m%s\033[0m\n' "$1"; }
check() { # check <label> <expected> <actual> [extra]
  [ "$3" = "429" ] && [ "$2" != "429" ] && rate_limited "Hit partway through, at \"$1\"."
  if [ "$2" = "$3" ]; then PASSED=$((PASSED+1)); printf '  \033[32mPASS\033[0m %-60s %s\n' "$1" "$3";
  else FAILED=$((FAILED+1)); printf '  \033[31mFAIL\033[0m %-60s expected %s got %s  %s\n' "$1" "$2" "$3" "${4:-}"; fi
}
code() { curl -s -o "$BODY_FILE" -w '%{http_code}' "$@"; }
bdy()  { cat "$BODY_FILE"; }

register() { # register <email> -> access token
  curl -s -X POST "$BASE/auth/register" -H 'content-type: application/json' \
    -d "{\"email\":\"$1\",\"password\":\"$PASS\",\"displayName\":\"Day3\"}" | jq -r '.data.accessToken // empty'
}
put_note() { # put_note <token> <noteId> <json body> -> http status, body in $BODY_FILE
  code -X PUT "$BASE/me/notes/$2" -H "authorization: Bearer $1" -H 'content-type: application/json' -d "$3"
}
list_notes() { # list_notes <token> [query] -> body
  curl -s "$BASE/me/notes?courseId=$COURSE${2:-}" -H "authorization: Bearer $1"
}

A="$(register "day3a+$STAMP@example.com")"
B="$(register "day3b+$STAMP@example.com")"
[ -n "$A" ] && [ -n "$B" ] || rate_limited "Could not register the two test accounts."

# ── 3.2 — upsert by id ─────────────────────────────────────────────────────

hr "3.2  PUT /me/notes/{noteId} creates a note"
STATUS=$(put_note "$A" note-1 "{\"courseId\":\"$COURSE\",\"moduleId\":\"graphs\",\"lessonId\":\"trees-3\",\"text\":\"Inorder = left, node, right.\",\"userId\":\"000000000000000000000000\"}")
check "PUT returns 200" 200 "$STATUS"
N="$(bdy)"
check "the response is the frontend's NoteRecord (+ createdAt)" \
  "courseId createdAt id lessonId moduleId text updatedAt" "$(jq -r '.data|keys|join(" ")' <<<"$N")"
check "the id is the one the client chose"     "note-1" "$(jq -r .data.id <<<"$N")"
check "moduleId comes from the curriculum, not the body" "trees" "$(jq -r .data.moduleId <<<"$N")"
CREATED="$(jq -r .data.createdAt <<<"$N")"

hr "3.2  The same id again replaces it — upsert, never a duplicate"
STATUS=$(put_note "$A" note-1 "{\"courseId\":\"$COURSE\",\"lessonId\":\"trees-3\",\"text\":\"Inorder = left, node, right. Sorted for a BST.\"}")
check "a second PUT returns 200"             200 "$STATUS"
check "the text is replaced"                 "Inorder = left, node, right. Sorted for a BST." "$(jq -r .data.text < "$BODY_FILE")"
check "createdAt is kept"                    "$CREATED" "$(jq -r .data.createdAt < "$BODY_FILE")"
check "still one note"                       1 "$(list_notes "$A" | jq '.data|length')"

hr "3.1  Several notes on one lesson — what the Notes panel does"
put_note "$A" note-2 "{\"courseId\":\"$COURSE\",\"lessonId\":\"trees-3\",\"text\":\"Postorder deletes a tree safely.\"}" >/dev/null
check "two notes on trees-3"                 2 "$(list_notes "$A" "&lessonId=trees-3" | jq '.data|length')"
check "listed oldest first"                  "note-1,note-2" "$(list_notes "$A" | jq -r '[.data[].id]|join(",")')"

hr "3.2  Ten parallel saves of one new note — still one note"
for n in $(seq 1 10); do
  curl -s -o /dev/null -X PUT "$BASE/me/notes/note-race" -H "authorization: Bearer $A" -H 'content-type: application/json' \
    -d "{\"courseId\":\"$COURSE\",\"lessonId\":\"trees-4\",\"text\":\"save $n\"}" &
done
wait
check "exactly one note-race exists"         1 "$(list_notes "$A" "&lessonId=trees-4" | jq '.data|length')"

hr "3.2  Scope: a course-level and a module-level note"
put_note "$A" note-course "{\"courseId\":\"$COURSE\",\"text\":\"Revise the whole course before interviews.\"}" >/dev/null
check "no lesson, no module"                 "null,null" "$(jq -r '[.data.moduleId,.data.lessonId]|map(tostring)|join(",")' < "$BODY_FILE")"
put_note "$A" note-module "{\"courseId\":\"$COURSE\",\"moduleId\":\"graphs\",\"text\":\"BFS for shortest paths.\"}" >/dev/null
check "a module-level note keeps its module" "graphs" "$(jq -r .data.moduleId < "$BODY_FILE")"
check "filter by moduleId"                   "note-module" "$(list_notes "$A" "&moduleId=graphs" | jq -r '[.data[].id]|join(",")')"

# ── pagination ─────────────────────────────────────────────────────────────

hr "3.2  Every list is paginated"
P1="$(list_notes "$A" "&limit=2")"
check "limit=2 returns two"                  2 "$(jq '.data|length' <<<"$P1")"
CURSOR="$(jq -r .meta.nextCursor <<<"$P1")"
check "and a nextCursor"                     "true" "$(jq -r '(.meta.nextCursor|type)=="string"' <<<"$P1")"
P2="$(list_notes "$A" "&limit=2&cursor=$CURSOR")"
check "the next page continues, no overlap"  "true" "$(jq -n --argjson a "$P1" --argjson b "$P2" '([$a.data[].id]-[$b.data[].id]|length)==2')"
ALL="$(list_notes "$A" "&limit=200")"
check "the last page says so"                "null" "$(jq -r .meta.nextCursor <<<"$ALL")"
check "five notes in all"                    5 "$(jq '.data|length' <<<"$ALL")"
STATUS=$(code "$BASE/me/notes?courseId=$COURSE&limit=201" -H "authorization: Bearer $A")
check "limit above 200 is 400"               400 "$STATUS"
STATUS=$(code "$BASE/me/notes?courseId=$COURSE&cursor=nope" -H "authorization: Bearer $A")
check "a malformed cursor is 400"            400 "$STATUS"

# ── delete ─────────────────────────────────────────────────────────────────

hr "3.2  DELETE /me/notes/{noteId}"
STATUS=$(code -X DELETE "$BASE/me/notes/note-2" -H "authorization: Bearer $A")
check "delete returns 204"                   204 "$STATUS"
STATUS=$(code -X DELETE "$BASE/me/notes/note-2" -H "authorization: Bearer $A")
check "deleting it again is 404"             404 "$STATUS"
check "the lesson has one note left"         1 "$(list_notes "$A" "&lessonId=trees-3" | jq '.data|length')"

# ── validation ─────────────────────────────────────────────────────────────

hr "val  Malformed notes are refused"
STATUS=$(put_note "$A" note-x "{\"courseId\":\"$COURSE\",\"text\":\"   \"}")
check "blank text is 400"                    400 "$STATUS"
LONG="$(printf 'x%.0s' $(seq 1 10001))"
STATUS=$(put_note "$A" note-x "{\"courseId\":\"$COURSE\",\"text\":\"$LONG\"}")
check "10,001 characters is 400"             400 "$STATUS"
STATUS=$(put_note "$A" note-x "{\"courseId\":\"$COURSE\",\"text\":\"${LONG:1}\"}")
check "10,000 characters is fine"            200 "$STATUS"
STATUS=$(put_note "$A" 'bad%24id' "{\"courseId\":\"$COURSE\",\"text\":\"x\"}")
check "an id with \$ in it is 400"           400 "$STATUS"
STATUS=$(put_note "$A" note-y "{\"courseId\":\"$COURSE\",\"lessonId\":\"trees-99\",\"text\":\"x\"}")
check "an unknown lesson is 404"             404 "$STATUS"
STATUS=$(put_note "$A" note-y "{\"courseId\":\"$COURSE\",\"moduleId\":\"no-such-module\",\"text\":\"x\"}")
check "an unknown module is 404"             404 "$STATUS"
STATUS=$(put_note "$A" note-y "{\"courseId\":\"not-a-course\",\"text\":\"x\"}")
check "an unknown course is 404"             404 "$STATUS"
STATUS=$(put_note "$A" note-y "{\"text\":\"x\"}")
check "no courseId is 400"                   400 "$STATUS"
STATUS=$(code -X PUT "$BASE/me/notes" -H "authorization: Bearer $A" -H 'content-type: application/json' \
  -d "{\"courseId\":\"$COURSE\",\"text\":\"x\"}")
check "PUT /me/notes without an id is not a route" 404 "$STATUS"
STATUS=$(code "$BASE/me/notes?courseId=$COURSE")
check "no token is 401"                      401 "$STATUS"

# ── identity ───────────────────────────────────────────────────────────────

hr "sec  One learner's notes are invisible to another"
check "B lists none of A's notes"            0 "$(list_notes "$B" | jq '.data|length')"
STATUS=$(code -X DELETE "$BASE/me/notes/note-1" -H "authorization: Bearer $B")
check "B deleting A's note id is 404, not 403" 404 "$STATUS"
STATUS=$(put_note "$B" note-1 "{\"courseId\":\"$COURSE\",\"lessonId\":\"trees-3\",\"text\":\"B's own note-1.\"}")
check "B saving the same id makes B's own note" 200 "$STATUS"
check "A's note-1 is untouched"              "Inorder = left, node, right. Sorted for a BST." \
  "$(list_notes "$A" "&lessonId=trees-3" | jq -r '.data[0].text')"
check "B sees exactly one note"              1 "$(list_notes "$B" | jq '.data|length')"
note "ids are chosen by clients, so they are unique per user — every query carries the token's user"

# ── the import source ──────────────────────────────────────────────────────

hr "3.5  Completions can say they were imported"
STATUS=$(code -X POST "$BASE/me/checkpoints/foundations-1/complete" -H "authorization: Bearer $B" \
  -H 'content-type: application/json' -d "{\"courseId\":\"$COURSE\",\"source\":\"import\"}")
check "source \"import\" is accepted"        200 "$STATUS"
check "and rewarded like any completion"     30  "$(jq -r .data.rewards.xpAwarded < "$BODY_FILE")"

# ── the frontend adapters, and the ledger ──────────────────────────────────

hr "3.3–3.6  The frontend adapters, against this API"
if (cd "$BACKEND" && BASE="$BASE" npm run --silent verify:adapters > "$LOG_DIR/adapters.log" 2>&1); then
  check "src/learning's real adapters pass every scenario" 0 0
  note "$(grep -Eo '[0-9]+ passed' "$LOG_DIR/adapters.log" | tail -1) — two browsers, import, offline, renewal"
else
  if grep -q "rate limit" "$LOG_DIR/adapters.log"; then rate_limited "Hit inside verify:adapters."; fi
  check "src/learning's real adapters pass every scenario" 0 1 "run 'npm run verify:adapters' to see which"
  grep -E "FAIL" "$LOG_DIR/adapters.log" | head -10
fi

hr "2.3  The reward ledger still reconciles"
if (cd "$BACKEND" && npm run --silent verify:ledger > "$LOG_DIR/ledger.log" 2>&1); then
  check "every point of XP traces to a ledger row" 0 0
  note "$(grep -o '[0-9]* progress documents · [0-9]* ledger rows' "$LOG_DIR/ledger.log" | head -1)"
else
  check "every point of XP traces to a ledger row" 0 1 "see npm run verify:ledger"
fi

# ── result ─────────────────────────────────────────────────────────────────

printf '\n\033[1m%s\033[0m\n' "Result"
printf '  \033[32m%s passed\033[0m' "$PASSED"
[ "$FAILED" -gt 0 ] && printf '   \033[31m%s failed\033[0m' "$FAILED"
printf '\n\n'
[ "$FAILED" -eq 0 ] || exit 1
