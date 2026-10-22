@echo off
chcp 65001 >nul
title Krueka - Comprobar Office y agente Windows
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Diagnosticar-Office-Krueka.ps1" -Modo Comprobar
if errorlevel 1 echo Hubo un error al comprobar el equipo.
pause
