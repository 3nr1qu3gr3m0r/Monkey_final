import React from 'react';
import { Box, Typography, Paper, Grid } from '@mui/material';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';

const topProductos = [
  { name: 'Laptop Pro',        ventas: 120 },
  { name: 'Monitor 27"',       ventas: 98  },
  { name: 'Teclado Mecánico',  ventas: 86  },
  { name: 'Ratón G-Pro',       ventas: 75  },
  { name: 'Silla Gamer',       ventas: 64  },
];

const topServicios = [
  { name: 'Catering Premium',    contrataciones: 45 },
  { name: 'Fotografía Estudio',  contrataciones: 38 },
  { name: 'DJ para Eventos',     contrataciones: 29 },
  { name: 'Animación Infantil',  contrataciones: 22 },
];

const Categorias = () => (
  <Box>
    <Typography variant="h5" fontWeight="700" sx={{ mb: 4 }}>Estadísticas de Categorías</Typography>
    <Grid container spacing={4}>
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #E5E7EB' }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Productos más vendidos</Typography>
          <Box sx={{ height: 350 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProductos} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={100} />
                <RechartsTooltip />
                <Bar dataKey="ventas" fill="#1D4ED8" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Paper>
      </Grid>

      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #E5E7EB' }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Servicios más contratados</Typography>
          <Box sx={{ height: 350 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topServicios} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={100} />
                <RechartsTooltip />
                <Bar dataKey="contrataciones" fill="#FACC15" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  </Box>
);

export default Categorias;