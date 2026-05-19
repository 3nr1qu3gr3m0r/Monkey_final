const chatService = require('../service/chat.service');
const clientService = require('../service/client.service');

const obtenerMensajes = async (req, res) => {
    const { detalle_pedido_id } = req.params;
    
    try {
        const mensajes = await chatService.obtenerMensajesPorDetalle(detalle_pedido_id);
        res.status(200).json(mensajes);
    } catch (error) {
        console.error(" Error al obtener chat:", error);
        res.status(500).json({ message: "Error al cargar los mensajes" });
    }
};

const enviarMensaje = async (req, res) => {
    const { detalle_pedido_id } = req.params;
    const { mensaje } = req.body;
    
    // Extraemos quién lo manda gracias al middleware de autenticación
    const remitente_id = req.user.id; 

    if (!mensaje || !mensaje.trim()) {
        return res.status(400).json({ message: "El mensaje no puede estar vacío" });
    }

    try {
        const insertId = await chatService.guardarMensaje(detalle_pedido_id, remitente_id, mensaje);
        
        res.status(201).json({ 
            message: "Mensaje enviado", 
            mensaje_id: insertId 
        });
    } catch (error) {
        console.error(" Error al enviar mensaje:", error);
        res.status(500).json({ message: "Error al enviar el mensaje" });
    }
};

const proponerSolucion = async (req, res) => {
    try {
        const { detalle_pedido_id } = req.body;
        await clientService.proponerSolucion(detalle_pedido_id);
        res.status(200).json({ message: "Solución propuesta enviada al cliente." });
    } catch (error) {
        res.status(500).json({ message: "Error al proponer solución." });
    }
};

const responderSolucion = async (req, res) => {
    try {
        const { detalle_pedido_id, aceptada } = req.body;
        await clientService.responderSolucion(detalle_pedido_id, aceptada);
        res.status(200).json({ message: aceptada ? "Disputa resuelta" : "Disputa escalada al Admin" });
    } catch (error) {
        res.status(500).json({ message: "Error al responder la solución." });
    }
};

module.exports = { 
    obtenerMensajes, 
    enviarMensaje,
    proponerSolucion, 
    responderSolucion 
};