const productService = require('../service/product.service');
const jwt = require('jsonwebtoken');

const getProducts = async (req, res) => {
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

        const productos = await productService.obtenerTodos(proveedorId);
        res.status(200).json(productos);
    } catch (error) {
        console.error("Error al obtener productos:", error);
        res.status(500).json({ message: "Error al obtener los productos" });
    }
};

const getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const producto = await productService.obtenerPorId(id);
        
        if (!producto) {
            return res.status(404).json({ message: "Producto no encontrado" });
        }
        res.status(200).json(producto);
    } catch (error) {
        console.error("Error al obtener el producto:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
};

const createProduct = async (req, res) => {
    try {
        const { titulo, descripcion, precio, stock, imagenes, categoria } = req.body;
        const proveedor_id = req.user.id; 

        if (!titulo || !precio) {
            return res.status(400).json({ message: "El título y precio son obligatorios" });
        }

        const nuevoId = await productService.crear(proveedor_id, titulo, descripcion, precio, stock, imagenes, categoria);
        
        res.status(201).json({ 
            message: "Producto creado exitosamente", 
            productoId: nuevoId 
        });
    } catch (error) {
        console.error("Error al crear producto:", error);
        res.status(500).json({ message: "Error al crear el producto" });
    }
};

const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { titulo, descripcion, precio, stock, imagenes, categoria } = req.body;

        const actualizado = await productService.actualizar(id, titulo, descripcion, precio, stock, imagenes, categoria);
        
        if (!actualizado) {
            return res.status(404).json({ message: "Producto no encontrado o no se pudo actualizar" });
        }

        res.status(200).json({ message: "Producto actualizado correctamente" });
    } catch (error) {
        console.error("Error al actualizar producto:", error);
        res.status(500).json({ message: "Error al actualizar el producto" });
    }
};

const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const eliminado = await productService.eliminar(id);
        
        if (!eliminado) {
            return res.status(404).json({ message: "Producto no encontrado" });
        }

        res.status(200).json({ message: "Producto eliminado correctamente" });
    } catch (error) {
        console.error("Error al eliminar producto:", error);
        res.status(500).json({ message: "Error al eliminar el producto" });
    }
};

const togglePausaProduct = async (req, res) => {
    try {
        const result = await productService.togglePausa(req.params.id, req.user);
        
        if (result.error) return res.status(403).json({ message: result.error });
        res.status(200).json({ message: "Estado actualizado correctamente" });
    } catch (error) {
        res.status(500).json({ message: "Error al pausar el producto" });
    }
};

module.exports = {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    togglePausaProduct
};