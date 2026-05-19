@echo off
:: Forzamos a que el script sepa dónde está parado
cd /d "%~dp0"

:: 1. Ruta de MySQL
set "MYSQ_PATH=C:\Program Files\MySQL\MySQL Server 8.3\bin"

:: 2. Configurar la fecha para el nombre del archivo
set "FECHA=%date:~-4%-%date:~3,2%-%date:~0,2%"

echo Generando respaldo diario de MonkeyMarket...

:: 3. Ejecutar el comando 
"%MYSQ_PATH%\mysqldump.exe" -u root --column-statistics=0 monkey_market > "backups\backup_%FECHA%.sql"

if %ERRORLEVEL% EQU 0 (
    echo [OK] Respaldo creado con exito en la carpeta backups.
) else (
    echo [ERROR] Algo salio mal. Revisa que la carpeta 'backups' exista.
)

pause