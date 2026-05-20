const db = require('../config/db');

const getDashboard = async (proveedorId) => {
    const [wallet] = await db.query('SELECT saldo_actual, total_ganado FROM billeteras WHERE proveedor_id = ?', [proveedorId]);
    const saldoWallet = wallet.length > 0 ? Number(wallet[0].saldo_actual) : 0;

    const [retirosDb] = await db.query("SELECT SUM(monto) as total FROM retiros WHERE proveedor_id = ? AND estado != 'rechazado'", [proveedorId]);
    const totalRetiros = retirosDb[0]?.total ? Number(retirosDb[0].total) : 0;

    const [ventas] = await db.query(
        `SELECT dp.id, dp.cantidad, dp.estado_operativo, dp.fecha_agendada, dp.precio_unitario_historico,
                ped.fecha_creacion, u.nombre as cliente_nombre, u.correo as cliente_correo,
                p.titulo as prod_nombre, p.imagenes as prod_fotos,
                s.titulo as serv_nombre, s.imagenes as serv_fotos
         FROM detalles_pedido dp
         JOIN pedidos ped ON dp.pedido_id = ped.id
         JOIN usuarios u ON ped.cliente_id = u.id
         LEFT JOIN productos p ON dp.producto_id = p.id
         LEFT JOIN servicios s ON dp.servicio_id = s.id
         WHERE (p.proveedor_id = ? OR s.proveedor_id = ?)
         ORDER BY ped.fecha_creacion DESC`,
        [proveedorId, proveedorId]
    );

    const pedidosFormateados = ventas.map(v => {
        const esProducto = v.prod_nombre != null;
        
        // 🚀 VACUNA ANTI-SAFARI: Si viene de MySQL como string sin 'T', se la ponemos
        const fechaCreacionSegura = typeof v.fecha_creacion === 'string' ? v.fecha_creacion.replace(' ', 'T') : v.fecha_creacion;
        const fechaAgendadaSegura = typeof v.fecha_agendada === 'string' ? v.fecha_agendada.replace(' ', 'T') : v.fecha_agendada;

        // 🚀 EXTRAEMOS LAS FOTOS DEPENDIENDO SI ES PRODUCTO O SERVICIO
        const fotosRaw = esProducto ? v.prod_fotos : v.serv_fotos;

        return {
            id: `ORD-${v.id}`,
            dbId: v.id,
            tipo: esProducto ? 'producto' : 'servicio',
            articulo: esProducto ? v.prod_nombre : v.serv_nombre,
            fotos: fotosRaw, // <--- 🚀 Las fotos ya viajan al frontend
            cliente: v.cliente_nombre,
            fecha: new Date(fechaCreacionSegura).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }),
            eventoFecha: v.fecha_agendada ? new Date(fechaAgendadaSegura).toLocaleDateString('es-MX') : null,
            monto: Number(v.precio_unitario_historico) * v.cantidad,
            estatus: (v.estado_operativo || 'pendiente').toLowerCase(), 
            avatar: v.cliente_nombre ? v.cliente_nombre.charAt(0).toUpperCase() : 'U',
            notes: esProducto ? `Cantidad: ${v.cantidad}` : 'Reserva de servicio'
        };
    });

    // 🚀 OBTENER REPORTES/DISPUTAS REALES
    const [reportesDb] = await db.query(
        `SELECT disp.id AS disputa_id, disp.detalle_pedido_id, disp.motivo_queja, disp.estado AS disputa_estado,
                disp.fecha_creacion, u.nombre AS cliente_nombre,
                p.titulo AS prod_nombre, s.titulo AS serv_nombre
         FROM disputas disp
         JOIN detalles_pedido dp ON disp.detalle_pedido_id = dp.id
         JOIN pedidos ped ON dp.pedido_id = ped.id
         JOIN usuarios u ON ped.cliente_id = u.id
         LEFT JOIN productos p ON dp.producto_id = p.id
         LEFT JOIN servicios s ON dp.servicio_id = s.id
         WHERE (p.proveedor_id = ? OR s.proveedor_id = ?)
         ORDER BY disp.fecha_creacion DESC`,
        [proveedorId, proveedorId]
    );

    const reportesFormateados = reportesDb.map(r => {
        const esProducto = r.prod_nombre != null;
        
        let estatus = 'pendiente';
        if (r.disputa_estado === 'esperando_confirmacion_cliente') estatus = 'respondido';
        if (r.disputa_estado === 'resuelto') estatus = 'resuelto';
        if (r.disputa_estado === 'escalado_a_admin') estatus = 'respondido';

        const fechaSegura = typeof r.fecha_creacion === 'string' ? r.fecha_creacion.replace(' ', 'T') : r.fecha_creacion;

        return {
            id: r.detalle_pedido_id, // 🔑 ID real del detalle del pedido para usar en Chat
            disputaId: r.disputa_id,
            tipoProd: esProducto ? 'producto' : 'servicio',
            articulo: esProducto ? r.prod_nombre : r.serv_nombre,
            nombre: esProducto ? r.prod_nombre : r.serv_nombre, // Para ChatProveedor
            cliente: r.cliente_nombre,
            avatar: r.cliente_nombre ? r.cliente_nombre.charAt(0).toUpperCase() : 'U',
            fecha: new Date(fechaSegura).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }),
            estatus: estatus,
            mensaje: r.motivo_queja,
            complaint: r.disputa_estado, // Para ChatProveedor
            respuesta: r.disputa_estado === 'esperando_confirmacion_cliente' ? 'Propuesta de solución enviada al cliente.' : null
        };
    });

    return { saldoWallet, totalRetiros, pedidos: pedidosFormateados, reportes: reportesFormateados };
};

const updateStatus = async (detalleId, estatus) => {
    // 1. Actualizar el estatus en la base de datos
    await db.query('UPDATE detalles_pedido SET estado_operativo = ? WHERE id = ?', [estatus, detalleId]);

    // 2. Obtener info del pedido para notificar al cliente y pagarle al proveedor
    const [info] = await db.query(`
        SELECT ped.cliente_id, 
               p.titulo AS prod_nombre, p.proveedor_id AS prod_provId,
               s.titulo AS serv_nombre, s.proveedor_id AS serv_provId,
               dp.precio_unitario_historico, dp.cantidad, dp.comision_historica
        FROM detalles_pedido dp
        JOIN pedidos ped ON dp.pedido_id = ped.id
        LEFT JOIN productos p ON dp.producto_id = p.id
        LEFT JOIN servicios s ON dp.servicio_id = s.id
        WHERE dp.id = ?
    `, [detalleId]);

    if (info.length > 0) {
        const clienteId = info[0].cliente_id;
        const itemName = info[0].prod_nombre || info[0].serv_nombre;
        
        // 🚀 NUEVO: LÓGICA DE PAGO AL PROVEEDOR
        if (estatus === 'entregado') {
            const proveedorId = info[0].prod_provId || info[0].serv_provId;
            
            // Calculamos cuánto le toca (Precio Total - Comisión de MonkeyMarket)
            const totalVenta = Number(info[0].precio_unitario_historico) * Number(info[0].cantidad);
            const comisionTotal = Number(info[0].comision_historica) * Number(info[0].cantidad);
            const gananciaNeta = totalVenta - comisionTotal;

            // Revisamos si el proveedor ya tiene una billetera creada
            const [billeteraExis] = await db.query('SELECT id FROM billeteras WHERE proveedor_id = ?', [proveedorId]);
            
            if (billeteraExis.length > 0) {
                // Si ya tiene billetera, le sumamos el dinero
                await db.query(`
                    UPDATE billeteras 
                    SET saldo_actual = saldo_actual + ?, total_ganado = total_ganado + ? 
                    WHERE proveedor_id = ?
                `, [gananciaNeta, gananciaNeta, proveedorId]);
            } else {
                // Si es su primera venta terminada, le creamos su billetera
                await db.query(`
                    INSERT INTO billeteras (proveedor_id, saldo_actual, total_ganado) 
                    VALUES (?, ?, ?)
                `, [proveedorId, gananciaNeta, gananciaNeta]);
            }
        }

        // 3. Notificación al cliente
        const estadosMap = {
            'en_preparacion': 'En Preparación 🛠️',
            'enviado_agendado': 'En Camino / Enviado 🚚',
            'entregado': 'Entregado / Completado ✅'
        };
        const estadoLegible = estadosMap[estatus] || estatus;
        const textoNotif = `¡Actualización! Tu pedido de "${itemName}" ahora está: ${estadoLegible}.`;
        
        await db.query('INSERT INTO notificaciones (usuario_id, titulo, mensaje) VALUES (?, ?, ?)', [clienteId, 'Actualización de Pedido', textoNotif]);
    }
    return true;
};

const solicitarRetiro = async (proveedorId, monto, cuentaDestino) => {
    const [wallet] = await db.query('SELECT saldo_actual FROM billeteras WHERE proveedor_id = ?', [proveedorId]);
    const saldoActual = wallet.length > 0 ? Number(wallet[0].saldo_actual) : 0;

    if (saldoActual < monto) throw new Error("Saldo insuficiente para este retiro.");

    await db.query(
        'INSERT INTO retiros (proveedor_id, monto, cuenta_destino, estado) VALUES (?, ?, ?, "pendiente")',
        [proveedorId, monto, cuentaDestino]
    );

    await db.query(
        'UPDATE billeteras SET saldo_actual = saldo_actual - ? WHERE proveedor_id = ?',
        [monto, proveedorId]
    );

    return saldoActual - monto;
};

module.exports = { getDashboard, updateStatus, solicitarRetiro };