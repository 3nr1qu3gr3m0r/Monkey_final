const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const authenticateToken = require('../middlewares/auth.middleware');

router.get('/', authenticateToken, notificationController.getNotificaciones);
router.put('/:id/leer', authenticateToken, notificationController.marcarLeida);

module.exports = router;