@echo off
chcp 65001 >nul
title Krueka - Autorizar EdClub y Code.org
echo Ejecutar este archivo como administrador de Windows.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Autorizar-EdClub-CodeOrg-Krueka.ps1" -Modo Aplicar
if errorlevel 1 echo Error: consultar el mensaje anterior; no se confirma la autorizacion.
pause
