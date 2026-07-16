@echo off
REM ============================================
REM Eduverse - تشغيل الباك اند والفرونت اند
REM ============================================

echo.
echo ========================================
echo   Eduverse - Starting Application
echo ========================================
echo.

echo [1/2] Starting Backend (NestJS on port 3001)...
start "Eduverse Backend" cmd /k "cd /d %~dp0backend && npm run start:dev"

timeout /t 3 /nobreak >nul

echo [2/2] Starting Frontend (Next.js on port 3000)...
start "Eduverse Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ========================================
echo   Both services are starting...
echo   Backend:  http://localhost:3001/api
echo   Swagger:  http://localhost:3001/docs
echo   Frontend: http://localhost:3000
echo ========================================
echo.
echo (اقفل الترمينالين لما تخلص)
pause
