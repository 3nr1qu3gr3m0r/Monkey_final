const mysql = require('mysql2/promise');

// 💡 Nota de Arquitectura: El archivo .env DEBE ir en la raíz del proyecto 
// (al mismo nivel que package.json), NO adentro de la carpeta src/.
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10, // Máximo de "tubos" abiertos al mismo tiempo
    queueLimit: 0,
    timezone: '-06:00', // Forzamos el horario de CDMX
    dateStrings: true
});

// Probamos que exista la conexión (Mantenemos esto activo para el Backend)
pool.getConnection()
    .then(connection => {
        console.log('📦 Conexión a MySQL (MonkeyMarket) exitosa');
        connection.release(); // Siempre debemos liberar la conexión de prueba
    })
    .catch(err => {
        console.error('❌ Error conectando a MySQL (Asegúrate de tener tu servidor local encendido):', err.message);
    });

module.exports = pool;