const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const authenticateToken = require('../middlewares/auth.middleware');

// Ruta protegida: Solo el usuario logueado puede ver sus propios pedidos
router.get('/mis-pedidos', authenticateToken, orderController.getMisPedidos);

module.exports = router;