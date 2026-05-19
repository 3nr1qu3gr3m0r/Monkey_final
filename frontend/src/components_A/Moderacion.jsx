import React from 'react';
import { Box, Typography, Paper, Chip } from '@mui/material';
import { CheckCircleOutline, HighlightOffOutlined } from '@mui/icons-material';
import { DataGrid, GridActionsCellItem } from '@mui/x-data-grid';

const reportesModeracion = [
  { id: 1, fecha: '2026-03-25', tipoUsuario: 'Proveedor', tipoContenido: 'Producto', descripcion: 'El producto infringe derechos de autor.', estado: 'Pendiente' },
  { id: 2, fecha: '2026-03-26', tipoUsuario: 'Usuario', tipoContenido: 'Comentario', descripcion: 'Lenguaje ofensivo en la reseña.', estado: 'Aprobado' },
  { id: 3, fecha: '2026-03-27', tipoUsuario: 'Proveedor', tipoContenido: 'Servicio', descripcion: 'Servicio engañoso, no cumple lo prometido.', estado: 'Rechazado' },
  { id: 4, fecha: '2026-03-28', tipoUsuario: 'Usuario', tipoContenido: 'Comentario', descripcion: 'Spam masivo de enlaces externos.', estado: 'Pendiente' },
];

const columnsModeracion = [
  { field: 'id', headerName: 'ID Reporte', width: 90 },
  { field: 'fecha', headerName: 'Fecha', width: 110 },
  {
    field: 'tipoUsuario', headerName: 'Tipo Usuario', width: 120,
    renderCell: (params) => <Chip label={params.value} size="small" variant="outlined" />
  },
  { field: 'tipoContenido', headerName: 'Contenido', width: 120 },
  { field: 'descripcion', headerName: 'Descripción', flex: 1, minWidth: 200 },
  {
    field: 'estado', headerName: 'Estado', width: 130,
    renderCell: (params) => {
      const config = {
        'Pendiente': { color: '#F59E0B', bg: '#FEF3C7' },
        'Aprobado':  { color: '#10B981', bg: '#D1FAE5' },
        'Rechazado': { color: '#EF4444', bg: '#FEE2E2' }
      }[params.value] || { color: '#000', bg: '#eee' };
      return <Chip label={params.value} size="small" sx={{ bgcolor: config.bg, color: config.color, fontWeight: 700 }} />;
    }
  },
  {
    field: 'actions', type: 'actions', headerName: 'Acciones', width: 100,
    getActions: () => [
      <GridActionsCellItem icon={<CheckCircleOutline sx={{ color: '#10B981' }} />} label="Aprobar" />,
      <GridActionsCellItem icon={<HighlightOffOutlined sx={{ color: '#EF4444' }} />} label="Rechazar" />
    ]
  }
];

const Moderacion = () => (
  <Box>
    <Typography variant="h5" fontWeight="700" sx={{ mb: 3 }}>Panel de Moderación</Typography>
    <Paper elevation={0} sx={{ height: 600, borderRadius: 3, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
      <DataGrid
        rows={reportesModeracion}
        columns={columnsModeracion}
        pageSizeOptions={[10]}
        disableRowSelectionOnClick
        sx={{ border: 'none' }}
      />
    </Paper>
  </Box>
);

export default Moderacion;