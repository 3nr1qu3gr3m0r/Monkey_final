import React, { useState, useEffect } from 'react';
import { 
  Box, Container, Typography, TextField, Button, Grid, 
  Paper, IconButton, Snackbar, Alert, CircularProgress, Divider,
  Stepper, Step, StepLabel, Card, CardContent
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddLocationAltIcon from '@mui/icons-material/AddLocationAlt';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useNavigate, Navigate } from 'react-router-dom';
import { initMercadoPago, Wallet } from '@mercadopago/sdk-react';
import Direcciones from './Direcciones';
import api from '../config/api';
import { useAlert } from '../context/AlertContext';

// Inicializar MercadoPago con la clave pública de prueba
initMercadoPago(import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY || 'TEST-PUBLIC-KEY');

function Checkout({ user, carrito, vaciarCarrito }) {
  const { showAlert, showConfirm } = useAlert();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadingDirecciones, setLoadingDirecciones] = useState(true);
  const [preferenceId, setPreferenceId] = useState(null);
  
  const [activeStep, setActiveStep] = useState(0);
  const [direcciones, setDirecciones] = useState([]);
  const [direccionSeleccionada, setDireccionSeleccionada] = useState(null);
  
  const [modalAddressOpen, setModalAddressOpen] = useState(false);
  const [direccionAEditar, setDireccionAEditar] = useState(null);

  const steps = ['Envío', 'Pago'];

  // Cargar direcciones reales desde MySQL
  useEffect(() => {
    const fetchDirecciones = async () => {
      try {
        const res = await api.get('/direcciones');
        setDirecciones(res.data);
        if (res.data.length > 0) {
          setDireccionSeleccionada(res.data[0]);
        }
      } catch (error) {
        console.error("Error cargando direcciones", error);
      } finally {
        setLoadingDirecciones(false);
      }
    };
    fetchDirecciones();
  }, []);

  const handleNextStep = () => setActiveStep(prev => prev + 1);
  const handleBackStep = () => setActiveStep(prev => prev - 1);

  const handleEditAddress = (e, dir) => {
    e.stopPropagation();
    const partes = dir.calle_y_numero.split(' #');
    const calle = partes[0] || dir.calle_y_numero;
    const numExt = partes[1] ? partes[1].split(' Int. ')[0] : '';
    const numInt = partes[1] && partes[1].includes('Int. ') ? partes[1].split('Int. ')[1] : '';

    setDireccionAEditar({
      id: dir.id,
      alias: dir.alias,
      calle: calle,
      numExt: numExt,
      numInt: numInt,
      cp: dir.codigo_postal,
      ciudad: dir.ciudad,
      alcaldia: dir.colonia,
      referencias: dir.indicaciones_extra
    });
    setModalAddressOpen(true);
  };

  const handleNewAddressClick = () => {
    setDireccionAEditar(null);
    setModalAddressOpen(true);
  };

  const saveNewAddress = async (rawForm, editId) => {
    try {
      const payload = {
        alias: rawForm.alias || 'Casa',
        calle_y_numero: `${rawForm.calle} #${rawForm.numExt}${rawForm.numInt ? ' Int. ' + rawForm.numInt : ''}`,
        colonia: rawForm.alcaldia,
        ciudad: rawForm.ciudad,
        codigo_postal: rawForm.cp,
        indicaciones_extra: rawForm.referencias || ''
      };

      if (editId) {
        await api.put(`/direcciones/${editId}`, payload);
        const updated = direcciones.map(d => d.id === editId ? { ...payload, id: editId } : d);
        setDirecciones(updated);
        if (direccionSeleccionada?.id === editId) setDireccionSeleccionada(updated.find(d => d.id === editId));
      } else {
        const res = await api.post('/direcciones', payload);
        const added = { ...payload, id: res.data.id };
        setDirecciones([...direcciones, added]);
        setDireccionSeleccionada(added);
      }
      
      setModalAddressOpen(false);
      setDireccionAEditar(null);

    } catch (error) {
      console.error("Error al guardar la dirección:", error);
      showAlert("Error al conectar con la base de datos.", "error");
    }
  };

  const handleDeleteAddress = async (e, id) => {
    e.stopPropagation();
    if(await showConfirm("¿Seguro que deseas eliminar esta dirección?")){
      try {
        await api.delete(`/direcciones/${id}`);
        setDirecciones(direcciones.filter(d => d.id !== id));
        if (direccionSeleccionada?.id === id) setDireccionSeleccionada(null);
      } catch (error) {
        showAlert("Error al eliminar la dirección.", "error");
      }
    }
  };

  if (carrito.length === 0) return <Navigate to="/cart" replace />;

  // 🚀 CORRECCIÓN: Lógica blindada para respetar la cantidad y agrupar bien
  const itemsAgrupados = carrito.reduce((acc, item) => {
    const existing = acc.find(i => i.id === item.id);
    const cantidadReal = item.cantidad ? Number(item.cantidad) : 1;

    if (existing) {
      existing.cantidad += cantidadReal;
    } else {
      acc.push({ ...item, cantidad: cantidadReal });
    }
    return acc;
  }, []);

  const subtotal = itemsAgrupados.reduce((total, item) => total + (item.precio * item.cantidad), 0);
  const envio = subtotal > 0 ? 150 : 0;
  const total = subtotal + envio;

  const handlePagarConMercadoPago = async () => {
    try {
      setLoading(true);
      const response = await api.post('/payments/create_preference', {
        carrito: itemsAgrupados, 
        user: user,
        direccion_envio: direccionSeleccionada 
      });

      if (response.data && response.data.id) {
        setPreferenceId(response.data.id);
      } else {
        showAlert("Error al obtener la preferencia de pago.", "error");
      }
    } catch (error) {
      console.error("Error al iniciar pago:", error);
      const serverMsg = error.response?.data?.message || error.message;
      showAlert(`No pudimos conectar con Mercado Pago: ${serverMsg}`, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f1f5f9', py: 6 }}>
      <Container maxWidth="lg">
        
        <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton 
              onClick={() => activeStep === 0 ? navigate('/cart') : handleBackStep()} 
              sx={{ mr: 2, backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6', boxShadow: 1, '&:hover': { backgroundColor: 'rgba(59, 130, 246, 0.2)' } }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h4" fontWeight={800}>Finalizar Compra</Typography>
          </Box>

          <Stepper activeStep={activeStep} sx={{ width: '40%', display: { xs: 'none', sm: 'flex' } }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4 }}>
          <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 65%' } }}>
              {activeStep === 0 ? (
                <Paper variant="outlined" sx={{ p: 4, borderRadius: 4, border: '2px solid #3B82F6' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h5" fontWeight={700}>Selecciona tu Dirección de Envío</Typography>
                    <Button 
                      startIcon={<AddLocationAltIcon />} variant="outlined" size="small"
                      onClick={handleNewAddressClick} sx={{ borderRadius: 50, fontWeight: 700, textTransform: 'none' }}
                    >
                      Añadir Nueva
                    </Button>
                  </Box>

                  {loadingDirecciones ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
                  ) : direcciones.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Typography color="text.secondary">No tienes direcciones guardadas. ¡Agrega una para continuar!</Typography>
                    </Box>
                  ) : (
                    <Grid container spacing={1.5}>
                      {direcciones.map((dir) => (
                        <Grid item xs={12} sm={6} md={4} key={dir.id}>
                          <Card 
                            variant="outlined" 
                            sx={{ 
                              borderRadius: 2, cursor: 'pointer', transition: 'all 0.2s',
                              borderColor: direccionSeleccionada?.id === dir.id ? 'primary.main' : 'divider',
                              backgroundColor: direccionSeleccionada?.id === dir.id ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
                              '&:hover': { borderColor: 'primary.light', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }
                            }}
                            onClick={() => setDireccionSeleccionada(dir)}
                          >
                            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5, alignItems: 'flex-start' }}>
                                <Typography variant="body2" fontWeight={800} color={direccionSeleccionada?.id === dir.id ? 'primary.main' : 'text.primary'} sx={{ lineHeight: 1.2 }}>
                                  {dir.alias}
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                  <IconButton size="small" onClick={(e) => handleEditAddress(e, dir)} sx={{ p: 0.2, mt: -0.5 }}>
                                    <EditIcon sx={{ fontSize: '0.9rem' }} />
                                  </IconButton>
                                  <IconButton size="small" color="error" onClick={(e) => handleDeleteAddress(e, dir.id)} sx={{ p: 0.2, mt: -0.5 }}>
                                    <DeleteIcon sx={{ fontSize: '0.9rem' }} />
                                  </IconButton>
                                  {direccionSeleccionada?.id === dir.id && <CheckCircleIcon color="primary" sx={{ fontSize: '1rem' }} />}
                                </Box>
                              </Box>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.1 }}>{dir.calle_y_numero}</Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.2 }}>{dir.colonia}, {dir.ciudad}</Typography>
                              <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', mt: 0.5, fontSize: '0.65rem', fontStyle: 'italic' }}>
                                {dir.indicaciones_extra || 'Sin ref.'}
                              </Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  )}

                  <Button 
                    variant="contained" fullWidth size="large"
                    disabled={!direccionSeleccionada} onClick={handleNextStep}
                    sx={{ mt: 4, py: 1.5, borderRadius: 50, fontWeight: 800, fontSize: '1rem' }}
                  >
                    Confirmar y Continuar al Pago
                  </Button>
                </Paper>
              ) : (
                <Paper variant="outlined" sx={{ p: 4, borderRadius: 4, border: '2px solid #3B82F6' }}>
                  <Typography variant="h5" fontWeight={700} mb={3} sx={{ pb: 1 }}>
                    Método de Pago
                  </Typography>
                  
                  <Box sx={{ mb: 3, p: 2, backgroundColor: 'grey.100', borderRadius: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <LocationOnIcon color="primary" />
                    <Box>
                      <Typography variant="body2" fontWeight={700}>Enviar a: {direccionSeleccionada?.alias}</Typography>
                      <Typography variant="caption" color="text.secondary">{direccionSeleccionada?.calle_y_numero}, {direccionSeleccionada?.ciudad}</Typography>
                    </Box>
                    <Button size="small" sx={{ ml: 'auto' }} onClick={() => setActiveStep(0)}>Cambiar</Button>
                  </Box>
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'center', py: 4 }}>
                    <svg width="320" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ maxWidth: '100%' }}>
                      <title>Mercado Pago</title>
                      <path d="M11.115 16.479a.93.927 0 0 1-.939-.886c-.002-.042-.006-.155-.103-.155-.04 0-.074.023-.113.059-.112.103-.254.206-.46.206a.816.814 0 0 1-.305-.066c-.535-.214-.542-.578-.521-.725.006-.038.007-.08-.02-.11l-.032-.03h-.034c-.027 0-.055.012-.093.039a.788.786 0 0 1-.454.16.7.699 0 0 1-.253-.05c-.708-.27-.65-.928-.617-1.126.005-.041-.005-.072-.03-.092l-.05-.04-.047.043a.728.726 0 0 1-.505.203.73.728 0 0 1-.732-.725c0-.4.328-.722.732-.722.364 0 .675.27.721.63l.026.195.11-.165c.01-.018.307-.46.852-.46.102 0 .21.016.316.05.434.13.508.52.519.68.008.094.075.1.09.1.037 0 .064-.024.083-.045a.746.744 0 0 1 .54-.225c.128 0 .263.03.402.09.69.293.379 1.158.374 1.167-.058.144-.061.207-.005.244l.027.013h.02c.03 0 .07-.014.134-.035.093-.032.235-.08.367-.08a.944.942 0 0 1 .94.93.936.934 0 0 1-.94.928zm7.302-4.171c-1.138-.98-3.768-3.24-4.481-3.77-.406-.302-.685-.462-.928-.533a1.559 1.554 0 0 0-.456-.07c-.182 0-.376.032-.58.095-.46.145-.918.505-1.362.854l-.023.018c-.414.324-.84.66-1.164.73a1.986 1.98 0 0 1-.43.049c-.362 0-.687-.104-.81-.258-.02-.025-.007-.066.04-.125l.008-.008 1-1.067c.783-.774 1.525-1.506 3.23-1.545h.085c1.062 0 2.12.469 2.24.524a7.03 7.03 0 0 0 3.056.724c1.076 0 2.188-.263 3.354-.795a9.135 9.11 0 0 0-.405-.317c-1.025.44-2.003.66-2.946.66-.962 0-1.925-.229-2.858-.68-.05-.022-1.22-.567-2.44-.57-.032 0-.065 0-.096.002-1.434.033-2.24.536-2.782.976-.528.013-.982.138-1.388.25-.361.1-.673.186-.979.185-.125 0-.35-.01-.37-.012-.35-.01-2.115-.437-3.518-.962-.143.1-.28.203-.415.31 1.466.593 3.25 1.053 3.812 1.089.157.01.323.027.491.027.372 0 .744-.103 1.104-.203.213-.059.446-.123.692-.17l-.196.194-1.017 1.087c-.08.08-.254.294-.14.557a.705.703 0 0 0 .268.292c.243.162.677.27 1.08.271.152 0 .297-.015.43-.044.427-.095.874-.448 1.349-.82.377-.296.913-.672 1.323-.782a1.494 1.49 0 0 1 .37-.05.611.61 0 0 1 .095.005c.27.034.533.125 1.003.472.835.62 4.531 3.815 4.566 3.846.002.002.238.203.22.537-.007.186-.11.352-.294.466a.902.9 0 0 1-.484.15.804.802 0 0 1-.428-.124c-.014-.01-1.28-1.157-1.746-1.543-.074-.06-.146-.115-.22-.115a.122.122 0 0 0-.096.045c-.073.09.01.212.105.294l1.48 1.47c.002 0 .184.17.204.395.012.244-.106.447-.35.606a.957.955 0 0 1-.526.171.766.764 0 0 1-.42-.127l-.214-.206a21.035 20.978 0 0 0-1.08-1.009c-.072-.058-.148-.112-.221-.112a.127.127 0 0 0-.094.038c-.033.037-.056.103.028.212a.698.696 0 0 0 .075.083l1.078 1.198c.01.01.222.26.024.511l-.038.048a1.18 1.178 0 0 1-.1.096c-.184.15-.43.164-.527.164a.8.798 0 0 1-.147-.012c-.106-.018-.178-.048-.212-.089l-.013-.013c-.06-.06-.602-.609-1.054-.98-.059-.05-.133-.11-.21-.11a.128.128 0 0 0-.096.042c-.09.096.044.24.1.293l.92 1.003a.204.204 0 0 1-.033.062c-.033.044-.144.155-.479.196a.91.907 0 0 1-.122.007c-.345 0-.712-.164-.902-.264a1.343 1.34 0 0 0 .13-.576 1.368 1.365 0 0 0-1.42-1.357c.024-.342-.025-.99-.697-1.274a1.455 1.452 0 0 0-.575-.125c-.146 0-.287.025-.42.075a1.153 1.15 0 0 0-.671-.564 1.52 1.515 0 0 0-.494-.085c-.28 0-.537.08-.767.242a1.168 1.165 0 0 0-.903-.43 1.173 1.17 0 0 0-.82.335c-.287-.217-1.425-.93-4.467-1.613a17.39 17.344 0 0 1-.692-.189 4.822 4.82 0 0 0-.077.494l.67.157c3.108.682 4.136 1.391 4.309 1.525a1.145 1.142 0 0 0-.09.442 1.16 1.158 0 0 0 1.378 1.132c.096.467.406.821.879 1.003a1.165 1.162 0 0 0 .415.08c.09 0 .179-.012.266-.034.086.22.282.493.722.668a1.233 1.23 0 0 0 .457.094c.122 0 .241-.022.355-.063a1.373 1.37 0 0 0 1.269.841c.37.002.726-.147.985-.41.221.121.688.341 1.163.341.06 0 .118-.002.175-.01.47-.059.689-.24.789-.382a.571.57 0 0 0 .048-.078c.11.032.234.058.373.058.255 0 .501-.086.75-.265.244-.174.418-.424.444-.637v-.01c.083.017.167.026.251.026.265 0 .527-.082.773-.242.48-.31.562-.715.554-.98a1.28 1.279 0 0 0 .978-.194 1.04 1.04 0 0 0 .502-.808 1.088 1.085 0 0 0-.16-.653c.804-.342 2.636-1.003 4.795-1.483a4.734 4.721 0 0 0-.067-.492 27.742 27.667 0 0 0-5.049 1.62zm5.123-.763c0 4.027-5.166 7.293-11.537 7.293-6.372 0-11.538-3.266-11.538-7.293 0-4.028 5.165-7.293 11.539-7.293 6.371 0 11.537 3.265 11.537 7.293zm.46.004c0-4.272-5.374-7.755-12-7.755S.002 7.277.002 11.55L0 12.004c0 4.533 4.695 8.203 11.999 8.203 7.347 0 12-3.67 12-8.204z" fill="#009EE3"/>
                    </svg>
                    <Typography variant="body1" textAlign="center" color="text.secondary">
                      Tu transacción será procesada de forma segura por Mercado Pago.
                    </Typography>
                    
                    {preferenceId && (
                      <Box sx={{ width: '100%', maxWidth: '400px', mt: 2 }}>
                        <Wallet 
                          initialization={{ preferenceId: preferenceId }} 
                          customization={{ texts: { valueProp: 'smart_option' } }} 
                        />
                      </Box>
                    )}

                  </Box>
                </Paper>
              )}
          </Box>

          {/* Resumen Sidebar (A la derecha) */}
          <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 35%' } }}>
              <Paper variant="outlined" sx={{ p: 3, borderRadius: 4, border: '2px solid #3B82F6', backgroundColor: '#F8FAFC' }}>
                <Typography variant="h6" fontWeight={700} mb={2}>Resumen del pedido</Typography>
                
                <Box sx={{ maxHeight: '250px', overflowY: 'auto', mb: 2 }}>
                  {itemsAgrupados.map((item, idx) => (
                    <Box key={idx} sx={{ display: 'flex', flexDirection: 'column', mb: 1.5 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ maxWidth: '65%' }}>
                          {item.cantidad}x {item.nombre}
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>
                          ${(item.precio * item.cantidad).toLocaleString('es-MX')}
                        </Typography>
                      </Box>
                      {/* 🚀 CORRECCIÓN: Renderiza fecha de la BD si ya está agendada */}
                      {(item.fechaReserva || item.fecha_agendada) && (
                        <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 600 }}>
                          📅 {item.fechaReserva || item.fecha_agendada}
                        </Typography>
                      )}
                    </Box>
                  ))}
                </Box>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">Productos:</Typography>
                  <Typography variant="body2" fontWeight={600}>${subtotal.toLocaleString('es-MX')}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">Envío y manejo:</Typography>
                  <Typography variant="body2" fontWeight={600}>${envio.toLocaleString('es-MX')}</Typography>
                </Box>
                <Divider sx={{ my: 2, borderColor: '#D5D9D9' }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                  <Typography variant="subtitle1" fontWeight={800} color="#3B82F6">Total del pedido:</Typography>
                  <Typography variant="subtitle1" fontWeight={800} color="#3B82F6">${total.toLocaleString('es-MX')}</Typography>
                </Box>

                {activeStep === 1 && !preferenceId ? (
                  <Button
                    onClick={handlePagarConMercadoPago}
                    fullWidth
                    variant="contained"
                    disabled={loading}
                    sx={{
                      py: 1.5, borderRadius: 50,
                      backgroundColor: '#FACC15', color: '#111', fontWeight: 800,
                      fontSize: '1rem',
                      '&:hover': { backgroundColor: '#FDE047' },
                      mb: 2
                    }}
                  >
                    {loading ? <CircularProgress size={24} color="inherit" /> : `Pagar con Mercado Pago`}
                  </Button>
                ) : null}
              </Paper>
          </Box>
        </Box>

        <Direcciones 
          open={modalAddressOpen} 
          onClose={() => {
            setModalAddressOpen(false);
            setDireccionAEditar(null);
          }} 
          onSave={saveNewAddress}
          initialData={direccionAEditar}
        />
      </Container>
    </Box>
  );
}

export default Checkout;