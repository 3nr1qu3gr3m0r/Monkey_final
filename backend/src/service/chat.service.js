const db = require('../config/db');

// Obtener el historial
const obtenerMensajesPorDetalle = async (detallePedidoId) => {
    const [mensajes] = await db.query(
        `SELECT m.id, m.mensaje, m.fecha_envio, m.remitente_id, 
                u.nombre as remitente_nombre, u.rol as remitente_rol
         FROM mensajes_chat m
         JOIN usuarios u ON m.remitente_id = u.id
         WHERE m.detalle_pedido_id = ?
         ORDER BY m.fecha_envio ASC`,
        [detallePedidoId]
    );
    return mensajes;
};

const guardarMensaje = async (detallePedidoId, remitenteId, mensaje) => {
    // 1. Guardamos el mensaje en el chat
    const [result] = await db.query(
        `INSERT INTO mensajes_chat (detalle_pedido_id, remitente_id, mensaje)
         VALUES (?, ?, ?)`,
        [detallePedidoId, remitenteId, mensaje]
    );

    // Buscamos quién es el cliente y quién es el proveedor de este artículo
    const [involucrados] = await db.query(
        `SELECT 
            dp.pedido_id,
            ped.cliente_id, 
            COALESCE(p.proveedor_id, s.proveedor_id) AS proveedor_id
         FROM detalles_pedido dp
         JOIN pedidos ped ON dp.pedido_id = ped.id
         LEFT JOIN productos p ON dp.producto_id = p.id
         LEFT JOIN servicios s ON dp.servicio_id = s.id
         WHERE dp.id = ?`,
        [detallePedidoId]
    );

    if (involucrados.length > 0) {
        const { cliente_id, proveedor_id } = involucrados[0];
        
        // Si el remitente es el cliente, notificamos al proveedor. Si no, al cliente.
        const receptorId = (Number(remitenteId) === Number(cliente_id)) ? proveedor_id : cliente_id;
        
        await db.query(
            `INSERT INTO notificaciones (usuario_id, titulo, mensaje) 
             VALUES (?, 'Nuevo mensaje en disputa', 'Tienes un nuevo mensaje en el chat de soporte.')`,
            [receptorId]
        );
    }

    return result.insertId;
};

module.exports = { 
    obtenerMensajesPorDetalle, 
    guardarMensaje 
};