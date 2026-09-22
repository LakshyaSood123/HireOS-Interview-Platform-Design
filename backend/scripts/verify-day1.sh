#!/usr/bin/env bash
#
# Day 1 verification — docs/05-DAY-WISE-CHECKPOINTS.md "Day 1 · Verification".
#
# Runs the whole auth flow against a server that is already running, and asserts
# every "Passes when" line in the checkpoint document. Needs `curl` and `jq`.
#
#   npm run dev            # in one terminal
#   npm run verify:day1    # in another
#
# Override the target with BASE=https://… npm run verify:day1
set -uo pipefail

BACKEND="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BASE="${BASE:-http://localhost:4883/api/v1}"
EMAIL="demo+$(date +%s)@example.com"
PASS="correct-horse-battery"
PASSED=0; FAILED=0

command -v jq >/dev/null || { echo "jq is required (brew install jq)"; exit 2; }
curl -sf -o /dev/null "$BASE/health" || { echo "No server at $BASE — start it with 'npm run dev'"; exit 2; }

BODY_FILE="$(mktemp)"; HEAD_FILE="$(mktemp)"
trap 'rm -f "$BODY_FILE" "$HEAD_FILE"' EXIT

# This suite spends 7 calls on /auth/register and /auth/login, which the contract
# limits to 10 per 15 minutes per IP. A server that has already served auth
# traffic — a previous run, or a demo — will run out partway through.
AUTH_BUDGET_NEEDED=7

rate_limited() {
  printf '\n  \033[33mAuth rate limit reached.\033[0m %s\n\n' "$1"
  printf '  The contract allows 10 auth calls per 15 minutes per IP and this suite\n'
  printf '  needs %s, so a server that has already served auth traffic runs out.\n' "$AUTH_BUDGET_NEEDED"
  printf '  This is the limiter working, not a failure.\n\n'
  printf '  The counter is in memory, so restarting the server resets it:\n\n'
  printf '    \033[1mkill $(lsof -ti:4883) && npm run dev\033[0m   # terminal 1\n'
  printf '    \033[1mnpm run verify:day1\033[0m                    # terminal 2\n\n'
  exit 2
}

hr() { printf '\n\033[1m%s\033[0m\n' "$1"; }
check() { # check <label> <expected> <actual> [extra]
  # A 429 anywhere means the budget ran out — stop rather than cascade failures.
  [ "$3" = "429" ] && [ "$2" != "429" ] && rate_limited "Hit partway through, at \"$1\"."
  if [ "$2" = "$3" ]; then PASSED=$((PASSED+1)); printf '  \033[32mPASS\033[0m %-52s %s\n' "$1" "$3";
  else FAILED=$((FAILED+1)); printf '  \033[31mFAIL\033[0m %-52s expected %s got %s  %s\n' "$1" "$2" "$3" "${4:-}"; fi
}
code() { curl -s -D "$HEAD_FILE" -o "$BODY_FILE" -w '%{http_code}' "$@"; }
bdy()  { cat "$BODY_FILE"; }
# Remaining calls in the limiter bucket that served the last request.
remaining() { tr -d '\r' < "$HEAD_FILE" | sed -n 's/.*remaining=\([0-9]*\).*/\1/p' | head -1; }

hr "1.5  GET /health"
STATUS=$(code "$BASE/health")
check "health returns 200" 200 "$STATUS"
BODY=$(bdy); echo "       $BODY"
check "health has data.status"      "ok"        "$(jq -r .data.status <<<"$BODY")"
check "health has data.db"          "connected" "$(jq -r .data.db <<<"$BODY")"
check "health has uptimeSeconds"    "number"    "$(jq -r '.data.uptimeSeconds|type' <<<"$BODY")"
check "health carries meta.requestId" "true"    "$(jq -r '.meta.requestId|startswith("req_")' <<<"$BODY")"

hr "1.7  POST /auth/register"
STATUS=$(code -X POST "$BASE/auth/register" -H 'content-type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\",\"displayName\":\"Demo\"}")
[ "$STATUS" = "429" ] && rate_limited "Hit on the very first call."

# The auth limiter reports its own budget, so we can stop now rather than fail
# six checks from here.
LEFT="$(remaining)"
if [ -n "$LEFT" ] && [ "$LEFT" -lt $((AUTH_BUDGET_NEEDED - 1)) ] 2>/dev/null; then
  rate_limited "Only $LEFT of the 10 auth calls are left; this run needs $((AUTH_BUDGET_NEEDED - 1)) more."
fi

check "register returns 201" 201 "$STATUS"
REG=$(bdy)
check "register returns accessToken"  "true" "$(jq -r '(.data.accessToken|length)>20' <<<"$REG")"
check "register returns refreshToken" "true" "$(jq -r '(.data.refreshToken|length)>20' <<<"$REG")"
check "register returns expiresIn=900" 900 "$(jq -r .data.expiresIn <<<"$REG")"
check "register user.email lowercased" "$EMAIL" "$(jq -r .data.user.email <<<"$REG")"
check "register user.role" "learner" "$(jq -r .data.user.role <<<"$REG")"
check "no passwordHash in response" "false" "$(grep -qi 'passwordhash' <<<"$REG" && echo true || echo false)"

hr "1.7  duplicate email"
STATUS=$(code -X POST "$BASE/auth/register" -H 'content-type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\",\"displayName\":\"Demo Again\"}")
check "duplicate register returns 409" 409 "$STATUS"
check "duplicate error code" "EMAIL_ALREADY_REGISTERED" "$(jq -r .error.code <<<"$(bdy)")"
check "error carries requestId" "true" "$(jq -r '.error.requestId|startswith("req_")' <<<"$(bdy)")"

hr "1.8  POST /auth/login"
STATUS=$(code -X POST "$BASE/auth/login" -H 'content-type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\"}")
check "login returns 200" 200 "$STATUS"
LOGIN=$(bdy)
ACCESS=$(jq -r .data.accessToken <<<"$LOGIN")
REFRESH=$(jq -r .data.refreshToken <<<"$LOGIN")
check "login returns tokens" "true" "$(jq -r '(.data.accessToken|length)>20 and (.data.refreshToken|length)>20' <<<"$LOGIN")"

hr "1.8  login failures leak nothing"
STATUS=$(code -X POST "$BASE/auth/login" -H 'content-type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"wrong-password-entirely\"}")
check "wrong password returns 401" 401 "$STATUS"
WRONGPW=$(jq -r .error.message <<<"$(bdy)")
STATUS=$(code -X POST "$BASE/auth/login" -H 'content-type: application/json' \
  -d "{\"email\":\"nobody-$(date +%s)@example.com\",\"password\":\"$PASS\"}")
check "unknown email returns 401" 401 "$STATUS"
UNKNOWN=$(jq -r .error.message <<<"$(bdy)")
check "both messages identical (no field hint)" "$WRONGPW" "$UNKNOWN"
echo "       message: \"$WRONGPW\""

hr "1.11 GET /users/me"
STATUS=$(code "$BASE/users/me" -H "authorization: Bearer $ACCESS")
check "me with valid token returns 200" 200 "$STATUS"
ME=$(bdy); echo "       $ME"
check "me email matches token owner" "$EMAIL" "$(jq -r .data.email <<<"$ME")"
check "me has no passwordHash" "false" "$(grep -qi 'passwordhash' <<<"$ME" && echo true || echo false)"

STATUS=$(code "$BASE/users/me"); check "me with no token returns 401" 401 "$STATUS"
check "code is UNAUTHENTICATED" "UNAUTHENTICATED" "$(jq -r .error.code <<<"$(bdy)")"
STATUS=$(code "$BASE/users/me" -H "authorization: Bearer ${ACCESS%?}X")
check "me with tampered token returns 401" 401 "$STATUS"
# Forging an expired-but-correctly-signed token needs the local signing secret,
# so this one check only runs against a server started from this .env.
if [ -f "$BACKEND/.env" ]; then
  EXPIRED=$(cd "$BACKEND" && node -e '
const jwt=require("jsonwebtoken");const fs=require("fs");
const env=Object.fromEntries(fs.readFileSync(".env","utf8").split("\n").filter(l=>l.includes("=")).map(l=>[l.slice(0,l.indexOf("=")),l.slice(l.indexOf("=")+1)]));
const now=Math.floor(Date.now()/1000);
console.log(jwt.sign({sub:"000000000000000000000000",role:"learner",typ:"access",iat:now-7200,exp:now-3600},env.JWT_ACCESS_SECRET,{issuer:"reagvis-trails-api",audience:"reagvis-trails"}));')
  STATUS=$(code "$BASE/users/me" -H "authorization: Bearer $EXPIRED")
  check "me with expired token returns 401" 401 "$STATUS"
fi
# A refresh token must not be usable as an access token.
STATUS=$(code "$BASE/users/me" -H "authorization: Bearer $REFRESH")
check "refresh token rejected as access token" 401 "$STATUS"

hr "1.9  POST /auth/refresh rotates"
STATUS=$(code -X POST "$BASE/auth/refresh" -H 'content-type: application/json' \
  -d "{\"refreshToken\":\"$REFRESH\"}")
check "refresh returns 200" 200 "$STATUS"
ROT=$(bdy)
NEW_REFRESH=$(jq -r .data.refreshToken <<<"$ROT")
NEW_ACCESS=$(jq -r .data.accessToken <<<"$ROT")
check "refresh issued a different refresh token" "true" "$([ "$NEW_REFRESH" != "$REFRESH" ] && echo true || echo false)"
STATUS=$(code "$BASE/users/me" -H "authorization: Bearer $NEW_ACCESS")
check "new access token works" 200 "$STATUS"
STATUS=$(code -X POST "$BASE/auth/refresh" -H 'content-type: application/json' \
  -d "{\"refreshToken\":\"$REFRESH\"}")
check "old refresh token now rejected" 401 "$STATUS"

hr "1.9  reuse revokes the family"
STATUS=$(code -X POST "$BASE/auth/refresh" -H 'content-type: application/json' \
  -d "{\"refreshToken\":\"$NEW_REFRESH\"}")
check "rotated-from-stolen token also revoked" 401 "$STATUS"

hr "1.10 POST /auth/logout"
STATUS=$(code -X POST "$BASE/auth/login" -H 'content-type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\"}")
L2=$(bdy); A2=$(jq -r .data.accessToken <<<"$L2"); R2=$(jq -r .data.refreshToken <<<"$L2")
check "fresh login after family revoke" 200 "$STATUS"
STATUS=$(code -X POST "$BASE/auth/logout" -H "authorization: Bearer $A2" \
  -H 'content-type: application/json' -d "{\"refreshToken\":\"$R2\"}")
check "logout returns 204" 204 "$STATUS"
STATUS=$(code -X POST "$BASE/auth/refresh" -H 'content-type: application/json' \
  -d "{\"refreshToken\":\"$R2\"}")
check "refresh token dead after logout" 401 "$STATUS"
STATUS=$(code -X POST "$BASE/auth/logout" -H 'content-type: application/json' -d "{\"refreshToken\":\"$R2\"}")
check "logout without access token returns 401" 401 "$STATUS"

hr "1.4  middleware — validation, envelope, 404"
STATUS=$(code -X POST "$BASE/auth/register" -H 'content-type: application/json' \
  -d '{"email":"not-an-email","password":"short","displayName":""}')
check "bad register body returns 400" 400 "$STATUS"
V=$(bdy)
check "code is VALIDATION_ERROR" "VALIDATION_ERROR" "$(jq -r .error.code <<<"$V")"
check "validation lists all 3 fields" 3 "$(jq -r '.error.details.issues|length' <<<"$V")"
echo "       $(jq -c '.error.details.issues' <<<"$V")"
STATUS=$(code "$BASE/no-such-route"); check "unknown route returns 404" 404 "$STATUS"
check "404 uses the error envelope" "NOT_FOUND" "$(jq -r .error.code <<<"$(bdy)")"
STATUS=$(code -X POST "$BASE/auth/login" -H 'content-type: application/json' -d '{bad json')
check "malformed JSON returns 400" 400 "$STATUS"
RID=$(curl -s -D- -o /dev/null "$BASE/health" | tr -d '\r' | awk 'tolower($1)=="x-request-id:"{print $2}')
check "x-request-id response header present" "true" "$([ -n "$RID" ] && echo true || echo false)"

hr "1.12 Swagger at /api/v1/docs"
STATUS=$(code "$BASE/docs/"); check "swagger UI returns 200" 200 "$STATUS"
check "swagger page rendered" "true" "$(grep -qi 'swagger' "$BODY_FILE" && echo true || echo false)"
STATUS=$(code "$BASE/docs/openapi.yaml"); check "raw openapi.yaml served" 200 "$STATUS"

printf '\n\033[1m── Result: %d passed, %d failed ──\033[0m\n' "$PASSED" "$FAILED"
[ "$FAILED" -eq 0 ]
