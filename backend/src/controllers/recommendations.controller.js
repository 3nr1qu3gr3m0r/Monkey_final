const pool = require('../config/db');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const generarRecomendaciones = async (req, res) => {
    try {
        const { proveedor_id } = req.params;

        if (!proveedor_id || isNaN(proveedor_id)) {
            return res.status(400).json({ message: "ID de proveedor inválido" });
        }

        const [resenas] = await pool.query(
            `SELECT 
                v.calificacion,
                v.comentario,
                COALESCE(p.titulo, s.titulo) AS titulo_item,
                CASE 
                    WHEN dp.producto_id IS NOT NULL THEN 'producto'
                    ELSE 'servicio'
                END AS tipo_item
             FROM valoraciones v
             JOIN detalles_pedido dp ON dp.id = v.detalle_pedido_id
             LEFT JOIN productos p ON p.id = dp.producto_id
             LEFT JOIN servicios s ON s.id = dp.servicio_id
             WHERE p.proveedor_id = ? OR s.proveedor_id = ?
             ORDER BY v.fecha_creacion DESC
             LIMIT 20`,
            [proveedor_id, proveedor_id]
        );

        if (resenas.length === 0) {
            return res.status(200).json({ 
                message: "No hay resenas suficientes para generar recomendaciones",
                recomendaciones: null
            });
        }

        const resumenResenas = resenas.map(r => 
            `- ${r.tipo_item}: "${r.titulo_item}" | Calificacion: ${r.calificacion}/5 | Comentario: "${r.comentario || 'Sin comentario'}"`
        ).join('\n');

        const calificacionPromedio = (resenas.reduce((sum, r) => sum + r.calificacion, 0) / resenas.length).toFixed(1);

        const prompt = `
Eres un consultor de negocios experto en marketplaces. Analiza las siguientes resenas de clientes y genera recomendaciones especificas y accionables para que el proveedor mejore sus productos y servicios.

RESENAS DE CLIENTES:
${resumenResenas}

CALIFICACION PROMEDIO: ${calificacionPromedio}/5

Por favor genera:
1. Un resumen breve del sentimiento general de los clientes
2. Los 3 principales problemas identificados
3. Las 3 recomendaciones mas importantes para mejorar
4. Un consejo especifico para aumentar la calificacion promedio

Responde en espanol, de forma clara y directa. Usa un tono profesional pero amigable.
        `;

        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent(prompt);
        const recomendacion = result.response.text();

        res.status(200).json({
            proveedor_id,
            calificacion_promedio: calificacionPromedio,
            total_resenas: resenas.length,
            recomendaciones: recomendacion
        });

    } catch (error) {
        console.error("Error al generar recomendaciones:", error);
        res.status(500).json({ message: "Error al generar recomendaciones" });
    }
};

module.exports = { generarRecomendaciones };
