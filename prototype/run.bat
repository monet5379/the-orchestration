@echo off
setlocal EnableExtensions

rem The Orchestration — HTML prototype launcher (Windows)
rem Starts a local server, waits until it responds, then opens the browser.

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

rem Server in background; this window stays attached for Ctrl+C shutdown
start /b "" cmd /c "%SERVER_CMD%"

echo  Waiting for server to respond...
set /a WAIT_TRIES=0

:wait_loop
set /a WAIT_TRIES+=1

powershell -NoProfile -Command "try { $r = Invoke-WebRequest -Uri '%CHECK_URL%' -UseBasicParsing -TimeoutSec 2; if ($r.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }"
if %ERRORLEVEL%==0 goto :server_ready

if %WAIT_TRIES% geq 120 (
  echo.
  echo  ERROR: Server did not respond at %URL%
  echo  Check that port %PORT% is free, then try again.
  echo.
  pause
  exit /b 1
)

timeout /t 1 /nobreak >nul
goto :wait_loop

:server_ready
echo  Server ready.
echo  Opening browser...
start "" "%URL%"
echo.

rem Keep launcher alive so Ctrl+C stops the background server in this session
:keep_alive
timeout /t 3600 /nobreak >nul
goto :keep_alive

:done
endlocal
