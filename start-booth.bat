@echo off
rem AIおみくじ: start the booth on this PC (no public website needed)
cd /d "%~dp0"
where node >nul 2>nul || (echo Node.js is not installed. Install the LTS version from https://nodejs.org and run this again. & pause & exit /b 1)
if not exist node_modules (echo Installing for the first time... & call npm install || (pause & exit /b 1))
if not exist .next\BUILD_ID (echo Building... & call npm run build || (pause & exit /b 1))
echo Starting the booth server on http://localhost:3000 ...
start "AIomikuji server" /min cmd /k "npm start"
timeout /t 6 /nobreak >nul
start "" chrome --kiosk --kiosk-printing --autoplay-policy=no-user-gesture-required http://localhost:3000/omikuji
exit /b 0
