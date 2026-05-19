import React, { useState } from 'react';
import {
  Box, Typography, Grid, Paper, IconButton,
  Drawer, List, ListItem, ListItemIcon, ListItemText,
  Avatar, Button, Tabs, Tab, Chip, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import {
  SpaceDashboard,
  CategoryOutlined,
  LocalShippingOutlined,
  NotificationsNone,
  Widgets,
  FileDownloadOutlined,
  WarningAmberRounded,
  CheckCircleOutline,
  HighlightOffOutlined,
  EmailOutlined,
  StorefrontOutlined,
  ReceiptOutlined
} from '@mui/icons-material';
import { DataGrid, GridActionsCellItem } from '@mui/x-data-grid';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, BarChart, Bar } from 'recharts';
import { useNavigate } from 'react-router-dom';

const drawerWidth = 260;

// ================= DATOS SIMULADOS =================
const revenueData = [
  { name: 'Ene', ingresos: 12000 }, { name: 'Feb', ingresos: 15000 },
  { name: 'Mar', ingresos: 14000 }, { name: 'Abr', ingresos: 22000 },
  { name: 'May', ingresos: 19000 }, { name: 'Jun', ingresos: 26000 },
  { name: 'Jul', ingresos: 31000 }, { name: 'Ago', ingresos: 28000 },
  { name: 'Sep', ingresos: 35000 },
];

const volumeData = [
  { name: 'Productos Físicos', value: 65, color: '#1D4ED8' },
  { name: 'Servicios Agendados', value: 35, color: '#FACC15' }
];

const topProductos = [
  { name: 'Laptop Pro', ventas: 120 }, { name: 'Monitor 27"', ventas: 98 },
  { name: 'Teclado Mecánico', ventas: 86 }, { name: 'Ratón G-Pro', ventas: 75 },
  { name: 'Silla Gamer', ventas: 64 }
];

const topServicios = [
  { name: 'Catering Premium', contrataciones: 45 }, { name: 'Fotografía Estudio', contrataciones: 38 },
  { name: 'DJ para Eventos', contrataciones: 29 }, { name: 'Animación Infantil', contrataciones: 22 },
  { name: 'Limpieza Profunda', contrataciones: 15 }
];

const transacciones = [
  { id: 'ORD-9821', fecha: '2026-03-21', monto: 1250.00, comision: 125.00, tipo: 'Producto', estado: 'Aprobado' },
  { id: 'ORD-9822', fecha: '2026-03-21', monto: 850.50, comision: 85.05, tipo: 'Servicio', estado: 'Procesando' },
  { id: 'ORD-9823', fecha: '2026-03-20', monto: 3400.00, comision: 340.00, tipo: 'Producto', estado: 'Rechazado' },
  { id: 'ORD-9824', fecha: '2026-03-20', monto: 150.00, comision: 15.00, tipo: 'Servicio', estado: 'Aprobado' },
  { id: 'ORD-9825', fecha: '2026-03-19', monto: 420.00, comision: 42.00, tipo: 'Producto', estado: 'Aprobado' },
];

const proveedoresActivos = [
  { id: 'PRV-001', nombre: 'ElectroGlobal SL', categoria: 'Electrónica', fecha: '12/01/2026', estado: 'Activo', rating: 4.8 },
  { id: 'PRV-002', nombre: 'Limpieza Express', categoria: 'Servicios', fecha: '25/01/2026', estado: 'Activo', rating: 4.5 },
  { id: 'PRV-003', nombre: 'Ropa Vintage', categoria: 'Moda', fecha: '03/02/2026', estado: 'Suspendido', rating: 2.1 },
  { id: 'PRV-004', nombre: 'Carpintería Torres', categoria: 'Servicios', fecha: '15/02/2026', estado: 'Activo', rating: 4.9 },
];

const proveedoresSolicitudes = [
  { id: 'REQ-01', nombre: 'Gourmet Foods', categoria: 'Alimentos', fecha: '20/03/2026', documentos: 'Verificados' },
  { id: 'REQ-02', nombre: 'Tech Fixers (Reparación)', categoria: 'Servicios', fecha: '21/03/2026', documentos: 'Pendiente' },
];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [provSubTab, setProvSubTab] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProv, setSelectedProv] = useState(null);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <SpaceDashboard /> },
    { id: 'transacciones', label: 'Transacciones', icon: <ReceiptOutlined /> },
    { id: 'proveedores', label: 'Proveedores', icon: <LocalShippingOutlined /> },
    { id: 'categorias', label: 'Categorías (Stats)', icon: <CategoryOutlined /> },
  ];

  const handleOpenModal = (prov) => {
    setSelectedProv(prov);
    setModalOpen(true);
  };

  // ================= COLUMNAS DATA GRID =================
  const columnsTransacciones = [
    { field: 'id', headerName: 'ID Orden', width: 110 },
    { field: 'fecha', headerName: 'Fecha', width: 110 },
    {
      field: 'monto', headerName: 'Monto Total', width: 130,
      renderCell: (params) => (
        <Typography sx={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600, pt: 1.5 }}>
          ${params.value.toFixed(2)}
        </Typography>
      )
    },
    {
      field: 'comision', headerName: 'Comisión', width: 120,
      renderCell: (params) => (
        <Typography sx={{ color: '#10B981', fontVariantNumeric: 'tabular-nums', fontWeight: 700, pt: 1.5 }}>
          ${params.value.toFixed(2)}
        </Typography>
      )
    },
    {
      field: 'tipo', headerName: 'Naturaleza', width: 130,
      renderCell: (params) => {
        const isProduct = params.value === 'Producto';
        return (
          <Chip
            label={params.value}
            size="small"
            variant={isProduct ? "outlined" : "filled"}
            sx={{
              color: isProduct ? '#1D4ED8' : '#111827',
              borderColor: isProduct ? '#1D4ED8' : 'transparent',
              bgcolor: isProduct ? 'transparent' : '#FACC15',
              fontWeight: 600
            }}
          />
        );
      }
    },
    {
      field: 'estado', headerName: 'Estado', width: 130,
      renderCell: (params) => {
        let color = '#F59E0B'; let bgcolor = '#FEF3C7';
        if (params.value === 'Aprobado') { color = '#10B981'; bgcolor = '#D1FAE5'; }
        if (params.value === 'Rechazado') { color = '#EF4444'; bgcolor = '#FEE2E2'; }
        return <Chip label={params.value} size="small" sx={{ bgcolor, color, fontWeight: 600 }} />
      }
    },
    {
      field: 'acciones', headerName: 'Payouts', width: 130,
      renderCell: (params) => (
        params.row.estado === 'Procesando' ?
          <Button size="small" variant="contained" sx={{ bgcolor: '#1D4ED8', '&:hover': { bgcolor: '#1e40af' }, fontSize: '0.7rem' }}>Autorizar</Button> : '-'
      )
    }
  ];

  const columnsProvActivos = [
    { field: 'nombre', headerName: 'Nombre del Comercio', flex: 1 },
    { field: 'categoria', headerName: 'Categoría', width: 130 },
    { field: 'fecha', headerName: 'Registro', width: 120 },
    {
      field: 'estado', headerName: 'Estado', width: 120,
      renderCell: (params) => {
        let color = '#F59E0B'; let bgcolor = '#FEF3C7';
        if (params.value === 'Activo') { color = '#10B981'; bgcolor = '#D1FAE5'; }
        if (params.value === 'Suspendido') { color = '#EF4444'; bgcolor = '#FEE2E2'; }
        return <Chip label={params.value} size="small" sx={{ bgcolor, color, fontWeight: 600 }} />
      }
    },
    {
      field: 'actions', type: 'actions', headerName: 'Acciones', width: 120,
      getActions: (params) => [
        <GridActionsCellItem icon={<StorefrontOutlined color="primary" />} label="Ver Expediente" onClick={() => handleOpenModal(params.row)} />
      ]
    }
  ];

  const columnsProvSolicitudes = [
    { field: 'nombre', headerName: 'Nombre del Comercio', flex: 1 },
    { field: 'categoria', headerName: 'Categoría', width: 150 },
    { field: 'fecha', headerName: 'Fecha Solicitud', width: 130 },
    { field: 'documentos', headerName: 'Documentos', width: 130 },
    {
      field: 'actions', type: 'actions', headerName: 'Resolución', width: 150,
      getActions: () => [
        <GridActionsCellItem icon={<CheckCircleOutline sx={{ color: '#10B981' }} />} label="Aprobar" />,
        <GridActionsCellItem icon={<HighlightOffOutlined sx={{ color: '#EF4444' }} />} label="Rechazar" />
      ]
    }
  ];

  return (
    <Box sx={{ display: 'flex', backgroundColor: '#F3F4F6', minHeight: '100vh', fontFamily: '"Inter", "Roboto", sans-serif' }}>

      {/* SIDEBAR */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box', backgroundColor: '#1D4ED8', color: '#E2E8F0', borderRight: 'none', display: 'flex', flexDirection: 'column' },
        }}
      >
        <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2, color: '#fff' }}>
          <Box sx={{ width: 36, height: 36, borderRadius: 1.5, bgcolor: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Widgets sx={{ color: '#1D4ED8' }} />
          </Box>
          <Typography variant="h6" fontWeight="bold" letterSpacing={0.5}>Administrador</Typography>
        </Box>

        <List sx={{ px: 2, flexGrow: 1 }}>
          {menuItems.map((item) => {
            const isSelected = activeTab === item.id;
            return (
              <ListItem
                button key={item.id} selected={isSelected} onClick={() => setActiveTab(item.id)}
                sx={{
                  borderRadius: 1.5, mb: 0.5, py: 1.2,
                  backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                  color: isSelected ? '#FFFFFF' : '#E2E8F0',
                  '&:hover': { backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)', color: '#FFFFFF' },
                  '& .MuiListItemIcon-root': { color: isSelected ? '#FFFFFF' : '#E2E8F0', minWidth: 40 }
                }}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: isSelected ? 600 : 500, fontSize: '0.95rem' }} />
              </ListItem>
            )
          })}
        </List>

        <Box sx={{ p: 2, mt: 'auto' }}>
          <Box sx={{
            display: 'flex', alignItems: 'center', gap: 2, backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 2, p: 2,
            transition: 'background 0.3s', cursor: 'pointer', '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.2)' }
          }}>
            <Avatar sx={{ bgcolor: '#FACC15', color: '#111827', width: 40, height: 40, fontSize: '1rem', fontWeight: 'bold' }}>AD</Avatar>
            <Box sx={{ overflow: 'hidden' }}>
              <Typography variant="body2" fontWeight="600" color="#fff" noWrap>Admin User</Typography>
              <Typography variant="caption" sx={{ color: '#E2E8F0' }} noWrap>admin@monkeymarket.com</Typography>
            </Box>
          </Box>
        </Box>
      </Drawer>

      {/* CONTENT AREA */}
      <Box component="main" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>

        {/* HEADER TOP BAR */}
        <Box sx={{
          height: 70, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', px: 4,
          backgroundColor: '#fff', borderBottom: '1px solid #E5E7EB'
        }}>
          {/* Se eliminó la barra de búsqueda */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton sx={{ position: 'relative' }}>
              <NotificationsNone sx={{ color: '#6B7280' }} />
              <Box sx={{ position: 'absolute', top: 10, right: 10, width: 8, height: 8, bgcolor: '#EF4444', borderRadius: '50%', border: '2px solid #fff' }} />
            </IconButton>
          </Box>
        </Box>

        {/* MAIN VIEWS */}
        <Box sx={{ px: 2, py: 4, flexGrow: 1, overflowY: 'auto' }}>

          {/* ===================== VISTA: DASHBOARD ===================== */}
          {activeTab === 'dashboard' && (
            <Box sx={{ width: '100%', px: 0 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" fontWeight="700" color="#111827">Métricas Financieras</Typography>
                <Button variant="outlined" startIcon={<FileDownloadOutlined />} sx={{ borderColor: '#E5E7EB', color: '#374151', '&:hover': { bgcolor: '#F9FAFB' } }}>
                  Exportar Reporte
                </Button>
              </Box>

              {/* KPIs */}
              <Grid container spacing={3} sx={{ mb: 4 }}>
                {[
                  { title: 'GMV (Volumen Total)', value: '$542,500.00', color: '#111827' },
                  { title: 'Ingresos Plataforma', value: '$54,250.00', color: '#10B981' },
                  { title: 'Pagos Pendientes', value: '$12,400.00', color: '#F59E0B' },
                  { title: 'Tasa de Reembolsos', value: '1.2%', color: '#EF4444' }
                ].map((stat, idx) => (
                  <Grid item xs={12} sm={6} md={3} key={idx}>
                    <Paper elevation={0} sx={{
                      p: 3, borderRadius: 3, border: '1px solid #E5E7EB',
                      transition: 'transform 0.3s, box-shadow 0.3s',
                      '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' }
                    }}>
                      <Typography variant="body2" color="text.secondary" fontWeight="600" sx={{ mb: 1, textTransform: 'uppercase', fontSize: '0.75rem' }}>{stat.title}</Typography>
                      <Typography variant="h4" fontWeight="800" sx={{ color: stat.color, fontVariantNumeric: 'tabular-nums' }}>{stat.value}</Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>

              {/* CHARTS (AMPLIADOS A 50/50 y CENTRADOS) */}
              <Grid container spacing={4} sx={{ mb: 2, justifyContent: 'center' }}>
                <Grid item xs={12} md={6}>
                  <Paper elevation={0} sx={{ px: 1, py: 4, borderRadius: 3, border: '1px solid #E5E7EB', height: 500, width: '100%' }}>
                    <Typography variant="h6" fontWeight="600" color="#111827" sx={{ mb: 2, px: 3 }}>Ingresos en el tiempo</Typography>
                    <Box sx={{ width: '100%', height: 400, ml: -2 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={revenueData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dy={10} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                          <RechartsTooltip cursor={{ stroke: '#1D4ED8', strokeWidth: 1, strokeDasharray: '3 3' }} contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                          <Line type="monotone" dataKey="ingresos" stroke="#1D4ED8" strokeWidth={6} dot={{ r: 5, fill: '#1D4ED8', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 9 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </Box>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Paper elevation={0} sx={{ px: 1, py: 4, borderRadius: 3, border: '1px solid #E5E7EB', height: 500, width: '100%' }}>
                    <Typography variant="h6" fontWeight="600" color="#111827" sx={{ mb: 2, px: 3 }}>Distribución del Volumen</Typography>
                    <Box sx={{ width: '100%', height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={volumeData} innerRadius="65%" outerRadius="100%" paddingAngle={5} dataKey="value">
                            {volumeData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <RechartsTooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                          <Legend verticalAlign="bottom" height={36} iconType="circle" />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* ===================== VISTA: TRANSACCIONES ===================== */}
          {activeTab === 'transacciones' && (
            <Box sx={{ width: '100%', px: 0 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" fontWeight="700" color="#111827">Transacciones y Payouts</Typography>
                <Button variant="outlined" startIcon={<FileDownloadOutlined />} sx={{ borderColor: '#E5E7EB', color: '#374151', '&:hover': { bgcolor: '#F9FAFB' } }}>
                  Descargar CSV
                </Button>
              </Box>
              <Paper elevation={0} sx={{ height: 600, width: '100%', borderRadius: 3, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
                <DataGrid
                  rows={transacciones}
                  columns={columnsTransacciones}
                  pageSizeOptions={[10, 20]}
                  disableRowSelectionOnClick
                  sx={{ border: 'none', '& .MuiDataGrid-columnHeaders': { backgroundColor: '#F9FAFB', color: '#4B5563', fontWeight: 600 } }}
                />
              </Paper>
            </Box>
          )}

          {/* ===================== VISTA: PROVEEDORES ===================== */}
          {activeTab === 'proveedores' && (
            <Box sx={{ width: '100%', px: 0 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" fontWeight="700" color="#111827">Control de Proveedores</Typography>
                <Button variant="contained" sx={{ bgcolor: '#1D4ED8', '&:hover': { bgcolor: '#1e40af' } }}>Añadir Manualmente</Button>
              </Box>

              <Tabs value={provSubTab} onChange={(e, val) => setProvSubTab(val)} sx={{ mb: 3, '& .MuiTab-root': { fontWeight: 600, textTransform: 'none', fontSize: '1rem' } }}>
                <Tab label="Proveedores Activos" />
                <Tab label="Nuevas Solicitudes" />
              </Tabs>

              {provSubTab === 0 && (
                <Paper elevation={0} sx={{ height: 500, width: '100%', borderRadius: 3, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
                  <DataGrid
                    rows={proveedoresActivos}
                    columns={columnsProvActivos}
                    pageSizeOptions={[10, 20]}
                    sx={{ border: 'none', '& .MuiDataGrid-columnHeaders': { backgroundColor: '#F9FAFB', color: '#4B5563', fontWeight: 600 } }}
                  />
                </Paper>
              )}

              {provSubTab === 1 && (
                <Paper elevation={0} sx={{ height: 500, width: '100%', borderRadius: 3, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
                  <DataGrid
                    rows={proveedoresSolicitudes}
                    columns={columnsProvSolicitudes}
                    pageSizeOptions={[10, 20]}
                    sx={{ border: 'none', '& .MuiDataGrid-columnHeaders': { backgroundColor: '#F9FAFB', color: '#4B5563', fontWeight: 600 } }}
                  />
                </Paper>
              )}
            </Box>
          )}

          {/* ===================== VISTA: CATEGORÍAS ===================== */}
          {activeTab === 'categorias' && (
            <Box sx={{ width: '100%', px: 0 }}>
              <Typography variant="h5" fontWeight="700" color="#111827" sx={{ mb: 4 }}>Estadísticas de Categorías</Typography>
              <Grid container spacing={4} sx={{ justifyContent: 'center' }}>
                {/* Gráfica Productos */}
                <Grid item xs={12} md={6}>
                  <Paper elevation={0} sx={{ px: 1, py: 4, borderRadius: 3, border: '1px solid #E5E7EB', height: 500, width: '100%' }}>
                    <Typography variant="h6" fontWeight="600" color="#111827" sx={{ mb: 3, px: 3 }}>Productos más vendidos</Typography>
                    <Box sx={{ width: '100%', height: 400, ml: -3 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={topProductos} layout="vertical" margin={{ top: 0, right: 30, left: 30, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E5E7EB" />
                          <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                          <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={100} tick={{ fill: '#4B5563', fontWeight: 500, fontSize: 13 }} />
                          <RechartsTooltip cursor={{ fill: '#F3F4F6' }} contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                          <Bar dataKey="ventas" fill="#1D4ED8" radius={[0, 4, 4, 0]} barSize={40} />
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  </Paper>
                </Grid>
                {/* Gráfica Servicios */}
                <Grid item xs={12} md={6}>
                  <Paper elevation={0} sx={{ px: 1, py: 4, borderRadius: 3, border: '1px solid #E5E7EB', height: 500, width: '100%' }}>
                    <Typography variant="h6" fontWeight="600" color="#111827" sx={{ mb: 3, px: 3 }}>Servicios más contratados</Typography>
                    <Box sx={{ width: '100%', height: 400, ml: -3 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={topServicios} layout="vertical" margin={{ top: 0, right: 30, left: 30, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E5E7EB" />
                          <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                          <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={100} tick={{ fill: '#111827', fontWeight: 500, fontSize: 13 }} />
                          <RechartsTooltip cursor={{ fill: '#F3F4F6' }} contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                          <Bar dataKey="contrataciones" fill="#FACC15" radius={[0, 4, 4, 0]} barSize={40} />
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          )}

        </Box>
      </Box>

      {/* ===================== MODAL DE EXPEDIENTE DEL PROVEEDOR ===================== */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
          <StorefrontOutlined color="primary" /> Expediente del Proveedor
        </DialogTitle>
        <DialogContent dividers>
          {selectedProv && (
            <Box>
              <Typography variant="h6" fontWeight="700" color="#111827">{selectedProv.nombre}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>Categoría: {selectedProv.categoria} | ID: {selectedProv.id}</Typography>

              <Grid container spacing={2} sx={{ mb: 4 }}>
                <Grid item xs={6}>
                  <Paper elevation={0} sx={{ p: 2, bgcolor: '#F9FAFB', borderRadius: 2, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">Calificación Promedio</Typography>
                    <Typography variant="h5" fontWeight="700" color="#F59E0B">⭐ {selectedProv.rating}</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper elevation={0} sx={{ p: 2, bgcolor: '#F9FAFB', borderRadius: 2, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">Inventario Activo</Typography>
                    <Typography variant="h5" fontWeight="700" color="#10B981">145 Ítems</Typography>
                  </Paper>
                </Grid>
              </Grid>

              <Typography variant="subtitle2" fontWeight="700" color="#EF4444" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <WarningAmberRounded fontSize="small" /> Acciones de Moderación (Zona de Peligro)
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
                <Button variant="outlined" color="warning" size="small">Pausar Catálogo</Button>
                <Button variant="contained" color="error" size="small">Eliminar Proveedor</Button>
              </Box>

              <Typography variant="subtitle2" fontWeight="700" color="#111827" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <EmailOutlined fontSize="small" /> Herramientas de Contacto
              </Typography>
              <Button variant="outlined" sx={{ borderColor: '#E5E7EB', color: '#374151' }}>Enviar Notificación/Alerta</Button>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setModalOpen(false)} sx={{ color: '#6B7280' }}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminDashboard;
