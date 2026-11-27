@echo off
rem AIおみくじ: get the latest version and rebuild (needs internet)
cd /d "%~dp0"
git pull || (pause & exit /b 1)
call npm install || (pause & exit /b 1)
call npm run build || (pause & exit /b 1)
echo Done. Run start-booth.bat to start the booth.
pause
