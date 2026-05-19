const pool = require('../config/db');

const buscar = async (req, res) => {
    try {
        const { q } = req.query;

        // Si no mandan nada, devolver lista vacía
        if (!q || q.trim() === '') {
            return res.status(200).json([]);
        }

        const termino = `%${q}%`;

        // Buscar en productos
        const [productos] = await pool.query(
            `SELECT id, titulo, descripcion, precio, imagenes, 'producto' AS tipo
             FROM productos 
             WHERE esta_activo = true 
             AND (titulo LIKE ? OR descripcion LIKE ?)`,
            [termino, termino]
        );

        // Buscar en servicios
        const [servicios] = await pool.query(
            `SELECT id, titulo, descripcion, precio, imagenes, 'servicio' AS tipo
             FROM servicios 
             WHERE esta_activo = true 
             AND (titulo LIKE ? OR descripcion LIKE ?)`,
            [termino, termino]
        );

        // Combinar y devolver
        const resultados = [...productos, ...servicios];
        res.status(200).json(resultados);

    } catch (error) {
        console.error("Error en búsqueda:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
};

module.exports = { buscar };