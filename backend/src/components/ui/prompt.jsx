import React from 'react';
import { Box, Typography, Paper, InputBase, Button, Chip } from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

import { useNavigate } from 'react-router-dom';



export default function HeroPrompt({ onSignInClick }) {
  const navigate = useNavigate();
  return (
    <Box 
      sx={{
        backgroundColor: 'white',
        color: 'primary.contrastText',
        minHeight: '100vh',
        px: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        position: 'relative',
      }}
    >
      {/* Botones Sign In / Sign Up */}
      <Box sx={{ position: 'absolute', top: 16, right: 24, display: 'flex', gap: 2 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate('/login')}
          sx={{ borderRadius: 50, px: 3 }}
        >
          Sign In
        </Button>
        <Button
          variant="contained"
          color="secondary"
          onClick={() => navigate('/registro')}
          sx={{ borderRadius: 50, px: 3 }}
        >
          Sign Up
        </Button>
      </Box>

      {/* Títulos */}
      <Typography variant="h3" fontWeight={700} gutterBottom sx={{ fontSize: { xs: '2rem', md: '3rem' }, color: 'primary.main' }}>
        ¿Qué evento estás planeando?
      </Typography>
      <Typography variant="subtitle1" sx={{ mb: 5, maxWidth: 800, fontSize: '1.1rem', color: 'primary.main' }}>
        Describe tu idea y nuestra IA experta encontrará todo el equipo, decoración y servicios que necesitas en segundos.
      </Typography>

      {/* La "Caja del Prompt" */}
     <Paper
        component="form"
        elevation={0}
        sx={{
          p: '6px 6px 6px 20px',
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          maxWidth: 800,
          borderRadius: 50,
          mb: 4,
          border: '2px solid',
          borderColor: 'primary.main',
        }}
      >
        <AutoAwesomeIcon sx={{ color: '#3B82F6', mr: 1 }} />
        <InputBase
          sx={{ ml: 1, flex: 1, fontSize: '1.1rem' }}
          placeholder="Ej: Boda en la playa al atardecer para 50 personas..."
          inputProps={{ 'aria-label': 'prompt del evento' }}
        />
        <Button
          variant="contained"
          color="secondary"
          disableElevation
          sx={{ borderRadius: 50, px: 4, py: 1.5, fontSize: '1rem' }}
        >
          Recomendar
        </Button>
      </Paper>

      {/* Sugerencias */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Typography variant="body2" sx={{ opacity: 0.8, mr: 1, color: 'primary.main' } }>
          Sugerencias:
        </Typography>
        {['Campamento familiar', 'Fiesta infantil de dinosaurios', 'Conferencia corporativa'].map((suggestion) => (
          <Chip
            key={suggestion}
            label={suggestion}
            variant="outlined"
            clickable
            sx={{
              color: 'primary.main',
              borderColor: 'primary.main',
              '&:hover': { backgroundColor: 'rgba(30, 64, 175, 0.08)' }
            }}
          />
        ))}
      </Box>
    </Box>
  );
}