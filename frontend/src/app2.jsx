import React, { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
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
import { useAlert } from './context/AlertContext';

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, errorInfo) { console.error("EB caught:", error, errorInfo); }
  render() {
    if (this.state.hasError) {
      return <div style={{ color: 'red', padding: '20px', zIndex: 9999, position: 'relative', backgroundColor: 'black' }}>
        <h1>Something went wrong.</h1>
        <pre>{this.state.error?.toString()}</pre>
        <pre>{this.state.error?.stack}</pre>
      </div>;
    }
    return this.props.children;
  }
}

function App() {
  const { showAlert } = useAlert();
  const navigate = useNavigate();
  const [carrito, setCarrito] = useState([]);
  const [user, setUser] = useState(null);

  const agregarAlCarrito = (producto, cantidad = 1) => {
    setCarrito(prev => [...prev, ...Array(cantidad).fill(producto)]);
  };

  const ajustarCantidad = (producto, nuevaCantidad) => {
    setCarrito(prev => {
      const nuevo = [];
      let yaInsertado = false;

      // Si la cantidad es 0, simplemente filtramos todas las ocurrencias
      if (Number(nuevaCantidad) === 0) return prev.filter(p => p.id !== producto.id);

      for (const item of prev) {
        if (item.id === producto.id) {
          if (!yaInsertado) {
            // Insertar la nueva cantidad completa en la primera posición encontrada
            for (let i = 0; i < Number(nuevaCantidad); i++) {
              nuevo.push(producto);
            }
            yaInsertado = true;
          }
          // Ignorar el resto de ocurrencias antiguas (ya las reemplazamos arriba)
        } else {
          nuevo.push(item);
        }
      }

      // Si el producto no estaba en el carrito (caso raro al ajustar), añadirlo al final
      if (!yaInsertado && Number(nuevaCantidad) > 0) {
        for (let i = 0; i < Number(nuevaCantidad); i++) {
          nuevo.push(producto);
        }
      }

      return nuevo;
    });
  };

  const eliminarDelCarrito = (productoId) => {
    setCarrito(prev => prev.filter(p => p.id !== productoId));
  };

  const vaciarCarrito = () => setCarrito([]);

  const handleRegistro = async (data) => {
    try {
      const response = await apiClient.post('/auth/register', data);
      console.log('Registro exitoso:', response.data);
      showAlert('¡Registro exitoso! Preparando tu asistente...', 'success');
    } catch (error) {
      const mensajeBackend = error.response?.data?.message;
      showAlert(mensajeBackend || 'Hubo un error de conexión con el servidor.', 'error');
    }
  };

  const handleLogin = async (data) => {
    try {
      const response = await apiClient.post('/auth/login', data);
      const { user: loggedUser, message } = response.data;
      console.log('Login exitoso:', message);
      setUser(loggedUser);
      showAlert(`¡Bienvenido de vuelta, ${loggedUser.nombre}!`, 'success');
      
      // Redirección por Rol
      if (loggedUser.rol === 'admin') {
        navigate('/admin');
      } else if (loggedUser.rol === 'proveedor') {
        navigate('/dashboard-proveedor');
      } else {
        navigate('/home');
      }
    } catch (error) {
      const mensajeBackend = error.response?.data?.message;
      showAlert(mensajeBackend || 'Error al intentar iniciar sesión.', 'error');
    }
  };

  return (
    <Box sx={{ p: 0, backgroundColor: 'background.default', minHeight: '100vh' }}>
      {/* Navbar global */}
      {!window.location.pathname.includes('dashboard') && (
       <Navbar user={user} carritoCount={carrito.length} />
      )}
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<AppC user={user} carrito={carrito} agregarAlCarrito={agregarAlCarrito} ajustarCantidad={ajustarCantidad} />} />
          <Route path="/registro" element={<Registro_Usuario onSubmit={handleRegistro} />} />
          <Route path="/login" element={<LoginForm onSubmit={handleLogin} />} />
          <Route path="/home" element={<AppC user={user} carrito={carrito} agregarAlCarrito={agregarAlCarrito} ajustarCantidad={ajustarCantidad} />} />
          <Route path="/cart" element={<Carrito user={user} carrito={carrito} setCarrito={setCarrito} eliminarDelCarrito={eliminarDelCarrito} vaciarCarrito={vaciarCarrito} ajustarCantidad={ajustarCantidad} />} />
          <Route path="/checkout" element={<Checkout user={user} carrito={carrito} vaciarCarrito={vaciarCarrito} />} />
          <Route path="/TicketCompra" element={<SuccessPage user={user} carrito={carrito} vaciarCarrito={vaciarCarrito} />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/dashboard-proveedor" element={<DashboardProveedor user={user} />} />
          <Route path="/perfil" element={<Perfil user={user} />} />
        </Routes>
      </ErrorBoundary>
    </Box>
  );
}

export default App;