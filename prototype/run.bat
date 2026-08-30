@echo off
setlocal EnableExtensions

rem The Orchestration — HTML prototype launcher (Windows)
rem Starts a local server in the foreground, opens the browser when ready.
rem Ctrl+C stops the server; leftover listeners on PORT are cleaned up on exit.

cd /d "%~dp0"

set "PORT=8080"
set "URL=http://localhost:%PORT%"
set "CHECK_URL=%URL%/js/main.js"

echo.
echo  The Orchestration — Prototype
echo  =============================
echo  Folder: %CD%
echo  URL:    %URL%
echo.
echo  Press Ctrl+C to stop the server.
echo.

set "SERVER_CMD="

where python >nul 2>nul
if %ERRORLEVEL%==0 (
  set "SERVER_CMD=python -m http.server %PORT%"
  echo  Using: Python http.server
  goto :start_server
)

where node >nul 2>nul
if %ERRORLEVEL%==0 (
  set "SERVER_CMD=npx --yes serve . -l %PORT%"
  echo  Using: npx serve
  goto :start_server
)

echo  ERROR: Python or Node.js is required.
echo.
echo  Install one of:
echo    - Python  https://www.python.org/downloads/
echo    - Node.js https://nodejs.org/
echo.
pause
exit /b 1

:start_server
echo.
echo  Starting server...

rem Open browser once the server responds (runs in background)
start /b powershell -NoProfile -WindowStyle Hidden -Command ^
  "for ($i = 0; $i -lt 120; $i++) { try { $r = Invoke-WebRequest -Uri '%CHECK_URL%' -UseBasicParsing -TimeoutSec 2; if ($r.StatusCode -eq 200) { Start-Process '%URL%'; exit 0 } } catch { } Start-Sleep -Seconds 1 }; exit 1"

rem Run server in the foreground so Ctrl+C targets it
%SERVER_CMD%

rem After Ctrl+C (and optional Y/N), free the port and close this window
call :kill_port
exit 0

:kill_port
for /f "tokens=5" %%P in ('netstat -ano ^| findstr ":%PORT% " ^| findstr LISTENING') do (
  taskkill /F /PID %%P >nul 2>&1
)
exit /b 0
