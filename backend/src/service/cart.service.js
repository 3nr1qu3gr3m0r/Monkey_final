const db = require('../config/db');

/**
 * Función auxiliar interna para asegurar que el usuario tenga un carrito
 * Se usa INSERT IGNORE para evitar errores si ya existe
 */
const getOrCreateCartId = async (userId) => {
    await db.query('INSERT IGNORE INTO carritos (cliente_id) VALUES (?)', [userId]);
    const [rows] = await db.query('SELECT id FROM carritos WHERE cliente_id = ?', [userId]);
    return rows[0].id;
};

/**
 * Obtiene todos los ítems del carrito de un usuario
 */
const getByUsuario = async (userId) => {
    const [rows] = await db.query(
        `SELECT 
            dc.id as detalle_id,
            dc.cantidad,
            dc.fecha_agendada,
            p.id as producto_id, p.titulo as producto_titulo, p.precio as producto_precio, p.imagenes as producto_img,
            s.id as servicio_id, s.titulo as servicio_titulo, s.precio as servicio_precio, s.imagenes as servicio_img
        FROM carritos c
        JOIN detalles_carrito dc ON c.id = dc.carrito_id
        LEFT JOIN productos p ON dc.producto_id = p.id
        LEFT JOIN servicios s ON dc.servicio_id = s.id
        WHERE c.cliente_id = ?`,
        [userId]
    );
    return rows;
};

/**
 * Agrega un producto o servicio al carrito
 */
const addItem = async (userId, producto_id, servicio_id, cantidad, fecha_agendada) => {
    const carrito_id = await getOrCreateCartId(userId);

    if (producto_id) {
        // Lógica para Productos: Si ya existe el mismo producto en el carrito, sumamos la cantidad
        const [exists] = await db.query(
            'SELECT id, cantidad FROM detalles_carrito WHERE carrito_id = ? AND producto_id = ?', 
            [carrito_id, producto_id]
        );

        if (exists.length > 0) {
            const nuevaCantidad = exists[0].cantidad + cantidad;
            const [result] = await db.query(
                'UPDATE detalles_carrito SET cantidad = ? WHERE id = ?', 
                [nuevaCantidad, exists[0].id]
            );
            return result.affectedRows > 0;
        } else {
            const [result] = await db.query(
                'INSERT INTO detalles_carrito (carrito_id, producto_id, cantidad) VALUES (?, ?, ?)', 
                [carrito_id, producto_id, cantidad]
            );
            return result.insertId;
        }
    } else if (servicio_id) {
        // Lógica para Servicios: Siempre inserta un nuevo registro por la especificidad de la fecha
        const [result] = await db.query(
            'INSERT INTO detalles_carrito (carrito_id, servicio_id, fecha_agendada, cantidad) VALUES (?, ?, ?, 1)', 
            [carrito_id, servicio_id, fecha_agendada]
        );
        return result.insertId;
    }
};

/**
 * Actualiza la cantidad de un ítem específico (Útil para los botones + y - en React)
 */
const updateCantidad = async (detalleId, nuevaCantidad) => {
    const [result] = await db.query(
        'UPDATE detalles_carrito SET cantidad = ? WHERE id = ?',
        [nuevaCantidad, detalleId]
    );
    return result.affectedRows > 0;
};

/**
 * Elimina un ítem específico del carrito mediante su detalle_id
 */
const removeItem = async (detalleId) => {
    const [result] = await db.query('DELETE FROM detalles_carrito WHERE id = ?', [detalleId]);
    return result.affectedRows > 0;
};

/**
 * Borra todos los ítems del carrito de un usuario
 */
const vaciar = async (userId) => {
    const [cart] = await db.query('SELECT id FROM carritos WHERE cliente_id = ?', [userId]);
    if (cart.length > 0) {
        const [result] = await db.query('DELETE FROM detalles_carrito WHERE carrito_id = ?', [cart[0].id]);
        return result.affectedRows >= 0; 
    }
    return true;
};

module.exports = { 
    getByUsuario, 
    addItem, 
    updateCantidad, 
    removeItem, 
    vaciar 
};