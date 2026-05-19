const db = require('../config/db');

// ✅ 2 queries totales sin importar cuántos pedidos tenga el cliente
const getPedidosConDetalles = async (clienteId) => {

    // Query 1 — pedidos maestros
    const [pedidos] = await db.query(
        `SELECT id, fecha_creacion, monto_total, estado, external_payment_id
         FROM pedidos
         WHERE cliente_id = ?
         ORDER BY fecha_creacion DESC`,
        [clienteId]
    );

    if (pedidos.length === 0) return [];

    // Query 2 — TODOS los detalles + VALORACIONES de una sola vez
    const pedidoIds = pedidos.map(p => p.id);

    const [detalles] = await db.query(
        `SELECT 
            dp.id               AS detalle_id,
            dp.pedido_id,
            dp.cantidad,
            dp.estado_operativo,
            dp.fecha_agendada,
            dp.precio_unitario_historico,
            p.id               AS prod_id,
            p.titulo           AS prod_nombre,
            p.imagenes         AS prod_fotos,
            s.id               AS serv_id,
            s.titulo           AS serv_nombre,
            s.imagenes         AS serv_fotos,
            u.nombre           AS vendor_nombre,
            v.calificacion,
            v.comentario
         FROM detalles_pedido dp
         LEFT JOIN productos  p  ON dp.producto_id = p.id
         LEFT JOIN servicios  s  ON dp.servicio_id  = s.id
         LEFT JOIN usuarios   u  ON (p.proveedor_id = u.id OR s.proveedor_id = u.id)
         -- 🚀 UNIMOS CON VALORACIONES PARA SABER SI YA EXISTE UNA
         LEFT JOIN valoraciones v ON (v.detalle_pedido_id = dp.id AND v.cliente_id = ?)
         WHERE dp.pedido_id IN (?)`,
        [clienteId, pedidoIds] // 👈 Pasamos clienteId para el JOIN y pedidoIds para el IN
    );

    // Agrupamos detalles por pedido_id en memoria
    const detallesPorPedido = detalles.reduce((map, det) => {
        if (!map[det.pedido_id]) map[det.pedido_id] = [];
        map[det.pedido_id].push(det);
        return map;
    }, {});

    // ENSAMBLAJE
    return pedidos.map(pedido => ({
        id: `ORD-${pedido.id}`, 
        db_id: pedido.id,       
        fecha: new Date(pedido.fecha_creacion).toLocaleDateString('es-MX'),
        total: Number(pedido.monto_total),
        estado: pedido.estado === 'completado' ? 'Pagado / En Proceso' : pedido.estado,
        mp_id: pedido.external_payment_id,
        
        items: (detallesPorPedido[pedido.id] || []).map(det => {
            const esProducto = det.prod_id !== null;
            const fotosRaw = esProducto ? det.prod_fotos : det.serv_fotos;
            
            let fotoUrl = 'https://via.placeholder.com/100';
            try {
                if (fotosRaw) {
                    const fotosArray = typeof fotosRaw === 'string' ? JSON.parse(fotosRaw) : fotosRaw;
                    if (Array.isArray(fotosArray) && fotosArray.length > 0) {
                        fotoUrl = fotosArray[0];
                    }
                }
            } catch (e) {
                console.error("Error al leer imagen:", e);
            }

            return {
                id: det.detalle_id, 
                item_id: esProducto ? det.prod_id : det.serv_id,
                nombre: esProducto ? det.prod_nombre : det.serv_nombre,
                tipo: esProducto ? 'Producto' : 'Servicio',
                vendor: det.vendor_nombre || 'MonkeyMarket',
                img: fotoUrl,
                cantidad: det.cantidad,
                // 💰 Ahora el precio se verá en el modal
                precio: Number(det.precio_unitario_historico) || 0,
                // ⭐ Si existe calificación en la BD, se manda, si no, null
                calificacion_previa: det.calificacion || null,
                comentario_previo: det.comentario || '',
                fechaReserva: det.fecha_agendada,
                estadoItem: det.estado_operativo, 
                complaint: null 
            };
        })
    }));
};

module.exports = { getPedidosConDetalles };