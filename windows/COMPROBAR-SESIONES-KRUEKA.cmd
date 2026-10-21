@echo off
chcp 65001 >nul
title Krueka - Comprobar cuentas y bloqueo Windows
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Blindar-Sesiones-Krueka.ps1" -Modo Comprobar
echo.
pause
