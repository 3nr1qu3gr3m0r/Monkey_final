// routes/admin.routes.js
const express = require('express');
const router  = express.Router();
const requireAdmin = require('../middlewares/admin.middleware');
const adminCtrl    = require('../controllers/admin.controller');

// Todas las rutas de este archivo exigen rol = 'admin'
router.use(requireAdmin);

// ── Resumen ──────────────────────────────────
router.get('/resumen', adminCtrl.getResumen);

// ── Moderación ───────────────────────────────
router.get('/moderacion/productos',          adminCtrl.getProductosPendientes);
router.patch('/moderacion/productos/:id',    adminCtrl.moderarProducto);       // body: { accion: 'aprobado'|'rechazado' }

// ── Transacciones ────────────────────────────
router.get('/transacciones', adminCtrl.getTransacciones);
// Query params opcionales: ?estado=pendiente&limite=50&pagina=1

// ── Proveedores ──────────────────────────────
router.get('/proveedores',              adminCtrl.getProveedores);
router.patch('/proveedores/:id/toggle', adminCtrl.toggleActivoProveedor);

// ── Categorías ───────────────────────────────
router.get('/categorias', adminCtrl.getCategorias);

// ── Disputas ─────────────────────────────────
router.get('/disputas',             adminCtrl.getDisputas);
// Query params opcionales: ?estado=escalado_a_admin
router.patch('/disputas/:id/resolver', adminCtrl.resolverDisputa);
// body: { resolucion: "texto", favorece: "cliente"|"proveedor" }

module.exports = router;