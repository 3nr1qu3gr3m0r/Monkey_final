import React, { useState } from 'react';
import {
  Box, Typography, Drawer, List, ListItem,
  ListItemIcon, ListItemText, IconButton, Badge,
  Tooltip, useTheme, useMediaQuery, Zoom
} from '@mui/material';
import {
  GavelOutlined, LocalShippingOutlined,
  ReceiptOutlined, CategoryOutlined,
  Widgets, Menu as MenuIcon, ReportProblemOutlined,
  DashboardOutlined
} from '@mui/icons-material';

import Resumen from './Resumen';
import Moderacion    from './Moderacion';
import Transacciones from './Transacciones';
import Proveedores   from './Proveedores';
import Categorias    from './Categorias';
import Disputas      from './Disputas';

import Navbar from '../components/Navbar';

const drawerWidth = 260;
const navbarHeight = 65;

const menuItems = [
  { id: 'resumen',       label: 'Resumen',            icon: <DashboardOutlined /> },
  { id: 'moderacion',    label: 'Moderación',        icon: <GavelOutlined /> },
  { id: 'transacciones', label: 'Transacciones',      icon: <ReceiptOutlined /> },
  { id: 'proveedores',   label: 'Proveedores',        icon: <LocalShippingOutlined /> },
  { id: 'categorias',    label: 'Categorías (Stats)', icon: <CategoryOutlined /> },
  { id: 'disputas',      label: 'Disputas',           icon: <ReportProblemOutlined />, badge: 3 },
];

const sectionMap = {
  resumen : <Resumen />,
  moderacion: <Moderacion />,
  transacciones: <Transacciones />,
  proveedores: <Proveedores />,
  categorias: <Categorias />,
  disputas: <Disputas />,
};

const AdminDashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab]   = useState('resumen');
  const [mobileOpen, setMobileOpen] = useState(false);

  const theme    = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleDrawerToggle = () => setMobileOpen((prev) => !prev);

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: '#1D4ED8', color: '#fff' }}>
      <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Widgets />
        <Typography variant="h6" fontWeight="bold">Admin</Typography>
      </Box>

      <List sx={{ px: 2, flexGrow: 1 }}>
        {menuItems.map((item) => (
          <Tooltip
            key={item.id}
            title={item.badge ? `${item.badge} disputas sin resolver` : ''}
            placement="right"
            arrow
            TransitionComponent={Zoom}
          >
            <ListItem
              button
              selected={activeTab === item.id}
              onClick={() => {
                setActiveTab(item.id);
                if (isMobile) setMobileOpen(false);
              }}
              sx={{
                borderRadius: 1.5,
                mb: 0.5,
                backgroundColor: activeTab === item.id ? 'rgba(255,255,255,0.2)' : 'transparent',
                transition: 'background 0.2s',
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.12)' },
              }}
            >
              <ListItemIcon sx={{ color: '#fff', minWidth: 40 }}>
                {item.badge ? (
                  <Badge badgeContent={item.badge} color="error">
                    {item.icon}
                  </Badge>
                ) : item.icon}
              </ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItem>
          </Tooltip>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', backgroundColor: '#F3F4F6', minHeight: '100vh' }}>
      
      {/* Navbar */}
      <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1200 }}>
        <Navbar
          user={user}
          onLogout={onLogout}
          // carritoCount y setBusqueda no aplican en el panel admin;
          // el Navbar los maneja internamente cuando son undefined.
        />
      </Box>
 
      {/* ÁREA BAJO EL NAVBAR: sidebar + contenido */}
      <Box sx={{ display: 'flex', flexGrow: 1, mt: `${navbarHeight}px` }}>
 
        {/* Sidebar */}
        <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
          <Drawer
            variant={isMobile ? 'temporary' : 'permanent'}
            open={isMobile ? mobileOpen : true}
            onClose={handleDrawerToggle}
            ModalProps={{ keepMounted: true }}
            sx={{ '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box', borderRight: 'none', top: `${navbarHeight}px`, height: `calc(100% - ${navbarHeight}px)` } }}
          >
            {drawerContent}
          </Drawer>
        </Box>
      

        {/* Contenido principal */}
        <Box
          component="main"
          sx={{ flexGrow: 1, p: { xs: 2, md: 4 }, width: { md: `calc(100% - ${drawerWidth}px)` } }}
        >
          {isMobile && (
            <IconButton onClick={handleDrawerToggle} sx={{ mb: 2 }}>
              <MenuIcon />
            </IconButton>
          )}

          {sectionMap[activeTab]}
        </Box>
      </Box>
    </Box>
  );
};

export default AdminDashboard;