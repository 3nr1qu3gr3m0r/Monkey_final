const cartService = require('../service/cart.service');

const getCart = async (req, res) => {
    try {
        // Obtenemos el ID directamente del token
        const items = await cartService.getByUsuario(req.user.id);
        res.status(200).json(items);
    } catch (error) {
        console.error("Error al obtener el carrito:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
};

const agregarItem = async (req, res) => {
    try {
        const { producto_id, servicio_id, cantidad, fecha_agendada } = req.body;
        
        if (!producto_id && !servicio_id) {
            return res.status(400).json({ message: "Debes especificar un producto o servicio" });
        }

        await cartService.addItem(
            req.user.id, 
            producto_id || null, 
            servicio_id || null, 
            cantidad || 1, 
            fecha_agendada || null
        );

        res.status(200).json({ message: "Ítem agregado al carrito" });
    } catch (error) {
        console.error("Error al agregar ítem al carrito:", error);
        res.status(500).json({ message: "Error al actualizar el carrito" });
    }
};


const actualizarCantidad = async (req, res) => {
    try {
        const { id } = req.params; // El detalle_id
        const { cantidad } = req.body;

        if (!cantidad || cantidad < 1) {
            return res.status(400).json({ message: "La cantidad debe ser mayor a 0" });
        }

        const actualizado = await cartService.updateCantidad(id, cantidad);
        
        if (!actualizado) {
            return res.status(404).json({ message: "No se pudo encontrar el ítem para actualizar" });
        }

        res.status(200).json({ message: "Cantidad actualizada" });
    } catch (error) {
        console.error("Error al actualizar cantidad:", error);
        res.status(500).json({ message: "Error al procesar la actualización" });
    }
};

const eliminarItem = async (req, res) => {
    try {
        const eliminado = await cartService.removeItem(req.params.id);
        if (!eliminado) {
            return res.status(404).json({ message: "Ítem no encontrado en el carrito" });
        }
        res.status(200).json({ message: "Ítem eliminado correctamente" });
    } catch (error) {
        console.error("Error al eliminar ítem:", error);
        res.status(500).json({ message: "Error al eliminar el ítem" });
    }
};

const vaciarCarrito = async (req, res) => {
    try {
        await cartService.vaciar(req.user.id);
        res.status(200).json({ message: "Carrito vaciado correctamente" });
    } catch (error) {
        console.error("Error al vaciar carrito:", error);
        res.status(500).json({ message: "Error al vaciar el carrito" });
    }
};

module.exports = { 
    getCart, 
    agregarItem, 
    actualizarCantidad, // Agregado a los exports
    eliminarItem, 
    vaciarCarrito 
};