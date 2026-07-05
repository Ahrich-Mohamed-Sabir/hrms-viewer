@echo off
:: ============================================================
:: START.bat — Lanceur automatique du HRMS Code Viewer
:: ============================================================
:: Ce script fait 3 choses dans l'ordre :
::   1. Installe les dépendances npm si node_modules n'existe pas encore
::   2. Compile le frontend Vue (génère dist/)
::   3. Lance le serveur Node (server.js)
::
:: Utilisation : double-cliquer sur START.bat
:: Pré-requis  : Node.js installé (node + npm dans le PATH)
:: ============================================================

title HRMS Code Viewer

:: %~dp0 = dossier contenant ce fichier .bat (chemin absolu avec barre oblique finale)
:: /d = permet de changer de lecteur aussi (ex: C: → D:) si nécessaire
cd /d "%~dp0"

echo.
echo  HRMS Code Viewer
echo  ================
echo.

:: Vérifie si node_modules existe — si non, installe les dépendances
if not exist node_modules (
    echo  [1/3] Installation des dependances...
    call npm install
    echo.
)

:: Build Vue → génère dist/index.html + dist/assets/*.js + dist/assets/*.css
:: highlight.js est inclus dans le bundle JS lors du build
echo  [2/3] Build du frontend Vue...
call npm run build
echo.

:: Lance server.js — serveur Express qui sert dist/ + les routes /api
:: Affiche les URLs Local et Réseau dans le terminal
echo  [3/3] Demarrage du serveur...
echo  Ouvre ton navigateur sur l'URL reseau affichee ci-dessous
echo.
node server.js

:: pause : garde le terminal ouvert si node plante (permet de voir l'erreur)
pause
