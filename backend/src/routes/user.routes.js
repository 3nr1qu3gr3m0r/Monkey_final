const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
// Importamos el middleware de autenticación (el guardia)
const authenticateToken = require('../middlewares/auth.middleware');

/**
 * RUTAS DE USUARIOS - MONKEYMARKET
 * Todas las rutas están protegidas con 'authenticateToken' para cumplir
 * con el requisito de que solo usuarios logueados accedan.
 */

// 1. Ver perfil (Solo usuarios autenticados)
router.get('/:id', authenticateToken, userController.getProfile);

// 2. Editar perfil (Solo el dueño de la cuenta)
router.put('/:id', authenticateToken, userController.updateProfile);

// 3. Eliminar cuenta (Solo el dueño de la cuenta)
router.delete('/:id', authenticateToken, userController.deleteAccount);

module.exports = router;