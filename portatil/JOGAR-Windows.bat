@echo off
rem =====================================================================
rem  HONK! - lancador para Windows 10/11
rem  Nao precisa instalar nada: usa o PowerShell que ja vem no Windows.
rem  Se o Windows avisar "protegeu o computador", clique em
rem  "Mais informacoes" > "Executar assim mesmo".
rem =====================================================================
title HONK!
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0servidor.ps1"
if errorlevel 1 (
  echo.
  echo Nao consegui iniciar o servidor. Abrindo o arquivo direto no navegador...
  start "" "%~dp0index.html"
  pause
)
