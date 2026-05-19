import { Button, Card, CardContent, Typography, TextField, Box, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import HeroPrompt from './components/ui/prompt';

function App() {
  return (
    <Box sx={{ backgroundColor: 'background.default', minHeight: '100vh' }}>
      {/* Hero con prompt del usuario */}
      {<HeroPrompt />}

      {/* Contenido principal */}
      <Box sx={{ p: 5 }}>
      <Typography variant="h4" color="primary" gutterBottom>
        MonkeyMarket
      </Typography>

      {/* Barra de búsqueda global */}
      <Box sx={{ mb: 4, maxWidth: 600 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Buscar productos o servicios..."
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 4, mt: 4 }}>
        {/* Prueba de Botones */}
        <Button variant="contained" color="primary">
          Botón Primario (Azul)
        </Button>
        <Button variant="contained" color="secondary">
          Recomendar (Amarillo)
        </Button>
        <Button variant="outlined" color="primary">
          Botón Secundario
        </Button>
      </Box>



      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        {/* Tarjeta de Producto */}
        <Card sx={{ maxWidth: 300, position: 'relative' }}>
          <Box
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              bgcolor: 'primary.main',
              color: '#fff',
              px: 1.5,
              py: 0.5,
              borderRadius: 1,
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            Producto
          </Box>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Kit de Iluminación
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Descripción de prueba para ver cómo se ve el texto secundario dentro de la tarjeta con bordes redondeados.
            </Typography>
          </CardContent>
        </Card>

        {/* Tarjeta de Servicio */}
        <Card sx={{ maxWidth: 300, position: 'relative' }}>
          <Box
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              bgcolor: 'secondary.main',
              color: '#111827',
              px: 1.5,
              py: 0.5,
              borderRadius: 1,
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            Servicio
          </Box>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Decoración de Salón
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Ejemplo de descripción de servicio para mostrar la diferencia entre tipos.
            </Typography>
          </CardContent>
        </Card>
      </Box>
      </Box>
    </Box>
  );
}

export default App;