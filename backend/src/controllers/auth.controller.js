const userService  = require('../service/user.service');
const authService  = require('../service/auth.service');
const { revokeToken } = require('../middlewares/auth.middleware');

const register = async (req, res) => {
    try {
        const { nombre, contacto, password, rol } = req.body;

        const usaCorreo = authService.esCorreo(contacto);
        const correo    = usaCorreo  ? contacto : null;
        const telefono  = !usaCorreo ? contacto : null;

        const existe = await userService.buscarUsuarioPorContacto(contacto, usaCorreo);
        if (existe) {
            const tipo = usaCorreo ? "correo electrónico" : "número telefónico";
            return res.status(400).json({ message: `Este ${tipo} ya está registrado.` });
        }

        const hashedPassword = await authService.hashPassword(password);
        const nuevoId = await userService.crearUsuario(
            nombre, correo, telefono, hashedPassword, rol || 'cliente'
        );

        res.status(201).json({ message: "Usuario registrado con éxito 🚀", userId: nuevoId });

    } catch (error) {
        console.error("Error en register:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
};

const login = async (req, res) => {
    try {
        const { contacto, password } = req.body;

        const usaCorreo = authService.esCorreo(contacto);
        const usuario   = await userService.buscarUsuarioPorContacto(contacto, usaCorreo);

        // Mensaje genérico intencional — no revelar qué campo falló
        if (!usuario) {
            return res.status(401).json({ message: "Credenciales inválidas" });
        }

        const passwordValida = await authService.verificarPassword(password, usuario.contrasena_hash);
        if (!passwordValida) {
            return res.status(401).json({ message: "Credenciales inválidas" });
        }

        const { token, user } = authService.generarToken(usuario);
        res.status(200).json({ message: "¡Bienvenido a MonkeyMarket!", token, user });

    } catch (error) {
        console.error("Error en login:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
};

const logout = async (req, res) => {
    try {
        const token = req.token;
        if (token) {
            revokeToken(token);
        }
        res.status(200).json({ message: 'Sesión cerrada correctamente.' });
    } catch (error) {
        console.error("Error en logout:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
};

module.exports = { register, login, logout };