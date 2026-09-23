@echo off
title Dogecoin Core Intranet Mining Game Server
echo ==========================================================
echo Starting Dogecoin Core Intranet Mining Game on Port 3000...
echo ==========================================================
echo 1. Checking Node.js environment...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo Error: Node.js is not found. Please install Node.js (v18+) from nodejs.org!
    pause
    exit /b 1
)

echo 2. Installing dependencies...
call npm install

echo 3. Building frontend production bundle...
call npm run build

echo 4. Starting game server on http://localhost:3000
echo    Intranet players can connect via http://<YOUR_LAN_IP>:3000
call npm start
pause
