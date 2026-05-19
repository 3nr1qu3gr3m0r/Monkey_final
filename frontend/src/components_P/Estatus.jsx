import { useState, useEffect } from 'react';
import { Box, Typography, Chip, Card, Avatar, Button, Tabs, Tab, Divider, Tooltip } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BuildIcon from '@mui/icons-material/Build';
import InventoryIcon from '@mui/icons-material/Inventory';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import HandshakeIcon from '@mui/icons-material/Handshake';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

// 👇 Importaciones clave
import { useStore } from './Store';
import api from '../config/api';
import { useAlert } from '../context/AlertContext';

// ─── Flujos de estatus sincronizados con la BD (ENUM) ────────────────────────
const FLUJO = {
  producto: [
    { key: 'pendiente',        label: 'Pendiente',      color: '#f59e0b', bg: '#fef3c7', Icon: HourglassTopIcon },
    { key: 'en_preparacion',   label: 'En Preparación', color: '#8b5cf6', bg: '#ede9fe', Icon: BuildIcon },
    { key: 'enviado_agendado', label: 'Enviado',        color: '#0ea5e9', bg: '#e0f2fe', Icon: LocalShippingIcon },
    { key: 'entregado',        label: 'Entregado',      color: '#10b981', bg: '#d1fae5', Icon: HandshakeIcon },
  ],
  servicio: [
    { key: 'pendiente',        label: 'Pendiente',      color: '#f59e0b', bg: '#fef3c7', Icon: HourglassTopIcon },
    { key: 'en_preparacion',   label: 'En Preparación', color: '#8b5cf6', bg: '#ede9fe', Icon: BuildIcon },
    { key: 'enviado_agendado', label: 'En Camino',      color: '#0ea5e9', bg: '#e0f2fe', Icon: LocalShippingIcon }, // 🚀 Modificado
    { key: 'entregado',        label: 'Completado',     color: '#10b981', bg: '#d1fae5', Icon: HandshakeIcon }, // 🚀 Modificado
  ],
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getEstatusInfo(tipo, key) {
  return FLUJO[tipo]?.find(e => e.key === key) ?? FLUJO[tipo][0];
}

function getSiguiente(tipo, key) {
  const flujo = FLUJO[tipo];
  const idx = flujo.findIndex(e => e.key === key);
  return idx < flujo.length - 1 ? flujo[idx + 1] : null;
}

// ─── Componentes Visuales Internos ───────────────────────────────────────────
function EstatusChip({ tipo, estatusKey, size = 'small' }) {
  const info = getEstatusInfo(tipo, estatusKey);
  return (
    <Chip
      label={info.label} size={size}
      icon={<info.Icon sx={{ fontSize: '14px !important', color: `${info.color} !important` }} />}
      sx={{ backgroundColor: info.bg, color: info.color, fontWeight: 700, fontSize: 12, border: `1px solid ${info.color}30` }}
    />
  );
}

function FlujoBarra({ tipo, estatusKey }) {
  const flujo = FLUJO[tipo];
  const idxActual = flujo.findIndex(e => e.key === estatusKey);
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0 }}>
      {flujo.map((paso, i) => {
        const activo = i <= idxActual;
        const esActual = i === idxActual;
        return (
          <Box key={paso.key} sx={{ display: 'flex', alignItems: 'center' }}>
            <Tooltip title={paso.label}>
              <Box sx={{
                width: 28, height: 28, borderRadius: '50%',
                backgroundColor: activo ? paso.color : '#e5e7eb',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: esActual ? `0 0 0 3px ${paso.color}30` : 'none',
                transition: 'all 0.3s',
              }}>
                <paso.Icon sx={{ fontSize: 14, color: activo ? 'white' : '#9ca3af' }} />
              </Box>
            </Tooltip>
            {i < flujo.length - 1 && (
              <Box sx={{ width: 24, height: 2, backgroundColor: i < idxActual ? flujo[i].color : '#e5e7eb', transition: 'all 0.3s' }} />
            )}
          </Box>
        );
      })}
    </Box>
  );
}

function PedidoCard({ pedido, onCambiarEstatus }) {
  const siguiente = getSiguiente(pedido.tipo, pedido.estatus);
  const esUltimo = !siguiente;
  const avatarColors = { M: '#6366f1', R: '#0ea5e9', S: '#f59e0b', C: '#10b981', D: '#ec4899', A: '#ef4444', V: '#8b5cf6', E: '#14b8a6' };
  const initial = pedido.avatar ? pedido.avatar.charAt(0).toUpperCase() : 'U';

  return (
    <Card sx={{
      borderRadius: 3, p: 2.5, boxShadow: '0 2px 10px rgba(0,0,0,0.06)', border: '1px solid #f3f4f6',
      transition: 'box-shadow 0.2s', '&:hover': { boxShadow: '0 6px 20px rgba(0,0,0,0.1)' },
    }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
        <Avatar sx={{ width: 42, height: 42, backgroundColor: avatarColors[initial] ?? '#6b7280', fontWeight: 700, fontSize: 16, flexShrink: 0 }}>
          {initial}
        </Avatar>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap', mb: 0.5 }}>
            <Box>
              <Typography variant="body1" fontWeight={700} noWrap>{pedido.cliente}</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mt: 0.2 }}>
                {pedido.tipo === 'servicio' ? <BuildIcon sx={{ fontSize: 13, color: '#6b7280' }} /> : <InventoryIcon sx={{ fontSize: 13, color: '#6b7280' }} />}
                <Typography variant="caption" color="text.secondary" noWrap>{pedido.articulo}</Typography>
              </Box>
            </Box>
            <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
              <Typography variant="body2" fontWeight={800} color="primary">
                ${pedido.monto.toLocaleString('es-MX')} MXN
              </Typography>
              <Typography variant="caption" color="text.secondary">{pedido.id}</Typography>
            </Box>
          </Box>

          {pedido.notas && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5, fontStyle: 'italic' }}>
              "{pedido.notas}"
            </Typography>
          )}

          <Box sx={{ mb: 1.5 }}>
            <FlujoBarra tipo={pedido.tipo} estatusKey={pedido.estatus} />
          </Box>

          <Box sx={{ display: 'flex', alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', flexWrap: 'wrap', gap: 1, flexDirection: { xs: 'column', sm: 'row' } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <EstatusChip tipo={pedido.tipo} estatusKey={pedido.estatus} />
              <Typography variant="caption" color="text.secondary">Pedido: {pedido.fecha}</Typography>
              {pedido.eventoFecha && (
                <Chip label={`Evento: ${pedido.eventoFecha}`} size="small" icon={<EventAvailableIcon sx={{ fontSize: '13px !important' }} />}
                  sx={{ backgroundColor: '#f0fdf4', color: '#15803d', fontWeight: 600, fontSize: 11 }} />
              )}
            </Box>

            {!esUltimo && (
              <Button size="small" variant="contained" endIcon={<ArrowForwardIcon fontSize="small" />} onClick={() => onCambiarEstatus(pedido.id, siguiente.key)}
                sx={{
                  textTransform: 'none', borderRadius: 2, fontWeight: 600, fontSize: 12, px: 2,
                  backgroundColor: siguiente.color, '&:hover': { backgroundColor: siguiente.color, filter: 'brightness(0.9)' },
                }}
              >
                Marcar como {siguiente.label}
              </Button>
            )}
            {esUltimo && (
              <Chip label="✓ Finalizado" size="small" sx={{ backgroundColor: '#d1fae5', color: '#065f46', fontWeight: 700 }} />
            )}
          </Box>
        </Box>
      </Box>
    </Card>
  );
}

// ─── Componente Principal ─────────────────────────────────────────────────────
export default function Estatus() {
  const { showAlert } = useAlert();
  const { state, actions } = useStore();
  const pedidos = state.pedidosActivos || []; 
  const [tabActiva, setTabActiva] = useState('todos');

  // NUEVO: Vamos al backend a buscar los pedidos reales al entrar a la pestaña
  useEffect(() => {
    const fetchPedidos = async () => {
      try {
        const res = await api.get('/proveedor/dashboard'); 
        if (actions.setPedidosActivos) {
            actions.setPedidosActivos(res.data.pedidos);
        }
      } catch (error) {
        console.error("Error al cargar los pedidos:", error);
      }
    };
    fetchPedidos();
  }, []);

  const handleCambiarEstatus = async (id, nuevoEstatus) => {
    try {
      const dbId = id.replace('ORD-', ''); // Limpiamos el ID visual
      
      // Enviamos el nuevo estatus al backend (esto también dispara la notificación al cliente)
      await api.put(`/proveedor/pedido/${dbId}/estatus`, { estatus: nuevoEstatus });
      
      // Actualizamos el Store global para reflejarlo en la interfaz de inmediato
      if (actions.updatePedidoEstatus) {
          actions.updatePedidoEstatus(id, nuevoEstatus);
      }
      
    } catch (error) {
      console.error("Error al actualizar estatus", error);
      showAlert("No se pudo actualizar el estatus en la base de datos.", "error");
    }
  };

  const conteos = {
    todos: pedidos.length,
    pendiente: pedidos.filter(p => p.estatus === 'pendiente').length,
    activos: pedidos.filter(p => !['pendiente', 'entregado', 'cancelado'].includes(p.estatus)).length,
    entregado: pedidos.filter(p => p.estatus === 'entregado').length,
  };

  const pedidosFiltrados = pedidos.filter(p => {
    if (tabActiva === 'todos') return true;
    if (tabActiva === 'pendiente') return p.estatus === 'pendiente';
    if (tabActiva === 'activos') return !['pendiente', 'entregado', 'cancelado'].includes(p.estatus);
    if (tabActiva === 'entregado') return p.estatus === 'entregado';
    return true;
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: { xs: 'flex-start', sm: 'flex-start' }, justifyContent: 'space-between', mb: 3, flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Estatus de Pedidos</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Gestiona y avanza el estatus de cada pedido o reserva
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          {[
            { label: 'Pendientes', count: conteos.pendiente, color: '#f59e0b', bg: '#fef3c7' },
            { label: 'En curso', count: conteos.activos, color: '#3b82f6', bg: '#dbeafe' },
            { label: 'Completados', count: conteos.entregado, color: '#10b981', bg: '#d1fae5' },
          ].map(({ label, count, color, bg }) => (
            <Box key={label} sx={{ textAlign: 'center', backgroundColor: bg, borderRadius: 2, px: 2, py: 1 }}>
              <Typography variant="h6" fontWeight={800} sx={{ color, lineHeight: 1 }}>{count}</Typography>
              <Typography variant="caption" sx={{ color, fontWeight: 600 }}>{label}</Typography>
            </Box>
          ))}
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
          <BuildIcon sx={{ fontSize: 14, color: '#6b7280' }} />
          <Typography variant="caption" color="text.secondary" fontWeight={600}>Servicio: Pendiente → En Preparación → <Box component="span" sx={{ color: '#0ea5e9' }}>En Camino</Box> → Completado</Typography>
        </Box>
      </Box>
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
          <InventoryIcon sx={{ fontSize: 14, color: '#6b7280' }} />
          <Typography variant="caption" color="text.secondary" fontWeight={600}>Producto: Pendiente → En Preparación → <Box component="span" sx={{ color: '#0ea5e9' }}>Enviado</Box> → Entregado</Typography>
        </Box>
      </Box>

      <Divider sx={{ mb: 3 }} />

      <Tabs value={tabActiva} onChange={(_, v) => setTabActiva(v)} variant="scrollable" scrollButtons="auto" sx={{ mb: 3, '& .MuiTab-root': { textTransform: 'none', fontWeight: 500, minHeight: 36 } }}>
        <Tab label={`Todos (${conteos.todos})`} value="todos" />
        <Tab label={`Pendientes (${conteos.pendiente})`} value="pendiente" />
        <Tab label={`En curso (${conteos.activos})`} value="activos" />
        <Tab label={`Completados (${conteos.entregado})`} value="entregado" />
      </Tabs>

      {pedidosFiltrados.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
          <CheckCircleIcon sx={{ fontSize: 52, opacity: 0.2, mb: 1 }} />
          <Typography variant="h6" fontWeight={600}>Sin pedidos en esta categoría</Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {pedidosFiltrados.map(pedido => (
            <PedidoCard
              key={pedido.id}
              pedido={pedido}
              onCambiarEstatus={handleCambiarEstatus}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}