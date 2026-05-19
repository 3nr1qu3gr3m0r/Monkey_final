const express = require('express');
const router = express.Router();
const clientController = require('../controllers/client.controller');
const authenticateToken = require('../middlewares/auth.middleware');

// Rutas protegidas (El usuario debe estar logueado)
router.post('/calificar', authenticateToken, clientController.calificarArticulo);
router.post('/reportar', authenticateToken, clientController.reportarProblema);
router.put('/queja/:id/estado', authenticateToken, clientController.actualizarQueja);
router.delete('/calificar/:id', authenticateToken, clientController.eliminarCalificacion);

module.exports = router;