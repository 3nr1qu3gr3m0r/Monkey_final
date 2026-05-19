import React from 'react';
import { Box, Typography, Chip } from '@mui/material';

export default function SelectorHoras({ horario, fechaSeleccionada, horaSeleccionada, onHoraSeleccionada, horariosOcupados }) {
  
  const generarChipsDeHoras = () => {
    if (!horario || !horario.inicio || !horario.fin) return [];
    
    const pad = (n) => String(n).padStart(2, '0');
    const [horaInicio] = String(horario.inicio).split(':').map(Number);
    const [horaFin] = String(horario.fin).split(':').map(Number);
    const horasComponentes = [];

    // 🚀 1. OBTENEMOS EL DÍA Y LA HORA ACTUAL DEL NAVEGADOR
    const ahora = new Date();
    const hoyStr = `${ahora.getFullYear()}-${pad(ahora.getMonth() + 1)}-${pad(ahora.getDate())}`;
    const horaActual = ahora.getHours();

    for (let i = horaInicio; i <= horaFin; i++) {
      const horaStr = `${pad(i)}:00`;
      const datetimeTarget = `${fechaSeleccionada} ${horaStr}`;
      
      const estaOcupada = horariosOcupados.includes(datetimeTarget);
      
      // 🚀 2. FILTRO ANTI-VIAJEROS EN EL TIEMPO
      // Si la fecha que eligió el cliente es HOY, y la hora del botón es menor o igual a la hora actual, la bloqueamos.
      const yaPaso = (fechaSeleccionada === hoyStr && i <= horaActual);

      // El botón se bloquea si alguien más ya reservó o si la hora ya pasó
      const bloqueada = estaOcupada || yaPaso;
      const seleccionada = horaSeleccionada === horaStr;

      horasComponentes.push(
        <Chip
          key={horaStr}
          label={horaStr}
          clickable={!bloqueada}
          color={seleccionada ? 'primary' : 'default'}
          variant={seleccionada ? 'filled' : 'outlined'}
          onClick={() => !bloqueada && onHoraSeleccionada(horaStr)}
          sx={{
            fontWeight: 700, px: 1, py: 2,
            textDecoration: bloqueada ? 'line-through' : 'none',
            opacity: bloqueada ? 0.5 : 1,
            backgroundColor: bloqueada ? '#f1f5f9' : undefined,
            '&:hover': { backgroundColor: bloqueada ? '#f1f5f9' : undefined }
          }}
        />
      );
    }
    return horasComponentes;
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="caption" fontWeight={800} color="text.secondary" display="block" mb={1.5}>
        {fechaSeleccionada ? 'SELECCIONA TU HORA' : 'ELIGE UN DÍA PRIMERO'}
      </Typography>
      {fechaSeleccionada ? (
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {generarChipsDeHoras()}
        </Box>
      ) : (
        <Typography variant="body2" color="text.secondary" fontStyle="italic">
          El calendario de horas se desbloqueará al elegir una fecha disponible.
        </Typography>
      )}
    </Box>
  );
}