const authenticateToken = require('./auth.middleware');

/**
 * Middleware en cascada:
 * 1. authenticateToken  → verifica el JWT (ya existente, sin duplicar lógica)
 * 2. requireAdmin       → verifica que req.user.rol === 'admin'
 */
const requireAdmin = [
  authenticateToken,
  (req, res, next) => {
    if (req.user?.rol !== 'admin') {
      return res.status(403).json({ message: 'Acceso denegado: se requiere rol de administrador.' });
    }
    next();
  },
];

module.exports = requireAdmin;