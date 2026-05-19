import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app';

// 1. Importas las herramientas de MUI
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// 2. Importas el archivo theme.js que creamos
import theme from './theme';

import { BrowserRouter } from 'react-router-dom';
import { AlertProvider } from './context/AlertContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AlertProvider>
          <App />
        </AlertProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);