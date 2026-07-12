@echo off
title Servidor RECSA + Supabase
echo ====================================================================
echo             INICIANDO SISTEMA DE SOLVENCIA RECSA
echo ====================================================================
echo [1/3] Verificando dependencias de Node.js...
call npm install
echo.
echo [2/3] Iniciando el servidor backend conectado a Supabase...
echo.
echo [3/3] LISTO. Deje esta ventana abierta.
echo.
echo Para usar el sistema, puede:
echo 1. Abrir http://localhost:3000 en su navegador (RECOMENDADO)
echo 2. O seguir abriendo el archivo index.html desde su escritorio.
echo.
echo Presione cualquier tecla para iniciar el servidor...
pause > null
npm start
pause
