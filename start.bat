@echo off
title Bingo Carriere Manager - Serveur Live
chcp 65001 > nul
echo ========================================================
echo   🎮 BINGO CARRIÈRE MANAGER (100% SIMULATION)
echo ========================================================
echo   Lancement du serveur local sur le port 3000...
echo   Ouverture de la page d'accueil dans le navigateur...
echo ========================================================
cd /d "%~dp0"
timeout /t 2 /nobreak > nul
start http://localhost:3000
node server.js
pause
