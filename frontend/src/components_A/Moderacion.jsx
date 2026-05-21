import React, { useState } from 'react';
import {
  Box, Typography, Paper, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, CircularProgress, Alert, Snackbar
} from '@mui/material';
import { CheckCircleOutline, HighlightOffOutlined } from '@mui/icons-material';
import { DataGrid, GridActionsCellItem } from '@mui/x-data-grid';

import { useAdminData, adminAction } from '../hooks/useAdminData';

// ── Columnas ──────────────────────────────────────────────────
const buildColumns = (onAprobar, onRechazar) => [
  { field: 'id', headerName: 'ID', width: 70 },
  {
    field: 'imagen_url', headerName: 'Imagen', width: 80,
    renderCell: (params) =>
      params.value
        ? <img src={params.value} alt="producto" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6 }} />
        : <Box sx={{ width: 40, height: 40, bgcolor: '#F3F4F6', borderRadius: 1 }} />
  },
  { field: 'nombre',      headerName: 'Producto',   flex: 1, minWidth: 160 },
  { field: 'vendedor',    headerName: 'Vendedor',   width: 140 },
  {
    field: 'categoria', headerName: 'Categoría', width: 130,
    renderCell: (params) =>
      <Chip label={params.value || 'Sin categoría'} size="small" variant="outlined" />
  },
  {
    field: 'precio', headerName: 'Precio', width: 100,
    renderCell: (params) => `$${Number(params.value).toFixed(2)}`
  },
  {
    field: 'estado', headerName: 'Estado', width: 120,
    renderCell: (params) => {
      const config = {
        pendiente: { label: 'Pendiente', color: '#F59E0B', bg: '#FEF3C7' },
        aprobado:  { label: 'Aprobado',  color: '#10B981', bg: '#D1FAE5' },
        rechazado: { label: 'Rechazado', color: '#EF4444', bg: '#FEE2E2' },
      }[params.value] || { label: params.value, color: '#000', bg: '#eee' };
      return (
        <Chip
          label={config.label}
          size="small"
          sx={{ bgcolor: config.bg, color: config.color, fontWeight: 700 }}
        />
      );
    }
  },
  {
    field: 'actions', type: 'actions', headerName: 'Acciones', width: 100,
    getActions: (params) => [
      <GridActionsCellItem
        icon={<CheckCircleOutline sx={{ color: '#10B981' }} />}
        label="Aprobar"
        onClick={() => onAprobar(params.row)}
        showInMenu={false}
      />,
      <GridActionsCellItem
        icon={<HighlightOffOutlined sx={{ color: '#EF4444' }} />}
        label="Rechazar"
        onClick={() => onRechazar(params.row)}
        showInMenu={false}
      />,
    ]
  }
];

// ── Componente ────────────────────────────────────────────────
const Moderacion = () => {
  const { data: productos, loading, error, refetch } = useAdminData('/admin/moderacion/productos');

  const [confirmDialog, setConfirmDialog] = useState({ open: false, producto: null, accion: null });
  const [procesando, setProcesando]       = useState(false);
  const [snackbar, setSnackbar]           = useState({ open: false, mensaje: '', severity: 'success' });

  // Abre el diálogo de confirmación
  const handleAprobar  = (producto) => setConfirmDialog({ open: true, producto, accion: 'aprobado' });
  const handleRechazar = (producto) => setConfirmDialog({ open: true, producto, accion: 'rechazado' });
  const handleCerrar   = () => setConfirmDialog({ open: false, producto: null, accion: null });

  // Ejecuta la acción confirmada
  const handleConfirmar = async () => {
    const { producto, accion } = confirmDialog;
    setProcesando(true);
    try {
      await adminAction(`/admin/moderacion/productos/${producto.id}`, { accion });
      setSnackbar({
        open: true,
        mensaje: `Producto "${producto.nombre}" ${accion} correctamente.`,
        severity: 'success',
      });
      refetch();
    } catch (err) {
      setSnackbar({ open: true, mensaje: err.message, severity: 'error' });
    } finally {
      setProcesando(false);
      handleCerrar();
    }
  };

  const columns = buildColumns(handleAprobar, handleRechazar);

  // ── Render ──
  return (
    <Box>
      <Typography variant="h5" fontWeight="700" sx={{ mb: 3 }}>
        Panel de Moderación
      </Typography>

      {/* Error de carga */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Error al cargar productos: {error}
        </Alert>
      )}

      <Paper elevation={0} sx={{ height: 600, borderRadius: 3, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
        <DataGrid
          rows={productos ?? []}
          columns={columns}
          loading={loading}
          pageSizeOptions={[10, 25]}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          disableRowSelectionOnClick
          sx={{ border: 'none' }}
          localeText={{
            noRowsLabel: 'No hay productos pendientes de moderación ✅',
          }}
        />
      </Paper>

      {/* Diálogo de confirmación */}
      <Dialog open={confirmDialog.open} onClose={handleCerrar} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight="700">
          {confirmDialog.accion === 'aprobado' ? '✅ Aprobar producto' : '❌ Rechazar producto'}
        </DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de que deseas{' '}
            <strong>{confirmDialog.accion === 'aprobado' ? 'aprobar' : 'rechazar'}</strong>{' '}
            el producto <strong>"{confirmDialog.producto?.nombre}"</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Se notificará automáticamente al vendedor <strong>{confirmDialog.producto?.vendedor}</strong>.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCerrar} disabled={procesando}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleConfirmar}
            disabled={procesando}
            color={confirmDialog.accion === 'aprobado' ? 'success' : 'error'}
            startIcon={procesando ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {procesando ? 'Procesando...' : 'Confirmar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar de resultado */}
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

export default Moderacion;