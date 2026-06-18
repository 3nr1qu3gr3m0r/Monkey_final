const { MercadoPagoConfig, Payment } = require('mercadopago');
const db = require('../config/db');

const receiveWebhook = async (req, res) => {
    const paymentId = req.query['data.id'] || req.query.id || req.body?.data?.id;

    if (!paymentId) return res.status(200).send("OK"); 

    try {
        const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
        const payment = new Payment(client);
        const paymentData = await payment.get({ id: paymentId });

        if (paymentData.status === 'approved') {
            const [existing] = await db.query('SELECT id FROM pedidos WHERE external_payment_id = ?', [paymentId.toString()]);
            if (existing.length > 0) return res.status(200).send("OK");

            const { userId, direccionId } = JSON.parse(paymentData.external_reference);

            let direccionFinal = "Dirección no encontrada";
            if (direccionId) {
                const [dirRows] = await db.query('SELECT * FROM direcciones WHERE id = ?', [direccionId]);
                if (dirRows.length > 0) {
                    const d = dirRows[0];
                    direccionFinal = `${d.calle_y_numero}, Col. ${d.colonia}, ${d.ciudad}. CP: ${d.codigo_postal}`;
                }
            }

            const [orderResult] = await db.query(
                `INSERT INTO pedidos (cliente_id, monto_total, direccion_envio, estado, external_payment_id) 
                 VALUES (?, ?, ?, 'completado', ?)`,
                [userId, paymentData.transaction_amount, direccionFinal, paymentId.toString()]
            );
            const pedido_id = orderResult.insertId;

            // Notificación para el CLIENTE
            await db.query(
                'INSERT INTO notificaciones (usuario_id, titulo, mensaje) VALUES (?, ?, ?)',
                [userId, '¡Pago Confirmado! 🎉', `Hemos recibido tu pago por $${paymentData.transaction_amount}. Tu pedido está en proceso.`]
            );

            // 🚀 LEEMOS EL METADATA BLINDADO
            const items = paymentData.metadata?.cart_items || paymentData.additional_info?.items || [];
            console.log("🛒 PROCESANDO ITEMS DEL WEBHOOK:", items.length);

            for (const item of items) {
                if (item.id === 'ENVIO') continue;

                const esProducto = String(item.id).startsWith('prod_');
                const esServicio = String(item.id).startsWith('serv_');
                if (!esProducto && !esServicio) continue; 

                const idRaw = String(item.id).split('_')[1];
                const idLimpio = parseInt(idRaw, 10);

                let fecha_agendada = null;
                if (idRaw.includes('-')) {
                    let fechaSucia = idRaw.substring(idRaw.indexOf('-') + 1); 
                    const soloFecha = fechaSucia.substring(0, 10); 
                    const soloHora = fechaSucia.substring(11, 16); 
                    fecha_agendada = `${soloFecha} ${soloHora}:00`; 
                }

                const producto_id = esProducto ? idLimpio : null;
                const servicio_id = esServicio ? idLimpio : null; 
                
                const qty = Number(item.q || item.quantity || 1);
                const price = Number(item.p || item.unit_price || 0);
                const comision = price * 0.10;

                // 1. Guardamos el detalle del pedido
                await db.query(
                    `INSERT INTO detalles_pedido 
                    (pedido_id, producto_id, servicio_id, cantidad, fecha_agendada, precio_unitario_historico, comision_historica, estado_operativo) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, 'pendiente')`,
                    [
                        pedido_id, 
                        producto_id, 
                        servicio_id, 
                        qty, 
                        fecha_agendada, 
                        price, 
                        comision
                    ]
                );

                // 🚀 AQUÍ ESTÁ EL FIX: LÓGICA PARA NOTIFICAR AL PROVEEDOR
                try {
                    let proveedor_id = null;
                    let titulo_item = "";

                    // Buscamos quién es el dueño del producto
                    if (esProducto && producto_id) {
                        const [prodRows] = await db.query('SELECT proveedor_id, titulo FROM productos WHERE id = ?', [producto_id]);
                        if (prodRows.length > 0) {
                            // Usamos fallback por si en tu DB se llama usuario_id
                            proveedor_id = prodRows[0].proveedor_id || prodRows[0].usuario_id; 
                            titulo_item = prodRows[0].titulo;
                        }
                    } 
                    // O buscamos quién es el dueño del servicio
                    else if (esServicio && servicio_id) {
                        const [servRows] = await db.query('SELECT proveedor_id, titulo FROM servicios WHERE id = ?', [servicio_id]);
                        if (servRows.length > 0) {
                            proveedor_id = servRows[0].proveedor_id || servRows[0].usuario_id;
                            titulo_item = servRows[0].titulo;
                        }
                    }

                    // Si encontramos al dueño, le disparamos su notificación
                    if (proveedor_id) {
                        await db.query(
                            'INSERT INTO notificaciones (usuario_id, titulo, mensaje) VALUES (?, ?, ?)',
                            [proveedor_id, '¡Nueva Venta! 💰', `¡Felicidades! Acabas de vender ${qty} unidad(es) de "${titulo_item}". Revisa tu panel para preparar el pedido.`]
                        );
                        console.log(`✅ Notificación enviada al proveedor ${proveedor_id} por su venta.`);
                    }
                } catch (errorNotif) {
                    // Si falla la notificación, no queremos que truene todo el webhook
                    console.error("⚠️ Error aislando la notificación al proveedor:", errorNotif.message);
                }
            }
        }
        res.status(200).send("OK");
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            console.log("Webhook duplicado interceptado.");
            return res.status(200).send("OK");
        }
        if (error.status === 404) {
            return res.status(200).send("OK");
        }
        console.error("🔥 Error Webhook:", error);
        res.status(500).send("Error");
    }
};

module.exports = { receiveWebhook };