const db = require('../config/db');

const registrarCalificacion = async (detallePedidoId, clienteId, calificacion, comentario, imagenes) => {
    await db.query(
        `INSERT INTO valoraciones (detalle_pedido_id, cliente_id, calificacion, comentario, imagenes) 
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE 
         calificacion = VALUES(calificacion), 
         comentario = VALUES(comentario), 
         imagenes = VALUES(imagenes)`,
        [detallePedidoId, clienteId, calificacion, comentario, JSON.stringify(imagenes || [])]
    );
    return true;
};

const registrarReporteProblema = async (detallePedidoId, clienteId, motivoQueja, imagenesEvidencia) => {
    
    // 1. INSERT IGNORE (Este se queda igual, está perfecto)
    await db.query(
        `INSERT IGNORE INTO disputas (detalle_pedido_id, cliente_id, motivo_queja, imagenes, estado) 
         VALUES (?, ?, ?, ?, 'abierta_con_proveedor')`,
        [detallePedidoId, clienteId, motivoQueja, JSON.stringify(imagenesEvidencia || [])]
    );

    // 2. Guardamos el mensaje en el chat
    await db.query(
        `INSERT INTO mensajes_chat (detalle_pedido_id, remitente_id, mensaje) 
         VALUES (?, ?, ?)`,
        [detallePedidoId, clienteId, motivoQueja]
    );

    // 🚀 3. LA CORRECCIÓN: Volvemos a usar 'estado_queja'
    await db.query(
        `UPDATE detalles_pedido SET estado_queja = 'chatting' WHERE id = ?`,
        [detallePedidoId]
    );
    
    return true;
};

const cambiarEstadoResolucion = async (detallePedidoId, nuevoEstadoOperativo) => {
    // nuevoEstadoOperativo será 'escalated' (Escalado al Admin) o 'resolved' (Resuelto)
    await db.query(
        `UPDATE detalles_pedido SET estado_queja = ? WHERE id = ?`,
        [nuevoEstadoOperativo, detallePedidoId]
    );
    return true;
};

const proponerSolucion = async (detallePedidoId) => {
    await db.query(
        `UPDATE disputas SET estado = 'esperando_confirmacion_cliente' WHERE detalle_pedido_id = ?`,
        [detallePedidoId]
    );
    // Agregamos un mensaje automático del sistema al chat
    await db.query(
        `INSERT INTO mensajes_chat (detalle_pedido_id, remitente_id, mensaje) 
         VALUES (?, (SELECT cliente_id FROM disputas WHERE detalle_pedido_id = ?), '🤖 SISTEMA: El proveedor ha propuesto una solución. ¿Estás de acuerdo?')`,
        [detallePedidoId, detallePedidoId]
    );
    return true;
};

const responderSolucion = async (detallePedidoId, aceptada) => {
    if (aceptada) {
        // Todo feliz: Se cierra la disputa y se marca el detalle como completado
        await db.query(`UPDATE disputas SET estado = 'resuelto' WHERE detalle_pedido_id = ?`, [detallePedidoId]);
        await db.query(`UPDATE detalles_pedido SET estado_operativo = 'entregado' WHERE id = ?`, [detallePedidoId]);
    } else {
        // Hay pleito: Se escala al ADMIN
        await db.query(`UPDATE disputas SET estado = 'escalado_a_admin' WHERE detalle_pedido_id = ?`, [detallePedidoId]);
        await db.query(`UPDATE detalles_pedido SET estado_operativo = 'escalated' WHERE id = ?`, [detallePedidoId]);
        
        // Notificamos al Admin (Asumiendo que el Admin tiene el ID 1, o cambias esto a tu lógica)
        await db.query(`INSERT INTO notificaciones (usuario_id, titulo, mensaje) VALUES (1, '🚨 Disputa Escalada', 'Un cliente y un proveedor no llegaron a un acuerdo.')`);
    }
    return true;
};

const eliminarCalificacion = async (detallePedidoId, clienteId) => {
    await db.query(
        `DELETE FROM valoraciones WHERE detalle_pedido_id = ? AND cliente_id = ?`,
        [detallePedidoId, clienteId]
    );
    return true;
};

module.exports = {
    registrarCalificacion,
    registrarReporteProblema,
    cambiarEstadoResolucion,
    proponerSolucion,
    responderSolucion,
    eliminarCalificacion
};