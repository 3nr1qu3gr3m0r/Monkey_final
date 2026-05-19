const db = require('../config/db');

const getByUsuario = async (userId) => {
    const [rows] = await db.query(
        `SELECT id, titulo, mensaje AS text, leida, fecha_creacion AS time 
         FROM notificaciones 
         WHERE usuario_id = ? 
         ORDER BY fecha_creacion DESC 
         LIMIT 15`,
        [userId]
    );
    return rows;
};

const marcarComoLeida = async (notificacionId, userId) => {
    const [result] = await db.query(
        'UPDATE notificaciones SET leida = TRUE WHERE id = ? AND usuario_id = ?',
        [notificacionId, userId]
    );
    return result.affectedRows > 0;
};

const crear = async (usuarioId, titulo, mensaje) => {
    const [result] = await db.query(
        'INSERT INTO notificaciones (usuario_id, titulo, mensaje) VALUES (?, ?, ?)',
        [usuarioId, titulo, mensaje]
    );
    return result.insertId;
};

module.exports = { getByUsuario, marcarComoLeida, crear };