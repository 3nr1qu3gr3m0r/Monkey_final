const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const authenticateToken = require('../middlewares/auth.middleware');

router.get('/', productController.getProducts);
router.get('/:id', productController.getProductById);

// Protegemos estas rutas
router.post('/', authenticateToken, productController.createProduct);
router.put('/:id', authenticateToken, productController.updateProduct);
router.delete('/:id', authenticateToken, productController.deleteProduct);
router.patch('/:id/toggle', authenticateToken, productController.togglePausaProduct);

module.exports = router;