import React, { useState, useEffect } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, Grid 
} from '@mui/material';
import api from '../config/api'; 
import { useAlert } from '../context/AlertContext';

function Direcciones({ open, onClose, onSave, initialData }) {
    const { showAlert } = useAlert();
    const [form, setForm] = useState({
        id: '',
        alias: '', 
        calle: '',
        numExt: '',
        numInt: '', 
        cp: '',
        ciudad: '',
        alcaldia: '', 
        referencias: ''
    });

    const [errors, setErrors] = useState({});

    // Efecto para cargar datos previos si estamos en modo "Edición"
    useEffect(() => {
        if (open) {
            if (initialData) {
                setForm({
                    id: initialData.id || '',
                    alias: initialData.alias || '',
                    calle: initialData.calle || '',
                    numExt: initialData.numExt || '',
                    numInt: initialData.numInt || '',
                    cp: initialData.cp || '',
                    ciudad: initialData.ciudad || '',
                    alcaldia: initialData.alcaldia || '',
                    referencias: initialData.referencias || ''
                });
            } else {
                setForm({ id: '', alias: '', calle: '', numExt: '', numInt: '', cp: '', ciudad: '', alcaldia: '', referencias: '' });
            }
            setErrors({});
        }
    }, [open, initialData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm({ ...form, [name]: value });
        if (errors[name]) {
            setErrors({ ...errors, [name]: false });
        }
    };

    const validarYGuardar = async () => {
        const nuevosErrores = {};

        if (!form.alias?.trim()) nuevosErrores.alias = "El alias es obligatorio (Ej. Casa)";
        if (!form.calle?.trim()) nuevosErrores.calle = "La calle es obligatoria";
        else if (form.calle.trim().length < 4) nuevosErrores.calle = "Mínimo 4 caracteres para la calle";
        if (!form.numExt?.trim()) nuevosErrores.numExt = "Número exterior obligatorio";
        if (!/^\d{5}$/.test(form.cp?.trim() || "")) nuevosErrores.cp = "El CP debe tener exactamente 5 números";
        if (!form.ciudad?.trim()) nuevosErrores.ciudad = "La ciudad/estado es obligatoria";
        else if (form.ciudad.trim().length < 4) nuevosErrores.ciudad = "Nombre de ciudad muy corto";
        if (!form.alcaldia?.trim()) nuevosErrores.alcaldia = "La alcaldía es obligatoria";

        if (Object.keys(nuevosErrores).length > 0) {
            setErrors(nuevosErrores);
            return;
        }

        try {
            // Estructura de datos basada en tu tabla de MySQL 'direcciones'
            const datosDireccion = {
                alias: form.alias, 
                calle_y_numero: `${form.calle} #${form.numExt}${form.numInt ? ' Int. ' + form.numInt : ''}`,
                colonia: form.alcaldia, // Mapeamos alcaldía a colonia para la BD
                ciudad: form.ciudad,
                codigo_postal: form.cp,
                indicaciones_extra: form.referencias
            };

            // Si el padre (Perfil) nos pasó una función onSave, la usamos (simulación o manejo externo)
            if (onSave) {
                onSave(form);
            } else {
                // Si no, hacemos la petición real a tu servidor
                if (form.id) {
                    await api.put(`/direcciones/${form.id}`, datosDireccion);
                } else {
                    await api.post('/direcciones', datosDireccion);
                }
                showAlert("¡Dirección guardada con éxito en MonkeyMarket! 🚀", "success");
                window.location.reload(); 
            }
            onClose();
        } catch (error) {
            console.error("Error en la conexión con el servidor:", error);
            showAlert("No se pudo conectar con el servidor de MonkeyMarket.", "error");
        }
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
        {initialData ? 'Editar Dirección' : 'Agregar Nueva Dirección'}
      </DialogTitle>
      <DialogContent dividers sx={{ borderBottom: 'none' }}>
        <Grid container spacing={3} sx={{ mt: 0.5 }}>
          <Grid item xs={12}>
            <TextField 
                name="alias"
                label="Nombre de la Dirección (Ej. Casa, Salón, Oficina) *" 
                fullWidth 
                variant="outlined" 
                value={form.alias}
                onChange={handleChange}
                error={!!errors.alias}
                helperText={errors.alias || ""}
                autoFocus
            />
          </Grid>
          <Grid item xs={12}>
            <TextField 
                name="calle"
                label="Calle *" 
                fullWidth 
                variant="outlined" 
                value={form.calle}
                onChange={handleChange}
                error={!!errors.calle}
                helperText={errors.calle || ""}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField 
                name="numExt"
                label="Número Exterior *" 
                fullWidth 
                value={form.numExt}
                onChange={handleChange}
                error={!!errors.numExt}
                helperText={errors.numExt || ""}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField 
                name="numInt"
                label="Número Interior (Opcional)" 
                fullWidth 
                value={form.numInt}
                onChange={handleChange}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField 
                name="cp"
                label="Código Postal *" 
                fullWidth 
                value={form.cp}
                onChange={handleChange}
                error={!!errors.cp}
                helperText={errors.cp || ""}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField 
                name="ciudad"
                label="Ciudad/Estado *" 
                fullWidth 
                value={form.ciudad}
                onChange={handleChange}
                error={!!errors.ciudad}
                helperText={errors.ciudad || ""}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField 
                name="alcaldia"
                label="Alcaldía / Colonia *" 
                fullWidth 
                value={form.alcaldia}
                onChange={handleChange}
                error={!!errors.alcaldia}
                helperText={errors.alcaldia || ""}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField 
                name="referencias"
                label="Referencias (Opcional)" 
                fullWidth 
                multiline 
                rows={2}
                value={form.referencias}
                onChange={handleChange}
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
          onClick={validarYGuardar} 
          variant="contained" 
          sx={{ 
            borderRadius: 50, px: 3, fontWeight: 700, 
            backgroundColor: '#FACC15', color: '#111', 
            boxShadow: 'none',
            '&:hover': { backgroundColor: '#FDE047', boxShadow: 'none' } 
          }}
        >
          Guardar Dirección
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default Direcciones;