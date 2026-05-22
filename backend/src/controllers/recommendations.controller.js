const pool = require('../config/db');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Inicializar de forma segura para que no truene el servidor si no hay API Key
const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

const generarRecomendaciones = async (req, res) => {
    try {
        const { proveedor_id } = req.params;

        if (!proveedor_id || isNaN(proveedor_id)) {
            return res.status(400).json({ message: "ID de proveedor inválido" });
        }

        // Consultar las reseñas de los productos/servicios del proveedor
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
             LIMIT 20`,
            [proveedor_id, proveedor_id]
        );

        if (resenas.length === 0) {
            return res.status(200).json({ 
                message: "No hay reseñas suficientes para generar recomendaciones",
                recomendaciones: null,
                total_resenas: 0,
                calificacion_promedio: "0.0"
            });
        }

        // Calcular el promedio matemáticamente en JS
        const calificacionPromedio = (resenas.reduce((sum, r) => sum + r.calificacion, 0) / resenas.length).toFixed(1);

        let recomendacionText = "Para obtener recomendaciones de IA, por favor configura tu GEMINI_API_KEY en el archivo .env.";

        // Intentar conectar con Gemini de forma segura
        if (genAI) {
            try {
                const resumenResenas = resenas.map(r => 
                    `- ${r.tipo_item}: "${r.titulo_item}" | Calificación: ${r.calificacion}/5 | Comentario: "${r.comentario || 'Sin comentario'}"`
                ).join('\n');

                const prompt = `
Eres un consultor de negocios experto en marketplaces. Analiza las siguientes reseñas de clientes y genera recomendaciones específicas y accionables para que el proveedor mejore sus productos y servicios.

RESEÑAS DE CLIENTES:
${resumenResenas}

CALIFICACIÓN PROMEDIO: ${calificacionPromedio}/5

Por favor genera:
1. Un resumen breve del sentimiento general de los clientes
2. Los 3 principales problemas identificados
3. Las 3 recomendaciones más importantes para mejorar
4. Un consejo específico para aumentar la calificación promedio

Responde en español, de forma clara y directa. Usa un tono profesional pero amigable.
                `;

                const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
                const result = await model.generateContent(prompt);
                
                if (result?.response?.candidates?.[0]?.content?.parts?.[0]?.text) {
                    recomendacionText = result.response.candidates[0].content.parts[0].text;
                }
            } catch (aiError) {
                console.error("⚠️ Error directo de la API de Gemini:", aiError.message);
                recomendacionText = `Error al conectar con la IA de Google: ${aiError.message}. Sin embargo, tus reseñas locales cargaron con éxito.`;
            }
        }

        // RETORNAMOS SIEMPRE LOS DATOS (Evita que el frontend reciba error 500)
        return res.status(200).json({
            proveedor_id,
            calificacion_promedio: calificacionPromedio,
            total_resenas: resenas.length,
            recomendaciones: recomendacionText,
            resenas_detalladas: resenas // Se las enviamos al frontend por si las ocupa para renderizar la tabla
        });

    } catch (error) {
        console.error("❌ Error crítico en el controlador:", error);
        res.status(500).json({ message: "Error interno al procesar las valoraciones", error: error.message });
    }
};

module.exports = { generarRecomendaciones };