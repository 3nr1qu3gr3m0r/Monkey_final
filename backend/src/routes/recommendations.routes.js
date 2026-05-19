const express = require('express');
const router = express.Router();
const recommendationsController = require('../controllers/recommendations.controller');

// Generar recomendaciones para un proveedor: GET /api/recommendations/:proveedor_id
router.get('/:proveedor_id', recommendationsController.generarRecomendaciones);

module.exports = router;
