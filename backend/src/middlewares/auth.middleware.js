const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    // Buscamos el token en la cabecera 'Authorization'
    const authHeader = req.headers['authorization'];
    
    // El formato es "Bearer eyJhbGciOiJIUzI1NiIs...", así que lo partimos por el espacio y tomamos la posición 1
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Acceso denegado. No se proporcionó un token.' });
    }

    // Verificamos que la firma sea válida
    jwt.verify(token, process.env.JWT_SECRET || 'super_secreto_monkey_market_2026', (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Token inválido o expirado.' });
        }
        
        // Si todo está bien, guardamos los datos del usuario en req.user para que los controladores lo usen
        req.user = user;
        next(); // ¡Adelante, puedes pasar!
    });
};

module.exports = authenticateToken;