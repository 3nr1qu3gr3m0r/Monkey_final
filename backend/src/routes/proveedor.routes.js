const express = require('express');
const router = express.Router();
const providerController = require('../controllers/proveedor.controller');
const authenticateToken = require('../middlewares/auth.middleware');

router.get('/dashboard', authenticateToken, providerController.getDashboardData);
router.put('/pedido/:id/estatus', authenticateToken, providerController.updateOrderStatus);
router.post('/retiro', authenticateToken, providerController.solicitarRetiro);
module.exports = router;