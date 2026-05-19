const db = require('../config/db');

const obtenerPorUsuario = async (usuarioId) => {
    const [rows] = await db.query(
        'SELECT * FROM direcciones WHERE usuario_id = ? AND esta_activa = TRUE ORDER BY fecha_creacion DESC', 
        [usuarioId]
    );
    return rows;
};

const crear = async (usuario_id, alias, calle_y_numero, colonia, ciudad, codigo_postal, indicaciones_extra) => {
    const [result] = await db.query(
        `INSERT INTO direcciones 
        (usuario_id, alias, calle_y_numero, colonia, ciudad, codigo_postal, indicaciones_extra) 
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [usuario_id, alias, calle_y_numero, colonia, ciudad, codigo_postal, indicaciones_extra]
    );
    return result.insertId;
};

const actualizar = async (id, usuario_id, alias, calle_y_numero, colonia, ciudad, codigo_postal, indicaciones_extra) => {
    const [result] = await db.query(
        `UPDATE direcciones 
         SET alias = ?, calle_y_numero = ?, colonia = ?, ciudad = ?, codigo_postal = ?, indicaciones_extra = ? 
         WHERE id = ? AND usuario_id = ?`,
        [alias, calle_y_numero, colonia, ciudad, codigo_postal, indicaciones_extra, id, usuario_id]
    );
    return result.affectedRows > 0;
};

const eliminar = async (id, usuario_id) => {
    // Es mejor hacer un borrado lógico (desactivar) por si hay pedidos en curso con esa dirección
    const [result] = await db.query(
        'UPDATE direcciones SET esta_activa = FALSE WHERE id = ? AND usuario_id = ?',
        [id, usuario_id]
    );
    return result.affectedRows > 0;
};

module.exports = {
    obtenerPorUsuario,
    crear,
    actualizar,
    eliminar
};