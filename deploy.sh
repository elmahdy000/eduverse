#!/usr/bin/env bash

set -Eeuo pipefail

APP_DIR="${APP_DIR:-/srv/eduverse}"
BACKEND_DIR="$APP_DIR/backend"
FRONTEND_DIR="$APP_DIR/frontend"
OWNER_PORTAL_DIR="$APP_DIR/owner-portal"
LOG_FILE="${LOG_FILE:-$APP_DIR/deploy.log}"
BRANCH="${DEPLOY_BRANCH:-master}"
BACKEND_PORT="${BACKEND_PORT:-3008}"
FRONTEND_PORT="${FRONTEND_PORT:-3009}"
OWNER_PORTAL_PORT="${OWNER_PORTAL_PORT:-3010}"

log() { printf '[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*"; }
fail() { log "ERROR: $*"; exit 1; }

require_tool() {
  command -v "$1" >/dev/null 2>&1 || fail "Required tool '$1' is not installed"
}

require_env_key() {
  local file="$1"
  local key="$2"
  [[ -f "$file" ]] || fail "Missing environment file: $file"
  grep -Eq "^${key}=.+" "$file" || fail "Missing $key in $file"
}

require_public_api_url() {
  local file="$1"
  require_env_key "$file" "NEXT_PUBLIC_API_URL"
  local value
  value="$(grep -E '^NEXT_PUBLIC_API_URL=' "$file" | tail -n 1 | cut -d= -f2-)"
  [[ "$value" =~ ^https:// ]] || fail "NEXT_PUBLIC_API_URL in $file must use https://"
  [[ "$value" != *localhost* && "$value" != *127.0.0.1* ]] || fail "NEXT_PUBLIC_API_URL in $file cannot use localhost"
}

health_check() {
  local name="$1"
  local url="$2"
  local attempts="${3:-12}"
  local delay="${4:-5}"
  local i
  for ((i = 1; i <= attempts; i += 1)); do
    if curl --fail --silent --show-error --max-time 10 "$url" >/dev/null; then
      log "$name health check passed: $url"
      return 0
    fi
    log "$name is not ready yet ($i/$attempts)"
    sleep "$delay"
  done
  fail "$name health check failed: $url"
}

mkdir -p "$(dirname "$LOG_FILE")"
touch "$LOG_FILE"
exec > >(tee -a "$LOG_FILE") 2>&1

log "Starting Eduverse deployment"
cd "$APP_DIR" || fail "Cannot access $APP_DIR"

for tool in git node npm npx pm2 curl; do
  require_tool "$tool"
done

[[ -f "$BACKEND_DIR/.env" ]] || fail "Missing backend/.env"
require_env_key "$BACKEND_DIR/.env" "DATABASE_URL"
require_env_key "$BACKEND_DIR/.env" "JWT_SECRET"
if grep -Eq '^JWT_SECRET=(your_|change_|secret$)' "$BACKEND_DIR/.env"; then
  fail "backend/.env contains an unsafe JWT_SECRET"
fi

FRONTEND_ENV_FILE="${FRONTEND_ENV_FILE:-$FRONTEND_DIR/.env.production}"
OWNER_PORTAL_ENV_FILE="${OWNER_PORTAL_ENV_FILE:-$OWNER_PORTAL_DIR/.env.production}"
require_public_api_url "$FRONTEND_ENV_FILE"
require_public_api_url "$OWNER_PORTAL_ENV_FILE"

if [[ -n "$(git status --porcelain --untracked-files=no)" ]]; then
  fail "Server checkout contains tracked local changes; refusing to overwrite them"
fi

OLD_COMMIT="$(git rev-parse HEAD)"
SERVICES_RELOADED=0
WORKTREE_MUTATED=0

rollback_on_exit() {
  local status="$?"
  trap - EXIT
  if [[ "$status" -ne 0 ]]; then
    set +e
    log "Deployment failed; restoring source to ${OLD_COMMIT:0:8}"
    cd "$APP_DIR" && git reset --hard "$OLD_COMMIT"
    if [[ "$WORKTREE_MUTATED" -eq 1 ]]; then
      log "Rebuilding the previous application version"
      (cd "$BACKEND_DIR" && npm ci && npx prisma generate && npm run build)
      (cd "$FRONTEND_DIR" && npm ci && npm run build)
      (cd "$OWNER_PORTAL_DIR" && npm ci && npm run build)
    fi
    if [[ "$SERVICES_RELOADED" -eq 1 ]]; then
      log "Restarting the previous application version"
      (cd "$APP_DIR" && pm2 startOrReload ecosystem.config.js --update-env)
    fi
  fi
  exit "$status"
}
trap rollback_on_exit EXIT

git fetch origin "$BRANCH"
git checkout "$BRANCH"
git merge --ff-only "origin/$BRANCH"
NEW_COMMIT="$(git rev-parse HEAD)"
WORKTREE_MUTATED=1
log "Updating ${OLD_COMMIT:0:8} -> ${NEW_COMMIT:0:8}"

log "Installing and building backend"
cd "$BACKEND_DIR"
npm ci
npx prisma generate
npm run build
[[ -f dist/src/main.js ]] || fail "Backend artifact dist/src/main.js is missing"

log "Installing and building frontend"
cd "$FRONTEND_DIR"
npm ci
npm run build
[[ -d .next ]] || fail "Frontend .next artifact is missing"

log "Installing and building owner portal"
cd "$OWNER_PORTAL_DIR"
npm ci
npm run build
[[ -d .next ]] || fail "Owner portal .next artifact is missing"

log "Applying committed database migrations"
cd "$BACKEND_DIR"
npx prisma migrate deploy

cd "$APP_DIR"
SERVICES_RELOADED=1
pm2 startOrReload ecosystem.config.js --update-env
pm2 save

health_check "Backend" "http://127.0.0.1:$BACKEND_PORT/api"
health_check "Frontend" "http://127.0.0.1:$FRONTEND_PORT/login"
health_check "Owner portal" "http://127.0.0.1:$OWNER_PORTAL_PORT/login"

pm2 list
log "Deployment completed successfully at commit ${NEW_COMMIT:0:8}"
log "Previous commit for manual rollback: ${OLD_COMMIT}"
trap - EXIT
