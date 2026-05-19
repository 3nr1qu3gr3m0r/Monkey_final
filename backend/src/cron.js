const cron = require('node-cron');
const db = require('./config/db');

// Esta regla '0 0 * * *' significa: "Ejecutar todos los días a la medianoche (00:00)"
cron.schedule('0 0 * * *', async () => {
    console.log("🤖 CRON JOB: Revisando disputas vencidas (Regla de los 3 días)...");

    try {
        // 1. Buscamos las disputas que llevan más de 3 días abiertas sin solución
        const [vencidas] = await db.query(`
            SELECT detalle_pedido_id, cliente_id 
            FROM disputas 
            WHERE estado = 'abierta_con_proveedor' 
            AND fecha_creacion < DATE_SUB(NOW(), INTERVAL 3 DAY)
        `);

        if (vencidas.length > 0) {
            console.log(`⚠️ Se encontraron ${vencidas.length} disputas vencidas. Escalando a Administrador...`);

            // 2. Las escalamos automáticamente
            await db.query(`
                UPDATE disputas 
                SET estado = 'escalado_a_admin' 
                WHERE estado = 'abierta_con_proveedor' 
                AND fecha_creacion < DATE_SUB(NOW(), INTERVAL 3 DAY)
            `);

            // 3. Avisamos al administrador y al cliente de cada disputa
            for (const disputa of vencidas) {
                await db.query(`UPDATE detalles_pedido SET estado_operativo = 'escalated' WHERE id = ?`, [disputa.detalle_pedido_id]);
                
                await db.query(`INSERT INTO notificaciones (usuario_id, titulo, mensaje) 
                                VALUES (?, 'Tiempo Agotado', 'El proveedor no resolvió el problema en 3 días. El caso ha sido escalado al Administrador.')`, 
                                [disputa.cliente_id]);
            }
        } else {
            console.log("✅ Todo en orden. No hay disputas vencidas.");
        }

    } catch (error) {
        console.error("🔥 Error en el Cron Job de disputas:", error);
    }
});

console.log("⏱️ Sistema de CRON (Vigilante de 3 Días) inicializado.");