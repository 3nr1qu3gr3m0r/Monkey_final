import React, { useState, useEffect } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, Grid, Avatar, Box, Typography,
  IconButton
} from '@mui/material';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';

function EditarPerfil({ open, onClose, user, onUpdate }) {
    const [form, setForm] = useState({
        nombre: '',
        contacto: '',
        password: '',
        foto: ''
    });

    // Cargar datos del usuario actual cuando se abra la ventana
    useEffect(() => {
        if (user) {
            setForm({
                nombre: user.nombre || '',
                contacto: user.contacto || user.email || user.telefono || '',
                password: '',
                foto: user.foto || ''
            });
        }
    }, [user, open]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm({ ...form, [name]: value });
    };

    const handleSave = () => {
        // Actualizamos el estado global del usuario para que se refleje de inmediato
        if (onUpdate) onUpdate(form);
        onClose();
    };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      fullWidth 
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: 4,
          border: '2px solid #3B82F6',
          boxShadow: '0px 10px 30px rgba(0,0,0,0.1)'
        }
      }}
    >
      <DialogTitle sx={{ fontWeight: 800, fontSize: '1.25rem', pb: 1, pt: 3 }}>
        Editar Perfil
      </DialogTitle>
      <DialogContent dividers sx={{ borderBottom: 'none' }}>
        
        {/* Sección de Foto de Perfil */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3, mt: 1 }}>
            <Box sx={{ position: 'relative' }}>
                <Avatar 
                    src={form.foto}
                    sx={{ width: 100, height: 100, bgcolor: 'secondary.main', fontSize: '2.5rem' }}
                >
                    {form.nombre ? form.nombre.charAt(0).toUpperCase() : 'U'}
                </Avatar>
                <input
                    type="file"
                    accept="image/*"
                    id="profile-photo-input"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                                setForm({ ...form, foto: reader.result });
                            };
                            reader.readAsDataURL(file);
                        }
                    }}
                />
                <IconButton 
                    color="primary" 
                    component="label"
                    htmlFor="profile-photo-input"
                    sx={{ 
                        position: 'absolute', bottom: 0, right: -10, 
                        bgcolor: 'white', border: '1px solid #ccc',
                        '&:hover': { bgcolor: '#f0f0f0' }
                    }}
                >
                    <PhotoCameraIcon fontSize="small" />
                </IconButton>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                Cambiar foto de perfil
            </Typography>
        </Box>

        {/* Formulario */}
        <Grid container spacing={3}>
          <Grid size={12}>
            <TextField 
                name="nombre"
                label="Nombre completo" 
                fullWidth 
                variant="outlined" 
                value={form.nombre}
                onChange={handleChange}
            />
          </Grid>
          <Grid size={12}>
            <TextField 
                name="contacto"
                label="Correo o celular" 
                fullWidth 
                value={form.contacto}
                onChange={handleChange}
            />
          </Grid>
          <Grid size={12}>
            <TextField 
                name="password"
                label="Contraseña" 
                type="password"
                fullWidth 
                placeholder="******"
                value={form.password}
                onChange={handleChange}
                helperText="Escribe solo si deseas cambiarla"
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 3, pt: 1, gap: 1 }}>
        <Button 
          onClick={onClose} 
          variant="outlined"
          sx={{ borderRadius: 50, fontWeight: 700, borderWidth: 2, '&:hover': { borderWidth: 2 } }}
        >
          Cancelar
        </Button>
        <Button 
          onClick={handleSave} 
          variant="contained" 
          sx={{ 
            borderRadius: 50, px: 3, fontWeight: 700, 
            backgroundColor: '#FACC15', color: '#111', 
            boxShadow: 'none',
            '&:hover': { backgroundColor: '#FDE047', boxShadow: 'none' } 
          }}
        >
          Guardar Cambios
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default EditarPerfil;
