import { useState } from 'react';
import {
  Box, Typography, Chip, IconButton, Modal,
  Alert, Divider, CircularProgress, Button,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import StarIcon from '@mui/icons-material/Star';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
 
export default function DetalleModal({ item, onClose }) {
  const [cargandoIA, setCargandoIA] = useState(false);
  const [analisisIA, setAnalisisIA] = useState(null);
  const [errorIA, setErrorIA] = useState(null);
 
  const generarAnalisis = async () => {
    setCargandoIA(true);
    setErrorIA(null);
    try {
      const prompt = `Eres un asistente de análisis de negocios para una plataforma de servicios y productos llamada MonkeyMarket.
 
Analiza el siguiente artículo de un proveedor y genera un breve resumen (3-4 oraciones) simulando opiniones de clientes, destacando puntos fuertes y áreas de mejora. Responde directamente el análisis, sin saludos ni introducciones.
 
Artículo: "${item.nombre}"
Tipo: ${item.tipo}
Descripción: "${item.descripcion}"
Precio: $${item.precio} MXN
Calificación: ${item.calificacion ?? 'Sin calificaciones aún'} estrellas (${item.reseñas} reseñas)
${item.tipo === 'servicio'
  ? `Días disponibles: ${item.diasDisponibles?.join(', ')}`
  : `Stock: ${item.stock} unidades`
}`;
 
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      const data = await res.json();
      const texto = data.content?.find(b => b.type === 'text')?.text ?? 'Sin respuesta';
      setAnalisisIA(texto);
    } catch (e) {
      setErrorIA('No se pudo conectar con el análisis IA. Intenta de nuevo.');
    } finally {
      setCargandoIA(false);
    }
  };
 
  const textoAnalisis = analisisIA ?? item?.opinionesIA;
 
  if (!item) return null;
 
  return (
    <Modal open={Boolean(item)} onClose={onClose}>
      <Box sx={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: 'white', borderRadius: { xs: 2, sm: 4 },
        p: 0, width: { xs: '95%', sm: '100%' }, maxWidth: 580,
        boxShadow: 24, outline: 'none',
        maxHeight: '92vh', overflowY: 'auto',
      }}>
        {/* Foto encabezado */}
        <Box sx={{ position: 'relative', height: 200, borderRadius: '16px 16px 0 0', overflow: 'hidden' }}>
          <img
            src={item.fotos?.[0] || `https://picsum.photos/seed/${item.id}/580/200`}
            alt={item.nombre}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)' }} />
          <IconButton
            onClick={onClose}
            sx={{ position: 'absolute', top: 12, right: 12, backgroundColor: 'rgba(0,0,0,0.4)', color: 'white', '&:hover': { backgroundColor: 'rgba(0,0,0,0.6)' } }}
          >
            <CloseIcon />
          </IconButton>
          <Box sx={{ position: 'absolute', bottom: 12, left: 16 }}>
            <Chip
              label={item.tipo === 'servicio' ? 'Servicio' : 'Producto'}
              size="small"
              sx={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white', backdropFilter: 'blur(4px)', fontWeight: 600, mb: 0.5 }}
            />
            <Typography variant="h6" fontWeight={800} color="white">{item.nombre}</Typography>
          </Box>
        </Box>
 
        <Box sx={{ p: 3 }}>
          {/* Info principal */}
          <Box sx={{ display: 'flex', gap: { xs: 2, sm: 3 }, mb: 2.5, flexWrap: 'wrap' }}>
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>PRECIO</Typography>
              <Typography variant="h5" fontWeight={800} color="primary">
                ${item.precio.toLocaleString('es-MX')} MXN
              </Typography>
            </Box>
            {item.calificacion && (
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>CALIFICACIÓN</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <StarIcon sx={{ color: '#f59e0b', fontSize: 20 }} />
                  <Typography variant="h5" fontWeight={800}>{item.calificacion}</Typography>
                  <Typography variant="body2" color="text.secondary">/ 5 ({item.reseñas} reseñas)</Typography>
                </Box>
              </Box>
            )}
            {item.tipo === 'producto' && (
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>STOCK</Typography>
                <Typography variant="h5" fontWeight={800}>{item.stock} unidades</Typography>
              </Box>
            )}
          </Box>
 
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, lineHeight: 1.7 }}>
            {item.descripcion}
          </Typography>
 
          {/* Disponibilidad — solo servicio */}
          {item.tipo === 'servicio' && (
            <Box sx={{ mb: 2.5 }}>
              <Typography variant="body2" fontWeight={700} sx={{ mb: 1 }}>Disponibilidad</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.6, mb: 1 }}>
                {item.diasDisponibles?.map(d => (
                  <Chip key={d} label={d} size="small" color="primary" variant="outlined" sx={{ fontWeight: 500 }} />
                ))}
              </Box>
              {item.horario && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <AccessTimeIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    {item.horario.inicio} – {item.horario.fin} hrs
                  </Typography>
                </Box>
              )}
            </Box>
          )}
 
          <Divider sx={{ mb: 2.5 }} />
 
          {/* Análisis IA */}
          <Box sx={{ backgroundColor: '#f8faff', borderRadius: 3, p: 2.5, border: '1px solid #e0e7ff' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AutoAwesomeIcon sx={{ color: '#6366f1', fontSize: 20 }} />
                <Typography variant="body1" fontWeight={700} color="#3730a3">
                  Análisis IA de opiniones
                </Typography>
              </Box>
              <Button
                size="small"
                variant="contained"
                onClick={generarAnalisis}
                disabled={cargandoIA}
                startIcon={cargandoIA
                  ? <CircularProgress size={12} color="inherit" />
                  : <AutoAwesomeIcon fontSize="small" />
                }
                sx={{
                  textTransform: 'none', borderRadius: 2,
                  backgroundColor: '#6366f1', '&:hover': { backgroundColor: '#4f46e5' },
                  fontSize: 12,
                }}
              >
                {cargandoIA ? 'Analizando...' : textoAnalisis ? 'Actualizar análisis' : 'Generar análisis'}
              </Button>
            </Box>
 
            {errorIA && <Alert severity="error" sx={{ mb: 1 }}>{errorIA}</Alert>}
 
            {textoAnalisis ? (
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                {textoAnalisis}
              </Typography>
            ) : !cargandoIA && (
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <AutoAwesomeIcon sx={{ fontSize: 32, color: '#c7d2fe', mb: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Haz clic en <strong>Generar análisis</strong> para obtener un resumen de las opiniones
                  de tus clientes sobre este artículo.
                </Typography>
              </Box>
            )}
 
            {cargandoIA && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1 }}>
                <CircularProgress size={18} sx={{ color: '#6366f1' }} />
                <Typography variant="body2" color="text.secondary">
                  Procesando opiniones con IA...
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </Modal>
  );
}