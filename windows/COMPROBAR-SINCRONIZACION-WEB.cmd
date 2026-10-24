@echo off
chcp 65001 >nul
title Krueka - Comprobar sincronizacion de paginas
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Krueka-PolicySync.ps1" -Mode Status
pause
