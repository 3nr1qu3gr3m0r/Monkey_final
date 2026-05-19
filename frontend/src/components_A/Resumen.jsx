import React from 'react';
import {
  Box, Typography, Paper, Grid, Chip, Divider,
  LinearProgress, Avatar, Tooltip
} from '@mui/material';
import {
  ReportProblemOutlined, GavelOutlined, InventoryOutlined,
  MiscellaneousServicesOutlined, AccessTimeOutlined,
  TrendingUpOutlined, WarningAmberOutlined, CheckCircleOutline
} from '@mui/icons-material';

// ─── Datos simulados ──────────────────
const reportesPendientes = [
  { id: 1, tipo: 'Producto', descripcion: 'Posible infracción de derechos de autor', fecha: '2026-03-25', prioridad: 'Alta' },
  { id: 4, tipo: 'Comentario', descripcion: 'Spam masivo de enlaces externos', fecha: '2026-03-28', prioridad: 'Media' },
];

const disputasActivas = [
  { id: 'DSP-001', asunto: 'Dispositivo no devuelto', cliente: 'Carlos Méndez', proveedor: 'TechRepair Pro', desde: '2026-03-28', prioridad: 'Alta' },
  { id: 'DSP-002', asunto: 'Pedido incompleto', cliente: 'Ana Torres', proveedor: 'Sabor Casero', desde: '2026-03-25', prioridad: 'Media' },
  { id: 'DSP-004', asunto: 'Daños en el hogar', cliente: 'Lucía Ramírez', proveedor: 'Limpieza Express', desde: '2026-04-01', prioridad: 'Media' },
];

const statsCategoria = {
  totalProductos: 342,
  totalServicios: 158,
  topProductoCat: 'Electrónica',
  topServicioCat: 'Limpieza',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getDiasTranscurridos = (fechaStr) => {
  const hoy = new Date('2026-04-29');
  const desde = new Date(fechaStr);
  const diff = Math.floor((hoy - desde) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'Hoy';
  if (diff === 1) return '1 día';
  return `${diff} días`;
};

const prioridadConfig = {
  Alta:  { color: '#EF4444', bg: '#FEE2E2' },
  Media: { color: '#F59E0B', bg: '#FEF3C7' },
  Baja:  { color: '#10B981', bg: '#D1FAE5' },
};

// ─── Sub-componente: Tarjeta contenedora ─────────────────────────────────────
const SummaryCard = ({ title, icon, count, countColor, children, accentColor = '#1D4ED8' }) => (
  <Paper
    elevation={0}
    sx={{
      borderRadius: 3,
      border: '1px solid #E5E7EB',
      overflow: 'hidden',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      transition: 'box-shadow 0.2s, transform 0.2s',
      '&:hover': { boxShadow: '0 8px 24px rgba(0,0,0,0.08)', transform: 'translateY(-2px)' },
    }}
  >
    {/* Header de la tarjeta */}
    <Box sx={{
      px: 2.5, py: 2,
      borderBottom: '1px solid #F3F4F6',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: `linear-gradient(135deg, ${accentColor}08 0%, transparent 100%)`,
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box sx={{
          width: 36, height: 36, borderRadius: 2,
          bgcolor: `${accentColor}15`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: accentColor,
        }}>
          {icon}
        </Box>
        <Typography variant="subtitle1" fontWeight={700} color="text.primary">{title}</Typography>
      </Box>
      {count !== undefined && (
        <Box sx={{
          px: 1.5, py: 0.3, borderRadius: 99,
          bgcolor: `${countColor || accentColor}15`,
          color: countColor || accentColor,
          fontWeight: 800, fontSize: 13,
        }}>
          {count}
        </Box>
      )}
    </Box>

    {/* Contenido */}
    <Box sx={{ px: 2.5, py: 2, flexGrow: 1 }}>
      {children}
    </Box>
  </Paper>
);

// ─── Componente Principal ───────
const Resumen = () => {
  const total = statsCategoria.totalProductos + statsCategoria.totalServicios;
  const pctProductos = Math.round((statsCategoria.totalProductos / total) * 100);
  const pctServicios = 100 - pctProductos;

  return (
    <Box>
      {/* Encabezado */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" fontWeight={800} color="text.primary">
          Resumen del Sistema
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Vista general de actividad pendiente — {new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </Typography>
      </Box>

      <Grid container spacing={3}>

        {/* ── Tarjeta 1: Reportes pendientes ── */}
        <Grid item xs={12} md={6}>
          <SummaryCard
            title="Reportes Pendientes"
            icon={<GavelOutlined fontSize="small" />}
            count={reportesPendientes.length}
            countColor="#F59E0B"
            accentColor="#F59E0B"
          >
            {reportesPendientes.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 3, color: 'text.disabled' }}>
                <CheckCircleOutline sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="body2">Sin reportes pendientes</Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {reportesPendientes.map((r, i) => {
                  const pc = prioridadConfig[r.prioridad];
                  return (
                    <Box key={r.id}>
                      {i > 0 && <Divider sx={{ mb: 1.5 }} />}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                        <Box>
                          <Typography variant="body2" fontWeight={600} sx={{ mb: 0.3 }}>
                            {r.descripcion}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip label={r.tipo} size="small" variant="outlined" sx={{ height: 18, fontSize: 10 }} />
                            <Typography variant="caption" color="text.disabled">{r.fecha}</Typography>
                          </Box>
                        </Box>
                        <Chip
                          label={r.prioridad}
                          size="small"
                          sx={{ bgcolor: pc.bg, color: pc.color, fontWeight: 700, height: 20, fontSize: 10, flexShrink: 0 }}
                        />
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            )}
          </SummaryCard>
        </Grid>

        {/* ── Tarjeta 2: Disputas activas ── */}
        <Grid item xs={12} md={6}>
          <SummaryCard
            title="Disputas Activas"
            icon={<ReportProblemOutlined fontSize="small" />}
            count={disputasActivas.length}
            countColor="#EF4444"
            accentColor="#EF4444"
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {disputasActivas.map((d, i) => {
                const dias = getDiasTranscurridos(d.desde);
                const pc   = prioridadConfig[d.prioridad];
                const isOld = parseInt(dias) >= 7 || dias === 'Hoy' ? false : parseInt(dias) >= 5;

                return (
                  <Box key={d.id}>
                    {i > 0 && <Divider sx={{ mb: 1.5 }} />}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="body2" fontWeight={700} sx={{ mb: 0.3 }}>{d.asunto}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {d.cliente} → {d.proveedor}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
                        <Chip
                          label={d.prioridad}
                          size="small"
                          sx={{ bgcolor: pc.bg, color: pc.color, fontWeight: 700, height: 18, fontSize: 10 }}
                        />
                        <Tooltip title={`Abierta el ${d.desde}`} arrow>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3, cursor: 'default' }}>
                            <AccessTimeOutlined sx={{ fontSize: 11, color: isOld ? '#EF4444' : '#9CA3AF' }} />
                            <Typography
                              variant="caption"
                              fontWeight={isOld ? 700 : 400}
                              color={isOld ? 'error.main' : 'text.disabled'}
                            >
                              {dias}
                            </Typography>
                          </Box>
                        </Tooltip>
                      </Box>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </SummaryCard>
        </Grid>

        {/* ── Tarjeta 3: Distribución productos/servicios ── */}
        <Grid item xs={12}>
          <SummaryCard
            title="Distribución de Catálogo"
            icon={<TrendingUpOutlined fontSize="small" />}
            accentColor="#1D4ED8"
          >
            <Grid container spacing={4} alignItems="center">

              {/* Barra de distribución */}
              <Grid item xs={12} md={6}>
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                      <InventoryOutlined sx={{ fontSize: 16, color: '#1D4ED8' }} />
                      <Typography variant="body2" fontWeight={600}>Productos</Typography>
                    </Box>
                    <Typography variant="body2" fontWeight={800} color="#1D4ED8">{pctProductos}%</Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate" value={pctProductos}
                    sx={{
                      height: 10, borderRadius: 99, bgcolor: '#DBEAFE',
                      '& .MuiLinearProgress-bar': { bgcolor: '#1D4ED8', borderRadius: 99 }
                    }}
                  />
                  <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: 'block' }}>
                    {statsCategoria.totalProductos.toLocaleString()} productos · Top: {statsCategoria.topProductoCat}
                  </Typography>
                </Box>

                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                      <MiscellaneousServicesOutlined sx={{ fontSize: 16, color: '#FACC15' }} />
                      <Typography variant="body2" fontWeight={600}>Servicios</Typography>
                    </Box>
                    <Typography variant="body2" fontWeight={800} color="#B45309">{pctServicios}%</Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate" value={pctServicios}
                    sx={{
                      height: 10, borderRadius: 99, bgcolor: '#FEF9C3',
                      '& .MuiLinearProgress-bar': { bgcolor: '#FACC15', borderRadius: 99 }
                    }}
                  />
                  <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: 'block' }}>
                    {statsCategoria.totalServicios.toLocaleString()} servicios · Top: {statsCategoria.topServicioCat}
                  </Typography>
                </Box>
              </Grid>

              {/* Métricas numéricas */}
              <Grid item xs={12} md={6}>
                <Grid container spacing={2}>
                  {[
                    { label: 'Total en catálogo', value: total.toLocaleString(), color: '#1D4ED8', bg: '#DBEAFE' },
                    { label: 'Productos activos', value: statsCategoria.totalProductos, color: '#1D4ED8', bg: '#EFF6FF' },
                    { label: 'Servicios activos', value: statsCategoria.totalServicios, color: '#B45309', bg: '#FEF9C3' },
                    { label: 'Categorías',         value: '12',   color: '#7C3AED', bg: '#EDE9FE' },
                  ].map(({ label, value, color, bg }) => (
                    <Grid item xs={6} key={label}>
                      <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, textAlign: 'center', bgcolor: bg, borderColor: 'transparent' }}>
                        <Typography variant="h5" fontWeight={800} color={color}>{value}</Typography>
                        <Typography variant="caption" color="text.secondary">{label}</Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </Grid>
            </Grid>
          </SummaryCard>
        </Grid>

      </Grid>
    </Box>
  );
};

export default Resumen;