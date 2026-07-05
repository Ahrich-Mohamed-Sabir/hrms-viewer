@echo off
:: ============================================================
:: START-DEV.bat — Mode développement (Vite HMR)
:: ============================================================
:: Lance 2 fenêtres :
::   1. node server.js   → API sur http://localhost:3030
::   2. npm run dev      → Vite sur http://localhost:5200
::      (Vite proxie /api → 3030 automatiquement via vite.config.js)
::
:: Avantage vs START.bat : Hot Module Replacement activé
:: Chaque modification d'un .vue se recharge sans rebuilder.
:: ============================================================

title HRMS Dev Launcher
cd /d "%~dp0"

:: Arrête les instances Node précédentes
echo  Arret des instances Node precedentes...
taskkill /F /IM node.exe >nul 2>&1

:: Installe les dépendances si besoin
if not exist node_modules (
    echo  Installation des dependances...
    call npm install
)

echo  Demarrage API (port 3030)...
start "HRMS API" powershell -NoExit -Command "cd '%~dp0'; node server.js"

echo  Demarrage Vite dev (port 5200)...
start "HRMS Vite" powershell -NoExit -Command "cd '%~dp0'; npm run dev"

echo.
echo  API   → http://localhost:3030
echo  App   → http://localhost:5200
echo.
pause
