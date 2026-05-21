import React from 'react';
import {
  Box, Typography, Paper, Grid, Chip, Divider,
  LinearProgress, Skeleton, Alert, Tooltip
} from '@mui/material';
import {
  ReportProblemOutlined, GavelOutlined, InventoryOutlined,
  MiscellaneousServicesOutlined, AccessTimeOutlined,
  TrendingUpOutlined, CheckCircleOutline
} from '@mui/icons-material';

import { useAdminData } from '../hooks/useAdminData';

const getDiasTranscurridos = (fechaStr) => {
  const diff = Math.floor((new Date() - new Date(fechaStr)) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'Hoy';
  if (diff === 1) return '1 día';
  return `${diff} días`;
};

const SummaryCard = ({ title, icon, count, countColor, children, accentColor = '#1D4ED8' }) => (
  <Paper
    elevation={0}
    sx={{
      borderRadius: 3, border: '1px solid #E5E7EB', overflow: 'hidden',
      height: '100%', display: 'flex', flexDirection: 'column',
      transition: 'box-shadow 0.2s, transform 0.2s',
      '&:hover': { boxShadow: '0 8px 24px rgba(0,0,0,0.08)', transform: 'translateY(-2px)' },
    }}
  >
    <Box sx={{
      px: 2.5, py: 2, borderBottom: '1px solid #F3F4F6',
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
    <Box sx={{ px: 2.5, py: 2, flexGrow: 1 }}>{children}</Box>
  </Paper>
);

const ResumenSkeleton = () => (
  <Grid container spacing={3}>
    {[1, 2].map((i) => (
      <Grid item xs={12} md={6} key={i}>
        <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #E5E7EB', p: 2.5 }}>
          <Skeleton variant="text" width="50%" height={32} sx={{ mb: 2 }} />
          {[1, 2, 3].map((j) => <Skeleton key={j} variant="text" width="100%" height={24} sx={{ mb: 1 }} />)}
        </Paper>
      </Grid>
    ))}
    <Grid item xs={12}>
      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #E5E7EB', p: 2.5 }}>
        <Skeleton variant="text" width="30%" height={32} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
      </Paper>
    </Grid>
  </Grid>
);

const Resumen = () => {
  const { data, loading, error } = useAdminData('/admin/resumen');

  if (loading) return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Skeleton variant="text" width="40%" height={40} />
        <Skeleton variant="text" width="60%" height={24} />
      </Box>
      <ResumenSkeleton />
    </Box>
  );

  if (error) return (
    <Alert severity="error" sx={{ borderRadius: 3 }}>
      Error al cargar el resumen: {error}
    </Alert>
  );

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" fontWeight={800} color="text.primary">
          Resumen del Sistema
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Vista general de actividad pendiente — {new Date().toLocaleDateString('es-MX', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
          })}
        </Typography>
      </Box>

      {/* Métricas rápidas */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Usuarios',         value: data.total_usuarios,  color: '#1D4ED8', bg: '#DBEAFE' },
          { label: 'Productos',        value: data.total_productos, color: '#7C3AED', bg: '#EDE9FE' },
          { label: 'Pedidos totales',  value: data.total_pedidos,   color: '#0891B2', bg: '#CFFAFE' },
          { label: 'Ingresos totales', value: `$${Number(data.ingresos_totales || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, color: '#059669', bg: '#D1FAE5' },
        ].map(({ label, value, color, bg }) => (
          <Grid item xs={6} md={3} key={label}>
            <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid #E5E7EB', textAlign: 'center', bgcolor: bg }}>
              <Typography variant="h5" fontWeight={800} color={color}>{value}</Typography>
              <Typography variant="caption" color="text.secondary">{label}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>

        {/* Moderación pendiente */}
        <Grid item xs={12} md={6}>
          <SummaryCard
            title="Pendientes de Moderación"
            icon={<GavelOutlined fontSize="small" />}
            count={data.productos_pendientes}
            countColor="#F59E0B"
            accentColor="#F59E0B"
          >
            {data.productos_pendientes === 0 ? (
              <Box sx={{ textAlign: 'center', py: 3, color: 'text.disabled' }}>
                <CheckCircleOutline sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="body2">Sin productos pendientes ✅</Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Hay <strong style={{ color: '#F59E0B' }}>{data.productos_pendientes} producto{data.productos_pendientes !== 1 ? 's' : ''}</strong> esperando revisión en el panel de Moderación.
                </Typography>
                <Chip label="Ir a Moderación →" size="small"
                  sx={{ bgcolor: '#FEF3C7', color: '#92400E', fontWeight: 700, alignSelf: 'flex-start' }} />
              </Box>
            )}
          </SummaryCard>
        </Grid>

        {/* Disputas activas */}
        <Grid item xs={12} md={6}>
          <SummaryCard
            title="Disputas Activas"
            icon={<ReportProblemOutlined fontSize="small" />}
            count={data.disputas_abiertas}
            countColor="#EF4444"
            accentColor="#EF4444"
          >
            {data.disputas_abiertas === 0 ? (
              <Box sx={{ textAlign: 'center', py: 3, color: 'text.disabled' }}>
                <CheckCircleOutline sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="body2">Sin disputas activas ✅</Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Hay <strong style={{ color: '#EF4444' }}>{data.disputas_abiertas} disputa{data.disputas_abiertas !== 1 ? 's' : ''}</strong> escaladas que requieren atención.
                </Typography>
                <Chip label="Ir a Disputas →" size="small"
                  sx={{ bgcolor: '#FEE2E2', color: '#991B1B', fontWeight: 700, alignSelf: 'flex-start' }} />
              </Box>
            )}
          </SummaryCard>
        </Grid>

        {/* Actividad últimos 7 días */}
        <Grid item xs={12}>
          <SummaryCard
            title="Actividad Reciente — Últimos 7 días"
            icon={<TrendingUpOutlined fontSize="small" />}
            accentColor="#1D4ED8"
          >
            <Grid container spacing={4} alignItems="center">
              <Grid item xs={12} md={8}>
                {!data.pedidos_por_dia?.length ? (
                  <Typography variant="body2" color="text.disabled" sx={{ py: 2 }}>
                    Sin pedidos en los últimos 7 días
                  </Typography>
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, height: 80 }}>
                    {data.pedidos_por_dia.map((dia) => {
                      const maxCantidad = Math.max(...data.pedidos_por_dia.map(d => d.cantidad), 1);
                      const pct = Math.round((dia.cantidad / maxCantidad) * 100);
                      return (
                        <Tooltip
                          key={dia.dia}
                          title={`${new Date(dia.dia + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric' })}: ${dia.cantidad} pedido${dia.cantidad !== 1 ? 's' : ''}`}
                          arrow
                        >
                          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                            <Box sx={{
                              width: '100%', bgcolor: '#1D4ED8', borderRadius: '4px 4px 0 0',
                              height: `${Math.max(pct * 0.6, 4)}px`,
                              cursor: 'default',
                              '&:hover': { bgcolor: '#1e40af' },
                            }} />
                            <Typography variant="caption" color="text.disabled" fontSize={9}>
                              {new Date(dia.dia + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric' })}
                            </Typography>
                          </Box>
                        </Tooltip>
                      );
                    })}
                  </Box>
                )}
              </Grid>
              <Grid item xs={12} md={4}>
                <Grid container spacing={1.5}>
                  {[
                    {
                      label: 'Pedidos esta semana',
                      value: data.pedidos_por_dia?.reduce((s, d) => s + Number(d.cantidad), 0) || 0,
                      color: '#1D4ED8', bg: '#DBEAFE'
                    },
                    {
                      label: 'Ingresos esta semana',
                      value: `$${Number(data.pedidos_por_dia?.reduce((s, d) => s + Number(d.monto || 0), 0) || 0).toLocaleString('es-MX', { minimumFractionDigits: 0 })}`,
                      color: '#059669', bg: '#D1FAE5'
                    },
                  ].map(({ label, value, color, bg }) => (
                    <Grid item xs={12} key={label}>
                      <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, bgcolor: bg, borderColor: 'transparent' }}>
                        <Typography variant="h6" fontWeight={800} color={color}>{value}</Typography>
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