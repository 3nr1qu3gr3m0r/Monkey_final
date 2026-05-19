const express = require('express');
const router = express.Router();
const direccionController = require('../controllers/direccion.controller');
const authenticateToken = require('../middlewares/auth.middleware');

// Aseguramos que solo usuarios logueados puedan manejar direcciones
router.use(authenticateToken);

router.get('/', direccionController.getDirecciones);
router.post('/', direccionController.createDireccion);
router.put('/:id', direccionController.updateDireccion);
router.delete('/:id', direccionController.deleteDireccion);

module.exports = router;