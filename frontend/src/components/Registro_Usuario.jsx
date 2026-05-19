import React, { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  Alert,
  Stack,
  RadioGroup,
  Radio,
  FormControlLabel,
  FormLabel,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

export default function Registro_Usuario({ onSubmit }) {
  const navigate = useNavigate();
  const [values, setValues] = useState({
    contacto: '',
    nombre: '',
    password: '',
    confirmPassword: '',
    rol: 'cliente',
  });
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const errors = useMemo(() => {
    const errs = {};

    if (!values.contacto.trim()) {
      errs.contacto = 'Ingresa un correo electrónico o número de celular.';
    } else {
      const contacto = values.contacto.trim();
      const isEmail = contacto.includes('@');
      if (isEmail) {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@(gmail\.com|hotmail\.com|yahoo\.com|outlook\.com|live\.com)$/i;
        if (!emailRegex.test(contacto)) {
          errs.contacto = 'Ingresa un correo válido de Gmail, Hotmail, Yahoo, Outlook o Live.';
        }
      } else {
        const phoneRegex = /^(\+52)?[0-9]{10}$/;
        if (!phoneRegex.test(contacto)) {
          errs.contacto = 'Ingresa un número de celular válido';
        }
      }
    }

    if (!values.nombre.trim()) {
      errs.nombre = 'Ingresa tu nombre.';
    }

    if (!values.password) {
      errs.password = 'Ingresa una contraseña.';
    } else {
      if (values.password.length < 8) {
        errs.password = 'La contraseña debe tener al menos 8 caracteres.';
      } else if (!/[A-Z]/.test(values.password)) {
        errs.password = 'Debe contener al menos una letra mayúscula.';
      } else if (!/\d/.test(values.password)) {
        errs.password = 'Debe contener al menos un número.';
      } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(values.password)) {
        errs.password = 'Debe contener al menos un carácter especial.';
      }
    }

    if (!values.confirmPassword) {
      errs.confirmPassword = 'Confirma tu contraseña.';
    } else if (values.password !== values.confirmPassword) {
      errs.confirmPassword = 'Las contraseñas no coinciden.';
    }

    return errs;
  }, [values]);

  const isValid = Object.keys(errors).length === 0;

  const handleChange = (field) => (event) => {
    setValues((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleBlur = (field) => () => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setSubmitted(true);

    if (!isValid) {
      return;
    }

    const payload = {
      contacto: values.contacto.trim(),
      nombre: values.nombre.trim(),
      password: values.password,
      rol: values.rol,
    };

    if (typeof onSubmit === 'function') {
      onSubmit(payload);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
      <Box sx={{ width: '100%', maxWidth: 520, px: 2, py: 4 }}>
        <Card elevation={2} sx={{ borderRadius: 4, border: '2px solid #3B82F6' }}>
          <CardContent sx={{ p: { xs: 3, md: 4 } }}>
            <Typography variant="h4" gutterBottom>Crear una cuenta</Typography>
            <Box component="form" noValidate onSubmit={handleSubmit}>
              <Stack spacing={2}>
                <TextField label="Correo o celular" value={values.contacto} onChange={handleChange('contacto')} onBlur={handleBlur('contacto')} error={Boolean((touched.contacto || submitted) && errors.contacto)} helperText={(touched.contacto || submitted) && errors.contacto} fullWidth autoComplete="username" />
                <TextField label="Nombre" value={values.nombre} onChange={handleChange('nombre')} onBlur={handleBlur('nombre')} error={Boolean((touched.nombre || submitted) && errors.nombre)} helperText={(touched.nombre || submitted) && errors.nombre} fullWidth autoComplete="name" />
                <TextField label="Contraseña" type="password" value={values.password} onChange={handleChange('password')} onBlur={handleBlur('password')} error={Boolean((touched.password || submitted) && errors.password)} helperText={((touched.password || submitted) && errors.password) || "Mínimo 8 caracteres, al menos una mayúscula, un número y un carácter especial."} fullWidth autoComplete="new-password" inputProps={{ pattern: '(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}', title: 'Mínimo 8 caracteres, al menos una mayúscula, un número y un carácter especial.', minLength: 8 }} />
                <TextField label="Confirmar contraseña" type="password" value={values.confirmPassword} onChange={handleChange('confirmPassword')} onBlur={handleBlur('confirmPassword')} error={Boolean((touched.confirmPassword || submitted) && errors.confirmPassword)} helperText={(touched.confirmPassword || submitted) && errors.confirmPassword} fullWidth autoComplete="new-password" />
                <Box sx={{ mt: 1 }}>
                  <FormLabel component="legend" sx={{ mb: 1, fontSize: '0.9rem', fontWeight: 600 }}>¿Qué buscas en MonkeyMarket?</FormLabel>
                  <RadioGroup row value={values.rol} onChange={handleChange('rol')}>
                    <FormControlLabel value="cliente" control={<Radio size="small" />} label={<Typography variant="body2">Contratar servicios (Cliente)</Typography>} />
                    <FormControlLabel value="proveedor" control={<Radio size="small" />} label={<Typography variant="body2">Ofrecer servicios (Proveedor)</Typography>} />
                  </RadioGroup>
                </Box>
                {submitted && !isValid && <Alert severity="error">Por favor corrige los campos marcados para continuar.</Alert>}
                <Button type="submit" variant="contained" size="large" fullWidth sx={{ borderRadius: 50, px: 3, textTransform: 'none', fontWeight: 600, backgroundColor: '#FACC15', color: '#111', boxShadow: '0 4px 10px rgba(245, 158, 11, 0.3)', '&:hover': { backgroundColor: '#FDE047', boxShadow: '0 6px 15px rgba(245, 158, 11, 0.4)' } }}>Continuar</Button>
              </Stack>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}