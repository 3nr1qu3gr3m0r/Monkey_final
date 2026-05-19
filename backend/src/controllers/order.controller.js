const orderService = require('../service/order.service');

const getMisPedidos = async (req, res) => {
    try {
        const pedidos = await orderService.getPedidosConDetalles(req.user.id);
        res.status(200).json(pedidos);
    } catch (error) {
        console.error("Error al obtener pedidos:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
};

module.exports = { getMisPedidos };