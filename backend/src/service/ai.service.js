const db = require('../config/db'); // Asegúrate de que esta ruta a tu BD sea correcta
require('dotenv').config();

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || process.env.PYTHON_SERVICE_URL || 'http://127.0.0.1:8000';

/**
 * LÓGICA ORIGINAL DEL EQUIPO DE IA
 */
const consultarMotorIA = async (mensajeUsuario, historial = []) => {
    try {
        const response = await fetch(`${AI_SERVICE_URL}/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: mensajeUsuario, history: historial })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Error en el servicio de IA Python');
        }

        const data = await response.json();
        return { action: data.action, content: data.content, entities: data.entities };
    } catch (error) {
        console.error("Error al conectar con el microservicio de IA:", error.message);
        throw error;
    }
};

/**
 * PARTE NUEVA: GESTIÓN DE RESEÑAS (PERSONA A)
 */
const generarRecomendacionesProveedor = async (proveedorId) => {
    try {
        const [resenas] = await db.query(`
            SELECT v.comentario, v.calificacion, p.titulo as item_nombre
            FROM valoraciones v
            JOIN detalles_pedido dp ON v.detalle_pedido_id = dp.id
            LEFT JOIN productos p ON dp.producto_id = p.id
            LEFT JOIN servicios s ON dp.servicio_id = s.id
            WHERE p.proveedor_id = ? OR s.proveedor_id = ?
        `, [proveedorId, proveedorId]);

        if (resenas.length === 0) return { content: "Aún no tienes reseñas suficientes para generar un análisis." };

        const promptParaIA = `Actúa como un consultor experto en negocios. Analiza las siguientes reseñas de mis clientes en MonkeyMarket y dime 3 recomendaciones específicas y accionables para mejorar mi servicio o producto: ${JSON.stringify(resenas)}`;
        
        return await consultarMotorIA(promptParaIA);
    } catch (error) {
        console.error("Error al generar recomendaciones:", error);
        throw error;
    }
};

const generarResumenAdmin = async () => {
    try {
        const [resenas] = await db.query(`
            SELECT v.comentario, v.calificacion, COALESCE(p.titulo, s.titulo) as nombre_item
            FROM valoraciones v
            JOIN detalles_pedido dp ON v.detalle_pedido_id = dp.id
            LEFT JOIN productos p ON dp.producto_id = p.id
            LEFT JOIN servicios s ON dp.servicio_id = s.id
            ORDER BY v.fecha_creacion DESC LIMIT 50
        `);

        if (resenas.length === 0) return { content: "No hay reseñas registradas en el sistema para resumir." };

        const promptParaIA = `Actúa como el Administrador General de MonkeyMarket. Haz un resumen ejecutivo destacando qué le gusta a la gente y los problemas recurrentes basados en estas reseñas: ${JSON.stringify(resenas)}`;
        
        return await consultarMotorIA(promptParaIA);
    } catch (error) {
        console.error("Error al generar resumen admin:", error);
        throw error;
    }
};

module.exports = { consultarMotorIA, generarRecomendacionesProveedor, generarResumenAdmin };