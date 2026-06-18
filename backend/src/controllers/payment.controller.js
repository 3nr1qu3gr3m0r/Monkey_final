const { MercadoPagoConfig, Preference } = require('mercadopago');

const createPreference = async (req, res) => {
    try {
        const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
        const { carrito, user, direccion_envio } = req.body;

        if (!carrito || carrito.length === 0) {
            return res.status(400).json({ message: "El carrito está vacío" });
        }

        // 🚀 1. AGRUPAR EL CARRITO (Soluciona el problema de que solo cobra 1)
        const carritoAgrupadoMap = {};
        for (const item of carrito) {
            const uniqueId = item.id; // ej: prod_1 o serv_1-2026-04-20
            if (!carritoAgrupadoMap[uniqueId]) {
                carritoAgrupadoMap[uniqueId] = { ...item, cantidad: Number(item.cantidad) || 1 };
            } else {
                carritoAgrupadoMap[uniqueId].cantidad += Number(item.cantidad) || 1;
            }
        }
        const carritoAgrupado = Object.values(carritoAgrupadoMap);

        // 🚀 2. MAPEAR PARA MERCADO PAGO (Ahora llevan la cantidad correcta sumada)
        const items = carritoAgrupado.map(item => ({
            id: item.id.toString(), 
            title: item.nombre.substring(0, 250), 
            description: item.tipo === 'Servicio' ? `Reserva: ${item.fechaReserva || 'Agendado'}` : 'Producto MonkeyMarket',
            unit_price: Number(item.precio), 
            quantity: Number(item.cantidad),
            currency_id: 'MXN'
        }));

        const subtotal = items.reduce((acc, item) => acc + (item.unit_price * item.quantity), 0);
        const costoEnvio = subtotal > 0 ? 150 : 0;
        if (costoEnvio > 0) {
            items.push({ id: 'ENVIO', title: 'Costo de Envío', unit_price: Number(costoEnvio), quantity: 1, currency_id: 'MXN' });
        }

        // 🚀 3. COPIA DE SEGURIDAD PARA EL WEBHOOK
        const metadataItems = items.map(i => ({ id: i.id, q: i.quantity, p: i.unit_price }));

        const clienteSeguro = user || req.user || {};
        const emailSeguro = (clienteSeguro.correo && clienteSeguro.correo.includes('@')) ? clienteSeguro.correo : 'cliente@monkeymarket.com';

        const frontendUrl = process.env.FRONTEND_URL || "https://frontend-production-6ca5.up.railway.app";

        const preference = new Preference(client);
        const response = await preference.create({
            body: {
                items: items,
                metadata: {
                    cart_items: metadataItems // <--- MP nos devolverá esto intacto en el Webhook
                },
                payer: { name: clienteSeguro.nombre || "Cliente", email: emailSeguro },
                back_urls: {
                    success: `${frontendUrl}/TicketCompra`,
                    failure: `${frontendUrl}/checkout`,
                    pending: `${frontendUrl}/checkout`
                },
                auto_return: "approved",
                notification_url: "https://backend-production-c09d.up.railway.app/api/payments/webhook",
                external_reference: JSON.stringify({
                    userId: clienteSeguro.id || req.user.id,
                    direccionId: direccion_envio ? direccion_envio.id : null
                })
            }
        });

        res.status(200).json({ id: response.id });
    } catch (error) {
        console.error("🔥 Error MP:", error);
        res.status(500).json({ message: "Error al generar pago" });
    }
};

module.exports = { createPreference };