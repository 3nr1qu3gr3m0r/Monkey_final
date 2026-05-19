import { useState, useRef } from 'react';
import {
  Box, Typography, Button, IconButton, Modal,
  TextField, Stack, Alert, MenuItem, Select,
  FormControl, InputLabel
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import { useAlert } from '../context/AlertContext';

const formInicial = {
  titulo: '',
  descripcion: '',
  precio: '',
  tipo: 'servicio',
  stock: '',
};

export default function ProdServForm({ open, onClose, onPublicar }) {
  const { showAlert } = useAlert();
  const [form, setForm] = useState(formInicial);
  const [imagenes, setImagenes] = useState([]); // archivos seleccionados
  const [previews, setPreviews] = useState([]);  // URLs de previsualización
  const [submitted, setSubmitted] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const inputRef = useRef(null);

  // Validaciones
  const errors = {};
  if (!form.titulo.trim()) errors.titulo = 'El título es obligatorio.';
  if (!form.descripcion.trim()) errors.descripcion = 'La descripción es obligatoria.';
  if (!form.precio || isNaN(form.precio) || Number(form.precio) <= 0)
    errors.precio = 'Ingresa un precio válido mayor a 0.';
  if (form.tipo === 'producto' && (!form.stock || isNaN(form.stock) || Number(form.stock) < 0))
    errors.stock = 'Ingresa un stock válido.';

  const isValid = Object.keys(errors).length === 0;

  const handleChange = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
  };

  // Maneja la selección de imágenes
  const handleImagenes = (e) => {
    const archivos = Array.from(e.target.files);

    // Filtra solo jpg, png, jpeg
    const validos = archivos.filter(f =>
      ['image/jpeg', 'image/jpg', 'image/png'].includes(f.type)
    );

    if (validos.length !== archivos.length) {
      showAlert('Solo se permiten archivos .jpg, .jpeg y .png', "error");
    }

    setImagenes(prev => [...prev, ...validos]);

    // Genera URLs de previsualización
    const nuevasPreviews = validos.map(f => URL.createObjectURL(f));
    setPreviews(prev => [...prev, ...nuevasPreviews]);
  };

  // Elimina una imagen de la lista
  const eliminarImagen = (index) => {
    setImagenes(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    setSubmitted(true);
    if (!isValid) return;

    const nuevo = {
      titulo: form.titulo,
      descripcion: form.descripcion,
      precio: Number(form.precio),
      tipo: form.tipo,
      stock: form.tipo === 'producto' ? Number(form.stock) : null,
      imagenes, // aquí van los archivos File para enviar al backend con FormData
    };

    onPublicar(nuevo);
    setSuccessMsg(`¡${form.tipo === 'servicio' ? 'Servicio' : 'Producto'} creado exitosamente!`);
    setForm(formInicial);
    setImagenes([]);
    setPreviews([]);
    setSubmitted(false);

    setTimeout(() => {
      setSuccessMsg('');
      onClose();
    }, 1500);
  };

  const handleClose = () => {
    setForm(formInicial);
    setImagenes([]);
    setPreviews([]);
    setSubmitted(false);
    setSuccessMsg('');
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <Box sx={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: 'white', borderRadius: { xs: 2, sm: 4 },
        p: { xs: 2.5, sm: 4 }, width: { xs: '95%', sm: '100%' }, maxWidth: 520,
        boxShadow: 24, outline: 'none',
        maxHeight: '90vh', overflowY: 'auto'
      }}>
        {/* Encabezado */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" fontWeight={700}>Crear nuevo servicio o producto</Typography>
          <IconButton size="small" onClick={handleClose}><CloseIcon /></IconButton>
        </Box>

        {successMsg && <Alert severity="success" sx={{ mb: 2 }}>{successMsg}</Alert>}

        <Stack spacing={2}>

          {/* Tipo */}
          <FormControl fullWidth size="small">
            <InputLabel>Tipo</InputLabel>
            <Select value={form.tipo} label="Tipo" onChange={handleChange('tipo')}>
              <MenuItem value="servicio">Servicio</MenuItem>
              <MenuItem value="producto">Producto</MenuItem>
            </Select>
          </FormControl>

          {/* Título */}
          <TextField
            label="Título"
            value={form.titulo}
            onChange={handleChange('titulo')}
            error={submitted && Boolean(errors.titulo)}
            helperText={submitted && errors.titulo}
            fullWidth size="small"
            placeholder="Ej: Kit de Iluminación Vintage"
          />

          {/* Descripción */}
          <TextField
            label="Descripción"
            value={form.descripcion}
            onChange={handleChange('descripcion')}
            error={submitted && Boolean(errors.descripcion)}
            helperText={submitted && errors.descripcion}
            fullWidth size="small" multiline rows={3}
            placeholder="Describe tu servicio o producto..."
          />

          {/* Precio */}
          <TextField
            label="Precio (MXN)"
            value={form.precio}
            onChange={handleChange('precio')}
            error={submitted && Boolean(errors.precio)}
            helperText={submitted && errors.precio}
            fullWidth size="small" type="number"
            placeholder="Ej: 1500"
          />

          {/* Stock - solo si es producto */}
          {form.tipo === 'producto' && (
            <TextField
              label="Stock disponible"
              value={form.stock}
              onChange={handleChange('stock')}
              error={submitted && Boolean(errors.stock)}
              helperText={submitted && errors.stock}
              fullWidth size="small" type="number"
              placeholder="Ej: 10"
            />
          )}

          {/* Subir imágenes */}
          <Box>
            <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
              Imágenes del {form.tipo}
            </Typography>

            {/* Área de subida */}
            <Box
              onClick={() => inputRef.current.click()}
              sx={{
                border: '2px dashed #BFDBFE',
                borderRadius: 2, p: 3,
                textAlign: 'center', cursor: 'pointer',
                backgroundColor: '#F0F9FF',
                '&:hover': { borderColor: 'primary.main', backgroundColor: '#E0F2FE' },
                transition: 'all 0.2s'
              }}
            >
              <CloudUploadIcon sx={{ color: 'primary.main', fontSize: 32, mb: 1 }} />
              <Typography variant="body2" color="primary" fontWeight={600}>
                Haz clic para subir imágenes
              </Typography>
              <Typography variant="caption" color="text.secondary">
                .jpg, .jpeg, .png — Puedes subir varias
              </Typography>
            </Box>

            {/* Input oculto */}
            <input
              ref={inputRef}
              type="file"
              accept=".jpg,.jpeg,.png"
              multiple
              style={{ display: 'none' }}
              onChange={handleImagenes}
            />

            {/* Previsualizaciones */}
            {previews.length > 0 && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
                {previews.map((src, i) => (
                  <Box key={i} sx={{ position: 'relative', width: 80, height: 80 }}>
                    <img
                      src={src} alt={`preview-${i}`}
                      style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8 }}
                    />
                    <IconButton
                      size="small"
                      onClick={() => eliminarImagen(i)}
                      sx={{
                        position: 'absolute', top: -8, right: -8,
                        backgroundColor: 'error.main', color: 'white',
                        width: 20, height: 20,
                        '&:hover': { backgroundColor: 'error.dark' }
                      }}
                    >
                      <DeleteIcon sx={{ fontSize: 12 }} />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            )}
          </Box>

          {/* Botones */}
          <Box sx={{ display: 'flex', gap: 2, pt: 1 }}>
            <Button fullWidth variant="outlined" color="primary" onClick={handleClose}>
              Cancelar
            </Button>
            <Button fullWidth variant="contained" color="primary" onClick={handleSubmit}>
              Publicar
            </Button>
          </Box>

        </Stack>
      </Box>
    </Modal>
  );
}