import React from 'react';
import { Box, Typography, Paper, InputBase, Button, Chip } from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'; // El ícono de destellos

export default function HeroPrompt() {
  return (
    <Box 
      sx={{
        backgroundColor: 'primary.main', // Toma el azul de tu theme.js
        color: 'primary.contrastText',
        py: { xs: 6, md: 10 }, // Padding vertical responsivo
        px: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center'
      }}
    >
      {/* Títulos */}
      <Typography variant="h3" fontWeight={700} gutterBottom sx={{ fontSize: { xs: '2rem', md: '3rem' } }}>
        ¿Qué evento estás planeando?
      </Typography>
      <Typography variant="subtitle1" sx={{ mb: 5, maxWidth: 800, opacity: 0.9, fontSize: '1.1rem' }}>
        Describe tu idea y nuestra IA experta encontrará todo el equipo, decoración y servicios que necesitas en segundos.
      </Typography>

      {/* La "Caja del Prompt" */}
      <Paper
        component="form"
        elevation={0}
        sx={{
          p: '6px 6px 6px 20px', // Padding interno para empujar los elementos
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          maxWidth: 800,
          borderRadius: 50, // Forma de pastilla
          mb: 4,
        }}
      >
        {/* Ícono izquierdo */}
        <AutoAwesomeIcon sx={{ color: '#3B82F6', mr: 1 }} />
        
        {/* Campo de texto invisible */}
        <InputBase
          sx={{ ml: 1, flex: 1, fontSize: '1.1rem' }}
          placeholder="Ej: Boda en la playa al atardecer para 50 personas..."
          inputProps={{ 'aria-label': 'prompt del evento' }}
        />
        
        {/* Botón amarillo integrado */}
        <Button 
          variant="contained" 
          color="secondary" 
          disableElevation
          sx={{ 
            borderRadius: 50, 
            px: 4, 
            py: 1.5,
            fontSize: '1rem'
          }}
        >
          Recomendar
        </Button>
      </Paper>

      {/* Fila de Sugerencias */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Typography variant="body2" sx={{ opacity: 0.8, mr: 1 }}>
          Sugerencias:
        </Typography>
        
        {['Campamento familiar', 'Fiesta infantil de dinosaurios', 'Conferencia corporativa'].map((suggestion) => (
          <Chip
            key={suggestion}
            label={suggestion}
            variant="outlined"
            clickable
            sx={{
              color: 'white',
              borderColor: 'rgba(255, 255, 255, 0.3)',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              }
            }}
          />
        ))}
      </Box>
    </Box>
  );
}