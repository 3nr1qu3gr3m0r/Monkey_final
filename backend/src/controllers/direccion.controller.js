const direccionService = require('../service/direccion.service');

const getDirecciones = async (req, res) => {
    try {
        const direcciones = await direccionService.obtenerPorUsuario(req.user.id);
        res.status(200).json(direcciones);
    } catch (error) {
        console.error("Error al obtener direcciones:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
};

const createDireccion = async (req, res) => {
    try {
        const usuario_id = req.user.id;
        
        // Leemos EXACTAMENTE los nombres que manda Direcciones.jsx
        const { alias, calle_y_numero, colonia, ciudad, codigo_postal, indicaciones_extra } = req.body;

        if (!calle_y_numero || !colonia || !ciudad || !codigo_postal) {
            return res.status(400).json({ message: "Faltan datos obligatorios para la dirección." });
        }

        const nuevaDireccionId = await direccionService.crear(
            usuario_id, 
            alias || 'Casa', 
            calle_y_numero, 
            colonia, 
            ciudad, 
            codigo_postal, 
            indicaciones_extra || null
        );

        res.status(201).json({ message: "Dirección creada", id: nuevaDireccionId });
    } catch (error) {
        console.error("Error al crear dirección:", error);
        res.status(500).json({ message: "Error al guardar la dirección" });
    }
};

const updateDireccion = async (req, res) => {
    try {
        const { id } = req.params;
        const usuario_id = req.user.id;
        const { alias, calle_y_numero, colonia, ciudad, codigo_postal, indicaciones_extra } = req.body;

        const exito = await direccionService.actualizar(
            id, usuario_id, alias, calle_y_numero, colonia, ciudad, codigo_postal, indicaciones_extra
        );

        if (!exito) {
            return res.status(404).json({ message: "Dirección no encontrada o no tienes permiso" });
        }

        res.status(200).json({ message: "Dirección actualizada" });
    } catch (error) {
        console.error("Error al actualizar dirección:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
};

const deleteDireccion = async (req, res) => {
    try {
        const exito = await direccionService.eliminar(req.params.id, req.user.id);
        if (!exito) return res.status(404).json({ message: "Dirección no encontrada" });
        res.status(200).json({ message: "Dirección eliminada" });
    } catch (error) {
        console.error("Error al eliminar dirección:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
};

module.exports = { getDirecciones, createDireccion, updateDireccion, deleteDireccion };