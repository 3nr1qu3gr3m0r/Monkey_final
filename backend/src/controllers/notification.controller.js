const notificationService = require('../service/notification.service');

const getNotificaciones = async (req, res) => {
    try {
        const notificaciones = await notificationService.getByUsuario(req.user.id);
        res.status(200).json(notificaciones);
    } catch (error) {
        console.error("Error al obtener notificaciones:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
};

const marcarLeida = async (req, res) => {
    try {
        const actualizada = await notificationService.marcarComoLeida(req.params.id, req.user.id);
        if (!actualizada) {
            return res.status(404).json({ message: "Notificación no encontrada" });
        }
        res.status(200).json({ message: "Marcada como leída" });
    } catch (error) {
        res.status(500).json({ message: "Error al actualizar notificación" });
    }
};

module.exports = { getNotificaciones, marcarLeida };