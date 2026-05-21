// controllers/admin.controller.js
const db = require('../config/db');

// ─────────────────────────────────────────────
//  RESUMEN  –  métricas generales del dashboard
// ─────────────────────────────────────────────
exports.getResumen = async (req, res) => {
  try {
    const [[{ total_usuarios }]]      = await db.query(`SELECT COUNT(*) AS total_usuarios FROM usuarios`);
    const [[{ total_productos }]]     = await db.query(`SELECT COUNT(*) AS total_productos FROM productos`);
    const [[{ total_pedidos }]]       = await db.query(`SELECT COUNT(*) AS total_pedidos FROM pedidos`);
    const [[{ ingresos_totales }]]    = await db.query(`SELECT IFNULL(SUM(total), 0) AS ingresos_totales FROM pedidos WHERE estado != 'cancelado'`);
    const [[{ disputas_abiertas }]]   = await db.query(`SELECT COUNT(*) AS disputas_abiertas FROM disputas WHERE estado IN ('abierta_con_proveedor','escalado_a_admin')`);
    const [[{ productos_pendientes }]]= await db.query(`SELECT COUNT(*) AS productos_pendientes FROM productos WHERE estado = 'pendiente'`);

    // Pedidos de los últimos 7 días (para mini gráfica)
    const [pedidos_por_dia] = await db.query(`
      SELECT DATE(fecha_pedido) AS dia, COUNT(*) AS cantidad, SUM(total) AS monto
      FROM pedidos
      WHERE fecha_pedido >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY DATE(fecha_pedido)
      ORDER BY dia ASC
    `);

    res.json({
      total_usuarios,
      total_productos,
      total_pedidos,
      ingresos_totales,
      disputas_abiertas,
      productos_pendientes,
      pedidos_por_dia,
    });
  } catch (error) {
    console.error('Error en getResumen:', error);
    res.status(500).json({ error: 'Error al obtener resumen' });
  }
};

// ─────────────────────────────────────────────
//  MODERACIÓN  –  productos pendientes de aprobación
// ─────────────────────────────────────────────
exports.getProductosPendientes = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT p.id, p.nombre, p.descripcion, p.precio, p.estado, p.imagen_url,
             u.nombre AS vendedor, u.email AS vendedor_email, u.id AS vendedor_id,
             c.nombre AS categoria
      FROM productos p
      JOIN usuarios u ON p.usuario_id = u.id
      LEFT JOIN categorias c ON p.categoria_id = c.id
      WHERE p.estado = 'pendiente'
      ORDER BY p.id DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error en getProductosPendientes:', error);
    res.status(500).json({ error: 'Error al obtener productos pendientes' });
  }
};

exports.moderarProducto = async (req, res) => {
  const { id } = req.params;
  const { accion } = req.body; // 'aprobado' | 'rechazado'

  if (!['aprobado', 'rechazado'].includes(accion)) {
    return res.status(400).json({ error: 'Acción inválida. Usa "aprobado" o "rechazado"' });
  }

  try {
    await db.query(`UPDATE productos SET estado = ? WHERE id = ?`, [accion, id]);

    // Notificar al vendedor
    const [[producto]] = await db.query(`SELECT usuario_id, nombre FROM productos WHERE id = ?`, [id]);
    const mensaje = accion === 'aprobado'
      ? `Tu producto "${producto.nombre}" ha sido aprobado y ya está visible.`
      : `Tu producto "${producto.nombre}" fue rechazado por el administrador.`;

    await db.query(
      `INSERT INTO notificaciones (usuario_id, titulo, mensaje) VALUES (?, ?, ?)`,
      [producto.usuario_id, accion === 'aprobado' ? 'Producto aprobado ✅' : 'Producto rechazado ❌', mensaje]
    );

    res.json({ mensaje: `Producto ${accion} correctamente` });
  } catch (error) {
    console.error('Error en moderarProducto:', error);
    res.status(500).json({ error: 'Error al moderar producto' });
  }
};

// ─────────────────────────────────────────────
//  TRANSACCIONES  –  todos los pedidos del sistema
// ─────────────────────────────────────────────
exports.getTransacciones = async (req, res) => {
  try {
    const { estado, limite = 50, pagina = 1 } = req.query;
    const offset = (pagina - 1) * limite;

    let whereClause = '';
    const params = [];

    if (estado) {
      whereClause = 'WHERE p.estado = ?';
      params.push(estado);
    }

    const [rows] = await db.query(`
      SELECT p.id, p.total, p.estado, p.metodo_pago, p.fecha_pedido,
             u.nombre AS comprador, u.email AS comprador_email,
             COUNT(dp.id) AS num_productos
      FROM pedidos p
      JOIN usuarios u ON p.usuario_id = u.id
      LEFT JOIN detalles_pedido dp ON dp.pedido_id = p.id
      ${whereClause}
      GROUP BY p.id
      ORDER BY p.fecha_pedido DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limite), parseInt(offset)]);

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM pedidos p ${whereClause}`,
      params
    );

    res.json({ pedidos: rows, total, pagina: parseInt(pagina), limite: parseInt(limite) });
  } catch (error) {
    console.error('Error en getTransacciones:', error);
    res.status(500).json({ error: 'Error al obtener transacciones' });
  }
};

// ─────────────────────────────────────────────
//  PROVEEDORES  –  usuarios con rol de proveedor
// ─────────────────────────────────────────────
exports.getProveedores = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT u.id, u.nombre, u.email, u.telefono, u.fecha_registro, u.activo,
             COUNT(DISTINCT p.id)  AS total_productos,
             COUNT(DISTINCT pe.id) AS total_pedidos,
             IFNULL(SUM(pe.total), 0) AS volumen_ventas
      FROM usuarios u
      LEFT JOIN productos p  ON p.usuario_id = u.id
      LEFT JOIN detalles_pedido dp ON dp.producto_id = p.id
      LEFT JOIN pedidos pe ON pe.id = dp.pedido_id AND pe.estado != 'cancelado'
      WHERE u.rol = 'proveedor'
      GROUP BY u.id
      ORDER BY volumen_ventas DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error en getProveedores:', error);
    res.status(500).json({ error: 'Error al obtener proveedores' });
  }
};

exports.toggleActivoProveedor = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query(`UPDATE usuarios SET activo = NOT activo WHERE id = ? AND rol = 'proveedor'`, [id]);
    const [[usuario]] = await db.query(`SELECT activo FROM usuarios WHERE id = ?`, [id]);
    res.json({ activo: usuario.activo });
  } catch (error) {
    console.error('Error en toggleActivoProveedor:', error);
    res.status(500).json({ error: 'Error al cambiar estado del proveedor' });
  }
};

// ─────────────────────────────────────────────
//  CATEGORÍAS  –  estadísticas por categoría
// ─────────────────────────────────────────────
exports.getCategorias = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT c.id, c.nombre,
             COUNT(DISTINCT p.id)  AS total_productos,
             COUNT(DISTINCT dp.id) AS total_ventas,
             IFNULL(SUM(dp.precio_unitario * dp.cantidad), 0) AS ingresos
      FROM categorias c
      LEFT JOIN productos p  ON p.categoria_id = c.id
      LEFT JOIN detalles_pedido dp ON dp.producto_id = p.id
      GROUP BY c.id
      ORDER BY ingresos DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error en getCategorias:', error);
    res.status(500).json({ error: 'Error al obtener categorías' });
  }
};

// ─────────────────────────────────────────────
//  DISPUTAS  –  gestión de disputas escaladas
// ─────────────────────────────────────────────
exports.getDisputas = async (req, res) => {
  try {
    const { estado } = req.query;
    let whereClause = '';
    const params = [];

    if (estado) {
      whereClause = 'WHERE d.estado = ?';
      params.push(estado);
    }

    const [rows] = await db.query(`
      SELECT d.id, d.estado, d.motivo, d.descripcion, d.fecha_creacion,
             d.resolucion, d.fecha_resolucion,
             uc.nombre AS cliente,  uc.email AS cliente_email,
             up.nombre AS proveedor, up.email AS proveedor_email,
             prod.nombre AS producto,
             dp.id AS detalle_pedido_id
      FROM disputas d
      JOIN detalles_pedido dp ON dp.id = d.detalle_pedido_id
      JOIN pedidos pe ON pe.id = dp.pedido_id
      JOIN usuarios uc ON uc.id = pe.usuario_id
      JOIN productos prod ON prod.id = dp.producto_id
      JOIN usuarios up ON up.id = prod.usuario_id
      ${whereClause}
      ORDER BY d.fecha_creacion DESC
    `, params);

    res.json(rows);
  } catch (error) {
    console.error('Error en getDisputas:', error);
    res.status(500).json({ error: 'Error al obtener disputas' });
  }
};

exports.resolverDisputa = async (req, res) => {
  const { id } = req.params;
  const { resolucion, favorece } = req.body;
  // favorece: 'cliente' | 'proveedor'

  if (!resolucion || !['cliente', 'proveedor'].includes(favorece)) {
    return res.status(400).json({ error: 'Debes indicar la resolución y a quién favorece (cliente|proveedor)' });
  }

  try {
    const [[disputa]] = await db.query(`
      SELECT d.*, pe.usuario_id AS cliente_id, prod.usuario_id AS proveedor_id, prod.nombre AS producto_nombre
      FROM disputas d
      JOIN detalles_pedido dp ON dp.id = d.detalle_pedido_id
      JOIN pedidos pe ON pe.id = dp.pedido_id
      JOIN productos prod ON prod.id = dp.producto_id
      WHERE d.id = ?
    `, [id]);

    if (!disputa) return res.status(404).json({ error: 'Disputa no encontrada' });

    // 1. Cerrar la disputa
    await db.query(`
      UPDATE disputas SET estado = 'resuelta', resolucion = ?, fecha_resolucion = NOW() WHERE id = ?
    `, [resolucion, id]);

    // 2. Actualizar estado operativo del detalle de pedido
    await db.query(`
      UPDATE detalles_pedido SET estado_operativo = ? WHERE id = ?
    `, [favorece === 'cliente' ? 'refunded' : 'completed', disputa.detalle_pedido_id]);

    // 3. Notificar a ambas partes
    const mensajeCliente = favorece === 'cliente'
      ? `Tu disputa sobre "${disputa.producto_nombre}" fue resuelta a tu favor. Resolución: ${resolucion}`
      : `Tu disputa sobre "${disputa.producto_nombre}" fue resuelta a favor del proveedor. Resolución: ${resolucion}`;

    const mensajeProveedor = favorece === 'proveedor'
      ? `La disputa sobre "${disputa.producto_nombre}" fue resuelta a tu favor. Resolución: ${resolucion}`
      : `La disputa sobre "${disputa.producto_nombre}" fue resuelta a favor del cliente. Resolución: ${resolucion}`;

    await db.query(`INSERT INTO notificaciones (usuario_id, titulo, mensaje) VALUES (?, 'Disputa resuelta', ?)`, [disputa.cliente_id, mensajeCliente]);
    await db.query(`INSERT INTO notificaciones (usuario_id, titulo, mensaje) VALUES (?, 'Disputa resuelta', ?)`, [disputa.proveedor_id, mensajeProveedor]);

    res.json({ mensaje: 'Disputa resuelta correctamente' });
  } catch (error) {
    console.error('Error en resolverDisputa:', error);
    res.status(500).json({ error: 'Error al resolver disputa' });
  }
};