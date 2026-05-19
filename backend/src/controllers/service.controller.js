const serviceService = require('../service/service.service');
const jwt = require('jsonwebtoken');

const postService = async (req, res) => {
    try {
        const id = await serviceService.crearServicio(req.body, req.user.id);
        res.status(201).json({ message: "Servicio publicado con éxito", serviceId: id });
    } catch (error) {
        res.status(500).json({ message: "Error al publicar servicio", error: error.message });
    }
};

const getAllServices = async (req, res) => {
    try {
        let proveedorId = null;
        if (req.query.me === 'true') {
            const authHeader = req.headers['authorization'];
            const token = authHeader && authHeader.split(' ')[1];
            
            if (!token) return res.status(401).json({ message: "No autorizado" });
            
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secreto_super_seguro');
                proveedorId = decoded.id;
            } catch (err) {
                return res.status(403).json({ message: "Token inválido" });
            }
        }

        const servicios = await serviceService.obtenerTodos(proveedorId);
        res.json(servicios);
    } catch (error) {
        console.error("Error al obtener servicios:", error);
        res.status(500).json({ message: "Error al obtener catálogo" });
    }
};

const getServiceById = async (req, res) => {
    try {
        const servicio = await serviceService.obtenerPorId(req.params.id);
        if (!servicio) return res.status(404).json({ message: "Servicio no encontrado" });
        res.status(200).json(servicio);
    } catch (error) {
        res.status(500).json({ message: "Error interno del servidor" });
    }
};

const updateService = async (req, res) => {
    try {
        const exito = await serviceService.actualizarServicio(req.params.id, req.body, req.user.id);
        if (!exito) return res.status(403).json({ message: "No puedes editar este servicio o no existe" });
        res.json({ message: "Servicio actualizado correctamente" });
    } catch (error) {
        res.status(500).json({ message: "Error al actualizar" });
    }
};

const deleteService = async (req, res) => {
    try {
        const exito = await serviceService.eliminarServicio(req.params.id, req.user.id);
        if (!exito) return res.status(403).json({ message: "No puedes eliminar este servicio" });
        res.json({ message: "Servicio desactivado" });
    } catch (error) {
        res.status(500).json({ message: "Error al eliminar" });
    }
};

const togglePausaService = async (req, res) => {
    try {
        const result = await serviceService.togglePausaServicio(req.params.id, req.user);
        if (result.error) return res.status(403).json({ message: result.error });
        res.json({ message: "Estado actualizado correctamente" });
    } catch (error) {
        res.status(500).json({ message: "Error al pausar" });
    }
};

const getHorariosOcupados = async (req, res) => {
    try {
        const ocupados = await serviceService.obtenerHorariosOcupados(req.params.id);
        res.json(ocupados);
    } catch (error) {
        console.error("Error al obtener horarios ocupados:", error);
        res.status(500).json({ message: "Error al obtener disponibilidad" });
    }
};

module.exports = { 
    postService, 
    getAllServices, 
    getServiceById, 
    updateService, 
    deleteService, 
    togglePausaService,
    getHorariosOcupados
};