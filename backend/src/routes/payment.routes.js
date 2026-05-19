const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const webhookController = require('../controllers/webhook.controller');
const authenticateToken = require('../middlewares/auth.middleware');

// Ruta para crear el pago desde React (Requiere login)
router.post('/create_preference', authenticateToken, paymentController.createPreference);

// Ruta para Mercado Pago (NO REQUIERE LOGIN, MP no tiene tu token)
router.post('/webhook', webhookController.receiveWebhook);

module.exports = router;