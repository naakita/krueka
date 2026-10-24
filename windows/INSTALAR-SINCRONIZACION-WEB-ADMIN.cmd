@echo off
chcp 65001 >nul
title Krueka - Instalar sincronizacion automatica de paginas (una sola vez)
echo Se requiere la cuenta ADMINISTRADORA de Windows y la credencial emitida por Krueka para ESTA PC.
echo NO utilice la credencial del agente viejo ni rote el token principal.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Krueka-PolicySync.ps1" -Mode Install
if errorlevel 1 echo El sincronizador no pudo instalarse. Verifique el error anterior.
echo.
pause
