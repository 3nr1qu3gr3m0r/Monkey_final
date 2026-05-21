import React, { useState } from 'react';
import {
  Box, Typography, Paper, Chip, Avatar, Divider,
  IconButton, Tooltip, Button, Fade, Badge, Stack, Zoom,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, CircularProgress, Alert, Snackbar, Skeleton
} from '@mui/material';
import {
  CheckCircleOutline, HighlightOffOutlined, AccessTimeOutlined,
  StorefrontOutlined, PersonOutlined, ArrowBackOutlined,
  WarningAmberOutlined, GavelOutlined, ChatOutlined,
  FiberManualRecord, RefreshOutlined
} from '@mui/icons-material';

import { useAdminData, adminAction } from '../hooks/useAdminData';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const estadoConfig = {
  'abierta_con_proveedor': { label: 'Con Proveedor', color: '#F59E0B', bg: '#FEF3C7', icon: <AccessTimeOutlined sx={{ fontSize: 14 }} /> },
  'escalado_a_admin':      { label: 'Escalada',      color: '#EF4444', bg: '#FEE2E2', icon: <WarningAmberOutlined sx={{ fontSize: 14 }} /> },
  'resuelta':              { label: 'Resuelta',      color: '#10B981', bg: '#D1FAE5', icon: <CheckCircleOutline sx={{ fontSize: 14 }} /> },
};

const getInitials = (name) =>
  (name || '?').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

const getDiasTranscurridos = (fechaStr) => {
  const diff = Math.floor((new Date() - new Date(fechaStr)) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'Hoy';
  if (diff === 1) return '1 día';
  return `${diff} días`;
};

// ─── Skeleton lista ───────────────────────────────────────────────────────────
const ListaSkeleton = () => (
  <Box>
    {[1, 2, 3, 4].map((i) => (
      <Box key={i} sx={{ p: 2, borderBottom: '1px solid #F3F4F6' }}>
        <Skeleton variant="text" width="70%" height={20} />
        <Skeleton variant="text" width="90%" height={16} sx={{ mt: 0.5 }} />
        <Skeleton variant="text" width="40%" height={16} sx={{ mt: 0.5 }} />
      </Box>
    ))}
  </Box>
);

// ─── Panel derecho: Detalle de disputa ───────────────────────────────────────
const DisputaDetalle = ({ disputa, onBack, onResolver, procesando }) => {
  const ec = estadoConfig[disputa.estado] || { label: disputa.estado, color: '#6B7280', bg: '#F3F4F6', icon: null };
  const dias = getDiasTranscurridos(disputa.fecha_creacion);
  const isOld = !isNaN(parseInt(dias)) && parseInt(dias) >= 5;

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
            <Typography variant="subtitle1" fontWeight={700}>{disputa.motivo}</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.3 }}>
              <Typography variant="caption" color="text.secondary">#{disputa.id}</Typography>
              <Tooltip title={`Abierta el ${new Date(disputa.fecha_creacion).toLocaleDateString('es-MX')}`} arrow>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3, cursor: 'default' }}>
                  <AccessTimeOutlined sx={{ fontSize: 11, color: isOld ? '#EF4444' : '#9CA3AF' }} />
                  <Typography variant="caption" fontWeight={isOld ? 700 : 400} color={isOld ? 'error.main' : 'text.disabled'}>
                    {dias}
                  </Typography>
                </Box>
              </Tooltip>
            </Box>
          </Box>
          <Chip
            icon={ec.icon}
            label={ec.label}
            size="small"
            sx={{ bgcolor: ec.bg, color: ec.color, fontWeight: 700, '& .MuiChip-icon': { color: ec.color } }}
          />
        </Box>

        <Box sx={{ p: 2.5, overflowY: 'auto', flexGrow: 1 }}>
          {/* Partes involucradas */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
            {[
              { label: 'Cliente',   value: disputa.cliente,   email: disputa.cliente_email,   icon: <PersonOutlined fontSize="small" />,    color: '#1D4ED8', bgColor: '#DBEAFE' },
              { label: 'Proveedor', value: disputa.proveedor, email: disputa.proveedor_email, icon: <StorefrontOutlined fontSize="small" />, color: '#7C3AED', bgColor: '#EDE9FE' },
            ].map(({ label, value, email, icon, color, bgColor }) => (
              <Paper key={label} variant="outlined" sx={{ p: 1.5, borderRadius: 2, flex: 1, minWidth: 160 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                  {icon} {label}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar sx={{ bgcolor: bgColor, color, width: 28, height: 28, fontSize: 11, fontWeight: 700 }}>
                    {getInitials(value)}
                  </Avatar>
                  <Box>
                    <Typography variant="body2" fontWeight={600}>{value}</Typography>
                    <Typography variant="caption" color="text.disabled">{email}</Typography>
                  </Box>
                </Box>
              </Paper>
            ))}
            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, flex: 1, minWidth: 130 }}>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>Producto</Typography>
              <Typography variant="body2" fontWeight={600}>{disputa.producto}</Typography>
            </Paper>
          </Box>

          {/* Descripción */}
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <ChatOutlined sx={{ fontSize: 16 }} /> Descripción del problema
          </Typography>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: '#FAFAFA', mb: 3 }}>
            <Typography variant="body2" color="text.secondary" lineHeight={1.7}>
              {disputa.descripcion || 'Sin descripción adicional.'}
            </Typography>
          </Paper>

          {/* Resolución (si ya está resuelta) */}
          {disputa.estado === 'resuelta' && disputa.resolucion && (
            <>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <CheckCircleOutline sx={{ fontSize: 16, color: '#10B981' }} /> Resolución del administrador
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: '#F0FDF4', borderColor: '#BBF7D0', mb: 3 }}>
                <Typography variant="body2" color="text.secondary" lineHeight={1.7}>
                  {disputa.resolucion}
                </Typography>
                {disputa.fecha_resolucion && (
                  <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: 'block' }}>
                    Resuelta el {new Date(disputa.fecha_resolucion).toLocaleDateString('es-MX')}
                  </Typography>
                )}
              </Paper>
            </>
          )}
        </Box>

        {/* Acciones */}
        {disputa.estado !== 'resuelta' && (
          <Box sx={{ p: 2, borderTop: '1px solid #E5E7EB', display: 'flex', gap: 1.5 }}>
            <Tooltip title="Dar la razón al cliente (reembolso)" arrow TransitionComponent={Zoom}>
              <Button
                variant="contained" size="small"
                startIcon={procesando ? <CircularProgress size={14} color="inherit" /> : <PersonOutlined />}
                onClick={() => onResolver(disputa, 'cliente')}
                disabled={procesando}
                sx={{ bgcolor: '#1D4ED8', flex: 1, borderRadius: 2, '&:hover': { bgcolor: '#1e40af' } }}
              >
                Favor Cliente
              </Button>
            </Tooltip>
            <Tooltip title="Dar la razón al proveedor (cerrar caso)" arrow TransitionComponent={Zoom}>
              <Button
                variant="outlined" size="small"
                startIcon={procesando ? <CircularProgress size={14} color="inherit" /> : <StorefrontOutlined />}
                onClick={() => onResolver(disputa, 'proveedor')}
                disabled={procesando}
                sx={{ borderColor: '#7C3AED', color: '#7C3AED', flex: 1, borderRadius: 2 }}
              >
                Favor Proveedor
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
  const [filterEstado, setFilterEstado] = useState('todos');
  const [selected, setSelected]         = useState(null);

  // Diálogo de resolución
  const [dialogOpen, setDialogOpen]     = useState(false);
  const [resolucionTxt, setResolucionTxt] = useState('');
  const [favoreceTemp, setFavoreceTemp] = useState(null);
  const [procesando, setProcesando]     = useState(false);
  const [snackbar, setSnackbar]         = useState({ open: false, mensaje: '', severity: 'success' });

  const { data: disputas, loading, error, refetch } = useAdminData('/admin/disputas');

  const filtradas = !disputas ? [] : filterEstado === 'todos'
    ? disputas
    : disputas.filter((d) => d.estado === filterEstado);

  const countPorEstado = (estado) => (disputas || []).filter((d) => d.estado === estado).length;

  // Abre el diálogo para pedir texto de resolución
  const handleResolver = (disputa, favorece) => {
    setSelected(disputa);
    setFavoreceTemp(favorece);
    setResolucionTxt('');
    setDialogOpen(true);
  };

  const handleConfirmarResolucion = async () => {
    if (!resolucionTxt.trim()) return;
    setProcesando(true);
    try {
      await adminAction(`/admin/disputas/${selected.id}/resolver`, {
        resolucion: resolucionTxt,
        favorece: favoreceTemp,
      });
      setSnackbar({
        open: true,
        mensaje: `Disputa #${selected.id} resuelta a favor del ${favoreceTemp}.`,
        severity: 'success',
      });
      setDialogOpen(false);
      setSelected(null);
      refetch();
    } catch (err) {
      setSnackbar({ open: true, mensaje: err.message, severity: 'error' });
    } finally {
      setProcesando(false);
    }
  };

  const filtrosBotones = [
    { key: 'todos',              label: `Todas (${(disputas || []).length})` },
    { key: 'escalado_a_admin',   label: `Escaladas (${countPorEstado('escalado_a_admin')})`,   color: '#EF4444', bg: '#FEE2E2' },
    { key: 'abierta_con_proveedor', label: `Con Proveedor (${countPorEstado('abierta_con_proveedor')})`, color: '#F59E0B', bg: '#FEF3C7' },
    { key: 'resuelta',           label: `Resueltas (${countPorEstado('resuelta')})`,           color: '#10B981', bg: '#D1FAE5' },
  ];

  return (
    <Box>
      {/* Cabecera */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h5" fontWeight="700">Panel de Disputas</Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
          <Tooltip title="Actualizar" arrow>
            <IconButton size="small" onClick={refetch} disabled={loading}>
              <RefreshOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
          {filtrosBotones.map(({ key, label, color, bg }) => {
            const isActive = filterEstado === key;
            return (
              <Tooltip key={key} title={`Filtrar: ${label}`} arrow TransitionComponent={Zoom}>
                <Chip
                  label={label}
                  size="small"
                  onClick={() => { setFilterEstado(key); setSelected(null); }}
                  sx={{
                    cursor: 'pointer', fontWeight: isActive ? 700 : 400,
                    bgcolor: isActive ? (bg || '#DBEAFE') : 'transparent',
                    color:   isActive ? (color || '#1D4ED8') : '#6B7280',
                    border:  `1px solid ${isActive ? (color || '#1D4ED8') : '#E5E7EB'}`,
                    transition: 'all 0.2s',
                  }}
                />
              </Tooltip>
            );
          })}
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>Error al cargar disputas: {error}</Alert>}

      {/* Layout bandeja */}
      <Paper elevation={0} sx={{ border: '1px solid #E5E7EB', borderRadius: 3, overflow: 'hidden', display: 'flex', height: 620 }}>

        {/* Lista izquierda */}
        <Box sx={{ width: { xs: '100%', md: 320 }, flexShrink: 0, borderRight: '1px solid #E5E7EB', overflowY: 'auto' }}>
          {loading ? <ListaSkeleton /> : filtradas.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center', color: 'text.disabled' }}>
              <GavelOutlined sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="body2">Sin disputas en esta categoría</Typography>
            </Box>
          ) : filtradas.map((d) => {
            const ec = estadoConfig[d.estado] || { label: d.estado, color: '#6B7280', bg: '#F3F4F6' };
            const isSelected = selected?.id === d.id;
            const dias = getDiasTranscurridos(d.fecha_creacion);
            const isOld = !isNaN(parseInt(dias)) && parseInt(dias) >= 5;

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
                    {d.motivo}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                    <AccessTimeOutlined sx={{ fontSize: 10, color: isOld ? '#EF4444' : '#9CA3AF' }} />
                    <Typography variant="caption" color={isOld ? 'error.main' : 'text.disabled'} fontWeight={isOld ? 700 : 400}>
                      {dias}
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                  <PersonOutlined sx={{ fontSize: 12 }} />{d.cliente}
                  {' · '}
                  <StorefrontOutlined sx={{ fontSize: 12 }} />{d.proveedor}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Chip
                    label={ec.label}
                    size="small"
                    sx={{ bgcolor: ec.bg, color: ec.color, fontWeight: 600, height: 20, fontSize: 10 }}
                  />
                  <Typography variant="caption" color="text.disabled">
                    {d.producto}
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </Box>

        {/* Detalle derecho */}
        <Box sx={{ flexGrow: 1, overflow: 'hidden', display: { xs: 'none', md: 'flex' }, flexDirection: 'column' }}>
          {selected ? (
            <DisputaDetalle
              disputa={selected}
              onBack={() => setSelected(null)}
              onResolver={handleResolver}
              procesando={procesando}
            />
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'text.disabled' }}>
              <GavelOutlined sx={{ fontSize: 56, mb: 2 }} />
              <Typography variant="body1">Selecciona una disputa para ver el detalle</Typography>
            </Box>
          )}
        </Box>
      </Paper>

      {/* Diálogo de resolución */}
      <Dialog open={dialogOpen} onClose={() => !procesando && setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>
          {favoreceTemp === 'cliente' ? '👤 Resolver a favor del cliente' : '🏪 Resolver a favor del proveedor'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Escribe la resolución oficial. Ambas partes recibirán una notificación automática.
          </Typography>
          <TextField
            autoFocus
            fullWidth
            multiline
            rows={4}
            label="Resolución"
            placeholder={
              favoreceTemp === 'cliente'
                ? 'Ej: Se procede al reembolso total al cliente por incumplimiento del proveedor...'
                : 'Ej: Tras revisar las evidencias, el caso se cierra a favor del proveedor...'
            }
            value={resolucionTxt}
            onChange={(e) => setResolucionTxt(e.target.value)}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)} disabled={procesando}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleConfirmarResolucion}
            disabled={procesando || !resolucionTxt.trim()}
            startIcon={procesando ? <CircularProgress size={16} color="inherit" /> : <CheckCircleOutline />}
            sx={{ bgcolor: favoreceTemp === 'cliente' ? '#1D4ED8' : '#7C3AED', borderRadius: 2 }}
          >
            {procesando ? 'Procesando...' : 'Confirmar resolución'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity} variant="filled" sx={{ width: '100%' }}>
          {snackbar.mensaje}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Disputas;