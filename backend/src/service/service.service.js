const db = require('../config/db');

const crearServicio = async (datos, proveedorId) => {
    const { titulo, descripcion, precio, datos_agenda, imagenes, categoria } = datos;
    const [result] = await db.query(
        'INSERT INTO servicios (proveedor_id, titulo, descripcion, precio, datos_agenda, imagenes, categoria) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [proveedorId, titulo, descripcion, precio, JSON.stringify(datos_agenda), JSON.stringify(imagenes), categoria||'Varios']
    );
    return result.insertId;
};

const obtenerTodos = async (proveedorId = null) => {
    let whereClause = "WHERE s.esta_activo = 1";
    let params = [];

    if (proveedorId) {
        whereClause = "WHERE s.proveedor_id = ? AND s.esta_activo IN (1, 2, 3)";
        params.push(proveedorId);
    }

    const query = `
        SELECT 
            s.*, 
            u.nombre AS nombre_proveedor,
            COALESCE(AVG(v.calificacion), 0) AS calificacion_promedio, 
            COUNT(v.id) AS total_resenas
        FROM servicios s
        LEFT JOIN usuarios u ON s.proveedor_id = u.id
        LEFT JOIN detalles_pedido dp ON s.id = dp.servicio_id
        LEFT JOIN valoraciones v ON dp.id = v.detalle_pedido_id
        ${whereClause}
        GROUP BY s.id
    `;
    const [rows] = await db.query(query, params);
    return rows;
};

const obtenerPorId = async (id) => {
    const queryServicio = `
        SELECT 
            s.*, 
            u.nombre AS nombre_proveedor,
            COALESCE(AVG(v.calificacion), 0) AS calificacion_promedio, 
            COUNT(v.id) AS total_resenas
        FROM servicios s
        LEFT JOIN usuarios u ON s.proveedor_id = u.id
        LEFT JOIN detalles_pedido dp ON s.id = dp.servicio_id
        LEFT JOIN valoraciones v ON dp.id = v.detalle_pedido_id
        WHERE s.id = ? AND s.esta_activo IN (1, 2)
        GROUP BY s.id
    `;
    const [servicioRows] = await db.query(queryServicio, [id]);
    
    if (servicioRows.length === 0) return null;
    const servicio = servicioRows[0];

    const queryResenas = `
        SELECT 
            v.id, 
            v.calificacion, 
            v.comentario, 
            v.fecha_creacion, 
            uc.nombre AS nombre_cliente
        FROM valoraciones v
        JOIN detalles_pedido dp ON v.detalle_pedido_id = dp.id
        JOIN usuarios uc ON v.cliente_id = uc.id
        WHERE dp.servicio_id = ?
        ORDER BY v.fecha_creacion DESC
    `;
    const [resenas] = await db.query(queryResenas, [id]);

    servicio.resenas = resenas;

    return servicio;
};

const actualizarServicio = async (id, datos, proveedorId) => {
    const { titulo, descripcion, precio, datos_agenda, imagenes, categoria } = datos;
    const [result] = await db.query(
        'UPDATE servicios SET titulo = ?, descripcion = ?, precio = ?, datos_agenda = ?, imagenes = ?, categoria = ? WHERE id = ? AND proveedor_id = ?',
        [titulo, descripcion, precio, JSON.stringify(datos_agenda), JSON.stringify(imagenes),categoria, id, proveedorId]
    );
    return result.affectedRows > 0;
};

const eliminarServicio = async (id, proveedorId) => {
    const [result] = await db.query(
        'UPDATE servicios SET esta_activo = 0 WHERE id = ? AND proveedor_id = ?',
        [id, proveedorId]
    );
    return result.affectedRows > 0;
};

const togglePausaServicio = async (id, usuario) => {
    const [rows] = await db.query('SELECT esta_activo, proveedor_id FROM servicios WHERE id = ?', [id]);
    if (rows.length === 0) return { error: "Servicio no encontrado" };
    
    const { esta_activo, proveedor_id } = rows[0];

    if (usuario.rol === 'admin') {
        const nuevoEstado = esta_activo === 3 ? 1 : 3;
        await db.query('UPDATE servicios SET esta_activo = ? WHERE id = ?', [nuevoEstado, id]);
        return { success: true };
    } else {
        if (proveedor_id !== usuario.id) return { error: "No autorizado" };
        if (esta_activo === 3) return { error: "Bloqueado por Administrador. Contacta a soporte." };
        
        const nuevoEstado = esta_activo === 1 ? 2 : 1;
        await db.query('UPDATE servicios SET esta_activo = ? WHERE id = ?', [nuevoEstado, id]);
        return { success: true };
    }
};

const obtenerHorariosOcupados = async (servicioId) => {
    const query = `
        SELECT fecha_agendada 
        FROM detalles_pedido 
        WHERE servicio_id = ? 
          AND estado_operativo NOT IN ('cancelado', 'rechazado')
          AND fecha_agendada IS NOT NULL
    `;
    const [rows] = await db.query(query, [servicioId]);
    return rows.map(row => row.fecha_agendada); 
};

module.exports = { 
    crearServicio, 
    obtenerTodos, 
    obtenerPorId, 
    actualizarServicio, 
    eliminarServicio, 
    togglePausaServicio,
    obtenerHorariosOcupados
};