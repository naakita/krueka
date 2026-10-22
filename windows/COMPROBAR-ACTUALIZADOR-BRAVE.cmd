@echo off
chcp 65001 >nul
title Krueka - Comprobar error de respaldo previo Brave
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Recuperar-Actualizador-Brave-v05.ps1" -Modo Comprobar
if errorlevel 1 echo El comprobador detecto un problema. No se cambiaron archivos.
pause
