import React, { useMemo, useState } from 'react';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { IconButton, InputAdornment } from '@mui/material';
import {
  Box, Button, Card, CardContent, TextField, Typography, Alert, Stack, Link,
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';

export default function LoginForm({ onSubmit }) {
  const navigate = useNavigate();
  const location = useLocation();
  const fromLocation = location.state?.from || null; // Capturamos si venía del carrito

  const [values, setValues] = useState({ contacto: '', password: '' });
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const errors = useMemo(() => {
    const errs = {};

    if (!values.contacto.trim()) {
      errs.contacto = 'Ingresa tu correo electrónico o número de celular.';
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
          errs.contacto = 'Ingresa un número de celular válido ';
        }
      }
    }

    if (!values.password) {
      errs.password = 'Ingresa una contraseña.';
    } else if (values.password.length < 8) {
      errs.password = 'La contraseña debe tener al menos 8 caracteres.';
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

    if (!isValid) return;

    const payload = {
      contacto: values.contacto.trim(),
      password: values.password,
    };

    if (typeof onSubmit === 'function') {
      onSubmit(payload);
    }
  };

  const irARegistro = () => {
    // Si iba a pagar, le pasamos ese mismo destino a la pantalla de registro
    navigate('/registro', { state: { from: fromLocation } });
  };

  return (
    <Box sx={{ minHeight: '100vh', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
      <Box sx={{ width: '100%', maxWidth: 520, px: 2, py: 4 }}>
        <Card elevation={2} sx={{ borderRadius: 4, border: '2px solid #3B82F6' }}>
          <CardContent sx={{ p: { xs: 3, md: 4 } }}>
            <Typography variant="h4" gutterBottom fontWeight={800}>
              Iniciar Sesión
            </Typography>
            
            {fromLocation === '/checkout' && (
               <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
                 Inicia sesión para completar tu compra. Tus artículos están guardados.
               </Alert>
            )}

            <Box component="form" noValidate onSubmit={handleSubmit}>
              <Stack spacing={2}>
                <TextField
                  label="Correo o celular" value={values.contacto}
                  onChange={handleChange('contacto')} onBlur={handleBlur('contacto')}
                  error={Boolean((touched.contacto || submitted) && errors.contacto)}
                  helperText={(touched.contacto || submitted) && errors.contacto}
                  fullWidth autoComplete="username"
                />

                <TextField
                  label="Contraseña" type={showPassword ? "text" : "password"}
                  value={values.password} onChange={handleChange('password')} onBlur={handleBlur('password')}
                  error={Boolean((touched.password || submitted) && errors.password)}
                  helperText={(touched.password || submitted) && errors.password}
                  fullWidth autoComplete="current-password"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                {submitted && !isValid && (
                  <Alert severity="error">Por favor corrige los campos marcados para continuar.</Alert>
                )}

                <Button 
                  type="submit" variant="contained" size="large" fullWidth
                  sx={{ borderRadius: 50, px: 3, textTransform: 'none', fontWeight: 800, fontSize: '1.05rem', backgroundColor: '#FACC15', color: '#111', boxShadow: '0 4px 10px rgba(245, 158, 11, 0.3)', '&:hover': { backgroundColor: '#FDE047', boxShadow: '0 6px 15px rgba(245, 158, 11, 0.4)' } }}
                >
                  Iniciar Sesión
                </Button>

                <Typography variant="body2" sx={{ textAlign: 'center', mt: 2 }}>
                  ¿No tienes cuenta?{' '}
                  <Link component="button" variant="body2" onClick={irARegistro} sx={{ cursor: 'pointer', textDecoration: 'underline', color: '#3B82F6', fontWeight: 700 }}>
                    Regístrate aquí
                  </Link>
                </Typography>
              </Stack>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}