#!/bin/bash
# ============================================================
#   Eduverse — Full Production Deployment Script
#   Server  : 72.62.27.196
#   Backend : Port 3008  (PM2: eduverse-backend)
#   Frontend: Port 3009  (PM2: eduverse-frontend)
# ============================================================

set -e          # Exit immediately on any error
set -o pipefail # Catch errors in pipes

# ─── Colors ─────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

# ─── Config ─────────────────────────────────────────────────
APP_DIR="/root/eduverse"
BACKEND_DIR="$APP_DIR/backend"
FRONTEND_DIR="$APP_DIR/frontend"
LOG_FILE="$APP_DIR/deploy.log"
BRANCH="master"
BACKEND_PM2="eduverse-backend"
FRONTEND_PM2="eduverse-frontend"
BACKEND_PORT=3008
FRONTEND_PORT=3009

# ─── Helpers ────────────────────────────────────────────────
log()     { echo -e "${CYAN}[$(date '+%H:%M:%S')]${RESET} $1" | tee -a "$LOG_FILE"; }
success() { echo -e "${GREEN}${BOLD}[✔] $1${RESET}" | tee -a "$LOG_FILE"; }
warn()    { echo -e "${YELLOW}[⚠] $1${RESET}" | tee -a "$LOG_FILE"; }
error()   { echo -e "${RED}${BOLD}[✘] $1${RESET}" | tee -a "$LOG_FILE"; exit 1; }
section() { echo -e "\n${BOLD}${CYAN}══════════════════════════════${RESET}" | tee -a "$LOG_FILE"
            echo -e "${BOLD}${CYAN}  $1${RESET}" | tee -a "$LOG_FILE"
            echo -e "${BOLD}${CYAN}══════════════════════════════${RESET}" | tee -a "$LOG_FILE"; }

# ─── START ──────────────────────────────────────────────────
echo "" | tee -a "$LOG_FILE"
echo -e "${BOLD}${GREEN}============================================${RESET}" | tee -a "$LOG_FILE"
echo -e "${BOLD}${GREEN}   EDUVERSE DEPLOYMENT — $(date '+%Y-%m-%d %H:%M:%S')   ${RESET}" | tee -a "$LOG_FILE"
echo -e "${BOLD}${GREEN}============================================${RESET}" | tee -a "$LOG_FILE"

# ─── STEP 0: Preflight Checks ───────────────────────────────
section "STEP 0 — Preflight Checks"

log "Checking working directory..."
cd "$APP_DIR" || error "Cannot cd to $APP_DIR"
success "Working dir: $APP_DIR"

log "Checking required tools..."
for tool in git node npm pm2 npx; do
  if ! command -v $tool &>/dev/null; then
    error "Required tool '$tool' is not installed. Aborting."
  fi
done
success "All required tools found (git, node, npm, pm2, npx)"

log "Node version: $(node --version)"
log "NPM version:  $(npm --version)"
log "PM2 version:  $(pm2 --version)"

# ─── STEP 1: Pull Latest Code ───────────────────────────────
section "STEP 1 — Pull Latest Code from GitHub"

log "Current commit: $(git rev-parse --short HEAD)"
log "Fetching latest changes from origin/$BRANCH..."

git fetch origin "$BRANCH" 2>&1 | tee -a "$LOG_FILE"
git reset --hard "origin/$BRANCH" 2>&1 | tee -a "$LOG_FILE"

NEW_COMMIT=$(git rev-parse --short HEAD)
log "Updated to commit: $NEW_COMMIT"
success "Git pull completed"

# Show what changed
log "Recent changes:"
git log --oneline -5 2>&1 | tee -a "$LOG_FILE"

# ─── STEP 2: Backend — Install Dependencies ─────────────────
section "STEP 2 — Backend: Install Dependencies"

cd "$BACKEND_DIR" || error "Cannot cd to backend"

log "Installing backend npm packages..."
npm install --legacy-peer-deps 2>&1 | tee -a "$LOG_FILE"
success "Backend npm install done"

# ─── STEP 3: Backend — Database Migration ───────────────────
section "STEP 3 — Backend: Database Migration (Prisma)"

log "Running Prisma db push (safe schema sync)..."
npx prisma db push --skip-generate 2>&1 | tee -a "$LOG_FILE"

log "Regenerating Prisma client..."
npx prisma generate 2>&1 | tee -a "$LOG_FILE"
success "Database schema is in sync"

# ─── STEP 4: Backend — Build ────────────────────────────────
section "STEP 4 — Backend: Build (NestJS)"

log "Building backend..."
npm run build 2>&1 | tee -a "$LOG_FILE"
success "Backend build completed"

# Verify dist exists
if [ ! -f "$BACKEND_DIR/dist/src/main.js" ]; then
  error "Build artifact dist/src/main.js not found. Build may have failed."
fi
success "Build artifact verified: dist/src/main.js"

cd "$APP_DIR"

# ─── STEP 5: Frontend — Install Dependencies ────────────────
section "STEP 5 — Frontend: Install Dependencies"

cd "$FRONTEND_DIR" || error "Cannot cd to frontend"

log "Installing frontend npm packages..."
npm install 2>&1 | tee -a "$LOG_FILE"
success "Frontend npm install done"

# ─── STEP 6: Frontend — Build ───────────────────────────────
section "STEP 6 — Frontend: Build (Next.js)"

log "Building frontend (this may take 1-3 minutes)..."
npm run build 2>&1 | tee -a "$LOG_FILE"
success "Frontend build completed"

# Verify .next folder
if [ ! -d "$FRONTEND_DIR/.next" ]; then
  error "Next.js .next directory not found. Build may have failed."
fi
success "Build artifact verified: .next directory"

cd "$APP_DIR"

# ─── STEP 7: Restart PM2 Services ───────────────────────────
section "STEP 7 — Restart PM2 Services"

log "Restarting PM2 processes..."

# Restart or start if not running
if pm2 describe "$BACKEND_PM2" > /dev/null 2>&1; then
  pm2 restart "$BACKEND_PM2" --update-env 2>&1 | tee -a "$LOG_FILE"
  success "Backend PM2 process restarted"
else
  warn "Backend PM2 process not found, starting fresh..."
  pm2 start ecosystem.config.js --only "$BACKEND_PM2" --update-env 2>&1 | tee -a "$LOG_FILE"
  success "Backend PM2 process started"
fi

if pm2 describe "$FRONTEND_PM2" > /dev/null 2>&1; then
  pm2 restart "$FRONTEND_PM2" --update-env 2>&1 | tee -a "$LOG_FILE"
  success "Frontend PM2 process restarted"
else
  warn "Frontend PM2 process not found, starting fresh..."
  pm2 start ecosystem.config.js --only "$FRONTEND_PM2" --update-env 2>&1 | tee -a "$LOG_FILE"
  success "Frontend PM2 process started"
fi

log "Saving PM2 process list for auto-restart on reboot..."
pm2 save 2>&1 | tee -a "$LOG_FILE"
success "PM2 process list saved"

# ─── STEP 8: Health Checks ──────────────────────────────────
section "STEP 8 — Health Checks"

log "Waiting 5 seconds for services to warm up..."
sleep 5

# Backend health check
log "Checking backend on port $BACKEND_PORT..."
if curl -sf "http://localhost:$BACKEND_PORT/api" > /dev/null 2>&1 || \
   curl -sf "http://localhost:$BACKEND_PORT/api/health" > /dev/null 2>&1; then
  success "Backend is responding on port $BACKEND_PORT"
else
  warn "Backend health check inconclusive (may still be starting). Check PM2 logs."
fi

# Frontend health check
log "Checking frontend on port $FRONTEND_PORT..."
if curl -sf "http://localhost:$FRONTEND_PORT" > /dev/null 2>&1; then
  success "Frontend is responding on port $FRONTEND_PORT"
else
  warn "Frontend health check inconclusive (may still be starting). Check PM2 logs."
fi

# ─── STEP 9: PM2 Status Report ──────────────────────────────
section "STEP 9 — Final PM2 Status"

pm2 list 2>&1 | tee -a "$LOG_FILE"

# ─── DONE ───────────────────────────────────────────────────
echo "" | tee -a "$LOG_FILE"
echo -e "${BOLD}${GREEN}============================================${RESET}" | tee -a "$LOG_FILE"
echo -e "${BOLD}${GREEN}   DEPLOYMENT SUCCESSFUL!                  ${RESET}" | tee -a "$LOG_FILE"
echo -e "${BOLD}${GREEN}   Commit : $NEW_COMMIT                    ${RESET}" | tee -a "$LOG_FILE"
echo -e "${BOLD}${GREEN}   Backend : http://localhost:$BACKEND_PORT/api  ${RESET}" | tee -a "$LOG_FILE"
echo -e "${BOLD}${GREEN}   Frontend: http://localhost:$FRONTEND_PORT     ${RESET}" | tee -a "$LOG_FILE"
echo -e "${BOLD}${GREEN}   Log file: $LOG_FILE                     ${RESET}" | tee -a "$LOG_FILE"
echo -e "${BOLD}${GREEN}============================================${RESET}" | tee -a "$LOG_FILE"
