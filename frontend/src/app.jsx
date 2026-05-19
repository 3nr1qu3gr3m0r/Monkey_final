import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Box, Typography, Button } from '@mui/material';
import Registro_Usuario from './components/Registro_Usuario';
import LoginForm from './components/LoginForm';
import AppC from './components/App_C';
import Carrito from './components/Carrito';
import Checkout from './components/Checkout';
import AdminDashboard from './components_A/AdminDashboard';
import apiClient from './config/api';
import Perfil from './components/Perfil';
import Navbar from './components/Navbar';
import DashboardProveedor from './components_P/App_P';
import SuccessPage from './components/SuccessPage';
import DetalleArticulo from './components/DetalleArticulo';
import ChatProveedor from './components/ChatProveedor'; 
import { useAlert } from './context/AlertContext';

// Componente para evitar pantallas en blanco si algo falla
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, errorInfo) { console.error("EB caught:", error, errorInfo); }
  render() {
    if (this.state.hasError) {
      return <div style={{ color: 'red', padding: '20px', zIndex: 9999, position: 'relative', backgroundColor: 'black' }}>
        <h1>Algo salió mal en la aplicación.</h1>
        <pre>{this.state.error?.toString()}</pre>
      </div>;
    }
    return this.props.children;
  }
}

function App() {
  const { showAlert } = useAlert();
  const navigate = useNavigate();
  const location = useLocation();

  // 👇 1. INICIALIZAR USUARIO DESDE LOCALSTORAGE
  const [user, setUser] = useState(() => {
    const usuarioGuardado = localStorage.getItem('monkeyUser');
    return usuarioGuardado ? JSON.parse(usuarioGuardado) : null;
  });

  // Inicializar Carrito desde LocalStorage (Para Invitados)
  const [carrito, setCarrito] = useState(() => {
    const carritoGuardado = localStorage.getItem('monkeyCarrito');
    return carritoGuardado ? JSON.parse(carritoGuardado) : [];
  });

  // 👇 2. RECUPERAR TOKEN PARA AXIOS AL CARGAR LA APP
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, []);

  // Guardar Carrito en LocalStorage cada vez que cambie (Backup para invitados)
  useEffect(() => {
    localStorage.setItem('monkeyCarrito', JSON.stringify(carrito));
  }, [carrito]);

  const updateUser = (newData) => {
    setUser(prev => {
      const updatedUser = { ...prev, ...newData };
      localStorage.setItem('monkeyUser', JSON.stringify(updatedUser));
      return updatedUser;
    });
  };

  // 🔄 3. EL CEREBRO DE SINCRONIZACIÓN CON MYSQL
  const fetchCarrito = useCallback(async () => {
    if (user) {
      try {
        const { data } = await apiClient.get('/cart');
        const itemsFormateados = data.map(item => {
          const isProd = item.producto_id !== null;
          
          // 1. Reconstruimos el ID como lo espera el frontend (prod_1 o serv_2)
          const baseId = isProd ? `prod_${item.producto_id}` : `serv_${item.servicio_id}`;
          
          // 2. Si es servicio, le pegamos la fecha al ID para que no se mezcle con otros días
          const finalId = (!isProd && item.fecha_agendada) ? `${baseId}-${item.fecha_agendada}` : baseId;

          return {
            detalle_id: item.detalle_id, 
            id: finalId, // 🔑 ID reconstruido perfectamente
            dbId: item.producto_id || item.servicio_id, // Guardamos el número puro por si acaso
            nombre: item.producto_titulo || item.servicio_titulo,
            precio: Number(item.producto_precio || item.servicio_precio), // Aseguramos que sea número
            tipo: isProd ? 'Producto' : 'Servicio',
            imagenes: item.producto_img || item.servicio_img,
            cantidad: Number(item.cantidad),
            fecha_agendada: item.fecha_agendada,
            vendor: 'Proveedor' // Puedes mapear el nombre real si lo traes en la consulta SQL
          };
        });
        setCarrito(itemsFormateados);
      } catch (error) {
        console.error("Error al sincronizar carrito desde BD:", error);
      }
    }
  }, [user]);

  // Cargar carrito de la BD al iniciar sesión
  useEffect(() => {
    if (user) {
      fetchCarrito();
    }
  }, [user, fetchCarrito]);

  // ➕ AGREGAR AL CARRITO (Inteligente)
  const agregarAlCarrito = async (producto, cantidad = 1, fecha_agendada = null) => {
    if (user) {
      try {
        const idReal = producto.dbId || (typeof producto.id === 'string' && producto.id.includes('_') ? parseInt(producto.id.split('_')[1]) : producto.id);
        
        await apiClient.post('/cart/add', {
          producto_id: producto.tipo === 'Producto' ? idReal : null,
          servicio_id: producto.tipo === 'Servicio' ? idReal : null,
          cantidad: cantidad,
          fecha_agendada: fecha_agendada
        });
        await fetchCarrito(); // 🔄 Forzamos recarga de MySQL
      } catch (error) {
        console.error("Error al guardar en BD:", error);
        showAlert("Hubo un error al guardar tu producto en la nube.", "error");
      }
    } else {
      // Lógica para invitados
      setCarrito(prev => {
        const nuevos = [];
        for (let i = 0; i < cantidad; i++) {
          nuevos.push({ ...producto, fecha_agendada });
        }
        return [...prev, ...nuevos];
      });
    }
  };

  /**
   * 🔄 AJUSTAR CANTIDAD (Actualizado para MySQL)
   */
  const ajustarCantidad = async (producto, nuevaCantidad) => {
    const cant = Number(nuevaCantidad);
    
    // Si el usuario está logueado, actualizamos en el servidor
    if (user && producto.detalle_id) {
        if (cant <= 0) {
            return eliminarDelCarrito(producto);
        }
        try {
            // Usamos la ruta que creamos: /cart/update/:id
            await apiClient.put(`/cart/update/${producto.detalle_id}`, { cantidad: cant });
            await fetchCarrito(); // Recargamos para estar sincronizados
            return;
        } catch (error) {
            console.error("Error al actualizar cantidad en BD:", error);
        }
    }

    // Lógica local (para invitados o fallback)
    setCarrito(prev => {
      const nuevo = [];
      let yaInsertado = false;
      if (cant === 0) return prev.filter(p => p.id !== producto.id);
      for (const item of prev) {
        if (item.id === producto.id) {
          if (!yaInsertado) {
            for (let i = 0; i < cant; i++) nuevo.push(producto);
            yaInsertado = true;
          }
        } else {
          nuevo.push(item);
        }
      }
      if (!yaInsertado && cant > 0) {
        for (let i = 0; i < cant; i++) nuevo.push(producto);
      }
      return nuevo;
    });
  };

  // 🗑️ ELIMINAR DEL CARRITO
  const eliminarDelCarrito = async (item) => {
    if (user && item.detalle_id) {
      try {
        await apiClient.delete(`/cart/item/${item.detalle_id}`);
        await fetchCarrito(); // 🔄 Recargamos BD para que desaparezca
      } catch (error) {
        console.error("Error al borrar en BD:", error);
      }
    } else {
      setCarrito(prev => prev.filter(p => p.id !== item.id));
    }
  };

  // 🧹 VACIAR CARRITO
  const vaciarCarrito = async () => {
    if (user) {
      try {
        await apiClient.delete('/cart/clear');
        await fetchCarrito();
      } catch (error) {
        console.error("Error al vaciar BD:", error);
      }
    } else {
      setCarrito([]);
    }
  };

  const handleRegistro = async (data, fromLocation = null) => {
    try {
      const response = await apiClient.post('/auth/register', data);
      showAlert('¡Registro exitoso! Por favor, inicia sesión.', 'success');
      navigate('/login', { state: { from: fromLocation } });
    } catch (error) {
      const mensajeBackend = error.response?.data?.message;
      showAlert(mensajeBackend || 'Hubo un error de conexión con el servidor.', 'error');
    }
  };

  const handleLogin = async (data, fromLocation = null) => {
    try {
      const response = await apiClient.post('/auth/login', data);
      const { user: loggedUser, message, token } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('monkeyUser', JSON.stringify(loggedUser));
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`; 
      
      const carritoLocal = JSON.parse(localStorage.getItem('monkeyCarrito')) || [];
      if (carritoLocal.length > 0) {
        console.log("Fusionando carrito local con la base de datos...");
        for (const item of carritoLocal) {
          try {
            const idReal = item.dbId || (typeof item.id === 'string' && item.id.includes('_') ? parseInt(item.id.split('_')[1]) : item.id);
            await apiClient.post('/cart/add', {
              producto_id: item.tipo === 'Producto' ? idReal : null,
              servicio_id: item.tipo === 'Servicio' ? idReal : null,
              cantidad: item.cantidad || 1,
              fecha_agendada: item.fecha_agendada || null
            });
          } catch (err) {
            console.error(`Error al fusionar el item ${item.nombre}:`, err);
          }
        }
        localStorage.removeItem('monkeyCarrito');
      }

      setUser(loggedUser);
      showAlert(`¡Bienvenido de vuelta, ${loggedUser.nombre}! Tus artículos han sido guardados.`, 'success');

      if (fromLocation) {
        navigate(fromLocation); 
      } else if (loggedUser.rol === 'admin') {
        navigate('/admin');
      } else if (loggedUser.rol === 'proveedor') {
        navigate('/dashboard-proveedor');
      } else {
        navigate('/');
      }
    } catch (error) {
      const mensajeBackend = error.response?.data?.message;
      showAlert(mensajeBackend || 'Error al intentar iniciar sesión.', 'error');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token'); 
    localStorage.removeItem('monkeyUser');
    delete apiClient.defaults.headers.common['Authorization'];
    
    setUser(null); 
    setCarrito([]); 
    navigate('/'); 
  };

  return (
    <Box sx={{ p: 0, backgroundColor: 'background.default', minHeight: '100vh' }}>
      {!location.pathname.includes('dashboard') && !location.pathname.includes('admin') && (
         <Navbar user={user} carritoCount={carrito.length} onLogout={handleLogout} />
      )}
      
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<AppC user={user} carrito={carrito} agregarAlCarrito={agregarAlCarrito} ajustarCantidad={ajustarCantidad} />} />
          <Route path="/home" element={<AppC user={user} carrito={carrito} agregarAlCarrito={agregarAlCarrito} ajustarCantidad={ajustarCantidad} />} />
          
          <Route path="/registro" element={<Registro_Usuario onSubmit={(data) => handleRegistro(data, location.state?.from)} />} />
          <Route path="/login" element={<LoginForm onSubmit={(data) => handleLogin(data, location.state?.from)} />} />
          
          <Route path="/cart" element={<Carrito user={user} carrito={carrito} setCarrito={setCarrito} eliminarDelCarrito={eliminarDelCarrito} vaciarCarrito={vaciarCarrito} ajustarCantidad={ajustarCantidad} />} />
          <Route path="/checkout" element={<Checkout user={user} carrito={carrito} vaciarCarrito={vaciarCarrito} />} />
          <Route path="/payment-success" element={<SuccessPage user={user} carrito={carrito} vaciarCarrito={vaciarCarrito} />} />
          <Route path="/admin" element={<AdminDashboard user={user} onLogout={handleLogout} />} />
          <Route path="/dashboard-proveedor" element={<DashboardProveedor user={user} />} />
          <Route path="/perfil" element={<Perfil user={user} onUpdate={updateUser} />} />
          <Route path="/articulo/:id" element={<DetalleArticulo agregarAlCarrito={agregarAlCarrito} user={user} />} />
          <Route path="/chat-soporte" element={<ChatProveedor />} />
        </Routes>
      </ErrorBoundary>
    </Box>
  );
}

export default App;