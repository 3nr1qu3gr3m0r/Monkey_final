import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, TextField, InputAdornment, IconButton, Badge, Button,
  Menu, MenuItem, Divider, Tooltip, Avatar, ListItemIcon
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import NotificationsIcon from '@mui/icons-material/Notifications';
import PersonIcon from '@mui/icons-material/Person';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import LogoutIcon from '@mui/icons-material/Logout';
import { useNavigate } from 'react-router-dom';
import api from '../config/api';
import logo from '../assets/logo2.png';
import { useAlert } from '../context/AlertContext';

function Navbar({ carritoCount, user, busqueda, setBusqueda, onLogout }) {
  const { showAlert } = useAlert();
  const navigate = useNavigate();
  const [anchorElNotif, setAnchorElNotif] = useState(null);
  const [anchorElUser, setAnchorElUser] = useState(null);
  
  // 👉 ESTADOS PARA LAS NOTIFICACIONES REALES
  const [notificaciones, setNotificaciones] = useState([]);
  const unreadCount = notificaciones.filter(n => !n.leida).length;

  const handleOpenNotif = (event) => setAnchorElNotif(event.currentTarget);
  const handleCloseNotif = () => setAnchorElNotif(null);

  const handleOpenUserMenu = (event) => setAnchorElUser(event.currentTarget);
  const handleCloseUserMenu = () => setAnchorElUser(null);

  // 🚀 Lógica para saber si mostrar el carrito (Invitados o Clientes)
  const isComprador = !user || (user.rol !== 'admin' && user.rol !== 'proveedor');

  // 🚀 Lógica de redirección del Logo
  const handleLogoClick = () => {
    if (user?.rol === 'admin') {
      navigate('/dashboard-admin');
    } else if (user?.rol === 'proveedor') {
      navigate('/dashboard-proveedor');
    } else {
      navigate('/');
    }
  };

  // 👉 BUSCAR NOTIFICACIONES EN LA BASE DE DATOS
  useEffect(() => {
    if (user) {
      const fetchNotificaciones = async () => {
        try {
          const res = await api.get('/notificaciones');
          setNotificaciones(res.data);
        } catch (error) {
          console.error("Error cargando notificaciones", error);
        }
      };
      fetchNotificaciones();
      
      // Polling cada 30 segundos para ver si hay nuevas
      const interval = setInterval(fetchNotificaciones, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // 👉 MARCAR COMO LEÍDA AL HACER CLIC
  const handleNotifClick = async (id) => {
    try {
      await api.put(`/notificaciones/${id}/leer`);
      // Actualizamos el estado local para quitar el puntito rojo sin recargar la página
      setNotificaciones(prev => prev.map(n => n.id === id ? { ...n, leida: 1 } : n));
    } catch (error) {
      console.error("Error al marcar como leída", error);
    }
  };

  // 👉 CHAT CON IA AL PRESIONAR ENTER EN LA BÚSQUEDA
  const handleChatSubmit = async (e) => {
    if (e.key === 'Enter' && busqueda.trim() !== '') {
      try {
        const response = await api.post('/ai/chat', { message: busqueda }); 
        showAlert("Monkey IA dice: " + response.data.reply, "info");
      } catch (error) {
        console.error("Error en el chat:", error);
      }
    }
  };

  return (
    <Box sx={{ 
      display: 'flex', alignItems: 'center', px: { xs: 2, sm: 4, md: 8 }, py: 1.5, 
      backgroundColor: '#fff', borderBottom: '2px solid', borderColor: 'primary.main', 
      position: 'sticky', top: 0, zIndex: 1100 
    }}>
      {/* 🚀 Logo con redirección dinámica */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 2, cursor: 'pointer' }} onClick={handleLogoClick}>
        <img src={logo} alt="MonkeyMarket" style={{ width: 36, height: 36, objectFit: 'contain' }} />
        <Typography variant="h6" fontWeight={700} color="primary">MonkeyMarket</Typography>
      </Box>

      {/* Barra de Búsqueda */}
      {setBusqueda !== undefined && (
        <TextField
          size="small" 
          placeholder="Buscar productos por nombre, categoría..." 
          value={busqueda} 
          onChange={(e) => setBusqueda(e.target.value)} 
          onKeyDown={handleChatSubmit}
          sx={{ flex: 1, '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: 'primary.main' } } }}
          InputProps={{ 
            startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: 'text.secondary' }} /></InputAdornment>, 
            sx: { borderRadius: 50 } 
          }}
        />
      )}

      {/* Íconos de Acción */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 'auto' }}>
        
        {/* Notificaciones Reales */}
        {user && (
          <>
            <Tooltip title="Notificaciones">
              <IconButton color="inherit" onClick={handleOpenNotif} sx={{ color: 'primary.main' }}>
                <Badge badgeContent={unreadCount} sx={{'& .MuiBadge-badge': {backgroundColor: '#FACC15', color: 'black', fontWeight: 700,}}}>
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip>

            <Menu
              anchorEl={anchorElNotif} open={Boolean(anchorElNotif)} onClose={handleCloseNotif}
              PaperProps={{ sx: { width: 340, mt: 1.5, borderRadius: 3, maxHeight: 400, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' } }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }} anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <Box sx={{ p: 2, pb: 1 }}><Typography variant="subtitle1" fontWeight={800}>Notificaciones</Typography></Box>
              <Divider />
              {notificaciones.length === 0 ? (
                <MenuItem disabled sx={{ py: 3, justifyContent: 'center' }}><Typography variant="body2">No tienes notificaciones nuevas.</Typography></MenuItem>
              ) : (
                notificaciones.map((notif) => (
                  <MenuItem 
                    key={notif.id} 
                    onClick={() => handleNotifClick(notif.id)} 
                    sx={{ py: 1.5, display: 'block', backgroundColor: notif.leida ? 'transparent' : 'rgba(59, 130, 246, 0.08)' }}
                  >
                    <Typography variant="subtitle2" fontWeight={notif.leida ? 600 : 800} color={notif.leida ? 'text.primary' : 'primary.main'}>
                      {notif.titulo || "Aviso"}
                    </Typography>
                    <Typography variant="body2" fontWeight={500} sx={{ whiteSpace: 'normal', mb: 0.5 }}>
                      {notif.text}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(notif.time).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}
                    </Typography>
                  </MenuItem>
                ))
              )}
            </Menu>
          </>
        )}

        {/* 🚀 Carrito: Solo visible para clientes o invitados */}
        {isComprador && (
          <Tooltip title="Carrito">
            <IconButton onClick={() => navigate('/cart')}>
              <Badge badgeContent={carritoCount} color="primary" sx={{ color: 'primary.main' }}>
                <ShoppingCartIcon />
              </Badge>
            </IconButton>
          </Tooltip>
        )}

        {/* Zona de Usuario Logueado */}
        {user ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 1 }}>
            <Typography variant="body2" fontWeight={600}>{user.nombre}</Typography>
            <Tooltip title="Opciones">
              <IconButton onClick={handleOpenUserMenu} sx={{ p: 0, ml: 1 }}>
                <Avatar src={user?.foto} sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: '0.9rem' }}>
                  {user?.nombre?.charAt(0).toUpperCase() || 'U'}
                </Avatar>
              </IconButton>
            </Tooltip>
            <Menu 
              anchorEl={anchorElUser} open={Boolean(anchorElUser)} onClose={handleCloseUserMenu} 
              PaperProps={{ sx: { width: 200, mt: 1.5, borderRadius: 2 } }} 
              transformOrigin={{ horizontal: 'right', vertical: 'top' }} anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <MenuItem onClick={() => { handleCloseUserMenu(); navigate('/perfil'); }}><ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>Mi Perfil</MenuItem>
              <Divider />
              <MenuItem onClick={() => { handleCloseUserMenu(); onLogout(); }}><ListItemIcon><LogoutIcon fontSize="small" color="error" /></ListItemIcon><Typography color="error" fontWeight={600}>Cerrar Sesión</Typography></MenuItem>
            </Menu>
          </Box>
        ) : (
          /* Zona de Usuario NO Logueado (Botones Bonitos) */
          <>
            <Tooltip title="Iniciar Sesión">
              <IconButton onClick={() => navigate('/login')} sx={{ color: 'primary.main', display: { xs: 'flex', sm: 'none' } }}>
                <PersonIcon />
              </IconButton>
            </Tooltip>
            <Box sx={{ display: { xs: 'none', sm: 'flex' }, gap: 1 }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/login')}
                sx={{ 
                  borderRadius: 50, px: 3, ml: 2, textTransform: 'none', fontWeight: 600, borderWidth: 2,
                  '&:hover': { borderWidth: 2 }
                }}
              >
                Sign In
              </Button>
              <Button
                variant="contained"
                onClick={() => navigate('/registro')}
                sx={{ 
                  borderRadius: 50, px: 3, textTransform: 'none', fontWeight: 600, 
                  backgroundColor: '#FACC15', color: '#111', 
                  boxShadow: '0 4px 10px rgba(245, 158, 11, 0.3)', 
                  '&:hover': { backgroundColor: '#FDE047', boxShadow: '0 6px 15px rgba(245, 158, 11, 0.4)' } 
                }}
              >
                Sign Up
              </Button>
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
}

export default Navbar;