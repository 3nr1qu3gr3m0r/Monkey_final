import React, { useMemo, useState } from 'react';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { IconButton, InputAdornment } from '@mui/material';
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  Alert,
  Stack,
} from '@mui/material';

export default function LoginForm({ onSubmit }) {
  const [values, setValues] = useState({
    contacto: '',
    password: '',
  });
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
        // Validar email con dominios permitidos
        const emailRegex = /^[a-zA-Z0-9._%+-]+@(gmail\.com|hotmail\.com|yahoo\.com|outlook\.com|live\.com)$/i;
        if (!emailRegex.test(contacto)) {
          errs.contacto = 'Ingresa un correo válido de Gmail, Hotmail, Yahoo, Outlook o Live.';
        }
      } else {
        // Validar número de celular mexicano (10 dígitos, opcionalmente con +52)
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

    if (!isValid) {
      return;
    }

    const payload = {
      contacto: values.contacto.trim(),
      password: values.password,
    };

    if (typeof onSubmit === 'function') {
      onSubmit(payload);
    }

  };

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: 520,
        mx: 'auto',
        my: 6,
        px: 2,
      }}
    >
      <Card elevation={2} sx={{ borderRadius: 4 }}>
        <CardContent sx={{ p: { xs: 3, md: 4 } }}>
          <Typography variant="h4" gutterBottom>
            Iniciar Sesión
          </Typography>

          <Box component="form" noValidate onSubmit={handleSubmit}>
            <Stack spacing={2}>
              <TextField
                label="Correo o celular"
                value={values.contacto}
                onChange={handleChange('contacto')}
                onBlur={handleBlur('contacto')}
                error={Boolean((touched.contacto || submitted) && errors.contacto)}
                helperText={(touched.contacto || submitted) && errors.contacto}
                fullWidth
                autoComplete="username"
              />

              <TextField
                label="Contraseña"
                type={showPassword ? "text" : "password"}
                value={values.password}
                onChange={handleChange('password')}
                onBlur={handleBlur('password')}
                error={Boolean((touched.password || submitted) && errors.password)}
                helperText={(touched.password || submitted) && errors.password}
                fullWidth
                autoComplete="current-password"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />


              {submitted && !isValid && (
                <Alert severity="error">Por favor corrige los campos marcados para continuar.</Alert>
              )}

              <Button type="submit" variant="contained" color="primary" size="large" fullWidth>
                Iniciar Sesión
              </Button>

            </Stack>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
