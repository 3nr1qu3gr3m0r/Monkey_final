import React from 'react';
import { Box, Typography, Paper, Button, Chip } from '@mui/material';
import { FileDownloadOutlined } from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';

const transacciones = [
  { id: 'ORD-9821', fecha: '2026-03-21', monto: 1250.00, comision: 125.00, tipo: 'Producto', estado: 'Aprobado' },
  { id: 'ORD-9822', fecha: '2026-03-21', monto: 850.50,  comision: 85.05,  tipo: 'Servicio', estado: 'Procesando' },
  { id: 'ORD-9823', fecha: '2026-03-20', monto: 3400.00, comision: 340.00, tipo: 'Producto', estado: 'Rechazado' },
  { id: 'ORD-9824', fecha: '2026-03-20', monto: 150.00,  comision: 15.00,  tipo: 'Servicio', estado: 'Aprobado' },
];

const columnsTransacciones = [
  { field: 'id',       headerName: 'ID Orden',      width: 130 },
  { field: 'fecha',    headerName: 'Fecha',          width: 130 },
  { field: 'monto',    headerName: 'Monto ($)',      width: 120, type: 'number' },
  { field: 'comision', headerName: 'Comisión ($)',   width: 120, type: 'number' },
  { field: 'tipo',     headerName: 'Tipo',           width: 120 },
  {
    field: 'estado', headerName: 'Estado', width: 130,
    renderCell: (params) => (
      <Chip
        label={params.value}
        size="small"
        color={params.value === 'Aprobado' ? 'success' : params.value === 'Rechazado' ? 'error' : 'warning'}
      />
    )
  },
];

const Transacciones = () => (
  <Box>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
      <Typography variant="h5" fontWeight="700">Transacciones y Payouts</Typography>
      <Button
        variant="outlined"
        startIcon={<FileDownloadOutlined />}
        sx={{ borderColor: '#E5E7EB', color: '#374151' }}
      >
        Descargar CSV
      </Button>
    </Box>
    <Paper elevation={0} sx={{ height: 600, borderRadius: 3, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
      <DataGrid
        rows={transacciones}
        columns={columnsTransacciones}
        pageSizeOptions={[10]}
        disableRowSelectionOnClick
        sx={{ border: 'none' }}
      />
    </Paper>
  </Box>
);

export default Transacciones;