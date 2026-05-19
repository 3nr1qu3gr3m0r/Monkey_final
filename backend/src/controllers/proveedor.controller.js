const vendorService = require('../service/proveedor.service');

const getDashboardData = async (req, res) => {
    try {
        const data = await vendorService.getDashboard(req.user.id);
        res.status(200).json(data);
    } catch (error) {
        console.error("Error al cargar dashboard de proveedor:", error);
        res.status(500).json({ message: "Error interno" });
    }
};

const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { estatus } = req.body; 
        
        // 🚀 Delegamos la actualización y notificación al Service
        await vendorService.updateStatus(id, estatus);
        
        res.status(200).json({ message: "Estatus actualizado y cliente notificado" });
    } catch (error) {
        console.error("Error al actualizar estatus:", error);
        res.status(500).json({ message: "Error al actualizar estatus" });
    }
};

const solicitarRetiro = async (req, res) => {
    try {
        const { monto, cuentaDestino } = req.body;

        if (!monto || monto <= 0 || !cuentaDestino) {
            return res.status(400).json({ message: "Monto o cuenta de destino inválidos." });
        }

        const nuevoSaldo = await vendorService.solicitarRetiro(req.user.id, monto, cuentaDestino);

        res.status(200).json({ 
            message: "¡Solicitud enviada! Recibirás tus fondos en un plazo de 24 a 48 horas hábiles.",
            nuevoSaldo
        });

    } catch (error) {
        console.error("Error al solicitar retiro:", error);
        if (error.message === "Saldo insuficiente para este retiro.") {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: "Error interno del servidor." });
    }
};

module.exports = { getDashboardData, updateOrderStatus, solicitarRetiro };