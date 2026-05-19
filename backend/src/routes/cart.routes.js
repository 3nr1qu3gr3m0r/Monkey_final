const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cart.controller');
const authenticateToken = require('../middlewares/auth.middleware');

// Todas las rutas del carrito requieren que el usuario esté logueado
router.get('/', authenticateToken, cartController.getCart);
router.post('/add', authenticateToken, cartController.agregarItem);

router.put('/update/:id', authenticateToken, cartController.actualizarCantidad);

router.delete('/item/:id', authenticateToken, cartController.eliminarItem);
router.delete('/clear', authenticateToken, cartController.vaciarCarrito);

module.exports = router;