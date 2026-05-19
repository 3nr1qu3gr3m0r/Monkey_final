import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1D4ED8', // El azul profundo de tu encabezado y textos principales
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#FACC15', // El amarillo vibrante de tus botones "Recomendar" y "+ Vender"
      contrastText: '#111827', // Texto oscuro para que contraste bien sobre el botón amarillo
    },
    background: {
      default: '#F3F4F6', // El gris súper claro del fondo en la pantalla de resultados
      paper: '#FFFFFF', // Blanco puro para las tarjetas y el sidebar
    },
    text: {
      primary: '#1F2937', // Gris muy oscuro para títulos (mejor legibilidad que el negro puro)
      secondary: '#6B7280', // Gris medio para descripciones de productos
    }
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    button: {
      textTransform: 'none', // Quita las mayúsculas automáticas de MUI para un look más moderno
      fontWeight: 600,
    },
    h4: {
      fontWeight: 700, // Para tu título principal "¿Qué evento estás planeando?"
    }
  },
  components: {
    // 1. Botones Principales (Recomendar, Vender, Login, Registro)
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 50, // Estilo "píldora" súper redondeado como en tu mockup
          padding: '10px 24px',
          boxShadow: 'none', // Quita la sombra por defecto para un look más plano/moderno
          '&:hover': {
            boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)', // Sombra suave al pasar el mouse
          },
        },
      },
    },

    // 2. Tarjetas (Productos, Servicios y Sidebar de Filtros)
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16, // Esquinas bien redondeadas
          boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.04)', // Sombra muy sutil para que "floten"
          border: '1px solid #E5E7EB', // Borde ligero gris claro
        },
      },
    },

    // 3. Inputs de Texto (Caja del Prompt, Login, Registro, Búsqueda)
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 50, // Inputs redondeados. (Para el login puedes usar una variante menos redondeada si prefieres)
          backgroundColor: '#FFFFFF',
          '& fieldset': {
            borderColor: '#E5E7EB',
          },
          '&:hover fieldset': {
            borderColor: '#1D4ED8', // Borde azul al interactuar
          },
        },
      },
    },

    // 4. Etiquetas (Los Chips de "100% Match" y las "Sugerencias" de eventos)
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          borderRadius: 8, // Esquinas ligeramente redondeadas para el tag de Match
        },
        colorPrimary: {
          backgroundColor: 'rgba(29, 78, 216, 0.1)', // Fondo azul translúcido
          color: '#1D4ED8',
        },
        colorSecondary: {
          backgroundColor: '#FACC15', // Fondo amarillo para el tag de Match
          color: '#111827',
        }
      },
    },
  },
});

export default theme;