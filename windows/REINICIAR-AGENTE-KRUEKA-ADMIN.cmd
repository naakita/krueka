@echo off
chcp 65001 >nul
title Krueka - Reiniciar agente Windows como administrador
echo IMPORTANTE: ejecutar como administrador SOLO en la PC afectada.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Diagnosticar-Office-Krueka.ps1" -Modo ReiniciarAgente
if errorlevel 1 echo No se pudo reiniciar el agente. Revisar el mensaje anterior.
pause
