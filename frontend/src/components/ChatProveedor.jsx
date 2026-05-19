import React, { useState, useEffect, useRef } from 'react';
import { Box, Container, Paper, Typography, Avatar, IconButton, TextField, Button, Fade, Alert, CircularProgress, Stack, Chip } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ChatIcon from '@mui/icons-material/Chat';
import SecurityIcon from '@mui/icons-material/Security';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import GavelIcon from '@mui/icons-material/Gavel';
import HandshakeIcon from '@mui/icons-material/Handshake';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../config/api';
import { useAlert } from '../context/AlertContext';

function ChatProveedor() {
  const { showAlert, showConfirm } = useAlert();
  const location = useLocation();
  const navigate = useNavigate();
  
  const item = location.state?.item || {};
  const vendor = item.vendor || 'Proveedor';
  const itemName = item.nombre || 'Producto/Servicio';
  const detalle_pedido_id = item.id;
  
  // 🚀 SABER SI EL QUE MIRA LA PANTALLA ES EL PROVEEDOR O EL CLIENTE
  // (Ajusta esto según cómo guardes tu usuario logueado, ej. useContext)
  const userString = localStorage.getItem('user');
  const usuarioLogueado = userString ? JSON.parse(userString) : { rol: 'cliente' };
  const soyProveedor = usuarioLogueado.rol === 'proveedor';
  const soyAdmin = usuarioLogueado.rol === 'admin';

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isFirstMessage, setIsFirstMessage] = useState(true); 
  const [cargando, setCargando] = useState(true);
  const [estadoDisputa, setEstadoDisputa] = useState(item.complaint || 'abierta_con_proveedor'); // Estado local de la disputa
  const [procesandoBoton, setProcesandoBoton] = useState(false);

  const messagesEndRef = useRef(null);

  const fetchMensajes = async () => {
    if (!detalle_pedido_id) return;
    try {
      const res = await api.get(`/chat/${detalle_pedido_id}`);
      const data = res.data;
      
      if (data && data.length > 0) {
        setIsFirstMessage(false);
        const formateados = data.map(m => {
          let tipoSender = 'vendor';
          if (m.remitente_rol === 'admin') tipoSender = 'admin';
          if (m.remitente_rol === 'cliente') tipoSender = 'me';
          // Si yo soy el proveedor viendo la pantalla, invierto la vista de 'me' y 'vendor'
          if (soyProveedor) {
              tipoSender = m.remitente_rol === 'proveedor' ? 'me' : (m.remitente_rol === 'admin' ? 'admin' : 'vendor');
          }

          return {
            id: m.id,
            sender: tipoSender,
            text: m.mensaje,
            nombre: m.remitente_nombre,
            time: new Date(m.fecha_envio).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
          };
        });
        setMessages(formateados);
      }
    } catch (error) {
      console.error("Error al cargar el historial del chat:", error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    fetchMensajes();
    const intervalo = setInterval(fetchMensajes, 3000); 
    return () => clearInterval(intervalo); 
  }, [detalle_pedido_id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;
    
    const textoEnviado = inputText;
    setInputText('');

    setMessages(prev => [...prev, { 
        id: Date.now(), 
        sender: 'me', 
        text: textoEnviado, 
        time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) 
    }]);

    try {
        if (isFirstMessage && !soyProveedor) {
            setIsFirstMessage(false);
            await api.post('/cliente/reportar', {
                detalle_pedido_id: detalle_pedido_id,
                motivo_queja: textoEnviado,
                imagenes: [] 
            });
        } else {
            await api.post(`/chat/${detalle_pedido_id}`, { mensaje: textoEnviado });
        }
        fetchMensajes(); 
    } catch (error) {
        showAlert("Hubo un error al enviar tu mensaje.", "error");
    }
  };

  // 🚀 FUNCIONES DE LOS BOTONES DE RESOLUCIÓN
  const handleProponerSolucion = async () => {
      if(!(await showConfirm("¿Seguro que deseas proponer esto como la solución final?"))) return;
      setProcesandoBoton(true);
      try {
          await api.post('/chat/resolucion/proponer', { detalle_pedido_id });
          setEstadoDisputa('esperando_confirmacion_cliente');
          fetchMensajes();
      } catch (error) {
          showAlert("Error al proponer solución", "error");
      } finally { setProcesandoBoton(false); }
  };

  const handleResponderSolucion = async (aceptada) => {
      const msg = aceptada 
        ? "¿Confirmas que el problema está resuelto? Se cerrará el caso." 
        : "¿Seguro que deseas rechazar y escalar el caso al Administrador?";
      if(!(await showConfirm(msg))) return;
      
      setProcesandoBoton(true);
      try {
          await api.post('/chat/resolucion/responder', { detalle_pedido_id, aceptada });
          setEstadoDisputa(aceptada ? 'resuelto' : 'escalado_a_admin');
          fetchMensajes();
      } catch (error) {
          showAlert("Error al enviar tu respuesta", "error");
      } finally { setProcesandoBoton(false); }
  };

  // 🚀 RENDERIZADO CONDICIONAL DEL PANEL DE ESTADO
  const renderPanelResolucion = () => {
      if (estadoDisputa === 'resuelto') {
          return (
              <Alert severity="success" icon={<CheckCircleIcon />} sx={{ borderRadius: 0, '& .MuiAlert-message': { width: '100%', textAlign: 'center', fontWeight: 800 } }}>
                  Este caso ha sido resuelto y cerrado exitosamente.
              </Alert>
          );
      }
      if (estadoDisputa === 'escalado_a_admin') {
          return (
              <Alert severity="error" icon={<GavelIcon />} sx={{ borderRadius: 0, '& .MuiAlert-message': { width: '100%', textAlign: 'center', fontWeight: 800 } }}>
                  Este caso fue escalado. Un Administrador de MonkeyMarket lo revisará pronto.
              </Alert>
          );
      }
      if (estadoDisputa === 'esperando_confirmacion_cliente') {
          return (
              <Alert severity="info" icon={<HandshakeIcon />} sx={{ borderRadius: 0, alignItems: 'center' }} action={
                  !soyProveedor && !soyAdmin ? (
                      <Stack direction="row" spacing={1}>
                          <Button size="small" color="success" variant="contained" disabled={procesandoBoton} onClick={() => handleResponderSolucion(true)} sx={{ fontWeight: 800, textTransform: 'none' }}>Sí, Resuelto</Button>
                          <Button size="small" color="error" variant="outlined" disabled={procesandoBoton} onClick={() => handleResponderSolucion(false)} sx={{ fontWeight: 800, textTransform: 'none', bgcolor: '#fff' }}>No, Escalar</Button>
                      </Stack>
                  ) : (
                      <Chip label="Esperando respuesta del cliente" size="small" color="info" />
                  )
              }>
                  <Typography variant="body2" fontWeight={700}>El proveedor propuso una solución.</Typography>
                  {!soyProveedor && !soyAdmin && <Typography variant="caption">¿Estás de acuerdo y consideras el caso cerrado?</Typography>}
              </Alert>
          );
      }
      // Estado: abierta_con_proveedor
      if (soyProveedor) {
          return (
              <Alert severity="warning" sx={{ borderRadius: 0, alignItems: 'center' }} action={
                  <Button size="small" color="primary" variant="contained" disabled={procesandoBoton} onClick={handleProponerSolucion} sx={{ fontWeight: 800, textTransform: 'none' }}>
                      Proponer Solución al Cliente
                  </Button>
              }>
                  Tienes 3 días para llegar a un acuerdo con el cliente.
              </Alert>
          );
      }
      return null;
  };

  return (
    <Container maxWidth="md" sx={{ py: 3, height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column' }}>
      <Paper elevation={0} sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRadius: 6, border: '1px solid #e2e8f0', bgcolor: '#f8fafc' }}>
        
        {/* Chat Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', p: 2, bgcolor: 'primary.main', color: 'primary.contrastText', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', zIndex: 10 }}>
          <IconButton onClick={() => navigate(-1)} sx={{ color: 'white', mr: 1 }}>
            <ArrowBackIcon />
          </IconButton>
          <Avatar sx={{ bgcolor: 'secondary.main', border: '2px solid white', fontWeight: 'bold' }}>
            {vendor.charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ ml: 2, flex: 1 }}>
            <Typography variant="subtitle1" fontWeight={800} sx={{ lineHeight: 1.2 }}>
                {soyProveedor ? 'Chat con Cliente' : vendor}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>Soporte: {itemName}</Typography>
          </Box>
        </Box>

        {/* PANEL DE RESOLUCIÓN DINÁMICO */}
        {!isFirstMessage && renderPanelResolucion()}

        {/* Chat Messages */}
        <Box sx={{ flex: 1, overflowY: 'auto', p: 3, display: 'flex', flexDirection: 'column', gap: 2, '&::-webkit-scrollbar': { width: '6px' }, '&::-webkit-scrollbar-thumb': { backgroundColor: '#cbd5e1', borderRadius: '10px' } }}>
          
          {cargando ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}><CircularProgress /></Box>
          ) : (
            <>
              <Box sx={{ textAlign: 'center', mb: 2 }}>
                <Typography variant="caption" sx={{ bgcolor: '#e2e8f0', px: 2, py: 0.5, borderRadius: 10, color: '#64748b', fontWeight: 600 }}>
                  Inicio de la conversación
                </Typography>
              </Box>

              {isFirstMessage && !soyProveedor && (
                <Alert severity="warning" icon={<ChatIcon />} sx={{ borderRadius: 3, mb: 2 }}>
                    El primer paso para solucionar el problema con **{itemName}** es escribirle un mensaje directo al proveedor. Sé lo más claro posible.
                </Alert>
              )}
              
              {messages.map((msg) => {
                const isMe = msg.sender === 'me';
                const isAdmin = msg.sender === 'admin';

                return (
                  <Fade in={true} key={msg.id} timeout={500}>
                    <Box sx={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '80%', position: 'relative' }}>
                      {isAdmin && (
                         <Typography variant="caption" color="secondary.main" fontWeight={800} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                            <SecurityIcon sx={{ fontSize: 14 }} /> Soporte MonkeyMarket
                         </Typography>
                      )}
                      <Box sx={{
                        p: 2, 
                        bgcolor: isMe ? 'primary.main' : (isAdmin ? 'secondary.light' : '#ffffff'), 
                        color: isMe || isAdmin ? '#ffffff' : '#1e293b',
                        borderRadius: 4, 
                        borderBottomRightRadius: isMe ? 4 : 16, 
                        borderBottomLeftRadius: isMe ? 16 : 4,
                        boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
                        border: isMe || isAdmin ? 'none' : '1px solid #e2e8f0',
                      }}>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>{msg.text}</Typography>
                      </Box>
                      <Typography variant="caption" sx={{ color: '#94a3b8', mt: 0.5, px: 1, display: 'block', textAlign: isMe ? 'right' : 'left' }}>
                        {msg.time}
                      </Typography>
                    </Box>
                  </Fade>
                );
              })}
            </>
          )}
          <div ref={messagesEndRef} />
        </Box>

        {/* Chat Input (Se oculta si el caso ya está cerrado o escalado) */}
        {(estadoDisputa !== 'resuelto' && estadoDisputa !== 'escalado_a_admin') && (
            <Box component="form" onSubmit={handleSend} sx={{ p: 2, bgcolor: '#ffffff', borderTop: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 2 }}>
            <TextField 
                fullWidth 
                placeholder="Escribe tu mensaje aquí..." 
                variant="outlined" 
                size="small"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                sx={{ 
                    '& .MuiOutlinedInput-root': { 
                        borderRadius: 50, 
                        bgcolor: '#f8fafc',
                        '& fieldset': { border: 'none' },
                        '&:hover fieldset': { border: 'none' },
                        '&.Mui-focused fieldset': { border: 'none' }
                    } 
                }}
            />
            <Button 
                type="submit" 
                variant="contained" 
                disabled={!inputText.trim()}
                sx={{ 
                    minWidth: 50, width: 50, height: 50, borderRadius: '50%', p: 0, 
                    boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)' 
                }}
            >
                <SendRoundedIcon sx={{ ml: 0.5 }} />
            </Button>
            </Box>
        )}
      </Paper>
    </Container>
  );
}

export default ChatProveedor;