const express = require('express');
const router = express.Router();
const aiController = require('../controllers/ai.controller');
// const authenticateToken = require('../middlewares/auth.middleware'); // Descomenta cuando uses JWT

// Rutas originales del Chatbot IA
router.get('/catalog', aiController.getCatalog);
router.post('/analyze', aiController.analyzeMessage);

// 🚀 RUTAS NUEVAS PARA LA GESTIÓN DE RESEÑAS (PERSONA A)
router.get('/proveedor/:id/recomendaciones', aiController.getRecomendacionesProveedor);
router.get('/admin/resumen', aiController.getResumenAdmin);

module.exports = router;