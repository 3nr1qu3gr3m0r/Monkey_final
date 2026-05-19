const clientService = require('../service/client.service');

const calificarArticulo = async (req, res) => {
    try {
        const clienteId = req.user.id;
        const { detalle_pedido_id, calificacion, comentario, imagenes } = req.body;

        await clientService.registrarCalificacion(detalle_pedido_id, clienteId, calificacion, comentario, imagenes);
        
        res.status(200).json({ message: '¡Gracias por calificar tu experiencia!' });
    } catch (error) {
        console.error(" Error al calificar artículo:", error);
        res.status(500).json({ message: 'Error interno al guardar la calificación.' });
    }
};

const reportarProblema = async (req, res) => {
    try {
        const clienteId = req.user.id; 
        const { detalle_pedido_id, motivo_queja, imagenes } = req.body; 

        await clientService.registrarReporteProblema(detalle_pedido_id, clienteId, motivo_queja, imagenes);
        
        res.status(200).json({ message: 'Reporte creado y mensaje enviado al chat.' });
    } catch (error) {
        console.error(" Error al reportar problema:", error);
        res.status(500).json({ message: 'Error interno al procesar el reporte.' });
    }
};

const actualizarQueja = async (req, res) => {
    try {
        const { id } = req.params; 
        const { nuevo_estado } = req.body; 
        
        await clientService.cambiarEstadoResolucion(id, nuevo_estado);
        
        res.status(200).json({ message: 'Estado del reporte actualizado correctamente.' });
    } catch (error) {
        console.error(" Error al actualizar queja:", error);
        res.status(500).json({ message: 'Error interno al modificar el estado del ticket.' });
    }
};

const eliminarCalificacion = async (req, res) => {
    try {
        const clienteId = req.user.id;
        const { id } = req.params; // Este es el detalle_pedido_id

        await clientService.eliminarCalificacion(id, clienteId);
        
        res.status(200).json({ message: 'Calificación eliminada correctamente.' });
    } catch (error) {
        console.error(" Error al eliminar calificación:", error);
        res.status(500).json({ message: 'Error interno al borrar la calificación.' });
    }
};

module.exports = { 
    calificarArticulo, 
    reportarProblema, 
    actualizarQueja,
    eliminarCalificacion
};