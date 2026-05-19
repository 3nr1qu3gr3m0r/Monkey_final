const db = require('../config/db');

const obtenerTodos = async (proveedorId = null) => {
    let whereClause = "WHERE p.esta_activo = 1";
    let params = [];
    if (proveedorId) {
        whereClause = "WHERE p.proveedor_id = ? AND p.esta_activo IN (1, 2, 3)";
        params.push(proveedorId);
    }

    const query = `
        SELECT 
            p.*, 
            u.nombre AS nombre_proveedor,
            COALESCE(AVG(v.calificacion), 0) AS calificacion_promedio, 
            COUNT(v.id) AS total_resenas
        FROM productos p
        LEFT JOIN usuarios u ON p.proveedor_id = u.id
        LEFT JOIN detalles_pedido dp ON p.id = dp.producto_id
        LEFT JOIN valoraciones v ON dp.id = v.detalle_pedido_id
        ${whereClause}
        GROUP BY p.id
    `;
    const [rows] = await db.query(query, params);
    return rows;
};

const obtenerPorId = async (id) => {
    const queryProducto = `
        SELECT 
            p.*, 
            u.nombre AS nombre_proveedor,
            COALESCE(AVG(v.calificacion), 0) AS calificacion_promedio, 
            COUNT(v.id) AS total_resenas
        FROM productos p
        LEFT JOIN usuarios u ON p.proveedor_id = u.id
        LEFT JOIN detalles_pedido dp ON p.id = dp.producto_id
        LEFT JOIN valoraciones v ON dp.id = v.detalle_pedido_id
        WHERE p.id = ? AND p.esta_activo IN (1,2)
        GROUP BY p.id
    `;
    const [productoRows] = await db.query(queryProducto, [id]);
    
    if (productoRows.length === 0) return null;
    const producto = productoRows[0];

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
        WHERE dp.producto_id = ?
        ORDER BY v.fecha_creacion DESC
    `;
    const [resenas] = await db.query(queryResenas, [id]);

    producto.resenas = resenas;

    return producto; 
};

const crear = async (proveedor_id, titulo, descripcion, precio, stock, imagenes, categoria) => {
    const imagenesJson = JSON.stringify(imagenes || []);
    const [result] = await db.query(
        'INSERT INTO productos (proveedor_id, titulo, descripcion, precio, stock, imagenes, categoria) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [proveedor_id, titulo, descripcion, precio, stock || 0, imagenesJson, categoria || 'Varios']
    );
    return result.insertId; 
};

const actualizar = async (id, titulo, descripcion, precio, stock, imagenes, categoria) => {
    const imagenesJson = JSON.stringify(imagenes || []);
    const [result] = await db.query(
        'UPDATE productos SET titulo = ?, descripcion = ?, precio = ?, stock = ?, imagenes = ?, categoria = ? WHERE id = ?',
        [titulo, descripcion, precio, stock, imagenesJson, categoria || 'Varios', id]
    );
    return result.affectedRows > 0; 
};

const eliminar = async (id) => {
    const [result] = await db.query('UPDATE productos SET esta_activo = 0 WHERE id = ?', [id]);
    return result.affectedRows > 0;
};

const togglePausa = async (id, usuario) => {
    const [rows] = await db.query('SELECT esta_activo, proveedor_id FROM productos WHERE id = ?', [id]);
    if (rows.length === 0) return { error: "Producto no encontrado" };
    
    const { esta_activo, proveedor_id } = rows[0];

    if (usuario.rol === 'admin') {
        const nuevoEstado = esta_activo === 3 ? 1 : 3;
        await db.query('UPDATE productos SET esta_activo = ? WHERE id = ?', [nuevoEstado, id]);
        return { success: true };
    } else {
        if (proveedor_id !== usuario.id) return { error: "No autorizado" };
        if (esta_activo === 3) return { error: "Bloqueado por Administrador. Contacta a soporte." };
        const nuevoEstado = esta_activo === 1 ? 2 : 1;
        await db.query('UPDATE productos SET esta_activo = ? WHERE id = ?', [nuevoEstado, id]);
        return { success: true };
    }
};

module.exports = { obtenerTodos, obtenerPorId, crear, actualizar, eliminar, togglePausa };