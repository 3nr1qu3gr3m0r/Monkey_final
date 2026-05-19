import React, { useState, useMemo } from 'react';
import { Box, Typography, Grid, Paper, Button, Modal, TextField, Alert, CircularProgress, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { useStore } from './Store';
import api from '../config/api';

// ─── Tooltip personalizado para la línea ───
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <Box sx={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: 2, px: 2, py: 1.5, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
      <Typography variant="caption" color="text.secondary" fontWeight={600}>{label}</Typography>
      <Typography variant="body2" fontWeight={700} color="#1D4ED8">
        ${payload[0].value.toLocaleString('es-MX')} MXN
      </Typography>
    </Box>
  );
}

export default function Finanzas() {
  const { state, actions } = useStore();
  // 🚀 AQUI: Extraemos totalRetiros en lugar de devoluciones
  const { pedidosActivos, saldoWallet, totalRetiros } = state;

  // Estados para el Modal de Retiro
  const [openRetiro, setOpenRetiro] = useState(false);
  const [montoRetiro, setMontoRetiro] = useState('');
  const [cuentaDestino, setCuentaDestino] = useState('');
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState({ text: '', type: '' });

  // ─── Cálculos Reales de KPIs ───
  const ingresosTotales = pedidosActivos.reduce((sum, p) => sum + Number(p.monto), 0);
  const ticketPromedio = pedidosActivos.length > 0 ? ingresosTotales / pedidosActivos.length : 0;

  const kpis = [
    { title: 'INGRESOS TOTALES (HISTÓRICO)', value: `$${ingresosTotales.toLocaleString('es-MX')}`, color: '#1D4ED8' },
    { title: 'PEDIDOS / RESERVAS', value: pedidosActivos.length.toString(), color: '#059669' },
    { title: 'TICKET PROMEDIO', value: `$${Math.round(ticketPromedio).toLocaleString('es-MX')}`, color: '#7C3AED' },
    // 🚀 AQUI: Reemplazamos la tarjeta
    { title: 'TOTAL RETIRADO', value: `$${(totalRetiros || 0).toLocaleString('es-MX')}`, color: '#F59E0B' },
  ];

  // 🚀 GRÁFICA DINÁMICA: Calculamos los ingresos reales por mes
  const revenueData = useMemo(() => {
    // Inicializamos los meses del año
    const meses = { Ene: 0, Feb: 0, Mar: 0, Abr: 0, May: 0, Jun: 0, Jul: 0, Ago: 0, Sep: 0, Oct: 0, Nov: 0, Dic: 0 };
    
    pedidosActivos.forEach(pedido => {
      // pedido.fecha viene como "27 abr 2026"
      const partes = pedido.fecha.split(' ');
      if (partes.length >= 2) {
        // Extraemos "abr", le quitamos puntos si los tiene, y lo capitalizamos -> "Abr"
        const mesStr = partes[1].replace('.', '').charAt(0).toUpperCase() + partes[1].replace('.', '').slice(1);
        if (meses[mesStr] !== undefined) {
          meses[mesStr] += Number(pedido.monto);
        }
      }
    });

    // Convertimos el objeto a un arreglo para Recharts
    return Object.keys(meses).map(key => ({ name: key, ingresos: meses[key] }));
  }, [pedidosActivos]);

  // Gráfica Circular Real basada en los tipos de venta
  const productosCount = pedidosActivos.filter(p => p.tipo === 'producto').length;
  const serviciosCount = pedidosActivos.filter(p => p.tipo === 'servicio').length;
  const volumeData = [
    { name: 'Productos', value: productosCount, color: '#1D4ED8' },
    { name: 'Servicios', value: serviciosCount, color: '#7C3AED' },
  ].filter(v => v.value > 0); 

  // ─── Lógica para solicitar retiro ───
  const handleRetirar = async () => {
    if (Number(montoRetiro) <= 0 || Number(montoRetiro) > saldoWallet) {
      setMensaje({ text: 'Monto inválido o superior a tu saldo.', type: 'error' });
      return;
    }
    if (!cuentaDestino.trim()) {
      setMensaje({ text: 'Ingresa una cuenta CLABE o Tarjeta.', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/proveedor/retiro', { monto: Number(montoRetiro), cuentaDestino: cuentaDestino });
      
      actions.actualizarWallet(res.data.nuevoSaldo);
      setMensaje({ text: res.data.message, type: 'success' });
      
      setTimeout(() => {
        setOpenRetiro(false);
        setMensaje({ text: '', type: '' });
        setMontoRetiro('');
        setCuentaDestino('');
      }, 3000);

    } catch (error) {
      setMensaje({ text: error.response?.data?.message || 'Error al solicitar el retiro.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Finanzas y Retiros</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Controla tus ganancias y solicita retiros a tu cuenta bancaria.
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'right', backgroundColor: 'white', p: 1.5, borderRadius: 2, border: '1px solid #e5e7eb' }}>
           <Typography variant="caption" color="text.secondary" fontWeight={600}>SALDO DISPONIBLE</Typography>
           <Typography variant="h4" fontWeight={800} color="#10B981">${Number(saldoWallet).toLocaleString('es-MX')}</Typography>
           <Button 
             variant="contained" size="small" sx={{ mt: 1, borderRadius: 5, fontWeight: 700 }}
             disabled={saldoWallet <= 0}
             onClick={() => setOpenRetiro(true)}
            >
             Retirar Fondos
           </Button>
        </Box>
      </Box>

      {/* KPIs */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        {kpis.map((stat, idx) => (
          <Grid item xs={12} sm={6} md={3} key={idx}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #E5E7EB', backgroundColor: 'white' }}>
              <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ letterSpacing: 0.5 }}>{stat.title}</Typography>
              <Typography variant="h4" fontWeight={800} sx={{ color: stat.color, mt: 0.5 }}>{stat.value}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Gráficas */}
      <Grid container spacing={3}>
        {/* Línea de ingresos */}
        <Grid item xs={12} md={8}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #E5E7EB', height: 380 }}>
            <Typography variant="h6" fontWeight={600} color="#111827" sx={{ mb: 2 }}>Ingresos Anuales</Typography>
            <ResponsiveContainer width="100%" height="85%">
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                <RechartsTooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="ingresos" stroke="#1D4ED8" strokeWidth={3} dot={{ r: 4, fill: '#1D4ED8', strokeWidth: 0 }} activeDot={{ r: 6, fill: '#1D4ED8' }} />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Pie de distribución */}
        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #E5E7EB', height: 380 }}>
            <Typography variant="h6" fontWeight={600} color="#111827" sx={{ mb: 2 }}>Distribución de Ventas</Typography>
            {volumeData.length === 0 ? (
               <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 10 }}>Aún no tienes ventas registradas.</Typography>
            ) : (
              <ResponsiveContainer width="100%" height="85%">
                <PieChart>
                  <Pie data={volumeData} innerRadius="60%" outerRadius="85%" paddingAngle={4} dataKey="value">
                    {volumeData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                  </Pie>
                  <RechartsTooltip formatter={(value) => [`${value} ventas`, 'Volumen']} contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" formatter={(value) => (<Typography component="span" variant="caption" fontWeight={600} color="#374151">{value}</Typography>)} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Modal de Retiro */}
      <Modal open={openRetiro} onClose={() => !loading && setOpenRetiro(false)}>
        <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', backgroundColor: 'white', borderRadius: 4, p: { xs: 3, sm: 4 }, width: { xs: '92%', sm: '100%' }, maxWidth: 400, boxShadow: 24, outline: 'none' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" fontWeight={800}>Retirar Fondos</Typography>
            <IconButton size="small" onClick={() => setOpenRetiro(false)} disabled={loading}><CloseIcon /></IconButton>
          </Box>
          
          <Typography variant="body2" color="text.secondary" mb={3}>
            Tu saldo disponible es de <strong>${Number(saldoWallet).toLocaleString('es-MX')} MXN</strong>.
          </Typography>

          {mensaje.text && <Alert severity={mensaje.type} sx={{ mb: 2 }}>{mensaje.text}</Alert>}

          <TextField 
            label="Monto a retirar (MXN)" fullWidth size="small" type="number" sx={{ mb: 2 }}
            value={montoRetiro} onChange={(e) => setMontoRetiro(e.target.value)}
            disabled={loading}
          />
          
          <TextField 
            label="CLABE o Número de Tarjeta" fullWidth size="small" sx={{ mb: 3 }}
            value={cuentaDestino} onChange={(e) => setCuentaDestino(e.target.value)}
            placeholder="Ej. 012345678901234567" disabled={loading}
          />

          <Button 
            fullWidth variant="contained" color="primary" size="large"
            onClick={handleRetirar} disabled={loading}
            sx={{ borderRadius: 50, fontWeight: 700 }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Confirmar Retiro'}
          </Button>
        </Box>
      </Modal>
    </Box>
  );
}