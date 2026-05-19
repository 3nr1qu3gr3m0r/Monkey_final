const express = require('express');
const router = express.Router();
const walletController = require('../controllers/wallet.controller');

router.get('/comision', walletController.verComision);
router.get('/retiros/:id', walletController.verRetiros);
router.get('/:id', walletController.verBilletera);
router.post('/retiro', walletController.solicitarRetiro);

module.exports = router;