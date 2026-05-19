import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Grid, Button, CircularProgress,
  Card, Divider, Avatar, Chip, Snackbar, Alert, Breadcrumbs, Link,
  List, ListItem, ListItemIcon, ListItemText, IconButton,
  Rating, ListItemAvatar
} from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import StorefrontIcon from '@mui/icons-material/Storefront';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import SecurityIcon from '@mui/icons-material/Security';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
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

export default function DetalleArticulo({ agregarAlCarrito, user }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [item, setItem] = useState(null);
  const [resenas, setResenas] = useState([]); 
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const [fotoPrincipalIndex, setFotoPrincipalIndex] = useState(0);
  const [cantidad, setCantidad] = useState(1);
  
  const [fechaSeleccionada, setFechaSeleccionada] = useState('');
  const [horaSeleccionada, setHoraSeleccionada] = useState('');
  const [horariosOcupados, setHorariosOcupados] = useState([]);

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [mensajeAlerta, setMensajeAlerta] = useState('');
  const [tipoAlerta, setTipoAlerta] = useState('success');

  useEffect(() => {
    const fetchDetalle = async () => {
      try {
        const [prefijo, idReal] = id.split('_');
        const endpoint = prefijo === 'prod' ? `/products/${idReal}` : `/services/${idReal}`;
        
        const res = await api.get(endpoint);
        const data = res.data;

        if (!data) throw new Error("Artículo no encontrado");

        const isProducto = prefijo === 'prod';
        
        let agenda = { dias: [], horario: { inicio: '08:00', fin: '20:00' } };
        if (!isProducto && data.datos_agenda) {
          try {
            const parsedAgenda = typeof data.datos_agenda === 'string' ? JSON.parse(data.datos_agenda) : data.datos_agenda;
            agenda = { ...agenda, ...parsedAgenda };
          } catch (e) {
            console.error("Error al parsear agenda");
          }
          
          try {
            const resOcupados = await api.get(`/services/${idReal}/ocupados`);
            // 🚀 APLICAMOS EL BLINDAJE CONTRA ZONAS HORARIAS
            const normalizados = resOcupados.data.map(extraerFechaSegura);
            setHorariosOcupados(normalizados);
          } catch (err) {
            console.error("No se pudo cargar la disponibilidad");
          }
        }

        const prom = Number(data.calificacion_promedio) || 0;

        setItem({
          id: id, dbId: data.id, tipo: isProducto ? 'Producto' : 'Servicio',
          vendor: data.nombre_proveedor || `Proveedor #${data.proveedor_id || 'X'}`,
          nombre: data.titulo || 'Artículo sin nombre', descripcion: data.descripcion || 'Sin descripción',
          precio: Number(data.precio) || 0, stock: isProducto ? (Number(data.stock) || 0) : null,
          categoria: data.categoria || 'Varios', rating: prom > 0 ? prom.toFixed(1) : null, 
          reviews: data.total_resenas || 0, fotos: typeof data.imagenes === 'string' ? JSON.parse(data.imagenes) : (data.imagenes || []),
          diasDisponibles: Array.isArray(agenda.dias) ? agenda.dias : [],
          horario: agenda.horario?.inicio ? agenda.horario : { inicio: '08:00', fin: '20:00' }, 
        });

        setResenas(data.resenas || []);
      } catch (err) {
        setError("El artículo ya no está disponible.");
      } finally {
        setCargando(false);
      }
    };
    fetchDetalle();
  }, [id]);

  const handleAddClick = async () => {
    const itemParaCarrito = { ...item, tipo: item.tipo };
    
    if (item.tipo === 'Servicio' && (!fechaSeleccionada || !horaSeleccionada)) {
      setMensajeAlerta("Por favor selecciona un día y una hora.");
      setTipoAlerta("warning");
      setSnackbarOpen(true);
      return;
    }

    const fechaFinal = item.tipo === 'Servicio' ? `${fechaSeleccionada} ${horaSeleccionada}` : null;
    await agregarAlCarrito(itemParaCarrito, cantidad, fechaFinal);

    setMensajeAlerta("¡Añadido a tu carrito con éxito!");
    setTipoAlerta("success");
    setSnackbarOpen(true);
  };

  if (cargando) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 15 }}><CircularProgress size={60} thickness={4} /></Box>;
  if (error || !item) return <Box sx={{ textAlign: 'center', py: 15 }}><Typography variant="h6">{error}</Typography></Box>;

  const fotosSeguras = Array.isArray(item.fotos) && item.fotos.length > 0 ? item.fotos : [`https://picsum.photos/seed/${item.id}/1200/800`];
  const botonDeshabilitado = (item.tipo === 'Producto' && item.stock <= 0) || (item.tipo === 'Servicio' && (!fechaSeleccionada || !horaSeleccionada));

  return (
    <Box sx={{ backgroundColor: '#fff', minHeight: '100vh', pb: 10, pt: 3 }}>
      <Box sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 2, md: 4 } }}>
        <Box sx={{ mb: 3 }}>
          <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2, fontSize: '0.85rem' }}>
            <Link underline="hover" color="inherit" sx={{ cursor: 'pointer' }} onClick={() => navigate('/')}>Catálogo</Link>
            <Link underline="hover" color="inherit" sx={{ cursor: 'pointer' }} onClick={() => navigate('/')}>{item.tipo}s</Link>
            <Typography color="text.primary" fontWeight={600}>{item.categoria}</Typography>
          </Breadcrumbs>
          <Typography variant="h3" fontWeight={800} sx={{ mb: 1.5, color: '#111', fontSize: { xs: '2rem', md: '2.5rem' }, lineHeight: 1.2 }}>{item.nombre}</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', mb: 2 }}>
            {item.rating ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <StarIcon sx={{ color: '#FBBF24', fontSize: 22 }} />
                <Typography fontWeight={700} fontSize="1.1rem">{item.rating}</Typography>
                <Typography color="text.secondary" sx={{ ml: 0.5 }}>({item.reviews} valoraciones)</Typography>
              </Box>
            ) : (
              <Chip icon={<VerifiedUserIcon fontSize="small"/>} label="Nuevo en plataforma" size="small" color="primary" variant="outlined" sx={{ fontWeight: 700 }} />
            )}
            <Typography color="text.secondary">•</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
              <StorefrontIcon fontSize="small" />
              <Typography variant="body1">Por <Typography component="span" color="primary" fontWeight={700}>{item.vendor}</Typography></Typography>
            </Box>
          </Box>
        </Box>

        <Grid container spacing={5}>
          <Grid item xs={12} md={7} lg={8}>
            {/* SECCIÓN DE FOTOS */}
            <Box sx={{ mb: 5 }}>
              <Box sx={{ width: '100%', height: { xs: 300, sm: 400, md: 500 }, borderRadius: 4, overflow: 'hidden', mb: 2, backgroundColor: '#f3f4f6' }}>
                <img src={fotosSeguras[fotoPrincipalIndex]} alt={item.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </Box>
              {fotosSeguras.length > 1 && (
                <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 1 }}>
                  {fotosSeguras.map((foto, idx) => (
                    <Box key={idx} onClick={() => setFotoPrincipalIndex(idx)} sx={{ width: 90, height: 90, flexShrink: 0, borderRadius: 3, cursor: 'pointer', overflow: 'hidden', border: fotoPrincipalIndex === idx ? '3px solid #111' : '1px solid transparent', opacity: fotoPrincipalIndex === idx ? 1 : 0.5, '&:hover': { opacity: 1 } }}>
                      <img src={foto} alt={`Miniatura ${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
            
            <Divider sx={{ mb: 4 }} />
            
            {/* SECCIÓN DE DESCRIPCIÓN */}
            <Box sx={{ pr: { md: 4 }, mb: 4 }}>
              <Typography variant="h5" fontWeight={800} mb={2}>Acerca de este {item.tipo.toLowerCase()}</Typography>
              <Typography variant="body1" color="text.secondary" sx={{ whiteSpace: 'pre-line', lineHeight: 1.8 }}>{item.descripcion}</Typography>
            </Box>

            <Divider sx={{ mb: 4 }} />

            {/* 🚀 SECCIÓN DE RESEÑAS RESTAURADA */}
            <Box sx={{ pr: { md: 4 }, mb: 4 }}>
              <Typography variant="h5" fontWeight={800} gutterBottom>
                Reseñas de clientes ({resenas.length})
              </Typography>

              {resenas.length === 0 ? (
                <Typography color="text.secondary" sx={{ mt: 2, mb: 4 }}>
                  Aún no hay comentarios para este artículo. ¡Sé el primero en comprar y opinar!
                </Typography>
              ) : (
                <List sx={{ width: '100%', bgcolor: 'transparent', mt: 2, mb: 4 }}>
                  {resenas.map((rev, index) => (
                    <React.Fragment key={rev.id || index}>
                      <ListItem alignItems="flex-start" sx={{ px: 0, py: 3 }}>
                        
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'secondary.main', color: '#fff', fontWeight: 'bold' }}>
                            {rev.nombre_cliente?.charAt(0).toUpperCase() || 'U'}
                          </Avatar>
                        </ListItemAvatar>
                        
                        <ListItemText
                          primaryTypographyProps={{ component: 'div' }}
                          secondaryTypographyProps={{ component: 'div' }}
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                              <Typography fontWeight={700}>{rev.nombre_cliente || 'Usuario'}</Typography>
                              <Rating value={Number(rev.calificacion)} readOnly size="small" precision={0.5} />
                            </Box>
                          }
                          secondary={
                            <Box sx={{ mt: 1 }}>
                              <Typography variant="body2" color="text.primary" sx={{ mb: 1, whiteSpace: 'pre-wrap' }}>
                                {rev.comentario}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Publicado el {new Date(rev.fecha_creacion?.replace(' ', 'T') || rev.fecha_creacion).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < resenas.length - 1 && <Divider component="li" />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </Box>

            {/* SECCIÓN DEL VENDEDOR RESTAURADA */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, p: 3, borderRadius: 4, backgroundColor: '#f8fafc', mb: 4 }}>
              <Avatar sx={{ width: 64, height: 64, bgcolor: 'primary.main', fontSize: '1.5rem', fontWeight: 800 }}>
                {item.vendor.replace('Proveedor #', '')}
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight={800}>{item.vendor}</Typography>
                <Typography variant="body2" color="text.secondary" mb={1}>Vendedor verificado en MonkeyMarket</Typography>
                <Button size="small" variant="outlined" sx={{ borderRadius: 50, textTransform: 'none', fontWeight: 600 }}>Ver perfil completo</Button>
              </Box>
            </Box>

          </Grid>

          <Grid item xs={12} md={5} lg={4}>
            <Box sx={{ position: 'sticky', top: 24 }}>
              <Card sx={{ borderRadius: 4, p: 3.5, boxShadow: '0 20px 40px rgba(0,0,0,0.08)', border: '1px solid #f1f5f9' }}>
                <Typography variant="h3" fontWeight={800} color="#111" mb={0.5}>${item.precio.toLocaleString('es-MX')}</Typography>
                <Typography variant="body2" color="text.secondary" mb={3} fontWeight={500}>Total a pagar. Incluye impuestos.</Typography>

                {item.tipo === 'Servicio' ? (
                  <Box sx={{ backgroundColor: '#fff', border: '1px solid #cbd5e1', borderRadius: 3, overflow: 'hidden', mb: 3 }}>
                    {item.diasDisponibles?.length > 0 && (
                      <Box sx={{ p: 2, backgroundColor: '#f8fafc', borderBottom: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', gap: 1 }}>
                        <InfoOutlinedIcon fontSize="small" color="primary" />
                        <Typography variant="caption" fontWeight={600} color="text.secondary">
                          Días Laborables: <Box component="span" color="primary.main">{item.diasDisponibles.join(', ')}</Box>
                        </Typography>
                      </Box>
                    )}

                    <CalendarioCustom 
                      diasDisponibles={item.diasDisponibles} 
                      fechaSeleccionada={fechaSeleccionada}
                      onFechaSeleccionada={(fecha) => {
                        setFechaSeleccionada(fecha);
                        setHoraSeleccionada('');
                      }}
                    />
                    
                    <SelectorHoras 
                      horario={item.horario}
                      fechaSeleccionada={fechaSeleccionada}
                      horaSeleccionada={horaSeleccionada}
                      onHoraSeleccionada={setHoraSeleccionada}
                      horariosOcupados={horariosOcupados}
                    />
                  </Box>
                ) : (
                  <Box sx={{ mb: 4 }}>
                    <Typography variant="subtitle2" fontWeight={700} mb={1}>Cantidad a comprar:</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', border: '1px solid #cbd5e1', borderRadius: 50, width: 'fit-content', p: 0.5 }}>
                      <IconButton onClick={() => setCantidad(Math.max(1, cantidad - 1))} size="small" sx={{ bgcolor: '#f1f5f9' }}><RemoveIcon /></IconButton>
                      <Typography variant="h6" sx={{ px: 4, fontWeight: 700 }}>{cantidad}</Typography>
                      <IconButton onClick={() => setCantidad(cantidad + 1)} size="small" sx={{ bgcolor: '#f1f5f9' }} disabled={item.stock !== null && cantidad >= item.stock}><AddIcon /></IconButton>
                    </Box>
                  </Box>
                )}

                <Button 
                  variant="contained" fullWidth size="large" onClick={handleAddClick} disabled={botonDeshabilitado}
                  sx={{ 
                    py: 1.8, borderRadius: 3, fontSize: '1.1rem', fontWeight: 800, textTransform: 'none', 
                    background: botonDeshabilitado ? '#e2e8f0' : 'linear-gradient(to right, #F59E0B, #FACC15)', 
                    color: botonDeshabilitado ? '#94a3b8' : '#111', 
                    boxShadow: botonDeshabilitado ? 'none' : '0 8px 20px rgba(245, 158, 11, 0.3)'
                  }}
                >
                  {item.tipo === 'Producto' ? (item.stock > 0 ? 'Añadir al carrito' : 'Agotado') : 'Reservar ahora'}
                </Button>
              </Card>
            </Box>
          </Grid>
        </Grid>
      </Box>

      <Snackbar open={snackbarOpen} autoHideDuration={4000} onClose={() => setSnackbarOpen(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={tipoAlerta} variant="filled" sx={{ borderRadius: 3, fontWeight: 600 }}>{mensajeAlerta}</Alert>
      </Snackbar>
    </Box>
  );
}