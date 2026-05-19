import React, { useState } from 'react';
import {
  Box, Typography, Paper, Chip, Avatar, Divider,
  IconButton, Tooltip, Button, Fade, Badge, Stack, Zoom
} from '@mui/material';
import {
  CheckCircleOutline, HighlightOffOutlined, AccessTimeOutlined,
  StorefrontOutlined, PersonOutlined, ArrowBackOutlined,
  WarningAmberOutlined, GavelOutlined, ChatOutlined,
  FiberManualRecord
} from '@mui/icons-material';

// ─── Datos ────────────────────────────────────────────────────────────────────
const disputas = [
  {
    id: 'DSP-001',
    cliente:    'Carlos Méndez',
    proveedor:  'TechRepair Pro',
    asunto:     'Dispositivo no devuelto',
    descripcion: 'El cliente entregó su laptop para reparación el 01/03/2026. Han pasado 5 semanas sin respuesta del proveedor. El cliente reporta intentos fallidos de contacto y teme que el equipo haya sido retenido indebidamente. Monto en disputa: $12,500 MXN.',
    estado:     'No resuelto',
    fecha:      '2026-03-28',
    prioridad:  'Alta',
    categoria:  'Servicios',
    historial: [
      { fecha: '28/03', accion: 'Disputa abierta por el cliente', tipo: 'apertura' },
      { fecha: '29/03', accion: 'Notificación enviada al proveedor', tipo: 'sistema' },
      { fecha: '01/04', accion: 'Proveedor no respondió en 48h', tipo: 'alerta' },
    ]
  },
  {
    id: 'DSP-002',
    cliente:    'Ana Torres',
    proveedor:  'Sabor Casero',
    asunto:     'Pedido incompleto y en mal estado',
    descripcion: 'El catering contratado para un evento corporativo llegó incompleto (faltaron 20 porciones) y varios platillos estaban a temperatura inadecuada. La cliente solicita reembolso parcial del 60% del total pagado ($4,800 MXN).',
    estado:     'En proceso',
    fecha:      '2026-03-25',
    prioridad:  'Media',
    categoria:  'Alimentos',
    historial: [
      { fecha: '25/03', accion: 'Disputa abierta por la cliente', tipo: 'apertura' },
      { fecha: '26/03', accion: 'Proveedor respondió: niega los cargos', tipo: 'proveedor' },
      { fecha: '27/03', accion: 'Admin solicitó evidencia fotográfica', tipo: 'admin' },
      { fecha: '28/03', accion: 'Cliente envió fotos y video del evento', tipo: 'cliente' },
    ]
  },
  {
    id: 'DSP-003',
    cliente:    'Roberto Sánchez',
    proveedor:  'ElectroGlobal SL',
    asunto:     'Producto diferente al anunciado',
    descripcion: 'El monitor recibido es de 24" cuando el anuncio especificaba 27". El cliente rechazó el paquete pero el proveedor no ha procesado el reembolso después de 10 días.',
    estado:     'Resuelto',
    fecha:      '2026-03-10',
    prioridad:  'Baja',
    categoria:  'Electrónica',
    historial: [
      { fecha: '10/03', accion: 'Disputa abierta', tipo: 'apertura' },
      { fecha: '11/03', accion: 'Proveedor aceptó el error', tipo: 'proveedor' },
      { fecha: '15/03', accion: 'Reembolso procesado al cliente', tipo: 'sistema' },
      { fecha: '15/03', accion: 'Disputa resuelta por admin', tipo: 'admin' },
    ]
  },
  {
    id: 'DSP-004',
    cliente:    'Lucía Ramírez',
    proveedor:  'Limpieza Express',
    asunto:     'Daños a objetos del hogar',
    descripcion: 'Durante el servicio de limpieza profunda, se reportó la rotura de un jarrón decorativo valuado en $2,200 MXN. El proveedor acepta responsabilidad parcial pero ofrece solo $800 MXN de compensación.',
    estado:     'En proceso',
    fecha:      '2026-04-01',
    prioridad:  'Media',
    categoria:  'Servicios',
    historial: [
      { fecha: '01/04', accion: 'Disputa abierta por la cliente', tipo: 'apertura' },
      { fecha: '02/04', accion: 'Proveedor reconoció el incidente', tipo: 'proveedor' },
      { fecha: '03/04', accion: 'Negociación en curso', tipo: 'admin' },
    ]
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const estadoConfig = {
  'No resuelto': { color: '#EF4444', bg: '#FEE2E2', icon: <HighlightOffOutlined sx={{ fontSize: 14 }} /> },
  'En proceso':  { color: '#F59E0B', bg: '#FEF3C7', icon: <AccessTimeOutlined sx={{ fontSize: 14 }} />  },
  'Resuelto':    { color: '#10B981', bg: '#D1FAE5', icon: <CheckCircleOutline sx={{ fontSize: 14 }} />  },
};

const prioridadConfig = {
  'Alta':  { color: '#EF4444', dot: '#EF4444' },
  'Media': { color: '#F59E0B', dot: '#F59E0B' },
  'Baja':  { color: '#10B981', dot: '#10B981' },
};

const historialConfig = {
  apertura:  { color: '#1D4ED8', bg: '#DBEAFE' },
  sistema:   { color: '#6B7280', bg: '#F3F4F6' },
  alerta:    { color: '#EF4444', bg: '#FEE2E2' },
  proveedor: { color: '#7C3AED', bg: '#EDE9FE' },
  cliente:   { color: '#0891B2', bg: '#CFFAFE' },
  admin:     { color: '#065F46', bg: '#D1FAE5' },
};

const getInitials = (name) => name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

// ─── Panel derecho: Detalle de disputa ───────────────────────────────────────
const DisputaDetalle = ({ disputa, onBack }) => {
  const ec = estadoConfig[disputa.estado];
  const pc = prioridadConfig[disputa.prioridad];

  return (
    <Fade in timeout={300}>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Header */}
        <Box sx={{ p: 2.5, borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Tooltip title="Volver a la lista" arrow>
            <IconButton size="small" onClick={onBack} sx={{ display: { md: 'none' } }}>
              <ArrowBackOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="subtitle1" fontWeight={700}>{disputa.asunto}</Typography>
            <Typography variant="caption" color="text.secondary">{disputa.id} · {disputa.fecha}</Typography>
          </Box>
          <Chip
            icon={ec.icon}
            label={disputa.estado}
            size="small"
            sx={{ bgcolor: ec.bg, color: ec.color, fontWeight: 700, '& .MuiChip-icon': { color: ec.color } }}
          />
        </Box>

        <Box sx={{ p: 2.5, overflowY: 'auto', flexGrow: 1 }}>
          {/* Partes involucradas */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
            {[
              { label: 'Cliente',    value: disputa.cliente,   icon: <PersonOutlined fontSize="small" />,    color: '#1D4ED8', bgColor: '#DBEAFE' },
              { label: 'Proveedor',  value: disputa.proveedor, icon: <StorefrontOutlined fontSize="small" />, color: '#7C3AED', bgColor: '#EDE9FE' },
            ].map(({ label, value, icon, color, bgColor }) => (
              <Paper key={label} variant="outlined" sx={{ p: 1.5, borderRadius: 2, flex: 1, minWidth: 160 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                  {icon} {label}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar sx={{ bgcolor: bgColor, color, width: 28, height: 28, fontSize: 11, fontWeight: 700 }}>
                    {getInitials(value)}
                  </Avatar>
                  <Typography variant="body2" fontWeight={600}>{value}</Typography>
                </Box>
              </Paper>
            ))}
            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, flex: 1, minWidth: 130 }}>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>Prioridad</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <FiberManualRecord sx={{ fontSize: 10, color: pc.dot }} />
                <Typography variant="body2" fontWeight={700} color={pc.color}>{disputa.prioridad}</Typography>
              </Box>
            </Paper>
          </Box>

          {/* Descripción */}
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <ChatOutlined sx={{ fontSize: 16 }} /> Descripción del problema
          </Typography>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: '#FAFAFA', mb: 3 }}>
            <Typography variant="body2" color="text.secondary" lineHeight={1.7}>
              {disputa.descripcion}
            </Typography>
          </Paper>

          {/* Historial */}
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <AccessTimeOutlined sx={{ fontSize: 16 }} /> Historial de actividad
          </Typography>
          <Stack spacing={1}>
            {disputa.historial.map((h, i) => {
              const hc = historialConfig[h.tipo] || historialConfig.sistema;
              return (
                <Box key={i} sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                  <Box sx={{
                    width: 8, height: 8, borderRadius: '50%', mt: 0.7, flexShrink: 0,
                    bgcolor: hc.color
                  }} />
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="body2">{h.accion}</Typography>
                    <Typography variant="caption" color="text.disabled">{h.fecha}</Typography>
                  </Box>
                </Box>
              );
            })}
          </Stack>
        </Box>

        {/* Acciones */}
        {disputa.estado !== 'Resuelto' && (
          <Box sx={{ p: 2, borderTop: '1px solid #E5E7EB', display: 'flex', gap: 1.5 }}>
            <Tooltip title="Marcar como resuelta" arrow TransitionComponent={Zoom}>
              <Button
                variant="contained" size="small" startIcon={<CheckCircleOutline />}
                sx={{ bgcolor: '#10B981', flex: 1, borderRadius: 2, '&:hover': { bgcolor: '#059669' } }}
              >
                Resolver
              </Button>
            </Tooltip>
            <Tooltip title="Escalar a moderación avanzada" arrow TransitionComponent={Zoom}>
              <Button
                variant="outlined" size="small" startIcon={<WarningAmberOutlined />}
                sx={{ borderColor: '#EF4444', color: '#EF4444', flex: 1, borderRadius: 2 }}
              >
                Escalar
              </Button>
            </Tooltip>
          </Box>
        )}
      </Box>
    </Fade>
  );
};

// ─── Componente Principal ─────────────────────────────────────────────────────
const Disputas = () => {
  const [selected, setSelected]       = useState(disputas[0]);
  const [filterEstado, setFilterEstado] = useState('todos');

  const filtradas = filterEstado === 'todos'
    ? disputas
    : disputas.filter((d) => d.estado === filterEstado);

  const countPorEstado = (estado) => disputas.filter((d) => d.estado === estado).length;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight="700">Panel de Disputas</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {['todos', 'No resuelto', 'En proceso', 'Resuelto'].map((estado) => {
            const ec = estado !== 'todos' ? estadoConfig[estado] : null;
            const isActive = filterEstado === estado;
            return (
              <Tooltip key={estado} title={`Filtrar por: ${estado}`} arrow TransitionComponent={Zoom}>
                <Chip
                  label={estado === 'todos' ? `Todas (${disputas.length})` : `${estado.split(' ')[0]} (${countPorEstado(estado)})`}
                  size="small"
                  onClick={() => setFilterEstado(estado)}
                  sx={{
                    cursor: 'pointer',
                    fontWeight: isActive ? 700 : 400,
                    bgcolor: isActive ? (ec ? ec.bg : '#DBEAFE') : 'transparent',
                    color: isActive ? (ec ? ec.color : '#1D4ED8') : '#6B7280',
                    border: `1px solid ${isActive ? (ec ? ec.color : '#1D4ED8') : '#E5E7EB'}`,
                    transition: 'all 0.2s',
                  }}
                />
              </Tooltip>
            );
          })}
        </Box>
      </Box>

      {/* Layout bandeja de entrada */}
      <Paper elevation={0} sx={{
        border: '1px solid #E5E7EB', borderRadius: 3, overflow: 'hidden',
        display: 'flex', height: 620
      }}>
        {/* Lista de disputas — columna izquierda */}
        <Box sx={{
          width: { xs: '100%', md: 320 }, flexShrink: 0,
          borderRight: '1px solid #E5E7EB', overflowY: 'auto'
        }}>
          {filtradas.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center', color: 'text.disabled' }}>
              <GavelOutlined sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="body2">Sin disputas en esta categoría</Typography>
            </Box>
          ) : filtradas.map((d) => {
            const ec = estadoConfig[d.estado];
            const pc = prioridadConfig[d.prioridad];
            const isSelected = selected?.id === d.id;

            return (
              <Box
                key={d.id}
                onClick={() => setSelected(d)}
                sx={{
                  p: 2, cursor: 'pointer', borderBottom: '1px solid #F3F4F6',
                  bgcolor: isSelected ? '#EFF6FF' : 'transparent',
                  borderLeft: isSelected ? '3px solid #1D4ED8' : '3px solid transparent',
                  transition: 'all 0.15s',
                  '&:hover': { bgcolor: isSelected ? '#EFF6FF' : '#F9FAFB' },
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2" fontWeight={700} noWrap sx={{ maxWidth: 170 }}>
                    {d.asunto}
                  </Typography>
                  <Typography variant="caption" color="text.disabled">{d.fecha.slice(5)}</Typography>
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                  <PersonOutlined sx={{ fontSize: 12 }} />{d.cliente} · <StorefrontOutlined sx={{ fontSize: 12 }} />{d.proveedor}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Chip
                    label={d.estado}
                    size="small"
                    sx={{ bgcolor: ec.bg, color: ec.color, fontWeight: 600, height: 20, fontSize: 10 }}
                  />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                    <FiberManualRecord sx={{ fontSize: 8, color: pc.dot }} />
                    <Typography variant="caption" sx={{ color: pc.color, fontWeight: 600, fontSize: 10 }}>
                      {d.prioridad}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            );
          })}
        </Box>

        {/* Detalle — columna derecha */}
        <Box sx={{ flexGrow: 1, overflow: 'hidden', display: { xs: 'none', md: 'flex' }, flexDirection: 'column' }}>
          {selected
            ? <DisputaDetalle disputa={selected} onBack={() => setSelected(null)} />
            : (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'text.disabled' }}>
                <GavelOutlined sx={{ fontSize: 56, mb: 2 }} />
                <Typography variant="body1">Selecciona una disputa para ver el detalle</Typography>
              </Box>
            )
          }
        </Box>
      </Paper>
    </Box>
  );
};

export default Disputas;