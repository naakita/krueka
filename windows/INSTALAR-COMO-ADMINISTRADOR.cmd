@echo off
setlocal
title Krueka - Configurar computadoras de alumnos
echo Configurando Krueka. Este archivo requiere permisos de administrador.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Configurar-Krueka-Alumnos.ps1"
if errorlevel 1 (
 echo.
 echo ERROR: No se completo la configuracion. Revise el mensaje anterior.
) else (
 echo.
 echo Listo. Cierre Edge y vuelva a iniciar sesion en Windows.
)
pause
