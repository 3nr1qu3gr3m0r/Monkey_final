import { useState, useRef, useEffect } from 'react';
import {
  Box, Typography, Button, IconButton, Modal,
  TextField, Stack, MenuItem, Select, FormControl,
  InputLabel, Chip, InputAdornment,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import BuildIcon from '@mui/icons-material/Build';
import InventoryIcon from '@mui/icons-material/Inventory';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { useAlert } from '../context/AlertContext';
 
const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const CATEGORIAS_EVENTOS = [
  'Mobiliario', 'Audio e Iluminación', 'Decoración', 'Alimentos y Bebidas', 
  'Fotografía y Video', 'Entretenimiento', 'Recintos y Salones', 'Personal y Staff', 
  'Repostería y Dulces', 'Recuerdos y Souvenirs', 'Transporte y Logística', 'Varios'
];
 
const formVacio = {
  tipo: 'servicio',
  categoria: 'Varios',
  nombre: '',
  descripcion: '',
  precio: '',
  stock: '',
  diasDisponibles: [],
  horario: { inicio: '09:00', fin: '18:00' },
};
 
export default function ItemFormModal({ open, onClose, onGuardar, inicial }) {
  const { showAlert } = useAlert();
  const esEdicion = Boolean(inicial);
  const [form, setForm] = useState(formVacio);
  const [previews, setPreviews] = useState([]);
  const [archivos, setArchivos] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const inputRef = useRef(null);
 
  // Sincronizar cuando cambia `inicial` o se abre el modal
  useEffect(() => {
    if (inicial) {
      setForm({
        tipo: inicial.tipo,
        categoria: inicial.categoria||'Varios',
        nombre: inicial.nombre,
        descripcion: inicial.descripcion,
        precio: String(inicial.precio),
        stock: String(inicial.stock ?? ''),
        diasDisponibles: inicial.diasDisponibles ?? [],
        horario: inicial.horario ?? { inicio: '09:00', fin: '18:00' },
      });
      setPreviews(inicial.fotos ?? []);
      setArchivos([]);
    } else {
      setForm(formVacio);
      setPreviews([]);
      setArchivos([]);
    }
    setSubmitted(false);
  }, [inicial, open]);
 
  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));
 
  const toggleDia = (dia) => {
    setForm(prev => ({
      ...prev,
      diasDisponibles: prev.diasDisponibles.includes(dia)
        ? prev.diasDisponibles.filter(d => d !== dia)
        : [...prev.diasDisponibles, dia],
    }));
  };
 
  const handleImagenes = (e) => {
    const files = Array.from(e.target.files).filter(f =>
      ['image/jpeg', 'image/jpg', 'image/png'].includes(f.type)
    );
    // Filtrar archivos mayores 3 2MB
    const validos = files.filter(f => f.size <= 3 * 1024 * 1024);
    const rechazados = files.filter(f => f.size > 3 * 1024 * 1024);

    if (rechazados.length > 0) {
      showAlert(`${rechazados.length} imagen(es) fueron rechazadas por superar los 2MB.`, "warning");
    }
    setArchivos(prev => [...prev, ...validos]);
    setPreviews(prev => [...prev, ...validos.map(f => URL.createObjectURL(f))]);
  };
 
  const eliminarFoto = (i) => {
    setPreviews(prev => prev.filter((_, idx) => idx !== i));
    setArchivos(prev => prev.filter((_, idx) => idx !== i));
  };
 
  // Validaciones
  const errors = {};
  if (!form.nombre.trim()) errors.nombre = 'El nombre es obligatorio.';
  if (!form.categoria) errors.categoria = 'Selecciona una categoría.';
  if (!form.descripcion.trim()) errors.descripcion = 'La descripción es obligatoria.';
  if (!form.precio || isNaN(form.precio) || Number(form.precio) <= 0) errors.precio = 'Precio inválido.';
  if (form.tipo === 'producto' && (isNaN(form.stock) || Number(form.stock) < 0)) errors.stock = 'Stock inválido.';
  if (form.tipo === 'servicio' && form.diasDisponibles.length === 0) errors.dias = 'Selecciona al menos un día.';
 
 const handleGuardar = () => {
    setSubmitted(true);
    if (Object.keys(errors).length > 0) return;
    
    // Le pasamos al componente padre tanto los datos de texto como los ARCHIVOS reales
    onGuardar({
      tipo: form.tipo,
      categoria: form.categoria,
      nombre: form.nombre,
      descripcion: form.descripcion,
      precio: Number(form.precio),
      stock: form.tipo === 'producto' ? Number(form.stock) : undefined,
      fotos: previews, // Mantenemos las previas por si era edición
      diasDisponibles: form.tipo === 'servicio' ? form.diasDisponibles : undefined,
      horario: form.tipo === 'servicio' ? form.horario : undefined,
    }, archivos); // 
  };
 
  const handleClose = () => {
    setSubmitted(false);
    onClose();
  };
 
  return (
    <Modal open={open} onClose={handleClose}>
      <Box sx={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: 'white', borderRadius: { xs: 2, sm: 4 },
        p: { xs: 2.5, sm: 4 }, width: { xs: '95%', sm: '100%' }, maxWidth: 560,
        boxShadow: 24, outline: 'none',
        maxHeight: '92vh', overflowY: 'auto',
      }}>
        {/* Encabezado */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" fontWeight={700}>
            {esEdicion ? 'Editar artículo' : 'Crear nuevo artículo'}
          </Typography>
          <IconButton size="small" onClick={handleClose}><CloseIcon /></IconButton>
        </Box>
 
        <Stack spacing={2.5}>
 
          {/* Tipo */}
          <FormControl fullWidth size="small">
            <InputLabel>Tipo</InputLabel>
            <Select value={form.tipo} label="Tipo" onChange={set('tipo')}>
              <MenuItem value="servicio">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <BuildIcon fontSize="small" /> Servicio
                </Box>
              </MenuItem>
              <MenuItem value="producto">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <InventoryIcon fontSize="small" /> Producto
                </Box>
              </MenuItem>
            </Select>
          </FormControl>

          {/* Categoría */}
          <FormControl fullWidth size="small">
            <InputLabel>Categoría</InputLabel>
            <Select value={form.categoria} label="Categoría" onChange={set('categoria')}>
              {CATEGORIAS_EVENTOS.map(cat => (
                <MenuItem key={cat} value={cat}>{cat}</MenuItem>
              ))}
            </Select>
          </FormControl>
 
          {/* Nombre */}
          <TextField
            label="Nombre"
            value={form.nombre}
            onChange={set('nombre')}
            size="small" fullWidth
            error={submitted && Boolean(errors.nombre)}
            helperText={submitted && errors.nombre}
            placeholder="Ej: Fotografía para bodas"
          />
 
          {/* Descripción */}
          <TextField
            label="Descripción"
            value={form.descripcion}
            onChange={set('descripcion')}
            size="small" fullWidth multiline rows={3}
            error={submitted && Boolean(errors.descripcion)}
            helperText={submitted && errors.descripcion}
            placeholder="Describe tu servicio o producto con detalle..."
          />
 
          {/* Precio */}
          <TextField
            label="Precio (MXN)"
            value={form.precio}
            onChange={set('precio')}
            size="small" fullWidth type="number"
            error={submitted && Boolean(errors.precio)}
            helperText={submitted && errors.precio}
            InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
          />
 
          {/* Stock — solo producto */}
          {form.tipo === 'producto' && (
            <TextField
              label="Stock disponible"
              value={form.stock}
              onChange={set('stock')}
              size="small" fullWidth type="number"
              error={submitted && Boolean(errors.stock)}
              helperText={submitted && errors.stock}
              placeholder="Ej: 10"
            />
          )}
 
          {/* Días de disponibilidad — solo servicio */}
          {form.tipo === 'servicio' && (
            <Box>
              <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
                Días de disponibilidad
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                {DIAS_SEMANA.map(dia => (
                  <Chip
                    key={dia}
                    label={dia}
                    clickable
                    onClick={() => toggleDia(dia)}
                    color={form.diasDisponibles.includes(dia) ? 'primary' : 'default'}
                    variant={form.diasDisponibles.includes(dia) ? 'filled' : 'outlined'}
                    size="small"
                    sx={{ fontWeight: 500 }}
                  />
                ))}
              </Box>
              {submitted && errors.dias && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                  {errors.dias}
                </Typography>
              )}
            </Box>
          )}
 
          {/* Horario — solo servicio */}
          {form.tipo === 'servicio' && (
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Hora inicio"
                type="time"
                value={form.horario.inicio}
                onChange={e => setForm(prev => ({ ...prev, horario: { ...prev.horario, inicio: e.target.value } }))}
                size="small" fullWidth
                InputLabelProps={{ shrink: true }}
                InputProps={{ startAdornment: <InputAdornment position="start"><AccessTimeIcon fontSize="small" /></InputAdornment> }}
              />
              <TextField
                label="Hora fin"
                type="time"
                value={form.horario.fin}
                onChange={e => setForm(prev => ({ ...prev, horario: { ...prev.horario, fin: e.target.value } }))}
                size="small" fullWidth
                InputLabelProps={{ shrink: true }}
                InputProps={{ startAdornment: <InputAdornment position="start"><AccessTimeIcon fontSize="small" /></InputAdornment> }}
              />
            </Box>
          )}
 
          {/* Fotos */}
          <Box>
            <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>Fotos</Typography>
            <Box
              onClick={() => inputRef.current.click()}
              sx={{
                border: '2px dashed #BFDBFE', borderRadius: 2, p: 2.5,
                textAlign: 'center', cursor: 'pointer', backgroundColor: '#F0F9FF',
                '&:hover': { borderColor: 'primary.main', backgroundColor: '#E0F2FE' },
                transition: 'all 0.2s',
              }}
            >
              <CloudUploadIcon sx={{ color: 'primary.main', fontSize: 28, mb: 0.5 }} />
              <Typography variant="body2" color="primary" fontWeight={600}>
                Haz clic para subir imágenes
              </Typography>
              <Typography variant="caption" color="text.secondary">.jpg, .jpeg, .png</Typography>
            </Box>
            <input
              ref={inputRef}
              type="file"
              accept=".jpg,.jpeg,.png"
              multiple
              style={{ display: 'none' }}
              onChange={handleImagenes}
            />
            {previews.length > 0 && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1.5 }}>
                {previews.map((src, i) => (
                  <Box key={i} sx={{ position: 'relative', width: 72, height: 72 }}>
                    <img src={src} alt="" style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8 }} />
                    <IconButton
                      size="small"
                      onClick={() => eliminarFoto(i)}
                      sx={{
                        position: 'absolute', top: -8, right: -8,
                        backgroundColor: 'error.main', color: 'white',
                        width: 20, height: 20,
                        '&:hover': { backgroundColor: 'error.dark' },
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
          <Box sx={{ display: 'flex', gap: 2, pt: 0.5 }}>
            <Button fullWidth variant="outlined" onClick={handleClose} sx={{ textTransform: 'none', borderRadius: 2 }}>
              Cancelar
            </Button>
            <Button fullWidth variant="contained" onClick={handleGuardar} sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 600 }}>
              {esEdicion ? 'Guardar cambios' : 'Publicar artículo'}
            </Button>
          </Box>
 
        </Stack>
      </Box>
    </Modal>
  );
}
