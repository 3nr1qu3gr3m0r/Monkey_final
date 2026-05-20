import React from 'react';
import { Box, Typography, Grid, Paper, Button, Chip } from '@mui/material';
import { useStore } from './Store';
import InventoryIcon from '@mui/icons-material/Inventory';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';

export default function InicioResumen({ onNavigate }) {
  const { state } = useStore();
  const { items, pedidosActivos, saldoWallet } = state;

  // 🚀 FILTRO FANTASMA: Filtramos los que YA están entregados o cancelados
  const pedidosPendientes = pedidosActivos.filter(p => 
    !['entregado', 'completado', 'cancelado', 'rechazado'].includes(p.estatus.toLowerCase())
  );

  return (
    <Box sx={{ pb: 4 }}>
      <Box sx={{ mb: { xs: 3, md: 4 } }}>
        <Typography variant="h5" fontWeight={700} color="#111827">
          ¡Bienvenido de vuelta! 👋
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Aquí tienes un resumen rápido de cómo va tu negocio hoy.
        </Typography>
      </Box>

      {/* TARJETAS DE RESUMEN (KPIs) - Totalmente responsivas */}
      <Grid container spacing={3} sx={{ mb: { xs: 4, md: 5 } }}>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 3, borderRadius: 4, display: 'flex', alignItems: 'center', gap: 2, border: '1px solid #e5e7eb', boxShadow: 'none' }}>
            <Box sx={{ p: 1.5, backgroundColor: '#dbeafe', borderRadius: '50%', color: '#1d4ed8' }}>
              <InventoryIcon fontSize="large" />
            </Box>
            <Box>
              <Typography variant="h4" fontWeight={800}>{items.length}</Typography>
              <Typography variant="body2" color="text.secondary" fontWeight={600}>Artículos Activos</Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 3, borderRadius: 4, display: 'flex', alignItems: 'center', gap: 2, border: '1px solid #e5e7eb', boxShadow: 'none' }}>
            <Box sx={{ p: 1.5, backgroundColor: '#fef3c7', borderRadius: '50%', color: '#d97706' }}>
              <LocalShippingIcon fontSize="large" />
            </Box>
            <Box>
              <Typography variant="h4" fontWeight={800}>{pedidosPendientes.length}</Typography>
              <Typography variant="body2" color="text.secondary" fontWeight={600}>Órdenes Pendientes</Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 3, borderRadius: 4, display: 'flex', alignItems: 'center', gap: 2, border: '1px solid #e5e7eb', boxShadow: 'none' }}>
            <Box sx={{ p: 1.5, backgroundColor: '#d1fae5', borderRadius: '50%', color: '#059669' }}>
              <AccountBalanceWalletIcon fontSize="large" />
            </Box>
            <Box>
              <Typography variant="h4" fontWeight={800}>${Number(saldoWallet).toLocaleString('es-MX')}</Typography>
              <Typography variant="body2" color="text.secondary" fontWeight={600}>Saldo Disponible</Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* ÚLTIMOS PEDIDOS PENDIENTES */}
      <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 4, border: '1px solid #e5e7eb', boxShadow: 'none' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" fontWeight={700} sx={{ fontSize: { xs: '1.1rem', md: '1.25rem' } }}>
            Tareas por hacer (Órdenes Activas)
          </Typography>
          <Button size="small" onClick={() => onNavigate('Estatus')} sx={{ fontWeight: 600 }}>Ver todas</Button>
        </Box>

        {pedidosPendientes.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
            <Typography variant="body1" fontWeight={600}>¡Todo al día!</Typography>
            <Typography variant="body2">No tienes órdenes pendientes o retrasadas.</Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {pedidosPendientes.slice(0, 4).map(pedido => (
              <Box key={pedido.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, backgroundColor: '#f9fafb', borderRadius: 2 }}>
                <Box>
                  <Typography variant="subtitle2" fontWeight={700}>{pedido.articulo}</Typography>
                  <Typography variant="caption" color="text.secondary">Para: {pedido.cliente} • {pedido.fecha}</Typography>
                </Box>
                <Chip label={pedido.estatus.toUpperCase()} size="small" color="warning" sx={{ fontWeight: 700, fontSize: 10 }} />
              </Box>
            ))}
          </Box>
        )}
      </Paper>
    </Box>
  );
}