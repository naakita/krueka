@echo off
chcp 65001 >nul
title Krueka - Verificar bloqueos reales de Edge y Chrome
echo Diagnostico de solo lectura. No modifica bloqueos ni instala archivos.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0DIAGNOSTICAR-REGLAS-REALES-KRUEKA.ps1"
if errorlevel 1 echo Hubo un error al comprobar las directivas. Ejecuta esta ventana en la cuenta del alumno.
echo.
pause
