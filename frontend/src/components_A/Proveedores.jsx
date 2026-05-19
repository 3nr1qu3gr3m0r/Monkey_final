import React, { useState, useMemo } from 'react';
import {
  Box, Typography, Paper, Tabs, Tab, Chip, Dialog, DialogContent,
  DialogActions, Button, Grid, Divider, Avatar, IconButton, Tooltip,
  Rating, Select, FormControl, InputLabel, MenuItem, Stack, Fade, Zoom
} from '@mui/material';
import {
  CheckCircleOutline, HighlightOffOutlined, StorefrontOutlined,
  CloseOutlined, CategoryOutlined, CalendarTodayOutlined,
  InventoryOutlined, FilterAltOutlined, WarningAmberOutlined,
  ThumbUpOutlined, ThumbDownOutlined, ChatBubbleOutlineOutlined
} from '@mui/icons-material';
import { DataGrid, GridActionsCellItem } from '@mui/x-data-grid';

// ─── Datos ────────────────────────────────────────────────────────────────────
const proveedoresActivos = [
  {
    id: 'PRV-001', nombre: 'ElectroGlobal SL', categoria: 'Electrónica',
    fecha: '12/01/2026', estado: 'Activo', rating: 4.8,
    descripcion: 'Distribuidor mayorista de electrónica de consumo y componentes.',
    opiniones: {
      positivos: ['Envíos rápidos', 'Productos de calidad', 'Buen soporte técnico'],
      negativos: ['Precios algo elevados'],
      resumen: 'Proveedor altamente confiable. Los clientes destacan la calidad de los productos y la rapidez en la logística. Pocas quejas, principalmente sobre precio.'
    },
    productos: ['Laptop Pro X1', 'Monitor UltraWide 34"', 'Teclado Mecánico RGB', 'Ratón Inalámbrico G9'],
  },
  {
    id: 'PRV-002', nombre: 'Limpieza Express', categoria: 'Servicios',
    fecha: '25/01/2026', estado: 'Activo', rating: 4.5,
    descripcion: 'Empresa de servicios de limpieza profesional para hogares y oficinas.',
    opiniones: {
      positivos: ['Personal amable', 'Puntualidad', 'Resultados visibles'],
      negativos: ['Dificultad para agendar en fin de semana'],
      resumen: 'Servicio consistente con alta satisfacción. Destaca la profesionalidad del equipo. Área de mejora: disponibilidad en fines de semana.'
    },
    productos: ['Limpieza Básica', 'Limpieza Profunda', 'Desinfección Industrial'],
  },
  {
    id: 'PRV-003', nombre: 'Sabor Casero', categoria: 'Alimentos',
    fecha: '03/02/2026', estado: 'Activo', rating: 2.4,
    descripcion: 'Proveedor de alimentos artesanales y catering para eventos.',
    opiniones: {
      positivos: ['Sabor auténtico'],
      negativos: ['Retrasos en entregas', 'Problemas de higiene reportados', 'Mala comunicación'],
      resumen: 'Calificación por debajo del umbral aceptable. Se han recibido múltiples reportes sobre retrasos y condiciones de entrega. Requiere revisión urgente.'
    },
    productos: ['Box Lunch Ejecutivo', 'Catering para 50 pax', 'Postres Artesanales'],
  },
  {
    id: 'PRV-004', nombre: 'TechRepair Pro', categoria: 'Servicios',
    fecha: '10/02/2026', estado: 'Suspendido', rating: 1.8,
    descripcion: 'Servicio de reparación de dispositivos electrónicos.',
    opiniones: {
      positivos: [],
      negativos: ['No devuelven dispositivos', 'Cobros no autorizados', 'Sin respuesta al cliente'],
      resumen: 'Proveedor con múltiples disputas activas. Cuenta suspendida por incumplimiento de política. Bajo investigación interna.'
    },
    productos: ['Reparación de Pantalla', 'Cambio de Batería', 'Diagnóstico General'],
  },
];

const proveedoresSolicitudes = [
  { id: 'REQ-01', nombre: 'Gourmet Foods', categoria: 'Alimentos',  fecha: '20/03/2026', documentos: 'Verificados' },
  { id: 'REQ-02', nombre: 'AquaClean',     categoria: 'Servicios',  fecha: '22/03/2026', documentos: 'Pendiente'   },
];

// ─── RatingCell ───────────────────────────────────────────────────────────────
const RatingCell = ({ value }) => {
  const isLow = value < 3;
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      <Rating
        value={value} precision={0.1} readOnly size="small"
        sx={{ '& .MuiRating-iconFilled': { color: isLow ? '#EF4444' : '#FACC15' },
              '& .MuiRating-iconEmpty':  { color: isLow ? '#FECACA' : '#D1D5DB' } }}
      />
      <Typography variant="caption" fontWeight={700} color={isLow ? 'error' : 'text.secondary'}>
        {value}
      </Typography>
    </Box>
  );
};

// ─── Modal Detalle ────────────────────────────────────────────────────────────
const ProveedorModal = ({ open, onClose, proveedor }) => {
  if (!proveedor) return null;
  const isLow = proveedor.rating < 3;

  return (
    <Dialog
      open={open} onClose={onClose} maxWidth="md" fullWidth
      TransitionComponent={Fade} transitionDuration={300}
      PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}
    >
      {/* Header con gradiente */}
      <Box sx={{
        background: isLow
          ? 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%)'
          : 'linear-gradient(135deg, #1e3a8a 0%, #1D4ED8 100%)',
        p: 3, color: '#fff'
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56, fontSize: 22 }}>
              {proveedor.nombre.charAt(0)}
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight={700}>{proveedor.nombre}</Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>{proveedor.descripcion}</Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose} sx={{ color: '#fff' }}><CloseOutlined /></IconButton>
        </Box>
      </Box>

      <DialogContent sx={{ p: 3 }}>
        <Grid container spacing={3}>
          {/* Info General */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary" fontWeight={700}
              sx={{ mb: 1.5, textTransform: 'uppercase', letterSpacing: 1 }}>
              Información General
            </Typography>
            <Stack spacing={1.5}>
              {[
                { icon: <CategoryOutlined fontSize="small" />,     label: 'Categoría', value: proveedor.categoria },
                { icon: <CalendarTodayOutlined fontSize="small" />, label: 'Registro',  value: proveedor.fecha    },
                { icon: <StorefrontOutlined fontSize="small" />,    label: 'Estado',    value: proveedor.estado   },
              ].map(({ icon, label, value }) => (
                <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box sx={{ color: '#6B7280' }}>{icon}</Box>
                  <Typography variant="body2" color="text.secondary" sx={{ minWidth: 80 }}>{label}:</Typography>
                  <Typography variant="body2" fontWeight={600}>{value}</Typography>
                </Box>
              ))}
            </Stack>
          </Grid>

          {/* Calificación */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary" fontWeight={700}
              sx={{ mb: 1.5, textTransform: 'uppercase', letterSpacing: 1 }}>
              Calificación Global
            </Typography>
            <Box sx={{
              p: 2, borderRadius: 2, textAlign: 'center',
              bgcolor: isLow ? '#FEF2F2' : '#F0FDF4',
              border: `2px solid ${isLow ? '#FECACA' : '#BBF7D0'}`
            }}>
              {isLow && (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mb: 1 }}>
                  <WarningAmberOutlined sx={{ color: '#EF4444', fontSize: 18 }} />
                  <Typography variant="caption" color="error" fontWeight={700}>CALIFICACIÓN BAJA</Typography>
                </Box>
              )}
              <Typography variant="h2" fontWeight={800} color={isLow ? 'error.main' : 'success.main'}>
                {proveedor.rating}
              </Typography>
              <Rating value={proveedor.rating} precision={0.1} readOnly size="large"
                sx={{ '& .MuiRating-iconFilled': { color: isLow ? '#EF4444' : '#FACC15' } }}
              />
              <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>sobre 5.0</Typography>
            </Box>
          </Grid>

          <Grid item xs={12}><Divider /></Grid>

          {/* Resumen opiniones */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="text.secondary" fontWeight={700}
              sx={{ mb: 1.5, textTransform: 'uppercase', letterSpacing: 1 }}>
              <ChatBubbleOutlineOutlined sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
              Resumen Cualitativo de Opiniones
            </Typography>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: '#FAFAFA', mb: 2 }}>
              <Typography variant="body2" color="text.secondary" fontStyle="italic">
                "{proveedor.opiniones.resumen}"
              </Typography>
            </Paper>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" fontWeight={700} color="success.main"
                  sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                  <ThumbUpOutlined fontSize="inherit" /> Aspectos positivos
                </Typography>
                {proveedor.opiniones.positivos.length > 0
                  ? proveedor.opiniones.positivos.map((p) => (
                    <Chip key={p} label={p} size="small"
                      sx={{ m: 0.3, bgcolor: '#D1FAE5', color: '#065F46', fontWeight: 600 }} />
                  ))
                  : <Typography variant="caption" color="text.disabled">Sin aspectos positivos registrados</Typography>
                }
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" fontWeight={700} color="error.main"
                  sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                  <ThumbDownOutlined fontSize="inherit" /> Aspectos negativos
                </Typography>
                {proveedor.opiniones.negativos.map((n) => (
                  <Chip key={n} label={n} size="small"
                    sx={{ m: 0.3, bgcolor: '#FEE2E2', color: '#991B1B', fontWeight: 600 }} />
                ))}
              </Grid>
            </Grid>
          </Grid>

          <Grid item xs={12}><Divider /></Grid>

          {/* Productos */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="text.secondary" fontWeight={700}
              sx={{ mb: 1.5, textTransform: 'uppercase', letterSpacing: 1 }}>
              <InventoryOutlined sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
              Productos / Servicios del Proveedor
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {proveedor.productos.map((p) => (
                <Chip key={p} label={p} variant="outlined" size="small"
                  sx={{ borderColor: '#1D4ED8', color: '#1D4ED8', fontWeight: 500 }} />
              ))}
            </Box>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 2, borderTop: '1px solid #E5E7EB' }}>
        <Button onClick={onClose} sx={{ color: '#6B7280' }}>Cerrar</Button>
        <Button variant="contained" sx={{ bgcolor: '#1D4ED8', borderRadius: 2 }}>Gestionar Proveedor</Button>
      </DialogActions>
    </Dialog>
  );
};

// ─── Componente Principal ─────────────────────────────────────────────────────
const Proveedores = () => {
  const [provSubTab, setProvSubTab]     = useState(0);
  const [selectedProv, setSelectedProv] = useState(null);
  const [modalOpen, setModalOpen]       = useState(false);
  const [filterRating, setFilterRating] = useState('todos');
  const [filterEstado, setFilterEstado] = useState('todos');

  const handleOpenModal  = (row) => { setSelectedProv(row); setModalOpen(true); };
  const handleCloseModal = ()    => { setModalOpen(false); setSelectedProv(null); };

  const filteredProveedores = useMemo(() => proveedoresActivos.filter((p) => {
    const ratingOk =
      filterRating === 'todos' ? true :
      filterRating === 'bajo'  ? p.rating < 3 :
      filterRating === 'medio' ? p.rating >= 3 && p.rating < 4 :
      p.rating >= 4;
    const estadoOk = filterEstado === 'todos' ? true : p.estado === filterEstado;
    return ratingOk && estadoOk;
  }), [filterRating, filterEstado]);

  const columnsProvActivos = [
    {
      field: 'nombre', headerName: 'Nombre del Comercio', flex: 1,
      renderCell: (params) => {
        const isLow = params.row.rating < 3;
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {isLow && (
              <Tooltip title="Calificación por debajo del mínimo aceptable" arrow>
                <WarningAmberOutlined sx={{ color: '#EF4444', fontSize: 16 }} />
              </Tooltip>
            )}
            <Typography variant="body2" fontWeight={isLow ? 700 : 400} color={isLow ? 'error.main' : 'inherit'}>
              {params.value}
            </Typography>
          </Box>
        );
      }
    },
    { field: 'categoria', headerName: 'Categoría', width: 130 },
    { field: 'fecha',     headerName: 'Registro',  width: 120 },
    {
      field: 'rating', headerName: 'Calificación', width: 200,
      renderCell: (params) => <RatingCell value={params.value} />
    },
    {
      field: 'estado', headerName: 'Estado', width: 120,
      renderCell: (params) => {
        let color = '#F59E0B', bgcolor = '#FEF3C7';
        if (params.value === 'Activo')     { color = '#10B981'; bgcolor = '#D1FAE5'; }
        if (params.value === 'Suspendido') { color = '#EF4444'; bgcolor = '#FEE2E2'; }
        return <Chip label={params.value} size="small" sx={{ bgcolor, color, fontWeight: 600 }} />;
      }
    },
    {
      field: 'actions', type: 'actions', headerName: 'Acciones', width: 100,
      getActions: (params) => [
        <GridActionsCellItem
          icon={
            <Tooltip title="Ver expediente completo" arrow TransitionComponent={Zoom}>
              <StorefrontOutlined color="primary" />
            </Tooltip>
          }
          label="Ver Expediente"
          onClick={() => handleOpenModal(params.row)}
        />
      ]
    }
  ];

  const columnsProvSolicitudes = [
    { field: 'nombre',    headerName: 'Nombre del Comercio', flex: 1 },
    { field: 'categoria', headerName: 'Categoría',           width: 150 },
    { field: 'fecha',     headerName: 'Fecha Solicitud',     width: 130 },
    {
      field: 'documentos', headerName: 'Documentos', width: 130,
      renderCell: (params) => (
        <Chip label={params.value} size="small" sx={{
          bgcolor: params.value === 'Verificados' ? '#D1FAE5' : '#FEF3C7',
          color:   params.value === 'Verificados' ? '#065F46' : '#92400E',
          fontWeight: 600
        }} />
      )
    },
    {
      field: 'actions', type: 'actions', headerName: 'Resolución', width: 150,
      getActions: () => [
        <GridActionsCellItem
          icon={<Tooltip title="Aprobar proveedor" arrow TransitionComponent={Zoom}><CheckCircleOutline sx={{ color: '#10B981' }} /></Tooltip>}
          label="Aprobar"
        />,
        <GridActionsCellItem
          icon={<Tooltip title="Rechazar solicitud" arrow TransitionComponent={Zoom}><HighlightOffOutlined sx={{ color: '#EF4444' }} /></Tooltip>}
          label="Rechazar"
        />
      ]
    }
  ];

  return (
    <Box>
      <Typography variant="h5" fontWeight="700" sx={{ mb: 3 }}>Control de Proveedores</Typography>

      <Tabs value={provSubTab} onChange={(e, val) => setProvSubTab(val)} sx={{ mb: 3 }}>
        <Tab label="Proveedores Activos" />
        <Tab label="Nuevas Solicitudes" />
      </Tabs>

      {/* Filtros */}
      {provSubTab === 0 && (
        <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <FilterAltOutlined sx={{ color: '#6B7280', fontSize: 18 }} />
            <Typography variant="body2" color="text.secondary" fontWeight={600}>Filtrar:</Typography>
          </Box>
          <FormControl size="small" sx={{ minWidth: 170 }}>
            <InputLabel>Calificación</InputLabel>
            <Select value={filterRating} label="Calificación" onChange={(e) => setFilterRating(e.target.value)}>
              <MenuItem value="todos">Todas</MenuItem>
              <MenuItem value="bajo">⚠️ Baja (&lt; 3★)</MenuItem>
              <MenuItem value="medio">Intermedia (3–4★)</MenuItem>
              <MenuItem value="alto">Alta (4★+)</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Estado</InputLabel>
            <Select value={filterEstado} label="Estado" onChange={(e) => setFilterEstado(e.target.value)}>
              <MenuItem value="todos">Todos</MenuItem>
              <MenuItem value="Activo">Activo</MenuItem>
              <MenuItem value="Suspendido">Suspendido</MenuItem>
            </Select>
          </FormControl>
          {(filterRating !== 'todos' || filterEstado !== 'todos') && (
            <Button size="small" onClick={() => { setFilterRating('todos'); setFilterEstado('todos'); }} sx={{ color: '#6B7280' }}>
              Limpiar filtros
            </Button>
          )}
        </Box>
      )}

      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
        <DataGrid
          rows={provSubTab === 0 ? filteredProveedores : proveedoresSolicitudes}
          columns={provSubTab === 0 ? columnsProvActivos : columnsProvSolicitudes}
          pageSizeOptions={[10]}
          autoHeight
          sx={{
            border: 'none',
            '& .MuiDataGrid-row:hover': { bgcolor: '#EFF6FF', transition: 'background 0.2s' },
            '& .row-danger': { bgcolor: '#FFF5F5', '&:hover': { bgcolor: '#FEE2E2' } },
          }}
          getRowClassName={(params) => params.row.rating < 3 ? 'row-danger' : ''}
        />
      </Paper>

      <ProveedorModal open={modalOpen} onClose={handleCloseModal} proveedor={selectedProv} />
    </Box>
  );
};

export default Proveedores;