// controllers/admin.controller.js
const db = require('../config/db');

// ─────────────────────────────────────────────
//  RESUMEN  –  métricas generales del dashboard (CORREGIDO)
// ─────────────────────────────────────────────
exports.getResumen = async (req, res) => {
  try {
    const [[{ total_usuarios }]]      = await db.query(`SELECT COUNT(*) AS total_usuarios FROM usuarios`);
    const [[{ total_productos }]]     = await db.query(`SELECT COUNT(*) AS total_productos FROM productos`);
    const [[{ total_pedidos }]]       = await db.query(`SELECT COUNT(*) AS total_pedidos FROM pedidos`);
    
    const [[{ ingresos_totales }]]    = await db.query(`SELECT IFNULL(SUM(monto_total), 0) AS ingresos_totales FROM pedidos WHERE estado != 'cancelado'`);
    
    const [[{ disputas_abiertas }]]   = await db.query(`SELECT COUNT(*) AS disputas_abiertas FROM disputas WHERE estado IN ('abierta_con_proveedor','escalada_admin')`);
    const [[{ productos_pendientes }]]= await db.query(`SELECT COUNT(*) AS productos_pendientes FROM productos WHERE esta_activo = FALSE`);

    const [pedidos_por_dia] = await db.query(`
      SELECT DATE(fecha_creacion) AS dia, COUNT(*) AS cantidad, SUM(monto_total) AS monto
      FROM pedidos
      WHERE fecha_creacion >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY DATE(fecha_creacion)
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
//  MODERACIÓN  –  productos pendientes de aprobación (CORREGIDO)
// ─────────────────────────────────────────────
exports.getProductosPendientes = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT p.id, p.titulo AS nombre, p.descripcion, p.precio, p.esta_activo, p.imagenes AS imagen_url,
             u.nombre AS vendedor, u.correo AS vendedor_email, u.id AS vendedor_id,
             p.categoria
      FROM productos p
      JOIN usuarios u ON p.proveedor_id = u.id
      WHERE p.esta_activo = FALSE
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
  const { accion } = req.body; 

  if (!['aprobado', 'rechazado'].includes(accion)) {
    return res.status(400).json({ error: 'Acción inválida. Usa "aprobado" o "rechazado"' });
  }

  try {
    await db.query(`UPDATE productos SET esta_activo = ? WHERE id = ?`, [accion === 'aprobado' ? true : false, id]);

    const [[producto]] = await db.query(`SELECT proveedor_id, titulo FROM productos WHERE id = ?`, [id]);
    const mensaje = accion === 'aprobado'
      ? `Tu producto "${producto.titulo}" ha sido aprobado y ya está visible.`
      : `Tu producto "${producto.titulo}" fue rechazado por el administrador.`;

    await db.query(
      `INSERT INTO notificaciones (usuario_id, titulo, mensaje) VALUES (?, ?, ?)`,
      [producto.proveedor_id, accion === 'aprobado' ? 'Producto aprobado ✅' : 'Producto rechazado ❌', mensaje]
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
      SELECT p.id, p.monto_total AS total, p.estado, p.metodo_pago, p.fecha_creacion AS fecha_pedido,
             u.nombre AS comprador, u.correo AS comprador_email,
             COUNT(dp.id) AS num_productos
      FROM pedidos p
      JOIN usuarios u ON p.usuario_id = u.id
      LEFT JOIN detalles_pedido dp ON dp.pedido_id = p.id
      ${whereClause}
      GROUP BY p.id
      ORDER BY p.fecha_creacion DESC
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
      SELECT u.id, u.nombre, u.correo AS email, u.telefono, u.fecha_registro, u.es_activo AS activo,
             COUNT(DISTINCT p.id)  AS total_productos,
             COUNT(DISTINCT pe.id) AS total_pedidos,
             IFNULL(SUM(pe.monto_total), 0) AS volumen_ventas
      FROM usuarios u
      LEFT JOIN productos p  ON p.proveedor_id = u.id
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
    await db.query(`UPDATE usuarios SET es_activo = NOT es_activo WHERE id = ? AND rol = 'proveedor'`, [id]);
    const [[usuario]] = await db.query(`SELECT es_activo AS activo FROM usuarios WHERE id = ?`, [id]);
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
      LEFT JOIN productos p  ON p.categoria = c.nombre
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
//  DISPUTAS  –  gestión de disputas escaladas (CORREGIDO)
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

    // 🚀 AQUI ESTABA EL ERROR: Se borró d.motivo y se ajustaron los alias a la BD
    const [rows] = await db.query(`
      SELECT d.id, d.estado, d.descripcion, d.fecha_creacion,
             d.resolucion, d.fecha_resolucion,
             uc.nombre AS cliente,  uc.correo AS cliente_email,
             up.nombre AS proveedor, up.correo AS proveedor_email,
             prod.titulo AS producto,
             dp.id AS detalle_pedido_id
      FROM disputas d
      JOIN detalles_pedido dp ON dp.id = d.detalle_pedido_id
      JOIN pedidos pe ON pe.id = dp.pedido_id
      JOIN usuarios uc ON uc.id = pe.usuario_id
      JOIN productos prod ON prod.id = dp.producto_id
      JOIN usuarios up ON up.id = prod.proveedor_id
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

  if (!resolucion || !['cliente', 'proveedor'].includes(favorece)) {
    return res.status(400).json({ error: 'Debes indicar la resolución y a quién favorece (cliente|proveedor)' });
  }

  try {
    const [[disputa]] = await db.query(`
      SELECT d.*, pe.usuario_id AS cliente_id, prod.proveedor_id AS proveedor_id, prod.titulo AS producto_nombre
      FROM disputas d
      JOIN detalles_pedido dp ON dp.id = d.detalle_pedido_id
      JOIN pedidos pe ON pe.id = dp.pedido_id
      JOIN productos prod ON prod.id = dp.producto_id
      WHERE d.id = ?
    `, [id]);

    if (!disputa) return res.status(404).json({ error: 'Disputa no encontrada' });

    await db.query(`
      UPDATE disputas SET estado = 'resuelta', resolucion = ?, fecha_resolucion = NOW() WHERE id = ?
    `, [resolucion, id]);

    await db.query(`
      UPDATE detalles_pedido SET estado = ? WHERE id = ?
    `, [favorece === 'cliente' ? 'cancelado' : 'entregado', disputa.detalle_pedido_id]);

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