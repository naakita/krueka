@echo off
chcp 65001 >nul
title Krueka - Comprobar EdClub y Code.org
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Autorizar-EdClub-CodeOrg-Krueka.ps1" -Modo Comprobar
pause
