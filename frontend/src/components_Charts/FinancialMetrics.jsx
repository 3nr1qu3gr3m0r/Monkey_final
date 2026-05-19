import React from 'react';
import { Box, Typography, Grid, Paper } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const FinancialMetrics = ({ revenueData, volumeData, kpis }) => {
  return (
    <Box>
      {/* KPIs dinámicos */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {kpis.map((stat, idx) => (
          <Grid item xs={12} sm={6} md={3} key={idx}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #E5E7EB' }}>
              <Typography variant="caption" color="text.secondary" fontWeight="700">{stat.title}</Typography>
              <Typography variant="h4" fontWeight="800" sx={{ color: stat.color }}>{stat.value}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Gráficas */}
      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #E5E7EB', height: 400 }}>
             <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="ingresos" stroke="#1D4ED8" strokeWidth={4} />
                </LineChart>
             </ResponsiveContainer>
          </Paper>
        </Grid>
        {/* Aquí puedes mover la de PieChart también... */}
        <Grid item xs={12} md={6}>
        <Paper elevation={0} sx={{ px: 1, py: 4, borderRadius: 3, border: '1px solid #E5E7EB', height: 500, width: '100%' }}>
            <Typography variant="h6" fontWeight="600" color="#111827" sx={{ mb: 2, px: 3 }}>Distribución del Volumen</Typography>
            <Box sx={{ width: '100%', height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                <Pie data={volumeData} innerRadius="65%" outerRadius="100%" paddingAngle={5} dataKey="value">
                    {volumeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                </Pie>
                <RechartsTooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
            </ResponsiveContainer>
            </Box>
        </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default FinancialMetrics;