# Carpeta de Backups - MonkeyMarket

Esta carpeta contiene los volcados (.sql) generados por el script `auto_backup.bat`.

### Requisitos:
- Tener instalado MySQL Server.
- Configurar la ruta correcta en el archivo .bat si es diferente a la estándar.

### Cómo restaurar un respaldo:
`mysql -u root -p monkey_market < nombre_del_archivo.sql`