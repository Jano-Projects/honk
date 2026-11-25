@echo off
rem  HONK! - baixa o motor e as fontes para jogar sem internet
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0preparar-offline.ps1"
pause
