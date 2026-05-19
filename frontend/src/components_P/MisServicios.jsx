import {
  Box, Typography, Button, Chip, IconButton,
  Card, CardContent, CardMedia, CardActions, Grid,
  Tabs, Tab, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Pagination // 🚀 Importamos el paginador de MUI
} from '@mui/material';
import api from '../config/api'; 
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PauseCircleIcon from '@mui/icons-material/PauseCircle';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import StorefrontIcon from '@mui/icons-material/Storefront';
import BuildIcon from '@mui/icons-material/Build';
import InventoryIcon from '@mui/icons-material/Inventory';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import StarIcon from '@mui/icons-material/Star';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import BlockIcon from '@mui/icons-material/Block';
import { useState, useEffect } from 'react'; // 🚀 Agregamos useEffect

import ItemFormModal from './ItemFormModal';
import DetalleModal from './DetalleModal';
import { useStore } from './Store';
import { useAlert } from '../context/AlertContext';

export default function MisServicios({ busqueda = '', user }) {
  const { showAlert } = useAlert();
  const { state, actions } = useStore();
  const items = state.items;

  const [tabActiva, setTabActiva]           = useState('todos');
  const [modalForm, setModalForm]           = useState(false);
  const [editando, setEditando]             = useState(null);
  const [modalDetalle, setModalDetalle]     = useState(null);
  const [confirmarEliminar, setConfirmarEliminar] = useState(null);

  // 🚀 ESTADOS PARA LA PAGINACIÓN
  const [paginaActual, setPaginaActual] = useState(1);
  const itemsPorPagina = 12; // Mostramos de 12 en 12 para que la cuadrícula siempre cuadre

  // 1. Filtrar los items normalmente
  const itemsFiltrados = items.filter(item => {
    const matchTab = tabActiva === 'todos' || item.tipo === tabActiva || item.estado === tabActiva;
    const matchBusqueda = item.nombre.toLowerCase().includes(busqueda.toLowerCase());
    return matchTab && matchBusqueda;
  });

  // 🚀 2. Reiniciar a la página 1 si el usuario busca algo o cambia de pestaña
  useEffect(() => {
    setPaginaActual(1);
  }, [busqueda, tabActiva, items.length]);

  // 🚀 3. Calcular los items que se mostrarán en la página actual
  const cantidadPaginas = Math.ceil(itemsFiltrados.length / itemsPorPagina);
  const indiceUltimoItem = paginaActual * itemsPorPagina;
  const indicePrimerItem = indiceUltimoItem - itemsPorPagina;
  const itemsMostrados = itemsFiltrados.slice(indicePrimerItem, indiceUltimoItem);

  const handleNuevo   = () => { setEditando(null); setModalForm(true); };
  const handleEditar  = (item) => { setEditando(item); setModalForm(true); };

  const handleGuardar = async (datos, archivosFisicos) => {
    try {
      let urlsNubes = [];
      if (archivosFisicos && archivosFisicos.length > 0) {
        const uploadPromises = archivosFisicos.map(async (file) => {
          const formData = new FormData();
          formData.append('image', file); 
          const res = await api.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
          return res.data.url;
        });
        urlsNubes = await Promise.all(uploadPromises);
      } else { urlsNubes = datos.fotos || []; }

      if (datos.tipo === 'producto') {
        const payloadProducto = { titulo: datos.nombre, descripcion: datos.descripcion, precio: datos.precio, stock: datos.stock, categoria: datos.categoria, imagenes: urlsNubes };
        if (editando) { await api.put(`/products/${editando.dbId}`, payloadProducto); } 
        else {
          const res = await api.post('/products', payloadProducto);
          datos.id = `prod_${res.data.productoId}`; datos.dbId = res.data.productoId; datos.estado = 'activo';
        }
      } else {
        const payloadServicio = { titulo: datos.nombre, descripcion: datos.descripcion, precio: datos.precio, datos_agenda: { dias: datos.diasDisponibles, horario: datos.horario }, categoria: datos.categoria, imagenes: urlsNubes };
        if (editando) { await api.put(`/services/${editando.dbId}`, payloadServicio); } 
        else {
          const res = await api.post('/services', payloadServicio);
          datos.id = `serv_${res.data.serviceId}`; datos.dbId = res.data.serviceId; datos.estado = 'activo';
        }
      }

      if (editando) { actions.editarItem({ id: editando.id, ...datos, fotos: urlsNubes }); } 
      else { actions.agregarItem({ ...datos, fotos: urlsNubes }); }
      setModalForm(false); setEditando(null); showAlert("¡Publicado con éxito en MonkeyMarket! 🚀", "success");
    } catch (error) {
      showAlert(error.response?.data?.message || "Hubo un error al conectar con el servidor.", "error");
    }
  };

  const handleTogglePausa = async (idString) => {
    try {
      const [prefijo, idReal] = idString.split('_');
      const endpoint = prefijo === 'prod' ? `/products/${idReal}/toggle` : `/services/${idReal}/toggle`;
      await api.patch(endpoint);
      actions.togglePausa(idString); 
    } catch (error) {
      showAlert(error.response?.data?.message || "No se pudo cambiar el estado del artículo.", "error");
    }
  };

  const handleEliminar = async (idString) => {
    try {
      const [prefijo, idReal] = idString.split('_');
      const endpoint = prefijo === 'prod' ? `/products/${idReal}` : `/services/${idReal}`;
      await api.delete(endpoint);
      actions.eliminarItem(idString);
      setConfirmarEliminar(null);
    } catch (error) { showAlert("No se pudo eliminar el artículo.", "error"); }
  };

  const conteos = {
    todos:    items.length,
    servicio: items.filter(i => i.tipo === 'servicio').length,
    producto: items.filter(i => i.tipo === 'producto').length,
    pausado:  items.filter(i => i.estado === 'pausado' || i.estado === 'bloqueado').length,
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', mb: 3, flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Mis Servicios y Productos</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Administra tu catálogo y analiza el rendimiento de cada artículo</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleNuevo} sx={{ borderRadius: 50, px: 3, textTransform: 'none', fontWeight: 600, backgroundColor: '#FACC15', color: '#111', alignSelf: { xs: 'flex-start', sm: 'auto' } }}>Nuevo artículo</Button>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Tabs value={tabActiva} onChange={(_, v) => setTabActiva(v)} variant="scrollable" scrollButtons="auto" sx={{ '& .MuiTab-root': { textTransform: 'none', fontWeight: 500, minHeight: 36 } }}>
          <Tab label={`Todos (${conteos.todos})`} value="todos" />
          <Tab label={`Servicios (${conteos.servicio})`} value="servicio" />
          <Tab label={`Productos (${conteos.producto})`} value="producto" />
          <Tab label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><PauseCircleIcon fontSize="small" /> Pausados ({conteos.pausado})</Box>} value="pausado" />
        </Tabs>
      </Box>

      {itemsFiltrados.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
          <StorefrontIcon sx={{ fontSize: 56, opacity: 0.2, mb: 2 }} />
          <Typography variant="h6" fontWeight={600}>Sin artículos</Typography>
          <Typography variant="body2">Crea tu primer servicio o producto para empezar a recibir reservas.</Typography>
        </Box>
      ) : (
        <>
          <Grid container spacing={2}>
            {/* 🚀 Usamos itemsMostrados en lugar de itemsFiltrados */}
            {itemsMostrados.map(item => (
              <Grid item xs={12} sm={6} lg={4} key={item.id}>
                <ItemCard item={item} onEditar={() => handleEditar(item)} onTogglePausa={() => handleTogglePausa(item.id)} onEliminar={() => setConfirmarEliminar(item.id)} onVerDetalle={() => setModalDetalle(item)} />
              </Grid>
            ))}
          </Grid>

          {/* 🚀 Controles de Paginación al fondo */}
          {cantidadPaginas > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5, mb: 2 }}>
              <Pagination
                count={cantidadPaginas} 
                page={paginaActual}
                onChange={(evento, valor) => { 
                  setPaginaActual(valor); 
                  // Opcional: Hacer scroll hacia arriba suavemente al cambiar de página
                  window.scrollTo({ top: 0, behavior: 'smooth' }); 
                }}
                color="primary" 
                size="large" 
                shape="rounded"
              />
            </Box>
          )}
        </>
      )}

      <ItemFormModal open={modalForm} onClose={() => { setModalForm(false); setEditando(null); }} onGuardar={handleGuardar} inicial={editando} />
      <DetalleModal item={modalDetalle} onClose={() => setModalDetalle(null)} />

      <Dialog open={Boolean(confirmarEliminar)} onClose={() => setConfirmarEliminar(null)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700}>¿Eliminar artículo?</DialogTitle>
        <DialogContent><Typography variant="body2" color="text.secondary">Esta acción es permanente. Si sólo quieres ocultarlo temporalmente, usa <strong>Pausar</strong>.</Typography></DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button variant="outlined" onClick={() => setConfirmarEliminar(null)} sx={{ textTransform: 'none' }}>Cancelar</Button>
          <Button variant="contained" color="error" onClick={() => handleEliminar(confirmarEliminar)} sx={{ textTransform: 'none' }}>Sí, eliminar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function ItemCard({ item, onEditar, onTogglePausa, onEliminar, onVerDetalle }) {
  const pausado = item.estado === 'pausado';
  const bloqueado = item.estado === 'bloqueado'; 
  
  const [fotoIndex, setFotoIndex] = useState(0);

  // 1. Extraemos las fotos limpiamente (gracias a tu console.log sabemos que SÍ es un Array)
  let arrayFotos = [];
  if (Array.isArray(item.fotos) && item.fotos.length > 0) {
    arrayFotos = item.fotos;
  } else if (Array.isArray(item.imagenes) && item.imagenes.length > 0) {
    arrayFotos = item.imagenes;
  } else if (typeof item.fotos === 'string' && item.fotos.startsWith('[')) {
    try { arrayFotos = JSON.parse(item.fotos); } catch(e){}
  }

  // 2. Si todo falla, ponemos la de respaldo
  const fotosSeguras = arrayFotos.length > 0 
    ? arrayFotos 
    : [`https://placehold.co/400x300/e2e8f0/1e293b?text=Sin+Imagen`];

  // 3. Limpiamos la URL quitando espacios fantasmas que rompen Material UI
  const urlLimpia = typeof fotosSeguras[fotoIndex] === 'string' 
    ? fotosSeguras[fotoIndex].trim() 
    : fotosSeguras[fotoIndex];

  const nextFoto = (e) => { e.stopPropagation(); setFotoIndex((prev) => (prev === fotosSeguras.length - 1 ? 0 : prev + 1)); };
  const prevFoto = (e) => { e.stopPropagation(); setFotoIndex((prev) => (prev === 0 ? fotosSeguras.length - 1 : prev - 1)); };

  return (
    <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', opacity: (pausado || bloqueado) ? 0.75 : 1, border: (pausado || bloqueado) ? '1.5px dashed #d1d5db' : '1.5px solid transparent', transition: 'all 0.2s', '&:hover': { boxShadow: '0 6px 24px rgba(0,0,0,0.12)', transform: 'translateY(-2px)' }, position: 'relative', overflow: 'visible', }}>
      {pausado && !bloqueado && (
        <Chip label="Pausado" size="small" icon={<PauseCircleIcon fontSize="small" />} sx={{ position: 'absolute', top: -10, left: 12, zIndex: 10, backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', fontWeight: 600, fontSize: 11 }} />
      )}
      {bloqueado && (
        <Chip label="Bloqueado por Admin" size="small" color="error" icon={<BlockIcon fontSize="small" />} sx={{ position: 'absolute', top: -10, left: 12, zIndex: 10, fontWeight: 700, fontSize: 11 }} />
      )}

      <Box sx={{ position: 'relative', height: 180, overflow: 'hidden', borderRadius: '12px 12px 0 0', '&:hover .carrusel-btn': { opacity: 1 } }}>
        
        {/* 🚀 LA SOLUCIÓN: Usamos "src" en lugar de "image" para forzar al navegador a pintarla */}
        <CardMedia 
          component="img" 
          height="180" 
          src={urlLimpia} 
          alt={item.nombre || 'Producto'} 
          sx={{ objectFit: 'cover', filter: (pausado || bloqueado) ? 'grayscale(60%)' : 'none', transition: 'filter 0.3s' }} 
        />
        
        {fotosSeguras.length > 1 && (
          <>
            <IconButton className="carrusel-btn" onClick={prevFoto} size="small" sx={{ position: 'absolute', top: '50%', left: 8, transform: 'translateY(-50%)', bgcolor: 'rgba(255,255,255,0.7)', opacity: 0, transition: 'opacity 0.2s', '&:hover': { bgcolor: 'white' } }}><ChevronLeftIcon /></IconButton>
            <IconButton className="carrusel-btn" onClick={nextFoto} size="small" sx={{ position: 'absolute', top: '50%', right: 8, transform: 'translateY(-50%)', bgcolor: 'rgba(255,255,255,0.7)', opacity: 0, transition: 'opacity 0.2s', '&:hover': { bgcolor: 'white' } }}><ChevronRightIcon /></IconButton>
            <Box sx={{ position: 'absolute', bottom: 8, width: '100%', display: 'flex', justifyContent: 'center', gap: 0.5 }}>
              {fotosSeguras.map((_, i) => (<Box key={i} sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: i === fotoIndex ? 'white' : 'rgba(255,255,255,0.5)', transition: 'background-color 0.3s' }} />))}
            </Box>
          </>
        )}

        <Chip label={item.tipo === 'servicio' ? 'Servicio' : 'Producto'} size="small" icon={item.tipo === 'servicio' ? <BuildIcon sx={{ fontSize: '13px !important' }} /> : <InventoryIcon sx={{ fontSize: '13px !important' }} />} sx={{ position: 'absolute', top: 10, right: 10, zIndex: 5, backgroundColor: item.tipo === 'servicio' ? '#dbeafe' : '#d1fae5', color: item.tipo === 'servicio' ? '#1d4ed8' : '#065f46', fontWeight: 600, fontSize: 11 }} />
      </Box>

      <CardContent sx={{ pb: 1 }}>
        <Typography variant="caption" color="primary" fontWeight={800} sx={{ display: 'block', mb: 0.3, textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: 0.5 }}>{item.categoria}</Typography>
        <Typography variant="subtitle1" fontWeight={700} noWrap sx={{ lineHeight: 1.2 }}>{item.nombre}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.descripcion}</Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" fontWeight={800} color="primary">${Number(item.precio || 0).toLocaleString('es-MX')} <Typography component="span" variant="caption" color="text.secondary" fontWeight={400}>MXN</Typography></Typography>
          {item.calificacion && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
              <StarIcon sx={{ fontSize: 15, color: '#f59e0b' }} />
              <Typography variant="body2" fontWeight={600}>{item.calificacion}</Typography>
              <Typography variant="caption" color="text.secondary">({item.reseñas})</Typography>
            </Box>
          )}
        </Box>
      </CardContent>

      <CardActions sx={{ px: 2, pb: 2, pt: 0, gap: 0.5 }}>
        <Button size="small" variant="outlined" sx={{ textTransform: 'none', flex: 1, borderRadius: 2 }} onClick={onVerDetalle} startIcon={<AutoAwesomeIcon fontSize="small" />}>Análisis IA</Button>
        <Tooltip title={bloqueado ? 'Contacta al Administrador' : pausado ? 'Reactivar' : 'Pausar temporalmente'}>
          <span>
            <IconButton size="small" onClick={() => onTogglePausa(item.id)} color={pausado || bloqueado ? 'success' : 'warning'} disabled={bloqueado} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}>
              {pausado || bloqueado ? <PlayCircleIcon fontSize="small" /> : <PauseCircleIcon fontSize="small" />}
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Editar"><IconButton size="small" onClick={onEditar} color="primary" sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}><EditIcon fontSize="small" /></IconButton></Tooltip>
        <Tooltip title="Eliminar"><IconButton size="small" onClick={onEliminar} color="error" sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
      </CardActions>
    </Card>
  );
}