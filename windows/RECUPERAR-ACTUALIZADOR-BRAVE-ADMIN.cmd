@echo off
chcp 65001 >nul
title Krueka - Recuperacion del actualizador Brave
echo IMPORTANTE: Ejecutar como administrador. No elimina respaldos.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Recuperar-Actualizador-Brave-v05.ps1" -Modo PrepararReintento
if errorlevel 1 echo ERROR: no ejecutar el actualizador hasta revisar el mensaje.
pause
