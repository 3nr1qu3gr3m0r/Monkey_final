const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Regex centralizada — un solo lugar para cambiarla
const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const esCorreo = (contacto) => REGEX_CORREO.test(contacto);

const hashPassword = async (password) => {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
};

const verificarPassword = async (password, hash) => {
    return bcrypt.compare(password, hash);
};

const generarToken = (usuario) => {
    const payload = {
        id:       usuario.id,
        nombre:   usuario.nombre,
        rol:      usuario.rol,
        email:    usuario.correo,
        telefono: usuario.telefono
    };
    return {
        token: jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' }),
        user: payload
    };
};

module.exports = { esCorreo, hashPassword, verificarPassword, generarToken };