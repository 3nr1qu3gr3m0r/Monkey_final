const userService = require('../service/user.service');

/**
 * CONTROLADOR DE USUARIOS - MONKEYMARKET
 * Maneja la lógica de perfil, actualización y borrado.
 */

// 1. Obtener perfil de un usuario
const getProfile = async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const user = await userService.buscarUsuarioPorId(userId);
        
        if (!user) return res.status(404).json({ message: "Usuario no encontrado" });
        
        res.json(user);
    } catch (error) {
        console.error("Error al obtener perfil:", error);
        res.status(500).json({ message: "Error al obtener perfil" });
    }
};

// 2. Actualizar datos (Solo el dueño)
const updateProfile = async (req, res) => {
    try {
        const userIdUrl = parseInt(req.params.id);
        const userIdToken = req.user.id; // Extraído del token por el middleware

        // VALIDACIÓN DE SEGURIDAD: ¿Eres el dueño de la cuenta?
        if (userIdUrl !== userIdToken) {
            return res.status(403).json({ 
                message: "Acceso denegado. No tienes permiso para modificar este perfil." 
            });
        }

        const { nombre, correo, telefono } = req.body;
        const exito = await userService.actualizarUsuario(userIdUrl, nombre, correo, telefono);
        
        if (!exito) return res.status(404).json({ message: "No se pudo actualizar el usuario" });
        
        res.json({ message: "Perfil actualizado con éxito 🚀" });
    } catch (error) {
        console.error("Error al actualizar:", error);
        res.status(500).json({ message: "Error interno al actualizar" });
    }
};

// 3. Eliminar cuenta (Solo el dueño)
const deleteAccount = async (req, res) => {
    try {
        const userIdUrl = parseInt(req.params.id);
        const userIdToken = req.user.id; // Extraído del token por el middleware

        // VALIDACIÓN DE SEGURIDAD: ¿Eres el dueño de la cuenta?
        if (userIdUrl !== userIdToken) {
            return res.status(403).json({ 
                message: "Acceso denegado. No tienes permiso para eliminar esta cuenta." 
            });
        }

        const exito = await userService.eliminarUsuario(userIdUrl);
        
        if (!exito) return res.status(404).json({ message: "Usuario no encontrado" });
        
        res.json({ message: "Cuenta eliminada correctamente" });
    } catch (error) {
        console.error("Error al eliminar cuenta:", error);
        res.status(500).json({ message: "Error interno al eliminar" });
    }
};

module.exports = { 
    getProfile, 
    updateProfile, 
    deleteAccount 
};