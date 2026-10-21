@echo off
chcp 65001 >nul
title Krueka - Seguridad de sesiones de Windows
echo IMPORTANTE: ejecutar como administrador local de Windows.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Blindar-Sesiones-Krueka.ps1" -Modo Aplicar
if errorlevel 1 echo Se detecto un error. NO se confirma la aplicacion de la seguridad.
echo.
pause
