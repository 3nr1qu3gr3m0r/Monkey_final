const aiService = require('../service/ai.service'); // Ajusta la ruta a donde guardaste el servicio
require('dotenv').config();

const PYTHON_API = process.env.PYTHON_SERVICE_URL || process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';

const getCatalog = async (req, res) => {
    try {
        const response = await fetch(`${PYTHON_API}/catalog`);
        const data = await response.json();
        res.status(200).json(data);
    } catch (error) {
        console.error("❌ Error conectando con Python:", error.message);
        res.status(500).json({ message: "El microservicio de IA (Python) está apagado o no responde." });
    }
};

const analyzeMessage = async (req, res) => {
    try {
        const response = await fetch(`${PYTHON_API}/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(req.body)
        });
        const data = await response.json();
        res.status(200).json(data);
    } catch (error) {
        console.error("❌ Error conectando con Python:", error.message);
        res.status(500).json({ message: "Error al analizar el mensaje con IA." });
    }
};

// 🚀 NUEVOS CONTROLADORES PARA LAS RESEÑAS
const getRecomendacionesProveedor = async (req, res) => {
    try {
        const result = await aiService.generarRecomendacionesProveedor(req.params.id);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getResumenAdmin = async (req, res) => {
    try {
        const result = await aiService.generarResumenAdmin();
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ¡Exportamos TODO correctamente!
module.exports = { getCatalog, analyzeMessage, getRecomendacionesProveedor, getResumenAdmin };