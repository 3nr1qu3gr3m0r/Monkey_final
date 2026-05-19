const pool = require('../config/db');

const verBilletera = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || isNaN(id)) {
            return res.status(400).json({ message: "ID de proveedor inválido" });
        }

        const [billetera] = await pool.query(
            'SELECT * FROM billeteras WHERE proveedor_id = ?',
            [id]
        );

        if (billetera.length === 0) {
            return res.status(404).json({ message: "Billetera no encontrada" });
        }

        res.status(200).json(billetera[0]);
    } catch (error) {
        console.error("Error al ver billetera:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
};

const verComision = async (req, res) => {
    try {
        const [config] = await pool.query(
            'SELECT porcentaje_comision FROM configuracion_global LIMIT 1'
        );

        if (config.length === 0) {
            return res.status(404).json({ message: "Configuración no encontrada" });
        }

        const porcentaje = config[0].porcentaje_comision;
        res.status(200).json({ 
            porcentaje_comision: porcentaje,
            ejemplo: {
                precio_venta: 1000,
                comision: (1000 * porcentaje / 100).toFixed(2),
                proveedor_recibe: (1000 - (1000 * porcentaje / 100)).toFixed(2)
            }
        });
    } catch (error) {
        console.error("Error al ver comisión:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
};

const solicitarRetiro = async (req, res) => {
    try {
        const { proveedor_id, monto, cuenta_destino } = req.body;

        if (!proveedor_id) {
            return res.status(400).json({ message: "proveedor_id es obligatorio" });
        }
        if (!monto || monto <= 0) {
            return res.status(400).json({ message: "El monto debe ser mayor a 0" });
        }
        if (!cuenta_destino || cuenta_destino.trim() === '') {
            return res.status(400).json({ message: "La cuenta destino es obligatoria" });
        }

        const [billetera] = await pool.query(
            'SELECT saldo_actual FROM billeteras WHERE proveedor_id = ?',
            [proveedor_id]
        );

        if (billetera.length === 0) {
            return res.status(404).json({ message: "Billetera no encontrada" });
        }

        if (billetera[0].saldo_actual < monto) {
            return res.status(400).json({ 
                message: "Saldo insuficiente",
                saldo_disponible: billetera[0].saldo_actual
            });
        }

        const [resultado] = await pool.query(
            'INSERT INTO retiros (proveedor_id, monto, cuenta_destino) VALUES (?, ?, ?)',
            [proveedor_id, monto, cuenta_destino]
        );

        await pool.query(
            'UPDATE billeteras SET saldo_actual = saldo_actual - ? WHERE proveedor_id = ?',
            [monto, proveedor_id]
        );

        res.status(201).json({ 
            message: "Retiro solicitado correctamente",
            retiroId: resultado.insertId,
            data: { proveedor_id, monto, cuenta_destino }
        });
    } catch (error) {
        console.error("Error al solicitar retiro:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
};

const verRetiros = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || isNaN(id)) {
            return res.status(400).json({ message: "ID de proveedor inválido" });
        }

        const [retiros] = await pool.query(
            `SELECT * FROM retiros 
             WHERE proveedor_id = ? 
             ORDER BY fecha_solicitud DESC`,
            [id]
        );

        res.status(200).json(retiros);
    } catch (error) {
        console.error("Error al ver retiros:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
};

module.exports = { verBilletera, verComision, solicitarRetiro, verRetiros };