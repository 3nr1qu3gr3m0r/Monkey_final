const jwt = require('jsonwebtoken');

const revokedTokens = new Set();

const isTokenRevoked = (token) => revokedTokens.has(token);
const revokeToken = (token) => {
    if (token) revokedTokens.add(token);
};

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Acceso denegado. No se proporcionó un token.' });
    }

    if (isTokenRevoked(token)) {
        return res.status(403).json({ message: 'Token inválido o revocado. Por favor inicia sesión de nuevo.' });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'super_secreto_monkey_market_2026', (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Token inválido o expirado.' });
        }

        req.user = user;
        req.token = token;
        next();
    });
};

module.exports = authenticateToken;
module.exports.authenticateToken = authenticateToken;
module.exports.revokeToken = revokeToken;