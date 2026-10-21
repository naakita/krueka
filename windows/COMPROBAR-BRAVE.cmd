@echo off
chcp 65001 >nul
title Krueka - Diagnosticar Internet de Brave
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Bloquear-Brave-Krueka.ps1" -Modo Comprobar
echo.
pause
