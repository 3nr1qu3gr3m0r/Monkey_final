import React, { useState } from 'react';
import {
  Box, Typography, Button, IconButton, Card,
  Divider, Stack, List, ListItem, ListItemText, ListItemAvatar,
  Avatar, Container, Paper, Snackbar, Alert, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import EditCalendarIcon from '@mui/icons-material/EditCalendar';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Tooltip from '@mui/material/Tooltip';
import { useNavigate } from 'react-router-dom';
import api from '../config/api';

import CalendarioCustom from './CalendarioCustom';
import SelectorHoras from './SelectorHoras';

// 🚀 FUNCION ANTI-TIMEZONES: Extrae "YYYY-MM-DD HH:mm" como texto puro
const extraerFechaSegura = (f) => {
  if (!f) return '';
  const str = typeof f === 'string' ? f : (f.fecha_agendada || String(f));
  const match = str.match(/(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})/);
  return match ? `${match[1]} ${match[2]}` : str;
};

function Carrito({ user, carrito, setCarrito, eliminarDelCarrito, vaciarCarrito, ajustarCantidad }) {
  const navigate = useNavigate();
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [mensajeAlerta, setMensajeAlerta] = useState('');
  const [snackbarKey, setSnackbarKey] = useState(0);

  const [modalEditOpen, setModalEditOpen] = useState(false);
  const [itemAEditar, setItemAEditar] = useState(null);
  const [nuevaFecha, setNuevaFecha] = useState('');
  const [nuevaHora, setNuevaHora] = useState('');
  
  const [horariosOcupadosEdit, setHorariosOcupadosEdit] = useState([]);

  const handleAjustarCantidad = async (item, nuevaCant) => {
    ajustarCantidad(item, nuevaCant);
  };

  const handleEliminar = async (item) => {
    eliminarDelCarrito(item);
  };

  const handleVaciar = async () => {
    vaciarCarrito();
  };

  const itemsAgrupados = carrito.reduce((acc, item) => {
    const existing = acc.find(i => i.id === item.id);
    const cantidadReal = item.cantidad ? Number(item.cantidad) : 1;

    if (existing) {
      existing.cantidad += cantidadReal;
    } else {
      acc.push({ ...item, cantidad: cantidadReal });
    }
    return acc;
  }, []);

  const subtotal = itemsAgrupados.reduce((total, item) => total + (item.precio * item.cantidad), 0);
  const envio = subtotal > 0 ? 150 : 0;
  const total = subtotal + envio;

  const handleFinalizarCompra = () => {
    if (!user) {
      setMensajeAlerta('⚠️ Redirigiendo a inicio de sesión (¡No perderás tus artículos!)...');
      setSnackbarKey(Date.now());
      setSnackbarOpen(true);
      setTimeout(() => {
        navigate('/login', { state: { from: '/checkout' } }); 
      }, 1500);
      return;
    }
    navigate('/checkout');
  };

  const abrirModalEdit = async (item) => {
    const fechaOriginal = item.fechaReserva || (item.fecha_agendada ? item.fecha_agendada.split(' ')[0] : '');
    const horaOriginal = item.horaReserva || (item.fecha_agendada ? item.fecha_agendada.split(' ')[1]?.substring(0, 5) : '');
    
    setNuevaFecha(fechaOriginal);
    setNuevaHora(horaOriginal);
    setItemAEditar({ ...item, fechaReserva: fechaOriginal, horaReserva: horaOriginal });
    setModalEditOpen(true); // Lo abrimos rápido para no hacer esperar al usuario
    
    if (item.tipo === 'Servicio') {
       try {
          const dbId = item.dbId || String(item.id).replace('serv_', '').split('-')[0];
          
          // 🚀 1. BAJAMOS LA AGENDA DEL PROVEEDOR ACTUALIZADA (Porque el carrito olvidó guardarla)
          const resServ = await api.get(`/services/${dbId}`);
          let parsedAgenda = { dias: [], horario: { inicio: '08:00', fin: '20:00' } };
          if (resServ.data.datos_agenda) {
              parsedAgenda = typeof resServ.data.datos_agenda === 'string' ? JSON.parse(resServ.data.datos_agenda) : resServ.data.datos_agenda;
          }

          // 🚀 2. BAJAMOS LOS HORARIOS OCUPADOS USANDO NUESTRA EXPRESIÓN REGULAR SEGURA
          const resOcupados = await api.get(`/services/${dbId}/ocupados`);
          const normalizados = resOcupados.data.map(extraerFechaSegura);
          
          setHorariosOcupadosEdit(normalizados);
          
          // Le inyectamos la agenda real al item que se está editando
          setItemAEditar(prev => ({ ...prev, diasDisponibles: parsedAgenda.dias || [], horario: parsedAgenda.horario }));
          
       } catch (e) {
          console.error("Error obteniendo disponibilidad en carrito", e);
       }
    }
  };

  const guardarEdicion = () => {
    if (!nuevaFecha || !nuevaHora) {
      setMensajeAlerta('Por favor, selecciona fecha y hora.');
      setSnackbarKey(Date.now());
      setSnackbarOpen(true);
      return;
    }

    if (setCarrito) {
      setCarrito(prev => prev.map(item => {
        if (item.id === itemAEditar.id) {
          const baseId = item.originalId || String(item.id).split('-')[0];
          return {
            ...item,
            fechaReserva: nuevaFecha,
            horaReserva: nuevaHora,
            // 🚀 MUY IMPORTANTE: Guardar también la fecha consolidada para que el Carrito la envíe a MercadoPago
            fecha_agendada: `${nuevaFecha} ${nuevaHora}:00`, 
            id: `${baseId}-${nuevaFecha}-${nuevaHora}`
          };
        }
        return item;
      }));
    }
    setModalEditOpen(false);
    setMensajeAlerta('Agendamiento actualizado correctamente.');
    setSnackbarKey(Date.now());
    setSnackbarOpen(true);
  };

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#fff' }}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
          <Typography variant="h4" fontWeight={800}>Mi Carrito</Typography>
          {carrito.length > 0 && (
            <Button 
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/')}
              sx={{ 
                textTransform: 'none', fontWeight: 700, backgroundColor: '#3B82F6', border: '2px solid #3B82F6',
                borderRadius: 50, px: 3, color: '#fff', '&:hover': { backgroundColor: '#2563EB', borderColor: '#2563EB' }
              }}
            >
              Explorar más productos
            </Button>
          )}
        </Box>

        {carrito.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 10 }}>
            <Typography variant="h5" color="text.secondary" gutterBottom>Tu carrito está vacío</Typography>
            <Button variant="contained" onClick={() => navigate('/')} sx={{ mt: 2, borderRadius: 50, px: 4, backgroundColor: '#3B82F6', color: '#fff', fontWeight: 700, '&:hover': { backgroundColor: '#2563EB' } }}>
              Explorar Productos
            </Button>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            <Box sx={{ flex: '1 1 600px' }}>
              <Card sx={{ borderRadius: 4, border: '2px solid #3B82F6', boxShadow: 'none', overflow: 'hidden' }}>
                <List disablePadding>
                  {itemsAgrupados.map((item, index) => (
                    <React.Fragment key={item.id}>
                      <ListItem sx={{ py: 2 }}>
                        <ListItemAvatar sx={{ mr: 2 }}>
                          <Avatar variant="rounded" src={item.imagenes || item.img || (item.fotos && item.fotos[0])} sx={{ width: 80, height: 80, borderRadius: 2 }} />
                        </ListItemAvatar>
                        
                        <ListItemText
                          sx={{ mr: 3, maxWidth: '50%' }}
                          secondaryTypographyProps={{ component: 'div' }}
                          primary={<Typography fontWeight={700} sx={{ lineHeight: 1.2, mb: 0.5 }}>{item.nombre}</Typography>}
                          secondary={
                            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                              <Typography variant="body2" color="text.secondary">
                                {item.vendor || 'Proveedor'} | ${item.precio.toLocaleString('es-MX')}
                              </Typography>
                              {(item.fechaReserva || item.fecha_agendada) && (
                                <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 600, mt: 0.5 }}>
                                  📅 {item.fechaReserva || item.fecha_agendada.split(' ')[0]} a las {item.horaReserva || item.fecha_agendada.split(' ')[1]?.substring(0, 5)}
                                </Typography>
                              )}
                            </Box>
                          }
                        />

                        <Box sx={{ display: 'flex', alignItems: 'center', ml: 'auto' }}>
                          <Box sx={{ width: 120, display: 'flex', justifyContent: 'center', mr: 2 }}>
                            {item.tipo === 'Servicio' ? (
                              <Tooltip title="Editar fecha y hora">
                                <IconButton size="small" color="primary" onClick={() => abrirModalEdit(item)} sx={{ border: '1px solid', borderColor: 'primary.main' }}>
                                  <EditCalendarIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            ) : (
                              <Box sx={{ display: 'flex', alignItems: 'center', border: '1px solid #e5e7eb', borderRadius: 50, px: 0.5, backgroundColor: 'grey.50' }}>
                                <IconButton size="small" onClick={() => handleAjustarCantidad(item, Math.max(1, item.cantidad - 1))}><RemoveIcon fontSize="small" /></IconButton>
                                <Typography variant="body2" sx={{ mx: 0.5, minWidth: 20, textAlign: 'center', fontWeight: 600 }}>{item.cantidad}</Typography>
                                <IconButton size="small" onClick={() => handleAjustarCantidad(item, item.cantidad + 1)}><AddIcon fontSize="small" /></IconButton>
                              </Box>
                            )}
                          </Box>

                          <Box sx={{ textAlign: 'right', mr: 2, minWidth: 80 }}>
                            <Typography fontWeight={700} color="primary">${(item.precio * item.cantidad).toLocaleString('es-MX')}</Typography>
                          </Box>
                          <IconButton onClick={() => handleEliminar(item)} color="error"><DeleteIcon /></IconButton>
                        </Box>
                      </ListItem>
                      {index < itemsAgrupados.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </Card>
              <Button onClick={() => handleVaciar()} sx={{ mt: 2, color: '#3B82F6', textTransform: 'none', fontWeight: 600, '&:hover': { backgroundColor: 'rgba(59, 130, 246, 0.05)' } }}>
                Vaciar carrito
              </Button>
            </Box>

            <Box sx={{ flex: '1 1 300px' }}>
              <Paper sx={{ p: 3, borderRadius: 4, border: '2px solid #3B82F6', boxShadow: 'none', backgroundColor: '#f8fafc' }}>
                <Typography variant="h6" fontWeight={800} gutterBottom>Resumen</Typography>
                <Stack spacing={1.5}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography color="text.secondary">Subtotal</Typography>
                    <Typography fontWeight={600}>${subtotal.toLocaleString('es-MX')}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography color="text.secondary">Envío</Typography>
                    <Typography fontWeight={600}>${envio.toLocaleString('es-MX')}</Typography>
                  </Box>
                  <Divider />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="h6" fontWeight={800}>Total</Typography>
                    <Typography variant="h6" fontWeight={800} color="primary">${total.toLocaleString('es-MX')}</Typography>
                  </Box>
                </Stack>

                {!user && (
                  <Paper elevation={0} sx={{ backgroundColor: '#fffbeb', p: 1.5, borderRadius: 2, mt: 3, border: '1px solid #fef3c7' }}>
                    <Typography variant="body2" color="#b45309" fontWeight={600} textAlign="center" sx={{ fontSize: '0.8rem' }}>
                      Inicia sesión o regístrate para proceder al pago. ¡Tu carrito se guardará automáticamente!
                    </Typography>
                  </Paper>
                )}

                <Button fullWidth variant="contained" onClick={handleFinalizarCompra} startIcon={!user ? <LockOutlinedIcon /> : null} sx={{ mt: 3, py: 1.5, borderRadius: 50, backgroundColor: '#FACC15', color: '#111', fontWeight: 800, fontSize: '1rem', '&:hover': { backgroundColor: '#FDE047' } }}>
                  {user ? 'Continuar al pago' : 'Iniciar sesión para pagar'}
                </Button>
              </Paper>
            </Box>
          </Box>
        )}
      </Container>

      <Snackbar key={snackbarKey} open={snackbarOpen} autoHideDuration={3000} onClose={() => setSnackbarOpen(false)} anchorOrigin={{ vertical: 'top', horizontal: 'center' }} sx={{ zIndex: 1400 }}>
        <Alert icon={false} onClose={() => setSnackbarOpen(false)} sx={{ width: '100%', borderRadius: 3, backgroundColor: '#fff', color: '#111', fontWeight: 600, border: '2px solid', borderColor: '#FACC15', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
          {mensajeAlerta}
        </Alert>
      </Snackbar>

      <Dialog open={modalEditOpen} onClose={() => setModalEditOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Editar Fecha de Servicio</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', p: 0 }}>
          
          <Box sx={{ borderBottom: '1px solid #cbd5e1' }}>
            <CalendarioCustom 
              diasDisponibles={itemAEditar?.diasDisponibles || []} 
              fechaSeleccionada={nuevaFecha}
              onFechaSeleccionada={(fecha) => {
                setNuevaFecha(fecha);
                setNuevaHora(''); 
              }}
            />
          </Box>

          <Box>
            <SelectorHoras 
              horario={itemAEditar?.horario || { inicio: '08:00', fin: '20:00' }}
              fechaSeleccionada={nuevaFecha}
              horaSeleccionada={nuevaHora}
              onHoraSeleccionada={setNuevaHora}
              horariosOcupados={horariosOcupadosEdit}
            />
          </Box>

        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setModalEditOpen(false)} color="inherit" sx={{ fontWeight: 600 }}>Cancelar</Button>
          <Button onClick={guardarEdicion} variant="contained" color="primary" sx={{ borderRadius: 50, fontWeight: 700 }}>Actualizar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Carrito;