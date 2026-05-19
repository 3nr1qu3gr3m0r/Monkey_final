const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');
const authenticateToken = require('../middlewares/auth.middleware');

// GET /api/chat/:detalle_pedido_id -> Lee los mensajes
router.get('/:detalle_pedido_id', authenticateToken, chatController.obtenerMensajes);

// POST /api/chat/:detalle_pedido_id -> Escribe un mensaje
router.post('/:detalle_pedido_id', authenticateToken, chatController.enviarMensaje);

router.post('/resolucion/proponer', authenticateToken, chatController.proponerSolucion);
router.post('/resolucion/responder', authenticateToken, chatController.responderSolucion);
module.exports = router;