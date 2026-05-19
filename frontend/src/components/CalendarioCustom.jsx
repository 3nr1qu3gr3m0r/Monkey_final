import React, { useState } from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

export default function CalendarioCustom({ diasDisponibles, fechaSeleccionada, onFechaSeleccionada }) {
  const [mesActual, setMesActual] = useState(new Date().getMonth());
  const [anioActual, setAñoActual] = useState(new Date().getFullYear());

  const diasSemanaNombres = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const mesesNombres = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  const cambiarMes = (direccion) => {
    if (direccion === -1) {
      if (mesActual === 0) { setMesActual(11); setAñoActual(prev => prev - 1); }
      else { setMesActual(prev => prev - 1); }
    } else {
      if (mesActual === 11) { setMesActual(0); setAñoActual(prev => prev + 1); }
      else { setMesActual(prev => prev + 1); }
    }
  };

  const getDiasDelMes = () => {
    const primerDia = new Date(anioActual, mesActual, 1).getDay();
    const diasEnMes = new Date(anioActual, mesActual + 1, 0).getDate();
    const diasArray = Array(primerDia).fill(null);
    for (let i = 1; i <= diasEnMes; i++) diasArray.push(i);
    return diasArray;
  };

  const pad = (n) => String(n).padStart(2, '0');

  const esDiaHabilitado = (dia) => {
    if (!dia) return false;
    const fechaObj = new Date(anioActual, mesActual, dia);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    if (fechaObj < hoy) return false;

    const diasSemanaCompletos = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const nombreDia = diasSemanaCompletos[fechaObj.getDay()];
    
    if (diasDisponibles?.length > 0 && !diasDisponibles.includes(nombreDia)) return false;

    return true;
  };

  const manejarClick = (dia) => {
    if (!esDiaHabilitado(dia)) return;
    const fechaStr = `${anioActual}-${pad(mesActual + 1)}-${pad(dia)}`;
    onFechaSeleccionada(fechaStr);
  };

  return (
    <Box sx={{ p: 2, borderBottom: '1px solid #cbd5e1' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <IconButton size="small" onClick={() => cambiarMes(-1)}><ChevronLeftIcon /></IconButton>
        <Typography variant="subtitle2" fontWeight={800} textTransform="uppercase">
          {mesesNombres[mesActual]} {anioActual}
        </Typography>
        <IconButton size="small" onClick={() => cambiarMes(1)}><ChevronRightIcon /></IconButton>
      </Box>

      {/* 🚀 Usamos CSS Grid para que sea perfectamente responsivo (7 columnas) */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5, mb: 1 }}>
        {diasSemanaNombres.map(dia => (
          <Typography key={dia} variant="caption" fontWeight={800} color="text.secondary" textAlign="center">
            {dia}
          </Typography>
        ))}
        
        {getDiasDelMes().map((dia, idx) => {
          const habilitado = esDiaHabilitado(dia);
          const fechaStr = dia ? `${anioActual}-${pad(mesActual + 1)}-${pad(dia)}` : null;
          const seleccionado = fechaSeleccionada === fechaStr;
          const esHoy = dia && (new Date().toISOString().split('T')[0] === fechaStr);

          return (
            <Box key={idx} sx={{ display: 'flex', justifyContent: 'center', p: 0.5 }}>
              {dia ? (
                <Box
                  onClick={() => manejarClick(dia)}
                  sx={{
                    width: { xs: 32, sm: 36 }, height: { xs: 32, sm: 36 }, 
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: '50%', cursor: habilitado ? 'pointer' : 'default',
                    fontWeight: seleccionado ? 800 : 600, fontSize: { xs: '0.8rem', sm: '0.9rem' },
                    backgroundColor: seleccionado ? 'primary.main' : 'transparent',
                    color: seleccionado ? '#fff' : (habilitado ? '#111' : '#cbd5e1'),
                    border: esHoy && !seleccionado ? '2px solid #FACC15' : '2px solid transparent',
                    transition: 'all 0.2s',
                    '&:hover': { backgroundColor: habilitado && !seleccionado ? '#f1f5f9' : (seleccionado ? 'primary.dark' : 'transparent') }
                  }}
                >
                  {dia}
                </Box>
              ) : <Box sx={{ width: 32, height: 32 }} />}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}