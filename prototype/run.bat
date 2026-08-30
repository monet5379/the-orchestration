@echo off
rem 새 콘솔에서 run.ps1 실행 — Ctrl+C가 배치(Y/N 물음)가 아니라 PowerShell로만 감
cd /d "%~dp0"
start "The Orchestration" /wait powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0run.ps1"
exit /b %ERRORLEVEL%
