import React, { useEffect, useState, useRef } from 'react';
import { Box, Container, Typography, Button, CircularProgress, Paper, Snackbar, Alert } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import HomeIcon from '@mui/icons-material/Home';
import { useNavigate, useSearchParams } from 'react-router-dom';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

import TicketCompra from './TicketCompra';
import { useAlert } from '../context/AlertContext';

function SuccessPage({ user, carrito, vaciarCarrito }) {
  const { showAlert } = useAlert();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [notificando, setNotificando] = useState(true);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState("");

  // Tomamos una "foto" del carrito actual para que el ticket no se borre cuando vaciemos el estado global
  const [ordenProcesada] = useState(carrito || []);
  const carritoVaciado = useRef(false); // Para asegurar que solo vaciamos 1 vez

  // Mercado Pago por defecto envía params como payment_id, status, etc.
  const paymentId = searchParams.get('payment_id') || `MM-${Math.floor(Math.random() * 1000000)}`;
  const orderDate = new Date().toLocaleString();

  useEffect(() => {
    // 1. Manejo Asíncrono para limpiar la Base de Datos y registrar el pedido
    const finalizarCompra = async () => {
      if (vaciarCarrito && !carritoVaciado.current && ordenProcesada.length > 0) {
        try {
          // 🚀 AQUÍ: En el futuro haremos el api.post('/pedidos', { items: ordenProcesada, paymentId })
          
          await vaciarCarrito(); // Limpia MySQL y el estado global
          carritoVaciado.current = true;
        } catch (error) {
          console.error("Error al procesar el cierre del carrito:", error);
        }
      }
    };

    finalizarCompra();

    // 2. Simulamos la carga visual
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);

    // 3. Simulamos las notificaciones usando nuestra "foto" de la orden (ordenProcesada)
    if (ordenProcesada && ordenProcesada.length > 0) {
      let count = 0;
      const interval = setInterval(() => {
        if (count < ordenProcesada.length) {
          const item = ordenProcesada[count];
          setSnackbarMsg(`🚀 Notificando a ${item.vendor || 'Proveedor'} por "${item.nombre}"...`);
          setSnackbarOpen(true);
          count++;
        } else {
          setNotificando(false);
          setSnackbarMsg("✅ Todos los proveedores han sido notificados.");
          setSnackbarOpen(true);
          clearInterval(interval);
        }
      }, 2500);

      return () => {
        clearTimeout(timer);
        clearInterval(interval);
      };
    } else {
      setLoading(false);
      setNotificando(false);
    }
  }, [vaciarCarrito, ordenProcesada]);

  const handleDownloadTicket = async () => {
    const element = document.getElementById('ticket-pdf-content');
    if (!element) return;
    try {
      const canvas = await html2canvas(element, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`MonkeyMarket_Ticket_${paymentId}.pdf`);
    } catch (error) {
      console.error(error);
      showAlert("Hubo un error al generar el PDF.", "error");
    }
  };

  const handleVolverInicio = () => {
    navigate('/');
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbarOpen(false);
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress size={60} thickness={4} />
        <Typography variant="h6" sx={{ mt: 3, fontWeight: 700, color: '#3B82F6' }}>
          Validando tu pago con Mercado Pago...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f1f5f9', py: 8 }}>
      <Container maxWidth="md">
        <Box sx={{ textAlign: 'center', animation: 'fadeIn 0.5s ease-in-out' }}>
          <Typography variant="h4" fontWeight={800} color="success.main" gutterBottom>
            ¡Pago Exitoso!
          </Typography>
          <Typography variant="body1" color="text.secondary" mb={4}>
            Tu pedido ha sido procesado correctamente por Mercado Pago. Aquí tienes tu ticket.
            <br/> <b>Referencia MP:</b> #{paymentId}
          </Typography>

          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
            <Box sx={{ 
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
              borderRadius: 2,
              overflow: 'hidden',
              backgroundColor: '#fff'
            }}>
              {/* Le pasamos la "foto" de la orden al ticket, no el carrito global que ya está vacío */}
              <TicketCompra carrito={ordenProcesada} user={user} orderId={paymentId} date={orderDate} />
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={handleDownloadTicket}
              sx={{
                py: 1.5, px: 4, borderRadius: 50,
                backgroundColor: '#FACC15', color: '#111', fontWeight: 800,
                '&:hover': { backgroundColor: '#eab308' }
              }}
            >
              Descargar Ticket PDF
            </Button>
            <Button
              variant="outlined"
              startIcon={<HomeIcon />}
              onClick={handleVolverInicio}
              sx={{
                py: 1.5, px: 4, borderRadius: 50,
                borderWidth: 2, fontWeight: 700,
                borderColor: '#3B82F6', color: '#3B82F6',
                '&:hover': { borderWidth: 2, backgroundColor: 'rgba(59,130,246,0.05)' }
              }}
            >
              Volver al Inicio
            </Button>
          </Box>
        </Box>
      </Container>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={2000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbarMsg.startsWith('✅') ? "success" : "info"} 
          variant="filled" 
          sx={{ width: '100%', borderRadius: 2, fontWeight: 600 }}
        >
          {snackbarMsg}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default SuccessPage;