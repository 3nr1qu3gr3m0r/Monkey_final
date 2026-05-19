import React from 'react';
import { Box, Typography, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { GavelOutlined, ReceiptOutlined, LocalShippingOutlined, CategoryOutlined, Widgets } from '@mui/icons-material';

const menuItems = [
  { id: 'moderacion', label: 'Moderación', icon: <GavelOutlined /> },
  { id: 'transacciones', label: 'Transacciones', icon: <ReceiptOutlined /> },
  { id: 'proveedores', label: 'Proveedores', icon: <LocalShippingOutlined /> },
  { id: 'categorias', label: 'Categorías', icon: <CategoryOutlined /> }
];

const Sidebar = ({ activeTab, setActiveTab }) => (
  <Box sx={{ bgcolor: '#1D4ED8', color: '#fff', height: '100%' }}>
    <Box sx={{ p: 3, display: 'flex', gap: 2 }}>
      <Widgets />
      <Typography fontWeight="bold">Admin</Typography>
    </Box>

    <List>
      {menuItems.map((item) => (
        <ListItem
          button
          key={item.id}
          selected={activeTab === item.id}
          onClick={() => setActiveTab(item.id)}
        >
          <ListItemIcon sx={{ color: '#fff' }}>{item.icon}</ListItemIcon>
          <ListItemText primary={item.label} />
        </ListItem>
      ))}
    </List>
  </Box>
);

export default Sidebar;
