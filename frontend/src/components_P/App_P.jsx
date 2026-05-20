import { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Avatar, Chip, IconButton,
  InputBase, Badge, Menu, MenuItem, Divider, ListItemIcon,
  Drawer,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import StorefrontIcon from '@mui/icons-material/Storefront';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import StarIcon from '@mui/icons-material/Star';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsIcon from '@mui/icons-material/Notifications';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import AssignmentIcon from '@mui/icons-material/Assignment';
import MenuIcon from '@mui/icons-material/Menu';
import { Tooltip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import CloseIcon from '@mui/icons-material/Close';

import logo from '../assets/logo2.png';
import ProdServForm from './ProdServForm';
import InicioResumen from './InicioResumen';
import MisServicios from './MisServicios';
import Estatus from './Estatus';
import Finanzas from './Finanzas';
import Reputacion from './Reputacion';
import Reportes from './Reportes';
import api from '../config/api';

// 🚀 AHORA IMPORTAMOS useStore TAMBIÉN
import { StoreProvider, useStore } from './Store';

const menuItems = [
  { icon: <DashboardIcon fontSize="medium" />, label: 'Inicio/Resumen' },
  { icon: <StorefrontIcon fontSize="medium" />, label: 'Mis Servicios y Productos' },
  { icon: <AssignmentIcon fontSize="medium" />, label: 'Estatus' },
  { icon: <AccountBalanceWalletIcon fontSize="medium" />, label: 'Finanzas' },
  { icon: <StarIcon fontSize="medium" />, label: 'Reputación (IA)' },
  { icon: <ReportProblemIcon fontSize="medium" />, label: 'Reportes', badge: true },
];

// ─── Contenido reutilizable del sidebar ──────────────────────────────────────
function SidebarContent({ activeMenu, setActiveMenu, onItemClick }) {
  return (
    <>
      <Typography variant="body2" fontWeight={700} sx={{
        color: 'rgba(255,255,255,0.5)', px: 1.5, mb: 2,
        letterSpacing: 1, fontSize: 11, textTransform: 'uppercase',
      }}>
        Mi Negocio
      </Typography>
      {menuItems.map((item) => (
        <Box
          key={item.label}
          onClick={() => {
            setActiveMenu(item.label);
            if (onItemClick) onItemClick();
          }}
          sx={{
            display: 'flex', alignItems: 'center', gap: 1.5,
            px: 1.5, py: 1.2, borderRadius: 2, mb: 0.5, cursor: 'pointer',
            backgroundColor: activeMenu === item.label ? 'rgba(255,255,255,0.15)' : 'transparent',
            color: activeMenu === item.label ? 'white' : 'rgba(255,255,255,0.6)',
            '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)', color: 'white' },
            transition: 'all 0.2s',
          }}
        >
          {item.icon}
          <Typography variant="body2" fontWeight={activeMenu === item.label ? 600 : 400}>
            {item.label}
          </Typography>
        </Box>
      ))}
    </>
  );
}

// ─── Layout interno (ya tiene acceso al store) ────────────────────────────────
function DashboardLayout({ user }) {
  const navigate = useNavigate();
  // 🚀 EXTRAEMOS LAS ACCIONES DEL STORE GLOBAL
  const { actions } = useStore();
  
  const [activeMenu, setActiveMenu] = useState('Inicio/Resumen');
  const [openForm, setOpenForm] = useState(false);
  const [busqueda, setBusqueda] = useState('');

  // Estado para el Drawer móvil
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Estados para el Menú de Notificaciones
  const [anchorElNotif, setAnchorElNotif] = useState(null);
  const handleOpenNotif = (event) => setAnchorElNotif(event.currentTarget);
  const handleCloseNotif = () => setAnchorElNotif(null);

  const [anchorElUser, setAnchorElUser] = useState(null);
  const handleOpenUser = (event) => setAnchorElUser(event.currentTarget);
  const handleCloseUser = () => setAnchorElUser(null);

  const [notificaciones, setNotificaciones] = useState([]);
  const unreadCount = notificaciones.filter(n => !n.leida).length;

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

      // Polling cada 30 segundos por si caen ventas mientras está en el panel
      const interval = setInterval(fetchNotificaciones, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // 🚀 NUEVO: DESCARGAMOS EL CATÁLOGO DE FORMA GLOBAL
  useEffect(() => {
    if (user) {
      const fetchCatalogo = async () => {
        try {
          const [resProd, resServ] = await Promise.all([
            api.get('/products?me=true'), 
            api.get('/services?me=true')
          ]);

          const productosDB = resProd.data.map(p => ({
            id: `prod_${p.id}`, dbId: p.id, tipo: 'producto', nombre: p.titulo,
            descripcion: p.descripcion, precio: Number(p.precio), stock: p.stock,
            categoria: p.categoria || 'Varios',
            fotos: typeof p.imagenes === 'string' ? JSON.parse(p.imagenes) : (p.imagenes || []),
            estado: p.esta_activo === 1 ? 'activo' : p.esta_activo === 2 ? 'pausado' : 'bloqueado',
          }));

          const serviciosDB = resServ.data.map(s => {
            const agenda = typeof s.datos_agenda === 'string' ? JSON.parse(s.datos_agenda) : (s.datos_agenda || {});
            return {
              id: `serv_${s.id}`, dbId: s.id, tipo: 'servicio', nombre: s.titulo,
              descripcion: s.descripcion, precio: Number(s.precio),
              categoria: s.categoria || 'Varios',
              fotos: typeof s.imagenes === 'string' ? JSON.parse(s.imagenes) : (s.imagenes || []),
              diasDisponibles: agenda.dias || [], horario: agenda.horario || null,
              estado: s.esta_activo === 1 ? 'activo' : s.esta_activo === 2 ? 'pausado' : 'bloqueado',
            };
          });

          actions.setItems([...productosDB, ...serviciosDB]);
        } catch (error) {
          console.error("Error al cargar tu catálogo global:", error);
        }
      };
      fetchCatalogo();
    }
  }, [user]);

  const handleNotifClick = async (id) => {
    try {
      await api.put(`/notificaciones/${id}/leer`);
      setNotificaciones(prev => prev.map(n => n.id === id ? { ...n, leida: 1 } : n));
    } catch (error) {
      console.error("Error al marcar como leída", error);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#F3F4F6' }}>
      <ProdServForm open={openForm} onClose={() => setOpenForm(false)} />

      {/* ── Navbar superior ── */}
      <Box sx={{
        display: 'flex', alignItems: 'center', gap: 2,
        px: { xs: 1, md: 2, lg: 3 }, py: 1.2, backgroundColor: 'white',
        borderBottom: '1px solid #e5e7eb',
        position: 'sticky', top: 0, zIndex: 100,
        minWidth: 0, border: '1px solid', borderColor: 'primary.main',
      }}>

        {/* Botón hamburguesa — solo en móvil */}
        <IconButton
          sx={{ display: { xs: 'flex', md: 'none' }, mr: 0.5 }}
          onClick={() => setSidebarOpen(true)}
        >
          <MenuIcon />
        </IconButton>

        <Box
          sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 2, cursor: 'pointer' }}
          onClick={() => navigate('/dashboard-proveedor')}
        >
          <img src={logo} alt="MonkeyMarket" style={{ width: 36, height: 36, objectFit: 'contain' }} />
          <Typography fontWeight={700} color="primary" fontSize={20}>MonkeyMarket</Typography>
        </Box>

        {/* Barra de búsqueda*/}
        <Box sx={{
          display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 2,
          backgroundColor: '#f5f4f4', borderRadius: 50,
          px: 2, py: 0.8, flex: 1, maxWidth: 800, border: '2px solid', borderColor: 'primary.main', ml: 6,  
        }}>
          <SearchIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
          <InputBase
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar en Mi Negocio..."
            sx={{ flex: 1, fontSize: 14 }}
          />
          {busqueda && (
            <IconButton size="small" onClick={() => setBusqueda('')} sx={{ p: 0.2 }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          )}
        </Box>

        <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title="Notificaciones">
            <IconButton size="medium" onClick={handleOpenNotif} sx={{ color: 'primary.main' }}>
              <Badge badgeContent={unreadCount} sx={{ '& .MuiBadge-badge': { backgroundColor: '#FACC15', color: 'black', fontWeight: 700 } }}>
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* Menú de notificaciones */}
          <Menu
            anchorEl={anchorElNotif} open={Boolean(anchorElNotif)} onClose={handleCloseNotif}
            PaperProps={{ sx: { width: 340, mt: 1.5, maxHeight: 400, borderRadius: 3, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' } }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }} anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <Box sx={{ p: 2, pb: 1 }}><Typography variant="subtitle1" fontWeight={800}>Notificaciones</Typography></Box>
            <Divider />

            {notificaciones.length === 0 ? (
              <MenuItem disabled sx={{ py: 3, justifyContent: 'center' }}>
                <Typography variant="body2">Sin novedades por ahora.</Typography>
              </MenuItem>
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

            <Divider />
            <MenuItem onClick={handleCloseNotif} sx={{ justifyContent: 'center', color: 'primary.main', fontWeight: 600 }}>Ver todas</MenuItem>
          </Menu>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 1 }}>
            {/* Nombre del usuario — oculto en pantallas muy pequeñas */}
            <Typography variant="body2" fontWeight={600} sx={{ display: { xs: 'none', sm: 'block' } }}>
              {user?.nombre}
            </Typography>
            <Tooltip title="Mi Perfil">
              <IconButton onClick={handleOpenUser} sx={{ p: 1, ml: { xs: 0, sm: 1 } }}>
                <PersonIcon color="primary" />
              </IconButton>
            </Tooltip>
          </Box>

          <Menu
            anchorEl={anchorElUser} open={Boolean(anchorElUser)} onClose={handleCloseUser}
            PaperProps={{ sx: { width: 220, mt: 1.5, borderRadius: 3, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' } }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }} anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem onClick={() => { navigate('/perfil'); handleCloseUser(); }}>
              <ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>
              Ver Perfil
            </MenuItem>
            <Divider />
            <MenuItem onClick={() => { handleCloseUser(); navigate('/login'); }} sx={{ color: 'error.main' }}>
              <ListItemIcon><LogoutIcon fontSize="small" color="error" /></ListItemIcon>
              Cerrar Sesión
            </MenuItem>
          </Menu>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Sidebar desktop — oculto en móvil */}
        <Box sx={{
          width: 270, flexShrink: 0, backgroundColor: 'primary.main',
          py: 2, px: 1.5,
          position: 'sticky', top: 52,
          height: 'calc(100vh - 52px)', overflowY: 'auto',
          display: { xs: 'none', md: 'block' },
        }}>
          <SidebarContent activeMenu={activeMenu} setActiveMenu={setActiveMenu} />
        </Box>

        {/* Drawer móvil — visible solo en xs/sm */}
        <Drawer
          anchor="left"
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          sx={{ display: { xs: 'block', md: 'none' } }}
          PaperProps={{
            sx: { width: 270, backgroundColor: 'primary.main', py: 2, px: 1.5 }
          }}
        >
          <SidebarContent
            activeMenu={activeMenu}
            setActiveMenu={setActiveMenu}
            onItemClick={() => setSidebarOpen(false)}
          />
        </Drawer>

        {/* Contenido — cada sección lee del mismo store */}
        <Box sx={{ flex: 1, p: { xs: 2, md: 3 }, overflowY: 'auto', height: 'calc(100vh - 52px)' }}>
          {activeMenu === 'Inicio/Resumen'            && <InicioResumen onNavigate={setActiveMenu} busqueda={busqueda} />}
          {activeMenu === 'Mis Servicios y Productos' && <MisServicios busqueda={busqueda} user={user} />}
          {activeMenu === 'Estatus'                   && <Estatus busqueda={busqueda} />}
          {activeMenu === 'Finanzas'                  && <Finanzas busqueda={busqueda} />}
          {activeMenu === 'Reputación (IA)'           && <Reputacion busqueda={busqueda} />}
          {activeMenu === 'Reportes'                  && <Reportes busqueda={busqueda} />}
        </Box>
      </Box>
    </Box>
  );
}

export default function DashboardProveedor({ user }) {
  return (
    <StoreProvider>
      <DashboardLayout user={user} />
    </StoreProvider>
  );
}