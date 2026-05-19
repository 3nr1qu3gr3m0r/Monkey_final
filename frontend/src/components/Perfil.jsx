import React, { useState, useEffect, useRef } from 'react';
import Direcciones from './Direcciones';
import EditarPerfil from './EditarPerfil';
import api from '../config/api';
import { 
  Box, Container, Paper, Typography, Avatar, Grid, 
  Button, Divider, List, ListItem, ListItemText, ListItemIcon,
  Rating, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Chip,
  Tabs, Tab, IconButton, Alert, Stack, CircularProgress, Tooltip
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import SettingsIcon from '@mui/icons-material/Settings';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PhoneIcon from '@mui/icons-material/Phone';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { useNavigate } from 'react-router-dom';
import { useAlert } from '../context/AlertContext';

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} id={`profile-tabpanel-${index}`} {...other}>
      {value === index && (<Box sx={{ py: 4 }}>{children}</Box>)}
    </div>
  );
}

const getStatusVisuals = (status) => {
  switch (status) {
    case 'en_preparacion': return { label: 'En Preparación', color: 'secondary' };
    case 'enviado_agendado': return { label: 'Enviado / Confirmado', color: 'info' };
    case 'entregado': return { label: 'Entregado / Realizado', color: 'success' };
    default: return { label: 'Pendiente', color: 'warning' };
  }
};

function Perfil({ user, onUpdate }) {
    const { showAlert, showConfirm } = useAlert();
    const navigate = useNavigate();
    const [tabValue, setTabValue] = useState(0);
    const [openDir, setOpenDir] = useState(false);
    const [openEdit, setOpenEdit] = useState(false);
    const [direcciones, setDirecciones] = useState([]);
    const [direccionAEditar, setDireccionAEditar] = useState(null);

    const [pedidos, setPedidos] = useState([]);
    const [loadingPedidos, setLoadingPedidos] = useState(false);

    // 🚀 Lógica para saber si es comprador
    const isComprador = user?.rol !== 'admin' && user?.rol !== 'proveedor';

    useEffect(() => {
        const obtenerDatos = async () => {
            try {
                const resDir = await api.get('/direcciones');
                setDirecciones(resDir.data);
            } catch (error) {}
        };
        // Solo pedimos direcciones si es comprador
        if (isComprador) obtenerDatos();
    }, [isComprador]);

    const fetchPedidos = async () => {
        setLoadingPedidos(true);
        try {
            const response = await api.get('/pedidos/mis-pedidos');
            setPedidos(response.data);
        } catch (error) { console.error("Error al cargar el historial:", error); } 
        finally { setLoadingPedidos(false); }
    };

    useEffect(() => { 
        // Si no es comprador, evitamos que pida pedidos (aunque no pueda ver la pestaña)
        if (tabValue === 1 && isComprador) fetchPedidos(); 
    }, [tabValue, isComprador]);

    const [openReview, setOpenReview] = useState(false);
    const [openDispute, setOpenDispute] = useState(false);
    const [openDetails, setOpenDetails] = useState(false);
    
    const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
    const [itemSeleccionado, setItemSeleccionado] = useState(null);
    const [loadingAction, setLoadingAction] = useState(false);

    const [reviewForm, setReviewForm] = useState({ rating: 0, comment: '', files: [], previews: [] });
    const [disputeText, setDisputeText] = useState('');
    const inputReviewRef = useRef(null);

    const handleTabChange = (event, newValue) => setTabValue(newValue);

    const handleOpenDetails = (pedido) => { setPedidoSeleccionado(pedido); setOpenDetails(true); };

    // Precargar datos si el usuario ya había calificado el producto
    const handleAbrirModalCalificacion = (item) => {
        setItemSeleccionado(item);
        setReviewForm({
            rating: Number(item.calificacion_previa) || 0,
            comment: item.comentario_previo || '',
            files: [],
            previews: []
        });
        setOpenReview(true);
    };

    // --- MANEJO DE IMÁGENES GENÉRICO ---
    const handleImagenes = (e, setFormState) => {
        const files = Array.from(e.target.files).filter(f => ['image/jpeg', 'image/jpg', 'image/png'].includes(f.type));
        const previews = files.map(f => URL.createObjectURL(f));
        setFormState(prev => ({ 
            ...prev, 
            files: [...prev.files, ...files], 
            previews: [...prev.previews, ...previews] 
        }));
    };

    const eliminarImagen = (index, setFormState) => {
        setFormState(prev => ({
            ...prev,
            files: prev.files.filter((_, i) => i !== index),
            previews: prev.previews.filter((_, i) => i !== index)
        }));
    };

    const subirImagenes = async (files) => {
        if (files.length === 0) return [];
        const uploadPromises = files.map(async (file) => {
            const formData = new FormData();
            formData.append('image', file);
            const res = await api.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' }});
            return res.data.url;
        });
        return await Promise.all(uploadPromises);
    };

    // --- ACCIONES DE RESEÑAS ---
    const handleSaveReview = async () => {
        if (reviewForm.rating === 0) return showAlert("Por favor selecciona una calificación de estrellas.", "warning");
        setLoadingAction(true);
        try {
            const urls = await subirImagenes(reviewForm.files);
            await api.post('/cliente/calificar', {
                detalle_pedido_id: itemSeleccionado.id,
                calificacion: reviewForm.rating,
                comentario: reviewForm.comment,
                imagenes: urls
            });
            showAlert(`¡Reseña guardada con éxito!`, "success");
            setOpenReview(false); 
            fetchPedidos();
        } catch (error) { showAlert("Error al guardar calificación", "error"); }
        finally { setLoadingAction(false); }
    };

    const handleDeleteReview = async () => {
        if(!(await showConfirm("¿Estás seguro de que deseas eliminar esta calificación?"))) return;
        setLoadingAction(true);
        try {
            await api.delete(`/cliente/calificar/${itemSeleccionado.id}`);
            showAlert("Reseña eliminada correctamente.", "success");
            setOpenReview(false);
            fetchPedidos();
        } catch (error) { showAlert("No se pudo eliminar la reseña.", "error"); }
        finally { setLoadingAction(false); }
    };

    // --- DIRECCIONES ---
    const handleEditAddress = (dir) => { setDireccionAEditar(dir); setOpenDir(true); };
    const removeAddress = async (id) => {
        if(await showConfirm("¿Seguro que deseas eliminar esta dirección?")){
            try {
                await api.delete(`/direcciones/${id}`);
                setDirecciones(prev => prev.filter(d => d.id !== id));
            } catch(error) { showAlert("No se pudo eliminar la dirección.", "error"); }
        }
    };

    return (
    <Container maxWidth="md" sx={{ py: 5 }}>
      <Paper elevation={0} sx={{ borderRadius: 6, overflow: 'hidden', border: '1px solid #e2e8f0', bgcolor: '#fff' }}>
        
        {/* Banner de Perfil */}
        <Box sx={{ height: 160, bgcolor: 'primary.main', position: 'relative' }}>
            <Box sx={{ position: 'absolute', bottom: -62, left: 40, display: 'flex', alignItems: 'flex-end', gap: 3 }}>
                <Avatar src={user?.foto} sx={{ width: 120, height: 120, border: '6px solid white', bgcolor: 'secondary.main', fontSize: '2.5rem', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
                    {user?.nombre? user.nombre.charAt(0).toUpperCase() : <PersonIcon/>}
                </Avatar>
                <Box sx={{ mb: 1, pt: 1 }}>
                    <Typography variant="h5" fontWeight={800} color="#1e293b">{user?.nombre}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {user?.rol === 'admin' ? '🛡️ Administrador' : user?.rol === 'proveedor' ? '🚀 Proveedor verificado' : '👤 Cliente Monkey'}
                    </Typography>
                </Box>
            </Box>
        </Box>
        
        <Box sx={{ px: { xs: 2, md: 5 }, pt: 8, pb: 4 }}>
          
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 1 }}>
            <Tabs value={tabValue} onChange={handleTabChange} variant="fullWidth" sx={{ '& .MuiTabs-indicator': { height: 3, borderRadius: '3px 3px 0 0' }, '& .MuiTab-root': { fontWeight: 700, textTransform: 'none', fontSize: '1rem' } }}>
              <Tab label="Mi Cuenta" icon={<PersonIcon />} iconPosition="start" />
              {/* 🚀 Ocultar estas pestañas si no es comprador */}
              {isComprador && <Tab label="Mis Pedidos" icon={<ShoppingBagIcon />} iconPosition="start" />}
              {isComprador && <Tab label="Direcciones" icon={<LocationOnIcon />} iconPosition="start" />}
            </Tabs>
          </Box>

          {/* PANEL 1: MI CUENTA (Visible para todos) */}
          <TabPanel value={tabValue} index={0}>
              <Grid container spacing={4} alignItems="center">
                <Grid item xs={12} md={7}>
                    <Typography variant="h6" fontWeight={800} gutterBottom>Detalles Personales</Typography>
                    <List sx={{ bgcolor: '#f8fafc', borderRadius: 4, p: 2 }}>
                        <ListItem>
                            <ListItemIcon><EmailIcon color="primary"/></ListItemIcon>
                            <ListItemText primary="Correo Electrónico" secondary={user?.correo || "No disponible"} />
                        </ListItem>
                        <Divider variant="inset" component="li" />
                        <ListItem>
                            <ListItemIcon><PhoneIcon color="primary"/></ListItemIcon>
                            <ListItemText primary="Teléfono de Contacto" secondary={user?.telefono || "No registrado"} />
                        </ListItem>
                    </List>
                </Grid>
                <Grid item xs={12} md={5}>
                    <Paper variant="outlined" sx={{ p: 4, borderRadius: 4, textAlign: 'center', bgcolor: '#f8fafc', borderStyle: 'dashed', borderColor: '#cbd5e1' }}>
                        <Typography variant="subtitle2" fontWeight={700} gutterBottom>Actualizar información</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>¿Deseas modificar tus datos?</Typography>
                        <Button variant="contained" startIcon={<SettingsIcon />} onClick={() => setOpenEdit(true)} sx={{ borderRadius: 50, px: 3, py: 1, fontWeight: 800, textTransform: 'none', boxShadow: 'none' }}>
                            Editar Perfil
                        </Button>
                        <EditarPerfil open={openEdit} onClose={() => setOpenEdit(false)} user={user} onUpdate={onUpdate} />
                    </Paper>
                </Grid>
              </Grid>
          </TabPanel>

          {/* PANEL 2: MIS PEDIDOS (Solo Compradores) */}
          {isComprador && (
            <TabPanel value={tabValue} index={1}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6" fontWeight={800}>Historial de Compras</Typography>
                    <Tooltip title="Actualizar estado de pedidos">
                        <IconButton onClick={fetchPedidos} disabled={loadingPedidos} sx={{ bgcolor: '#f1f5f9' }}><RefreshIcon color="primary" /></IconButton>
                    </Tooltip>
                </Box>
                
                {loadingPedidos ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}><CircularProgress /></Box>
                ) : pedidos.length > 0 ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {pedidos.map((pedido) => (
                          <Paper key={pedido.db_id || pedido.id} variant="outlined" sx={{ p: 3, borderRadius: 4, border: '1px solid #e2e8f0', transition: '0.3s', '&:hover': { borderColor: 'primary.main', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' } }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, alignItems: 'center' }}>
                                  <Box>
                                      <Typography variant="subtitle1" fontWeight={800} color="primary">Pedido #{pedido.id}</Typography>
                                      <Typography variant="caption" color="text.secondary">{pedido.fecha}</Typography>
                                  </Box>
                                  <Chip label={pedido.estado} size="small" color={pedido.estado === 'Pagado / En Proceso' ? 'success' : 'warning'} sx={{ fontWeight: 800, borderRadius: 1.5, px: 1, textTransform: 'capitalize' }} />
                              </Box>
                              
                              {(pedido.items || []).map(item => {
                                  const statusVis = getStatusVisuals(item.estadoItem);
                                  return (
                                  <Box key={item.id} sx={{ mb: 2 }}>
                                      <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', mb: 1 }}>
                                          <Avatar src={item.img} variant="rounded" sx={{ width: 70, height: 70, borderRadius: 2 }} />
                                          <Box sx={{ flex: 1 }}>
                                              <Typography variant="body1" fontWeight={700}>{item.cantidad}x {item.nombre}</Typography>
                                              <Typography variant="caption" color="text.secondary" display="block">{item.tipo} | Vendido por: {item.vendor}</Typography>
                                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                                                  <Chip label={statusVis.label} size="small" color={statusVis.color} variant="outlined" sx={{ fontWeight: 700, fontSize: '0.7rem', height: 20 }} />
                                                  {item.fechaReserva && <Typography variant="caption" color="primary.main" fontWeight={600}>📅 {item.fechaReserva}</Typography>}
                                              </Box>
                                          </Box>
                                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'flex-end' }}>
                                              {/* Si está en chat, mostrar botón rápido para ir al chat */}
                                              {item.estadoItem === 'chatting' && (
                                                  <Button size="small" color="info" onClick={() => navigate('/chat-soporte', { state: { item } })} sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.7rem' }}>Ver Chat</Button>
                                              )}
                                              {item.estadoItem === 'escalated' && <Chip label="En Disputa" color="error" variant="outlined" size="small" />}
                                              {item.estadoItem === 'resolved' && <Chip label="Resuelto" color="success" size="small" />}
                                          </Box>
                                      </Box>
                                  </Box>
                              )})}

                              <Divider sx={{ my: 1.5 }} />
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <Typography variant="subtitle1" fontWeight={800}>Total: ${(Number(pedido.total)||0).toLocaleString('es-MX')}</Typography>
                                  <Stack direction="row" spacing={1}>
                                      <Button size="small" variant="contained" onClick={() => handleOpenDetails(pedido)} sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 50, boxShadow: 'none' }}>Administrar Pedido</Button>
                                  </Stack>
                              </Box>
                          </Paper>
                      ))}
                    </Box>
                ) : (
                    <Box sx={{ textAlign: 'center', py: 8 }}>
                        <ShoppingBagIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                        <Typography color="text.secondary">Aún no hay compras registradas en tu cuenta.</Typography>
                    </Box>
                )}
            </TabPanel>
          )}

          {/* PANEL 3: DIRECCIONES (Solo Compradores) */}
          {isComprador && (
            <TabPanel value={tabValue} index={2}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6" fontWeight={800}>Mis Direcciones</Typography>
                  <Button variant="contained" size="small" sx={{ textTransform: 'none', borderRadius: 50, fontWeight: 700, px: 3 }} onClick={() => { setDireccionAEditar(null); setOpenDir(true); }}>+ Nueva Dirección</Button>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {direcciones.length > 0 ? direcciones.map((dir) => (
                      <Paper key={dir.id} variant="outlined" sx={{ p: 2, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: '0.2s', '&:hover': { bgcolor: '#f8fafc' } }}>
                          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                              <LocationOnIcon sx={{ color: 'primary.main', fontSize: 28 }} />
                              <Box>
                                  <Typography variant="subtitle1" fontWeight={800}>{dir.alias || "Dirección"}</Typography>
                                  <Typography variant="body2" color="text.secondary">
                                      {dir.calle_y_numero}, {dir.colonia}, {dir.ciudad} - CP: {dir.codigo_postal}
                                  </Typography>
                              </Box>
                          </Box>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                              <IconButton onClick={() => handleEditAddress(dir)} sx={{ color: '#64748b' }}><EditIcon fontSize="small" /></IconButton>
                              <IconButton onClick={() => removeAddress(dir.id)} sx={{ color: '#ef4444' }}><DeleteIcon fontSize="small" /></IconButton>
                          </Box>
                      </Paper>
                    )) : (
                    <Paper sx={{ textAlign: 'center', py: 6, borderRadius: 4, bgcolor: '#f8fafc', border: '2px dashed #e2e8f0' }}>
                        <LocationOnIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                        <Typography color="text.secondary">No hay direcciones guardadas en tu cuenta.</Typography>
                    </Paper>
                  )}
                  <Direcciones open={openDir} onClose={() => { setOpenDir(false); setDireccionAEditar(null); }} initialData={direccionAEditar} />
                </Box>
            </TabPanel>
          )}
        </Box>
      </Paper>

      {/* 📸 MODAL DE CALIFICACIÓN (AHORA SOPORTA EDICIÓN Y ELIMINACIÓN) */}
      <Dialog open={openReview} onClose={() => !loadingAction && setOpenReview(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle sx={{ fontWeight: 800, textAlign: 'center' }}>
            {reviewForm.rating > 0 ? 'Editar Reseña' : `Calificar ${itemSeleccionado?.nombre}`}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 3 }}>
            <Rating value={reviewForm.rating} onChange={(_, v) => setReviewForm({...reviewForm, rating: v})} size="large" />
            <TextField label="Cuéntanos más..." fullWidth multiline rows={3} value={reviewForm.comment} onChange={(e) => setReviewForm({...reviewForm, comment: e.target.value})} />
            
            <Box onClick={() => inputReviewRef.current.click()} sx={{ width: '100%', border: '2px dashed #cbd5e1', borderRadius: 2, p: 2, textAlign: 'center', cursor: 'pointer', '&:hover': { borderColor: 'primary.main', bgcolor: '#f8fafc' } }}>
                <CloudUploadIcon color="primary" />
                <Typography variant="body2" color="primary" fontWeight={600}>Añadir fotos (Opcional)</Typography>
            </Box>
            <input ref={inputReviewRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={(e) => handleImagenes(e, setReviewForm)} />
            
            {reviewForm.previews.length > 0 && (
                <Box sx={{ display: 'flex', gap: 1, width: '100%', overflowX: 'auto', pb: 1 }}>
                    {reviewForm.previews.map((src, i) => (
                        <Box key={i} sx={{ position: 'relative', flexShrink: 0 }}>
                            <Avatar src={src} variant="rounded" sx={{ width: 50, height: 50 }} />
                            <IconButton size="small" onClick={() => eliminarImagen(i, setReviewForm)} sx={{ position: 'absolute', top: -10, right: -10, bgcolor: 'error.main', color: 'white', width: 20, height: 20, '&:hover': { bgcolor: 'error.dark'} }}><DeleteIcon sx={{ fontSize: 12 }} /></IconButton>
                        </Box>
                    ))}
                </Box>
            )}
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0, justifyContent: 'space-between' }}>
            {/* Botón de Eliminar solo visible si ya tenía calificación previa */}
            {itemSeleccionado?.calificacion_previa ? (
                <Button onClick={handleDeleteReview} color="error" disabled={loadingAction} sx={{ fontWeight: 700 }}>
                    Eliminar
                </Button>
            ) : <Box />} {/* Espaciador para mantener el diseño flex */}
            
            <Box>
                <Button onClick={() => setOpenReview(false)} color="inherit" disabled={loadingAction}>Cancelar</Button>
                <Button onClick={handleSaveReview} variant="contained" disabled={loadingAction} sx={{ borderRadius: 50, fontWeight: 700, ml: 1 }}>
                    {loadingAction ? <CircularProgress size={24} color="inherit" /> : 'Guardar'}
                </Button>
            </Box>
        </DialogActions>
      </Dialog>

      {/* 📦 MODAL DE DETALLES MEJORADO (MINI-DASHBOARD) */}
      <Dialog open={openDetails} onClose={() => setOpenDetails(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle sx={{ fontWeight: 800, bgcolor: 'primary.main', color: 'white', py: 2 }}>
            Administrar Pedido: {pedidoSeleccionado?.id}
        </DialogTitle>
        <DialogContent sx={{ py: 3, mt: 1 }}>
            
            <List disablePadding>
                {(pedidoSeleccionado?.items || []).map(item => {
                    const statusVis = getStatusVisuals(item.estadoItem);
                    return (
                    <ListItem key={item.id} sx={{ py: 2, px: 0, flexDirection: 'column', alignItems: 'flex-start', borderBottom: '1px dashed #e2e8f0' }}>
                        
                        {/* Info de Precio y Cantidad */}
                        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Box>
                                <Typography variant="body1" fontWeight={700}>{item.cantidad}x {item.nombre}</Typography>
                                <Typography variant="body2" color="text.secondary">Vendedor: {item.vendor}</Typography>
                            </Box>
                            <Box sx={{ textAlign: 'right' }}>
                                <Typography variant="body1" fontWeight={800}>${(Number(item.precio || 0) * item.cantidad).toLocaleString('es-MX')}</Typography>
                                <Typography variant="caption" color="text.secondary">${Number(item.precio || 0).toLocaleString('es-MX')} c/u</Typography>
                            </Box>
                        </Box>

                        {/* Botones de Acción (Calificar / Reportar) */}
                        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                            <Chip label={statusVis.label} size="small" color={statusVis.color} variant="outlined" sx={{ fontWeight: 700, fontSize: '0.7rem' }} />
                            
                            <Stack direction="row" spacing={1}>
                                {item.estadoItem === 'entregado' && (
                                    <Button variant="contained" size="small" color="primary" onClick={() => { setOpenDetails(false); handleAbrirModalCalificacion(item); }} sx={{ textTransform: 'none', borderRadius: 50, fontWeight: 700, fontSize: '0.7rem', py: 0.5, boxShadow: 'none' }}>
                                        {item.calificacion_previa ? 'Editar Reseña' : 'Calificar'}
                                    </Button>
                                )}
                                <Button variant="outlined" size="small" color="error" onClick={() => { setOpenDetails(false); navigate('/chat-soporte', { state: { item } }); }} sx={{ textTransform: 'none', borderRadius: 50, fontWeight: 700, fontSize: '0.7rem', py: 0.5 }}>
                                    {item.estadoItem === 'chatting' || item.estadoItem === 'escalated' ? 'Ver Chat' : 'Reportar Problema'}
                                </Button>
                            </Stack>
                        </Box>

                    </ListItem>
                )})}
            </List>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3, p: 2, bgcolor: '#f8fafc', borderRadius: 2 }}>
                <Typography variant="h6" fontWeight={800}>Total del Pedido</Typography>
                <Typography variant="h6" fontWeight={800} color="primary">${(Number(pedidoSeleccionado?.total)||0).toLocaleString('es-MX')}</Typography>
            </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
            <Button onClick={() => setOpenDetails(false)} variant="contained" color="inherit" fullWidth sx={{ borderRadius: 50, fontWeight: 700, boxShadow: 'none', color: '#111' }}>Cerrar Panel</Button>
        </DialogActions>
      </Dialog>

    </Container>
  );
}

export default Perfil;