import { useState } from 'react';
import {
  Box, Typography, Chip, Card, Avatar, Button,
  Tabs, Tab, Divider, TextField, Collapse, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Alert,
} from '@mui/material';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import BuildIcon from '@mui/icons-material/Build';
import InventoryIcon from '@mui/icons-material/Inventory';
import SendIcon from '@mui/icons-material/Send';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import StarIcon from '@mui/icons-material/Star';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import BlockIcon from '@mui/icons-material/Block';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { useNavigate } from 'react-router-dom';




// ─── Datos de ejemplo ─────────────────────────────────────────────────────────
const REPORTES_INICIALES = [
  {
    id: 'RPT-001',
    
    tipoProd: 'servicio',
    articulo: 'Fotografía para eventos',
    cliente: 'Emilio Ruiz',
    avatar: 'E',
    fecha: '17 Abr 2026',
    estatus: 'pendiente',
    mensaje: 'El fotógrafo llegó 40 minutos tarde al inicio del evento. Esto retrasó toda la agenda y nos perdimos las fotos de la recepción de los invitados, que era uno de los momentos más importantes.',
    respuesta: null,
  },
  {
    id: 'RPT-002',
    
    tipoProd: 'producto',
    articulo: 'Kit de iluminación vintage',
    cliente: 'Andrés Vega',
    avatar: 'A',
    fecha: '14 Abr 2026',
    estatus: 'respondido',
    mensaje: 'La descripción dice que el kit incluye cable de extensión de 10 metros, pero lo que llegó medía apenas 2 metros. Tuve que comprar uno extra el mismo día del evento.',
    respuesta: 'Hola Andrés, lamentamos mucho la confusión. Tienes razón, la descripción era incorrecta y ya la actualizamos. Te hemos enviado un cupón de descuento del 20% para tu próxima renta como compensación. Gracias por señalarlo.',
    fechaRespuesta: '15 Abr 2026',
  },
  {
    id: 'RPT-003',
    
    tipoProd: 'servicio',
    articulo: 'DJ para fiestas',
    cliente: 'Lucía Montoya',
    avatar: 'L',
    fecha: '10 Abr 2026',
    estatus: 'pendiente',
    mensaje: 'El equipo de sonido presentó fallas durante casi una hora. El DJ no contaba con equipo de respaldo y esto arruinó parte importante de la fiesta. Esperaba un servicio más profesional.',
    respuesta: null,
  },
  {
    id: 'RPT-004',
    
    tipoProd: 'servicio',
    articulo: 'Fotografía para eventos',
    cliente: 'Gabriela Soto',
    avatar: 'G',
    fecha: '05 Abr 2026',
    estatus: 'resuelto',
    mensaje: 'El asistente del fotógrafo fue bastante grosero con mis invitados al pedirles que se movieran para las tomas. No esperaba ese trato.',
    respuesta: 'Hola Gabriela, nos disculpamos sinceramente por la actitud de nuestro asistente. Eso no representa nuestros valores. Hablamos con él y tomamos medidas. Nos gustaría ofrecerte una sesión de retratos familiar sin costo como compensación.',
    fechaRespuesta: '06 Abr 2026',
  },
  {
    id: 'RPT-005',
    tipoProd: 'producto',
    articulo: 'Kit de iluminación vintage',
    cliente: 'Fernando Ibarra',
    avatar: 'F',
    fecha: '01 Abr 2026',
    estatus: 'respondido',
    mensaje: 'El proceso de devolución tardó más de dos semanas. Tuve que mandar varios mensajes para que me respondieran. El producto estaba bien pero la logística de devolución fue muy mala.',
    respuesta: 'Hola Fernando, tienes toda la razón y pedimos disculpas. Estamos mejorando nuestro proceso de devoluciones. Gracias por tu paciencia.',
    fechaRespuesta: '03 Abr 2026',
  },
];

const ESTATUS_INFO = {
  pendiente:   { label: 'Sin responder', color: '#ef4444', bg: '#fee2e2' },
  respondido:  { label: 'Respondido',    color: '#3b82f6', bg: '#dbeafe' },
  resuelto:    { label: 'Resuelto',      color: '#10b981', bg: '#d1fae5' },
};

const AVATAR_COLORS = {
  E: '#6366f1', A: '#ef4444', L: '#ec4899',
  G: '#f59e0b', F: '#0ea5e9', M: '#10b981',
};

// ─── Tarjeta de reporte ───────────────────────────────────────────────────────
function ReporteCard({ reporte, onResponder, onMarcarResuelto }) {
  const [expandido, setExpandido] = useState(reporte.estatus === 'pendiente');
  const [textoRespuesta, setTextoRespuesta] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [exito, setExito] = useState(false);

  
  const estatusInfo = ESTATUS_INFO[reporte.estatus];

  const navigate = useNavigate(); // ← agrega esto
  

  const handleEnviar = () => {
    if (!textoRespuesta.trim()) return;
    setEnviando(true);
    setTimeout(() => {
      onResponder(reporte.id, textoRespuesta.trim());
      setTextoRespuesta('');
      setEnviando(false);
      setExito(true);
      setTimeout(() => setExito(false), 2500);
    }, 600);
  };

  return (
    <Card sx={{
      borderRadius: 3, p: 0,
      boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
      border: '1.5px solid #3b82f6',
      overflow: 'hidden',
      transition: 'box-shadow 0.2s',
      '&:hover': { boxShadow: '0 6px 20px rgba(0,0,0,0.09)' },
    }}>
      {/* Franja de color por tipo border: '1.5px solid #3b82f6',*/}
      

      <Box sx={{ p: 2.5 }}>
        {/* Fila superior */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          <Avatar sx={{ width: 40, height: 40, backgroundColor: AVATAR_COLORS[reporte.avatar] ?? '#6b7280', fontWeight: 700, fontSize: 15, flexShrink: 0 }}>
            {reporte.avatar}
          </Avatar>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
              <Box>
                <Typography variant="body1" fontWeight={700}>{reporte.cliente}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7, mt: 0.2 }}>
                  {reporte.tipoProd === 'servicio'
                    ? <BuildIcon sx={{ fontSize: 12, color: '#9ca3af' }} />
                    : <InventoryIcon sx={{ fontSize: 12, color: '#9ca3af' }} />
                  }
                  <Typography variant="caption" color="text.secondary">{reporte.articulo}</Typography>
                  <Typography variant="caption" color="text.secondary">·</Typography>
                  <Typography variant="caption" color="text.secondary">{reporte.fecha}</Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                
                
                {/* Estatus */}
                <Chip
                  label={estatusInfo.label}
                  size="small"
                  sx={{ backgroundColor: estatusInfo.bg, color: estatusInfo.color, fontWeight: 700, fontSize: 11 }}
                />
                {/* Expandir */}
                <IconButton size="small" onClick={() => setExpandido(p => !p)}>
                  {expandido ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                </IconButton>
              </Box>
            </Box>

            {/* Mensaje (siempre visible, truncado si colapsado) */}
            <Typography
              variant="body2" color="text.secondary"
              sx={{
                mt: 1, lineHeight: 1.7,
                display: '-webkit-box',
                WebkitLineClamp: expandido ? 'unset' : 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              "{reporte.mensaje}"
            </Typography>
          </Box>
        </Box>

        {/* Contenido expandido */}
        <Collapse in={expandido}>
          <Box sx={{ mt: 2 }}>
            <Divider sx={{ mb: 2 }} />

            {/* Respuesta existente */}
            {reporte.respuesta && (
              <Box sx={{ backgroundColor: '#f8faff', borderRadius: 2, p: 2, mb: 2, borderLeft: '3px solid #3b82f6' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.8 }}>
                  <ChatBubbleOutlineIcon sx={{ fontSize: 14, color: '#3b82f6' }} />
                  <Typography variant="caption" fontWeight={700} color="#1d4ed8">
                    Tu respuesta · {reporte.fechaRespuesta}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                  {reporte.respuesta}
                </Typography>
              </Box>
            )}

            {/* Formulario de respuesta */}
            {reporte.estatus === 'pendiente' && (
              <Box>
                {exito && <Alert severity="success" sx={{ mb: 1.5 }}>Respuesta enviada correctamente.</Alert>}
                <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>
                  {reporte.estatus !== 'resuelto' && (
                    <Button
                      size="small" variant="contained" color="primary"
                      startIcon={<CheckCircleOutlineIcon fontSize="small" />}
                      onClick={() => onMarcarResuelto(reporte.id)}
                      sx={{ borderRadius: 50, px: 3, ml: 2,textTransform: 'none'}}
                    >
                      Marcar como resuelto
                    </Button>
                  )}
                  <Button
                    size="small" variant="contained" color="secondary"
                    startIcon={<ChatBubbleOutlineIcon fontSize="small" />}
                    onClick={() => navigate('/chat-proveedor', { state: { item: reporte } })}
                    sx={{ borderRadius: 50, px: 3, ml: 2, textTransform: 'none', fontWeight: 600, backgroundColor: '#FACC15', color: '#111' }}
                  >
                    Chat
                  </Button>
                </Box>
              </Box>
            )}

            {/* Ya respondido: opción de resolver */}
            {reporte.estatus === 'respondido' && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  size="small" variant="outlined" color="success"
                  startIcon={<CheckCircleOutlineIcon fontSize="small" />}
                  onClick={() => onMarcarResuelto(reporte.id)}
                  sx={{ textTransform: 'none', borderRadius: 2 }}
                >
                  Marcar como resuelto
                </Button>
              </Box>
            )}
          </Box>
        </Collapse>
      </Box>
    </Card>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function Reportes() {
  const [reportes, setReportes] = useState(REPORTES_INICIALES);
  const [tabActiva, setTabActiva] = useState('todos');

  const handleResponder = (id, respuesta) => {
    setReportes(prev => prev.map(r =>
      r.id === id
        ? { ...r, respuesta, estatus: 'respondido', fechaRespuesta: 'Hoy' }
        : r
    ));
  };

  const handleMarcarResuelto = (id) => {
    setReportes(prev => prev.map(r =>
      r.id === id ? { ...r, estatus: 'resuelto' } : r
    ));
  };

  const conteos = {
    todos:      reportes.length,
    pendiente:  reportes.filter(r => r.estatus === 'pendiente').length,
    respondido: reportes.filter(r => r.estatus === 'respondido').length,
    resuelto:   reportes.filter(r => r.estatus === 'resuelto').length,
  };

  const filtrados = reportes.filter(r =>
    tabActiva === 'todos' ? true : r.estatus === tabActiva
  );

  return (
    <Box>
      {/* Encabezado */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3, flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Reportes de Clientes</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Gestiona y responde los reportes sobre tus servicios y productos
          </Typography>
        </Box>

        {/* Contadores rápidos */}
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          {[
            { label: 'Sin responder', count: conteos.pendiente,  color: '#ef4444', bg: '#fee2e2' },
            { label: 'Respondidos',   count: conteos.respondido, color: '#3b82f6', bg: '#dbeafe' },
            { label: 'Resueltos',     count: conteos.resuelto,   color: '#10b981', bg: '#d1fae5' },
          ].map(({ label, count, color, bg }) => (
            <Box key={label} sx={{ textAlign: 'center', backgroundColor: bg, borderRadius: 2, px: 2, py: 1 }}>
              <Typography variant="h6" fontWeight={800} sx={{ color, lineHeight: 1 }}>{count}</Typography>
              <Typography variant="caption" sx={{ color, fontWeight: 600 }}>{label}</Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Tabs */}
      <Tabs
        value={tabActiva}
        onChange={(_, v) => setTabActiva(v)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 3, '& .MuiTab-root': { textTransform: 'none', fontWeight: 500, minHeight: 36 } }}
      >
        <Tab label={`Todos (${conteos.todos})`} value="todos" />
        <Tab
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
              {conteos.pendiente > 0 && (
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#ef4444' }} />
              )}
              Sin responder ({conteos.pendiente})
            </Box>
          }
          value="pendiente"
        />
        <Tab label={`Respondidos (${conteos.respondido})`} value="respondido" />
        <Tab label={`Resueltos (${conteos.resuelto})`} value="resuelto" />
      </Tabs>

      {/* Lista */}
      {filtrados.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
          <CheckCircleOutlineIcon sx={{ fontSize: 52, opacity: 0.2, mb: 1 }} />
          <Typography variant="h6" fontWeight={600}>Sin reportes en esta categoría</Typography>
          <Typography variant="body2">¡Todo en orden por aquí!</Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {filtrados.map(r => (
            <ReporteCard
              key={r.id}
              reporte={r}
              onResponder={handleResponder}
              onMarcarResuelto={handleMarcarResuelto}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}