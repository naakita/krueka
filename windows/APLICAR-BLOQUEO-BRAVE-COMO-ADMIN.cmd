@echo off
chcp 65001 >nul
title Krueka - Bloquear Internet de Brave
echo IMPORTANTE: ejecutar este archivo COMO ADMINISTRADOR de Windows.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Bloquear-Brave-Krueka.ps1" -Modo Aplicar
if errorlevel 1 (echo Se produjo un error. No se confirma el bloqueo.)
echo.
pause
