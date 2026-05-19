const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller')
// Registro: POST /api/auth/register
router.post('/register', authController.register);

// Login: POST /api/auth/login
router.post('/login', authController.login);

module.exports = router;