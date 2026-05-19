const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/service.controller');
const authenticateToken = require('../middlewares/auth.middleware');

// Cualquiera puede ver el catálogo o un servicio específico
router.get('/', serviceController.getAllServices);
router.get('/:id', serviceController.getServiceById);

// Solo usuarios logueados (Proveedores) pueden crear, editar, borrar o pausar
router.post('/', authenticateToken, serviceController.postService);
router.put('/:id', authenticateToken, serviceController.updateService);
router.delete('/:id', authenticateToken, serviceController.deleteService);
router.patch('/:id/toggle', authenticateToken, serviceController.togglePausaService);
router.get('/:id/ocupados', serviceController.getHorariosOcupados);

module.exports = router;