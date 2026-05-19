import React from 'react';
import { Box, Typography, Divider, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';

const TicketCompra = ({ carrito = [], user, orderId, date }) => {
  
  // 🚀 CORRECCIÓN: Lógica blindada para respetar la cantidad real
  const itemsAgrupados = (carrito || []).reduce((acc, item) => {
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

  return (
    <Box 
      id="ticket-pdf-content"
      sx={{ 
        width: '100%', 
        maxWidth: '800px', 
        margin: '0 auto', 
        backgroundColor: '#fff', 
        p: 5,
        border: '1px solid #e0e0e0',
        borderRadius: 2,
        fontFamily: "'Courier New', Courier, monospace", // Typical receipt font feel but elegant
        color: '#111'
      }}
    >
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Typography variant="h3" fontWeight={900} sx={{ fontFamily: 'Inter, sans-serif', color: '#3B82F6', mb: 1 }}>
          MonkeyMarket
        </Typography>
        <Typography variant="h6" fontWeight={600}>TICKET DE COMPRA</Typography>
        <Typography variant="body2" color="text.secondary">Order #{orderId}</Typography>
        <Typography variant="body2" color="text.secondary">Fecha: {date}</Typography>
      </Box>

      <Divider sx={{ borderStyle: 'dashed', my: 2 }} />

      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={700}>Detalles del Cliente:</Typography>
        <Typography variant="body1">{user?.nombre || 'Invitado'}</Typography>
        <Typography variant="body2" color="text.secondary">{user?.email || ''}</Typography>
      </Box>

      <Table size="small" sx={{ mb: 3 }}>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 700, borderBottom: '2px dashed #e0e0e0', px: 1 }}>Cant.</TableCell>
            <TableCell sx={{ fontWeight: 700, borderBottom: '2px dashed #e0e0e0' }}>Descripción</TableCell>
            <TableCell align="right" sx={{ fontWeight: 700, borderBottom: '2px dashed #e0e0e0', px: 1 }}>Precio</TableCell>
            <TableCell align="right" sx={{ fontWeight: 700, borderBottom: '2px dashed #e0e0e0', px: 1 }}>Subtotal</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {itemsAgrupados.map((item, index) => (
            <TableRow key={index} sx={{ '&:last-child td': { border: 0 } }}>
              <TableCell sx={{ px: 1, borderBottom: '1px dashed #e0e0e0' }}>{item.cantidad}</TableCell>
              <TableCell sx={{ borderBottom: '1px dashed #e0e0e0' }}>
                {item.nombre}
                {/* Si tiene fecha agendada, la mostramos en el ticket */}
                {(item.fechaReserva || item.fecha_agendada) && (
                   <Typography variant="caption" display="block" color="primary.main" fontWeight={600}>
                     📅 {item.fechaReserva || item.fecha_agendada}
                   </Typography>
                )}
                <Typography variant="caption" display="block" color="text.secondary">{item.vendor}</Typography>
              </TableCell>
              <TableCell align="right" sx={{ px: 1, borderBottom: '1px dashed #e0e0e0' }}>${Number(item.precio).toLocaleString('es-MX')}</TableCell>
              <TableCell align="right" sx={{ px: 1, borderBottom: '1px dashed #e0e0e0' }}>${(Number(item.precio) * item.cantidad).toLocaleString('es-MX')}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
        <Box sx={{ width: '250px' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography>Subtotal:</Typography>
            <Typography>${subtotal.toLocaleString('es-MX')}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography>Costo de Envío:</Typography>
            <Typography>${envio.toLocaleString('es-MX')}</Typography>
          </Box>
          <Divider sx={{ borderStyle: 'dashed', my: 1 }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
            <Typography variant="h6" fontWeight={800}>TOTAL:</Typography>
            <Typography variant="h6" fontWeight={800} color="primary">${total.toLocaleString('es-MX')}</Typography>
          </Box>
        </Box>
      </Box>

      <Divider sx={{ borderStyle: 'dashed', my: 3 }} />

      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="subtitle1" fontWeight={700}>¡Gracias por tu compra!</Typography>
        <Typography variant="body2" color="text.secondary">Vuelve pronto a MonkeyMarket</Typography>
      </Box>
    </Box>
  );
};

export default TicketCompra;