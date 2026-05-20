const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');

// Registro: POST /api/auth/register
router.post('/register', authController.register);

// Login: POST /api/auth/login
router.post('/login', authController.login);

// Logout: POST /api/auth/logout
router.post('/logout', authenticateToken, authController.logout);

module.exports = router;