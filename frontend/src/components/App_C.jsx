import React, { useState, useEffect } from 'react';
import {
  Box, Typography, TextField, Card, CardContent, CardMedia,
  InputAdornment, Chip, Slider, Checkbox, FormControlLabel,
  IconButton, Badge, Button, Paper, InputBase, Divider,
  RadioGroup, Radio, Select, MenuItem, OutlinedInput, ListItemText,
  Snackbar, Alert, Dialog, DialogTitle, DialogContent, DialogActions, Rating, Avatar, CircularProgress,
  Pagination
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import NotificationsIcon from '@mui/icons-material/Notifications';
import PersonIcon from '@mui/icons-material/Person';
import StarIcon from '@mui/icons-material/Star';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import FilterListIcon from '@mui/icons-material/FilterList';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import NewReleasesIcon from '@mui/icons-material/NewReleases';
import { useNavigate } from 'react-router-dom';
import api from '../config/api';

const categorias = [
  'Mobiliario', 'Audio e Iluminación', 'Decoración', 'Alimentos y Bebidas',
  'Fotografía y Video', 'Entretenimiento', 'Recintos y Salones', 'Personal y Staff',
  'Repostería y Dulces', 'Recuerdos y Souvenirs', 'Transporte y Logística'
];

function AppC({ user, carrito, setCarrito, agregarAlCarrito, ajustarCantidad }) {
  const navigate = useNavigate();

  const [productosData, setProductosData] = useState([]);
  const [cargando, setCargando] = useState(true);

  const [busqueda, setBusqueda] = useState('');
  const [categoriasSeleccionadas, setCategoriasSeleccionadas] = useState([]);
  const [precioRange, setPrecioRange] = useState([0, 50000]);
  const [promptValue, setPromptValue] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState('Todos');
  const [calificacionMinima, setCalificacionMinima] = useState(0);

  // 🚀 ESTADOS CON PERSISTENCIA DE LA IA (Local Storage)
  const [idsRecomendados, setIdsRecomendados] = useState(() => {
    const saved = localStorage.getItem('monkey_idsRecomendados');
    return saved ? JSON.parse(saved) : [];
  });
  const [chatPhase, setChatPhase] = useState(() => {
    return localStorage.getItem('monkey_chatPhase') || 'idle';
  });
  const [chatHistory, setChatHistory] = useState(() => {
    const saved = localStorage.getItem('monkey_chatHistory');
    return saved ? JSON.parse(saved) : [];
  });

  const [isAITyping, setIsAITyping] = useState(false);
  const [fechaSeleccionada, setFechaSeleccionada] = useState('');
  const [horaSeleccionada, setHoraSeleccionada] = useState('');

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarKey, setSnackbarKey] = useState(0);
  const [mensajeAlerta, setMensajeAlerta] = useState('');
  const [cantidades, setCantidades] = useState({});

  // 🚀 NUEVOS ESTADOS FUSIONADOS (Búsqueda Backend y Modales)
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalFotoIndex, setModalFotoIndex] = useState(0);
  const [resultados, setResultados] = useState([]);
  const [cargandoBusqueda, setCargandoBusqueda] = useState(false);

  const [paginaActual, setPaginaActual] = useState(1);
  const itemsPorPagina = 12;

  // GUARDAR EN LOCAL STORAGE CADA VEZ QUE LA IA RESPONDE
  useEffect(() => {
    localStorage.setItem('monkey_idsRecomendados', JSON.stringify(idsRecomendados));
    localStorage.setItem('monkey_chatPhase', chatPhase);
    localStorage.setItem('monkey_chatHistory', JSON.stringify(chatHistory));
  }, [idsRecomendados, chatPhase, chatHistory]);

// CONSULTA DIRECTA A MYSQL AL INICIAR
  useEffect(() => {
    const fetchCatalogo = async () => {
      try {
        setCargando(true);
        const [resProds, resSvcs] = await Promise.all([
          api.get('/products').catch(() => ({ data: [] })),
          api.get('/services').catch(() => ({ data: [] })),
        ]);

        // 🚀 EXTRACTOR BLINDADO PARA PRODUCTOS
        const productosNorm = resProds.data.map(p => ({
          id: `prod_${p.id}`,
          dbId: p.id,
          nombre: p.titulo,
          descripcion: p.descripcion,
          precio: Number(p.precio),
          tipo: 'Producto',
          categoria: p.categoria || 'Varios',
          fotos: (() => {
            const raw = p.imagenes || p.fotos;
            if (!raw) return [];
            if (Array.isArray(raw)) return raw;
            if (typeof raw === 'string') {
              try { return JSON.parse(raw); } 
              catch(e) {
                const links = raw.match(/https?:\/\/[^\s"'\\]+/g);
                return links || [];
              }
            }
            return [];
          })(),
          stock: p.stock,
          calificacion: Number(p.calificacion_promedio || 0).toFixed(1),
          reseñas: p.total_resenas || 0,
          vendor: p.nombre_proveedor || 'Proveedor Verificado',
        }));

        // 🚀 EXTRACTOR BLINDADO PARA SERVICIOS
        const serviciosNorm = resSvcs.data.map(s => ({
          id: `serv_${s.id}`,
          dbId: s.id,
          nombre: s.titulo,
          descripcion: s.descripcion,
          precio: Number(s.precio),
          tipo: 'Servicio',
          categoria: s.categoria || 'Varios',
          fotos: (() => {
            const raw = s.imagenes || s.fotos;
            if (!raw) return [];
            if (Array.isArray(raw)) return raw;
            if (typeof raw === 'string') {
              try { return JSON.parse(raw); } 
              catch(e) {
                const links = raw.match(/https?:\/\/[^\s"'\\]+/g);
                return links || [];
              }
            }
            return [];
          })(),
          calificacion: Number(s.calificacion_promedio || 0).toFixed(1),
          reseñas: s.total_resenas || 0,
          vendor: s.nombre_proveedor || 'Proveedor Verificado',
        }));

        setProductosData([...productosNorm, ...serviciosNorm]);
      } catch (error) {
        console.error("Error al cargar el catálogo de MySQL:", error);
      } finally {
        setCargando(false);
      }
    };
    fetchCatalogo();
  }, []);

  const handleSendPrompt = async (e) => {
    if (e) e.preventDefault();
    const userText = promptValue.trim();
    if (!userText) return;

    if (chatPhase === 'idle' || chatPhase === 'results') {
      setChatPhase('chatting');
    }

    setChatHistory(prev => [...prev, { role: 'user', text: userText }]);
    setPromptValue('');
    setIsAITyping(true);

    try {
      const historial = chatHistory.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.text
      }));

      const response = await api.post('/ai/analyze', {
        message: userText,
        history: historial
      });

      const { action, content, entities } = response.data;

      setIsAITyping(false);
      setChatHistory(prev => [...prev, { role: 'ai', text: content }]);

      if (entities?.recommendations && entities.recommendations.length > 0) {
        setChatPhase('results');
        setIdsRecomendados(entities.recommendations.map(r => r.id));
      } else if (action === 'RECOMMENDATION') {
        setChatPhase('results');
      }

    } catch (error) {
      console.error("Error communicating with MonkeyIA:", error);
      setIsAITyping(false);
      setChatHistory(prev => [...prev, {
        role: 'ai',
        text: 'Lo siento, tuve un problema conectando con mi base de datos. 🐵 ¿Podrías intentar de nuevo?'
      }]);
    }
  };

  const buscarEnBackend = async (termino) => {
    if (termino.trim() === '') {
        setResultados([]);
        return;
    }
    setCargandoBusqueda(true); 
    try {
        const response = await fetch(`http://localhost:3000/api/search?q=${termino}`);
        const data = await response.json();
        setResultados(data);
    } catch (error) {
        console.error("Error al buscar:", error);
    } finally {
        setCargandoBusqueda(false);
    }
  };

  // 🚀 FUSIÓN DE FILTROS: Soporta la IA y el nuevo buscador del backend
  const productosBase = busqueda ? resultados : productosData;
  const productosFiltrados = productosBase.filter(p => {
    // FILTRO ESTRELLA: Mostrar solo las tarjetas recomendadas por la IA (si existen)
    if (idsRecomendados.length > 0 && !idsRecomendados.includes(p.id)) return false;

    if (tipoFiltro !== 'Todos' && p.tipo !== tipoFiltro) return false;
    if (categoriasSeleccionadas.length > 0 && !categoriasSeleccionadas.includes(p.categoria)) return false;
    if (p.precio < precioRange[0] || p.precio > precioRange[1]) return false;
    if (calificacionMinima > 0) {
      if (p.rating === null || p.rating < calificacionMinima) return false;
    }
    // El filtro local de búsqueda se mantiene como respaldo secundario
    if (busqueda && resultados.length === 0) {
      const query = busqueda.toLowerCase();
      const matchNombre = p.nombre.toLowerCase().includes(query);
      const matchVendor = p.vendor.toLowerCase().includes(query);
      if (!matchNombre && !matchVendor) return false;
    }
    return true;
  });

  const cantidadPaginas = Math.ceil(productosFiltrados.length / itemsPorPagina);
  const indiceUltimoItem = paginaActual * itemsPorPagina;
  const indicePrimerItem = indiceUltimoItem - itemsPorPagina;
  const productosMostrados = productosFiltrados.slice(indicePrimerItem, indiceUltimoItem);

  useEffect(() => {
    setPaginaActual(1);
  }, [busqueda, categoriasSeleccionadas, precioRange, tipoFiltro, calificacionMinima, idsRecomendados]);

  // LIMPIAR FILTROS Y MEMORIA DE IA
  const limpiarFiltros = () => {
    setCategoriasSeleccionadas([]);
    setPrecioRange([0, 50000]);
    setTipoFiltro('Todos');
    setCalificacionMinima(0);
    setBusqueda('');
    setResultados([]); // Limpiamos también el buscador backend
    setPaginaActual(1);
    
    setIdsRecomendados([]);
    setChatPhase('idle');
    setChatHistory([]);
    localStorage.removeItem('monkey_idsRecomendados');
    localStorage.removeItem('monkey_chatPhase');
    localStorage.removeItem('monkey_chatHistory');
  };

  const handleAgregarAlCarrito = async (producto) => {
    let cantidad = 1;
    let fechaFinal = null;

    if (producto.tipo === 'Servicio') {
      if (!fechaSeleccionada || !horaSeleccionada) {
        setMensajeAlerta('Por favor selecciona una fecha y hora para el servicio.');
        setSnackbarKey(Date.now());
        setSnackbarOpen(true);
        return false;
      }
      fechaFinal = `${fechaSeleccionada} ${horaSeleccionada}`;
    } else {
      const qtyRaw = cantidades[producto.id] || 1;
      cantidad = Number(qtyRaw);
    }

    await agregarAlCarrito(producto, cantidad, fechaFinal);

    setMensajeAlerta(producto.tipo === 'Servicio'
      ? `¡Servicio agendado para el ${fechaSeleccionada} y guardado!`
      : `¡${cantidad}x ${producto.nombre} añadidos a tu carrito!`
    );

    setSnackbarKey(Date.now());
    setSnackbarOpen(true);
    setCantidades(prev => ({ ...prev, [producto.id]: 1 }));
    return true;
  };

  const cambiarCantidad = (producto, delta) => {
    const id = producto.id;
    const nuevaCantidad = Math.max(1, (cantidades[id] || 1) + delta);
    setCantidades(prev => ({ ...prev, [id]: nuevaCantidad }));

    const estaEnCarrito = carrito.some(item => item.id === id);
    if (estaEnCarrito && ajustarCantidad) {
      ajustarCantidad(producto, nuevaCantidad);
    }
  };

    const abrirDetalles = (producto) => navigate(`/articulo/${producto.id}`);

  const cerrarDetalles = () => {
    setModalAbierto(false);
  };

  return (
    <Box sx={{ backgroundColor: 'background.default', minHeight: '100vh' }}>

      <Box sx={{ pt: 6, pb: 2, px: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', background: 'linear-gradient(135deg, #ffffff 0%, #eff6ff 100%)' }}>
        {chatPhase === 'idle' && (
          <>
            <Typography variant="h3" fontWeight={800} gutterBottom sx={{ fontSize: { xs: '2rem', sm: '2.8rem', md: '3.5rem' }, color: '#111', textShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
              ¿Qué evento estás planeando?
            </Typography>
            <Typography variant="subtitle1" sx={{ mb: 5, maxWidth: 800, fontSize: '1.1rem', color: 'text.primary' }}>
              Describe tu idea y nuestra IA experta encontrará todo el equipo, decoración y servicios que necesitas en segundos.
            </Typography>
          </>
        )}

        {chatPhase !== 'idle' && (
          <Box sx={{
            width: '100%', maxWidth: 800, mb: 4, height: 350, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2, px: 1,
            '&::-webkit-scrollbar': { width: '6px' }, '&::-webkit-scrollbar-track': { background: 'transparent' }, '&::-webkit-scrollbar-thumb': { backgroundColor: '#cbd5e1', borderRadius: '10px' }
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, alignSelf: 'center' }}>
              <AutoAwesomeIcon sx={{ color: 'primary.main', fontSize: 24 }} />
              <Typography variant="h6" fontWeight={800} color="primary">Asistente IA de Eventos</Typography>
            </Box>
            {chatHistory.map((msg, idx) => (
              <Box key={idx} sx={{
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                backgroundColor: msg.role === 'user' ? '#3B82F6' : '#fff', color: msg.role === 'user' ? '#fff' : '#111',
                p: 2, borderRadius: 4, borderBottomRightRadius: msg.role === 'user' ? 4 : 20, borderBottomLeftRadius: msg.role === 'ai' ? 4 : 20,
                border: msg.role === 'ai' ? '1px solid #e5e7eb' : 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', maxWidth: '85%', textAlign: 'left'
              }}>
                <Typography variant="body1" sx={{ fontWeight: msg.role === 'user' ? 600 : 500, lineHeight: 1.5 }}>{msg.text}</Typography>
              </Box>
            ))}
            {isAITyping && (
              <Box sx={{ alignSelf: 'flex-start', backgroundColor: '#fff', p: 2, borderRadius: 4, borderBottomLeftRadius: 4, border: '1px solid #e5e7eb', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', display: 'flex', gap: 1, alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary" fontStyle="italic" fontWeight={600}>MonkeyIA está pensando...</Typography>
              </Box>
            )}
          </Box>
        )}

        <Paper component="form" onSubmit={handleSendPrompt} elevation={0} sx={{ p: '6px 6px 6px 20px', display: 'flex', alignItems: 'center', width: '100%', maxWidth: 800, borderRadius: 50, mb: 4, border: '2px solid', borderColor: 'primary.main', boxShadow: '0 10px 30px rgba(59, 130, 246, 0.15)', transition: 'box-shadow 0.3s', '&:hover': { boxShadow: '0 15px 35px rgba(59, 130, 246, 0.2)' } }}>
          <AutoAwesomeIcon sx={{ color: '#3B82F6', mr: 1 }} />
          <InputBase sx={{ ml: 1, flex: 1, fontSize: '1.1rem' }} placeholder="Ej: Boda en la playa al atardecer para 50 personas..." value={promptValue} onChange={(e) => setPromptValue(e.target.value)} />
          <Button type="submit" variant="contained" disabled={isAITyping} sx={{ borderRadius: 50, px: 4, py: 1.5, fontSize: '1rem', backgroundColor: '#FACC15', color: '#111', boxShadow: '0 4px 14px 0 rgba(245, 158, 11, 0.4)', textTransform: 'none', fontWeight: 700, '&:hover': { backgroundColor: '#FDE047', boxShadow: '0 6px 20px rgba(245, 158, 11, 0.4)' }, '&:disabled': { backgroundColor: '#fde047', opacity: 0.7 } }}>
            {chatPhase === 'idle' ? 'Empezar' : 'Enviar'}
          </Button>
        </Paper>
      </Box>

      <Divider sx={{ mt: 0, mb: chatPhase === 'results' || chatPhase === 'idle' ? 4 : 0, borderColor: 'primary.main', borderBottomWidth: 2 }} />

      {(chatPhase === 'idle' || chatPhase === 'results') && (
        <Box sx={{ display: 'flex', gap: { xs: 2, sm: 3, md: 4 }, p: { xs: 2, sm: 3, md: 4 }, maxWidth: 1400, mx: 'auto', flexDirection: { xs: 'column', md: 'row' } }}>

          <Box sx={{ width: { xs: '100%', md: 260 }, flexShrink: 0, backgroundColor: 'white', borderRadius: 3, p: 2.5, height: 'fit-content', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FilterListIcon fontSize="small" />
                <Typography fontWeight={600}>Filtros</Typography>
              </Box>
              <Typography variant="body2" color="primary" sx={{ cursor: 'pointer' }} onClick={limpiarFiltros}>Limpiar</Typography>
            </Box>

            <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>Tipo</Typography>
            <RadioGroup value={tipoFiltro} onChange={(e) => setTipoFiltro(e.target.value)}>
              <FormControlLabel value="Todos" control={<Radio size="small" />} label={<Typography variant="body2">Todos</Typography>} />
              <FormControlLabel value="Producto" control={<Radio size="small" />} label={<Typography variant="body2">Productos</Typography>} />
              <FormControlLabel value="Servicio" control={<Radio size="small" />} label={<Typography variant="body2">Servicios</Typography>} />
            </RadioGroup>

            <Typography variant="body2" fontWeight={600} sx={{ mt: 2, mb: 1 }}>Categorías</Typography>
            <Select multiple displayEmpty value={categoriasSeleccionadas} onChange={(e) => setCategoriasSeleccionadas(e.target.value)} input={<OutlinedInput size="small" />} renderValue={(selected) => {
              if (selected.length === 0) return <Typography variant="body2" color="text.secondary">Todas las categorías</Typography>;
              return <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>{selected.map((value) => (<Chip key={value} label={value} size="small" sx={{ fontSize: '0.65rem', height: 20 }} />))}</Box>;
            }} sx={{ width: '100%', mb: 1 }}>
              {categorias.map((name) => (
                <MenuItem key={name} value={name}>
                  <Checkbox checked={categoriasSeleccionadas.includes(name)} size="small" />
                  <ListItemText primary={<Typography variant="body2">{name}</Typography>} />
                </MenuItem>
              ))}
            </Select>
          </Box>

          <Box sx={{ flex: 1 }}>

            {idsRecomendados.length > 0 && (
              <Alert
                icon={<AutoAwesomeIcon />}
                severity="info"
                sx={{ mb: 3, backgroundColor: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe', borderRadius: 3, fontWeight: 600 }}
                action={
                  <Button color="inherit" size="small" onClick={limpiarFiltros}>
                    Cerrar IA y ver todo el catálogo
                  </Button>
                }
              >
                Mostrando recomendaciones personalizadas de MonkeyIA ✨
              </Alert>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
              <Box>
                <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mb: 0 }}>Resultados del catálogo</Typography>
                <Typography variant="body2" color="text.secondary">
                  Mostrando {productosFiltrados.length} opciones disponibles
                </Typography>
              </Box>

              <TextField placeholder="Buscar productos, proveedores..." value={busqueda} 
                onChange={(e) => { 
                  setBusqueda(e.target.value);
                  buscarEnBackend(e.target.value); // 🚀 Ahora el buscador dispara tu nueva función
                }}
                sx={{
                  width: { xs: '100%', sm: 350, md: 450 },
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'white', borderRadius: 50, fontSize: { xs: '0.95rem', sm: '1.05rem' },
                    '& fieldset': { borderColor: 'primary.main', borderWidth: 2 },
                  }
                }}
                InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon sx={{ color: 'primary.main', fontSize: 26 }} /></InputAdornment>) }}
              />
            </Box>

            {cargando || cargandoBusqueda ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box>
            ) : productosFiltrados.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8 }}><Typography variant="h6" color="text.secondary">No hay artículos que coincidan con tu búsqueda.</Typography></Box>
            ) : (
              <>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: { xs: 2, sm: 3 } }}>
                  {productosMostrados.map(p => (
                    <ItemCardAppC
                      key={p.id} p={p}
                      abrirDetalles={abrirDetalles} cambiarCantidad={cambiarCantidad}
                      cantidades={cantidades} handleAgregarAlCarrito={handleAgregarAlCarrito}
                    />
                  ))}
                </Box>

                {cantidadPaginas > 1 && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5, mb: 2 }}>
                    <Pagination
                      count={cantidadPaginas} page={paginaActual}
                      onChange={(evento, valor) => { setPaginaActual(valor); window.scrollTo({ top: 350, behavior: 'smooth' }); }}
                      color="primary" size="large" shape="rounded"
                    />
                  </Box>
                )}
              </>
            )}
          </Box>
        </Box>
      )}

      <Snackbar key={snackbarKey} open={snackbarOpen} autoHideDuration={3000} onClose={() => setSnackbarOpen(false)} anchorOrigin={{ vertical: 'top', horizontal: 'center' }} sx={{ zIndex: 1400 }}>
        <Alert icon={false} onClose={() => setSnackbarOpen(false)} sx={{ width: '100%', borderRadius: 3, backgroundColor: '#fff', color: '#111', fontWeight: 600, border: '2px solid', borderColor: '#FACC15', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
          {mensajeAlerta}
        </Alert>
      </Snackbar>

    </Box>
  );
}

function ItemCardAppC({ p, abrirDetalles, cambiarCantidad, cantidades, handleAgregarAlCarrito }) {
  const [fotoIndex, setFotoIndex] = useState(0);
  const fotosSeguras = Array.isArray(p.fotos) && p.fotos.length > 0 ? p.fotos : [`https://picsum.photos/seed/${p.id}/400/300`];
  const nextFoto = (e) => { e.stopPropagation(); setFotoIndex((prev) => (prev === fotosSeguras.length - 1 ? 0 : prev + 1)); };
  const prevFoto = (e) => { e.stopPropagation(); setFotoIndex((prev) => (prev === 0 ? fotosSeguras.length - 1 : prev - 1)); };

  return (
    <Card onClick={() => abrirDetalles(p)} sx={{ borderRadius: 3, border: '1px solid #e5e7eb', boxShadow: '0 4px 10px rgba(0,0,0,0.03)', '&:hover': { boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', transform: 'translateY(-6px)' }, transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', cursor: 'pointer', overflow: 'visible' }}>
      <Box sx={{ position: 'relative', '&:hover .carrusel-btn': { opacity: 1 } }}>
        <CardMedia component="img" height="180" image={fotosSeguras[fotoIndex]} alt={p.nombre} sx={{ objectFit: 'cover', borderRadius: '12px 12px 0 0' }} />
        {fotosSeguras.length > 1 && (
          <>
            <IconButton className="carrusel-btn" onClick={prevFoto} size="small" sx={{ position: 'absolute', top: '50%', left: 8, transform: 'translateY(-50%)', bgcolor: 'rgba(255,255,255,0.7)', opacity: 0, transition: '0.2s', '&:hover': { bgcolor: 'white' } }}><ChevronLeftIcon /></IconButton>
            <IconButton className="carrusel-btn" onClick={nextFoto} size="small" sx={{ position: 'absolute', top: '50%', right: 8, transform: 'translateY(-50%)', bgcolor: 'rgba(255,255,255,0.7)', opacity: 0, transition: '0.2s', '&:hover': { bgcolor: 'white' } }}><ChevronRightIcon /></IconButton>
          </>
        )}
        <Chip label={p.tipo} size="small" sx={{ position: 'absolute', top: 12, right: 12, backgroundColor: p.tipo === 'Servicio' ? '#fff' : 'primary.main', color: p.tipo === 'Servicio' ? 'primary.main' : '#fff', border: p.tipo === 'Servicio' ? '2px solid' : 'none', borderColor: 'primary.main', fontWeight: 800, fontSize: 11, boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }} />
      </Box>
      <CardContent sx={{ pb: '12px !important' }}>
        <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5, lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.nombre}</Typography>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
          <Typography variant="h6" fontWeight={700} color="primary">${p.precio.toLocaleString('es-MX')}</Typography>
          <IconButton size="small" color="primary" onClick={(e) => { e.stopPropagation(); p.tipo === 'Producto' ? handleAgregarAlCarrito(p) : abrirDetalles(p); }} sx={{ backgroundColor: 'primary.main', color: 'white', '&:hover': { backgroundColor: 'primary.dark' } }}>
            {p.tipo === 'Producto' ? <AddShoppingCartIcon fontSize="small" /> : <CalendarMonthIcon fontSize="small" />}
          </IconButton>
        </Box>
      </CardContent>
    </Card>
  );
}

export default AppC;