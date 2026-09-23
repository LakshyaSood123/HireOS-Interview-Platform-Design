#!/usr/bin/env bash
#
# Day 2 verification — docs/05-DAY-WISE-CHECKPOINTS.md "Day 2 · Verification".
#
# Asserts every "Passes when" line against a server that is already running,
# using two fresh accounts. Needs `curl` and `jq`.
#
#   npm run seed:curriculum   # once
#   npm run dev               # in one terminal
#   npm run verify:day2       # in another
#
# Override the target with BASE=https://… npm run verify:day2
set -uo pipefail

BACKEND="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BASE="${BASE:-http://localhost:4883/api/v1}"
COURSE="dsa-foundations"
STAMP="$(date +%s)"
PASS="correct-horse-battery"
PASSED=0; FAILED=0

command -v jq >/dev/null || { echo "jq is required (brew install jq)"; exit 2; }
curl -sf -o /dev/null "$BASE/health" || { echo "No server at $BASE — start it with 'npm run dev'"; exit 2; }

BODY_FILE="$(mktemp)"; HEAD_FILE="$(mktemp)"
trap 'rm -f "$BODY_FILE" "$HEAD_FILE" /tmp/day2_par_*.json' EXIT

# Two registrations, and the contract allows 10 auth calls per 15 minutes per
# IP. A server that has already served auth traffic can run out.
rate_limited() {
  printf '\n  \033[33mAuth rate limit reached.\033[0m %s\n\n' "$1"
  printf '  The counter is in memory, so restarting the server resets it:\n\n'
  printf '    \033[1mkill $(lsof -ti:4883) && npm run dev\033[0m   # terminal 1\n'
  printf '    \033[1mnpm run verify:day2\033[0m                    # terminal 2\n\n'
  exit 2
}

hr()  { printf '\n\033[1m%s\033[0m\n' "$1"; }
note() { printf '       \033[2m%s\033[0m\n' "$1"; }
check() { # check <label> <expected> <actual> [extra]
  [ "$3" = "429" ] && [ "$2" != "429" ] && rate_limited "Hit partway through, at \"$1\"."
  if [ "$2" = "$3" ]; then PASSED=$((PASSED+1)); printf '  \033[32mPASS\033[0m %-56s %s\n' "$1" "$3";
  else FAILED=$((FAILED+1)); printf '  \033[31mFAIL\033[0m %-56s expected %s got %s  %s\n' "$1" "$2" "$3" "${4:-}"; fi
}
code() { curl -s -D "$HEAD_FILE" -o "$BODY_FILE" -w '%{http_code}' "$@"; }
bdy()  { cat "$BODY_FILE"; }

register() { # register <email> -> access token
  curl -s -X POST "$BASE/auth/register" -H 'content-type: application/json' \
    -d "{\"email\":\"$1\",\"password\":\"$PASS\",\"displayName\":\"Day2\"}" | jq -r '.data.accessToken // empty'
}
state()    { curl -s "$BASE/me/courses/$COURSE/state" -H "authorization: Bearer $1"; }
complete() { # complete <token> <checkpointId> [source]
  curl -s -X POST "$BASE/me/checkpoints/$2/complete" -H "authorization: Bearer $1" \
    -H 'content-type: application/json' -d "{\"courseId\":\"$COURSE\",\"source\":\"${3:-manual}\"}"
}

# ── accounts ───────────────────────────────────────────────────────────────

A="$(register "day2a+$STAMP@example.com")"
B="$(register "day2b+$STAMP@example.com")"
[ -n "$A" ] && [ -n "$B" ] || rate_limited "Could not register the two test accounts."

# ── 2.1 / 2.2 / 2.4 — the seeded curriculum and a fresh learner ────────────

hr "2.1  Curriculum snapshot is seeded and served"
STATUS=$(code "$BASE/me/courses/$COURSE/state" -H "authorization: Bearer $A")
check "GET /me/courses/{id}/state returns 200" 200 "$STATUS"
S="$(bdy)"
if [ "$STATUS" = "404" ]; then
  printf '\n  \033[33mNo curriculum.\033[0m Run \033[1mnpm run seed:curriculum\033[0m, then restart the server.\n\n'
  exit 2
fi
check "snapshot version is reported"        "true" "$(jq -r '(.data.curriculumVersion|length)>0' <<<"$S")"
check "7 zones"                             7      "$(jq -r '.data.zoneStates|length' <<<"$S")"
check "29 modules"                          29     "$(jq -r '.data.moduleStates|length' <<<"$S")"
note "curriculum version $(jq -r .data.curriculumVersion <<<"$S")"

hr "2.2  courseProgress is shaped like LearnerProgressState"
check "progress has exactly the engine's fields" \
  "activeCheckpointId activeCourseId activeModuleId activeZoneId completedCheckpointIds lastActivityDate lives masteredCheckpointIds streak xp" \
  "$(jq -r '.data.progress|keys|join(" ")' <<<"$S")"

hr "2.4  Derived states on a fresh account"
check "xp starts at 0"                    0            "$(jq -r .data.progress.xp <<<"$S")"
check "lives start at 3"                  3            "$(jq -r .data.progress.lives <<<"$S")"
check "streak starts at 0"                0            "$(jq -r .data.progress.streak <<<"$S")"
check "nothing is completed"              0            "$(jq -r '.data.progress.completedCheckpointIds|length' <<<"$S")"
check "foundations is current"            "current"    "$(jq -r .data.moduleStates.foundations <<<"$S")"
check "arrays-strings is locked"          "locked"     "$(jq -r '.data.moduleStates["arrays-strings"]' <<<"$S")"
check "trees is locked"                   "locked"     "$(jq -r .data.moduleStates.trees <<<"$S")"
check "basecamp zone is current"          "current"    "$(jq -r .data.zoneStates.basecamp <<<"$S")"
check "graph-highlands zone is locked"    "locked"     "$(jq -r '.data.zoneStates["graph-highlands"]' <<<"$S")"

# ── 2.6 — locked stays locked ──────────────────────────────────────────────

hr "2.6  Locked stays locked, even bypassing the UI"
STATUS=$(code -X POST "$BASE/me/modules/graphs/start" -H "authorization: Bearer $A" \
  -H 'content-type: application/json' -d "{\"courseId\":\"$COURSE\"}")
check "POST /me/modules/graphs/start returns 409" 409 "$STATUS"
L="$(bdy)"
check "error code is MODULE_LOCKED"          "MODULE_LOCKED" "$(jq -r .error.code <<<"$L")"
check "409 names the missing prerequisites"  "trees-5"       "$(jq -r '.error.details.missingPrerequisites|join(",")' <<<"$L")"
check "409 message is human-readable"        "true"          "$(jq -r '(.error.message|length)>20' <<<"$L")"
note "$(jq -r .error.message <<<"$L")"

STATUS=$(code -X POST "$BASE/me/modules/foundations/start" -H "authorization: Bearer $A" \
  -H 'content-type: application/json' -d "{\"courseId\":\"$COURSE\"}")
check "an available module starts"           200            "$STATUS"
check "start returns the entry checkpoint"   "foundations-1" "$(jq -r .data.activeCheckpointId < "$BODY_FILE")"

# ── 2.7 — completion, idempotency, concurrency ─────────────────────────────

hr "2.7  Completing a checkpoint awards once"
C1="$(complete "$A" foundations-1 reading)"
check "first completion is not already-completed" "false" "$(jq -r .data.alreadyCompleted <<<"$C1")"
check "awards the checkpoint's own XP"            30      "$(jq -r .data.rewards.xpAwarded <<<"$C1")"
check "xp is now 30"                              30      "$(jq -r .data.progress.xp <<<"$C1")"
check "the next checkpoint became active"  "foundations-2" "$(jq -r .data.progress.activeCheckpointId <<<"$C1")"
check "it reports what unlocked"           "foundations-2" "$(jq -r '.data.unlocked.checkpointIds|join(",")' <<<"$C1")"

hr "2.7  Idempotency — five calls, one reward"
BASELINE="$(jq -Sc .data.progress <<<"$C1")"
IDEMPOTENT=1
for n in 2 3 4 5; do
  R="$(complete "$A" foundations-1)"
  [ "$(jq -r .data.alreadyCompleted <<<"$R")" = "true" ] || IDEMPOTENT=0
  [ "$(jq -r .data.rewards.xpAwarded <<<"$R")" = "0" ]   || IDEMPOTENT=0
  [ "$(jq -Sc .data.progress <<<"$R")" = "$BASELINE" ]   || IDEMPOTENT=0
done
check "calls 2-5 return alreadyCompleted, 0 XP, same progress" 1 "$IDEMPOTENT"
check "xp after five calls is still 30" 30 "$(jq -r .data.progress.xp < <(state "$A"))"

hr "2.7  Concurrency — ten parallel completions, one reward"
for n in $(seq 1 10); do
  curl -s -X POST "$BASE/me/checkpoints/foundations-2/complete" -H "authorization: Bearer $A" \
    -H 'content-type: application/json' -d "{\"courseId\":\"$COURSE\"}" -o "/tmp/day2_par_$n.json" &
done
wait
AWARDS="$(jq -r 'select(.data.alreadyCompleted == false) | .data.rewards.xpAwarded' /tmp/day2_par_*.json | wc -l | tr -d ' ')"
check "exactly one of ten calls awarded"  1  "$AWARDS"
check "xp after the burst is 60"          60 "$(jq -r .data.progress.xp < <(state "$A"))"

hr "2.7  Mastery bonus on a module's terminal checkpoint"
complete "$A" foundations-3 > /dev/null
complete "$A" foundations-4 > /dev/null
C5="$(complete "$A" foundations-5 submit)"
check "terminal checkpoint pays xp + masteryXp" 140    "$(jq -r .data.rewards.xpAwarded <<<"$C5")"
check "masteryAwarded is true"                  "true" "$(jq -r .data.rewards.masteryAwarded <<<"$C5")"
check "it joins masteredCheckpointIds" "foundations-5" "$(jq -r '.data.progress.masteredCheckpointIds|join(",")' <<<"$C5")"
check "total xp is 270"                         270    "$(jq -r .data.progress.xp <<<"$C5")"
check "finishing the module unlocks two more"   "arrays-strings,linked-structures" \
  "$(jq -r '.data.unlocked.moduleIds|sort|join(",")' <<<"$C5")"
check "a fully-completed module reads completed" "completed" "$(jq -r .data.moduleStates.foundations < <(state "$A"))"

hr "2.7  Review is free"
REVIEW="$(complete "$A" foundations-3)"
check "reviewing awards nothing"        0      "$(jq -r .data.rewards.xpAwarded <<<"$REVIEW")"
check "reviewing reports alreadyCompleted" "true" "$(jq -r .data.alreadyCompleted <<<"$REVIEW")"
check "xp is unchanged by the review"   270    "$(jq -r .data.progress.xp <<<"$REVIEW")"

hr "2.7  A locked checkpoint cannot be completed"
STATUS=$(code -X POST "$BASE/me/checkpoints/trees-1/complete" -H "authorization: Bearer $A" \
  -H 'content-type: application/json' -d "{\"courseId\":\"$COURSE\"}")
check "completing a locked checkpoint returns 409" 409 "$STATUS"
check "error code is CHECKPOINT_LOCKED" "CHECKPOINT_LOCKED" "$(jq -r .error.code < "$BODY_FILE")"
check "it names what is missing"        "recursion-5" "$(jq -r '.error.details.missingPrerequisites|join(",")' < "$BODY_FILE")"

# ── 2.5 — the active pointer ───────────────────────────────────────────────

hr "2.5  Setting the active module / checkpoint"
STATUS=$(code -X PUT "$BASE/me/courses/$COURSE/active" -H "authorization: Bearer $A" \
  -H 'content-type: application/json' -d '{"checkpointId":"summit-1"}')
check "an unavailable target is rejected" 409 "$STATUS"
check "error code is CHECKPOINT_LOCKED" "CHECKPOINT_LOCKED" "$(jq -r .error.code < "$BODY_FILE")"

STATUS=$(code -X PUT "$BASE/me/courses/$COURSE/active" -H "authorization: Bearer $A" \
  -H 'content-type: application/json' -d '{"moduleId":"linked-structures"}')
check "an available module is accepted"   200 "$STATUS"
P="$(bdy)"
check "the zone follows the module"    "structure-woods"     "$(jq -r .data.progress.activeZoneId <<<"$P")"
check "the entry checkpoint is chosen" "linked-structures-1" "$(jq -r .data.progress.activeCheckpointId <<<"$P")"

STATUS=$(code -X PUT "$BASE/me/courses/$COURSE/active" -H "authorization: Bearer $A" \
  -H 'content-type: application/json' -d '{"moduleId":"trees","checkpointId":"linked-structures-2"}')
check "a mismatched module/checkpoint pair is rejected" 400 "$STATUS"

# ── 2.8 — attempts ─────────────────────────────────────────────────────────

hr "2.8  Recording a quick-check attempt"
STATUS=$(code -X POST "$BASE/me/attempts" -H "authorization: Bearer $A" -H 'content-type: application/json' \
  -d "{\"courseId\":\"$COURSE\",\"checkpointId\":\"arrays-strings-1\",\"moduleId\":\"trees\",\"activityId\":\"arrays-strings-1-quick-check\",\"attemptType\":\"quick-check\",\"passed\":true,\"payload\":{\"selectedIndex\":2,\"correctIndex\":2}}")
check "POST /me/attempts returns 201" 201 "$STATUS"
check "it returns the attempt id" "true" "$(jq -r '(.data.attemptId|length)>0' < "$BODY_FILE")"
MP="$(curl -s "$BASE/me/modules/arrays-strings/progress?courseId=$COURSE" -H "authorization: Bearer $A")"
check "the attempt is counted on the checkpoint" 1 "$(jq -r '.data.checkpoints[0].attempts' <<<"$MP")"
check "an attempt awards no XP"                270 "$(jq -r .data.progress.xp < <(state "$A"))"
note "the body said moduleId \"trees\"; the server used the curriculum's own answer"

hr "2.x  Module progress, for a roadmap refresh"
MPF="$(curl -s "$BASE/me/modules/foundations/progress?courseId=$COURSE" -H "authorization: Bearer $A")"
check "module state is completed"  "completed" "$(jq -r .data.state <<<"$MPF")"
check "five checkpoints reported"  5           "$(jq -r '.data.checkpoints|length' <<<"$MPF")"
check "the terminal one is mastered" "mastered" "$(jq -r '.data.checkpoints[4].state' <<<"$MPF")"
check "completedAt is recorded"    "true"      "$(jq -r '(.data.checkpoints[0].completedAt|length)>0' <<<"$MPF")"

# ── 2.9 — streak ───────────────────────────────────────────────────────────

hr "2.9  Streak from lastActivityDate"
S="$(state "$A")"
check "lastActivityDate is today in UTC" "$(date -u +%Y-%m-%d)" "$(jq -r .data.progress.lastActivityDate <<<"$S")"
check "a first day of activity is a streak of 1" 1 "$(jq -r .data.progress.streak <<<"$S")"

# ── identity comes from the token ──────────────────────────────────────────

hr "sec  Identity comes from the token, never the body"
SB="$(state "$B")"
check "user B's account is untouched by user A" 0 "$(jq -r .data.progress.xp <<<"$SB")"
check "user B completed nothing"                0 "$(jq -r '.data.progress.completedCheckpointIds|length' <<<"$SB")"
check "user B's foundations is still current" "current" "$(jq -r .data.moduleStates.foundations <<<"$SB")"

STATUS=$(code -X POST "$BASE/me/checkpoints/foundations-1/complete" -H 'content-type: application/json' \
  -d "{\"courseId\":\"$COURSE\"}")
check "no token is 401" 401 "$STATUS"

# ── validation ─────────────────────────────────────────────────────────────

hr "val  Unknown ids and malformed requests"
STATUS=$(code "$BASE/me/courses/not-a-course/state" -H "authorization: Bearer $A")
check "unknown course is 404" 404 "$STATUS"
STATUS=$(code -X POST "$BASE/me/checkpoints/trees-99/complete" -H "authorization: Bearer $A" \
  -H 'content-type: application/json' -d "{\"courseId\":\"$COURSE\"}")
check "unknown checkpoint is 404" 404 "$STATUS"
STATUS=$(code -X POST "$BASE/me/checkpoints/Trees%3B1/complete" -H "authorization: Bearer $A" \
  -H 'content-type: application/json' -d "{\"courseId\":\"$COURSE\"}")
check "a malformed id is 400" 400 "$STATUS"
STATUS=$(code -X PUT "$BASE/me/courses/$COURSE/active" -H "authorization: Bearer $A" \
  -H 'content-type: application/json' -d '{}')
check "an empty active body is 400" 400 "$STATUS"

# ── the two checks that do not go through HTTP ─────────────────────────────

hr "2.4  Engine parity with src/learning/progressEngine.ts"
if (cd "$BACKEND" && npm run --silent verify:parity > /tmp/day2_parity.log 2>&1); then
  check "backend derives what the frontend derives" 0 0
  note "$(grep -o '[0-9,]* comparisons' /tmp/day2_parity.log | head -1)"
else
  check "backend derives what the frontend derives" 0 1 "see /tmp/day2_parity.log"
fi

hr "2.3  Reward ledger reconciles"
if (cd "$BACKEND" && npm run --silent verify:ledger > /tmp/day2_ledger.log 2>&1); then
  check "every point of XP traces to a ledger row" 0 0
  note "$(grep -o '[0-9]* progress documents · [0-9]* ledger rows' /tmp/day2_ledger.log | head -1)"
else
  check "every point of XP traces to a ledger row" 0 1 "see /tmp/day2_ledger.log"
fi

# ── result ─────────────────────────────────────────────────────────────────

printf '\n\033[1m%s\033[0m\n' "Result"
printf '  \033[32m%s passed\033[0m' "$PASSED"
[ "$FAILED" -gt 0 ] && printf '   \033[31m%s failed\033[0m' "$FAILED"
printf '\n\n'
[ "$FAILED" -eq 0 ] || exit 1
