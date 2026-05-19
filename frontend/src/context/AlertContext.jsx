import React, { createContext, useContext, useState, useCallback } from 'react';
import { Snackbar, Alert, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from '@mui/material';

const AlertContext = createContext();

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    console.warn("useAlert must be used within an AlertProvider. Falling back to window.alert/confirm.");
    return {
      showAlert: (msg) => window.alert(msg),
      showConfirm: async (msg) => window.confirm(msg)
    };
  }
  return context;
};

export const AlertProvider = ({ children }) => {
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [dialog, setDialog] = useState({ open: false, message: '', resolve: null });

  const showAlert = useCallback((message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const closeSnackbar = useCallback((event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbar(prev => ({ ...prev, open: false }));
  }, []);

  const showConfirm = useCallback((message) => {
    return new Promise((resolve) => {
      setDialog({ open: true, message, resolve });
    });
  }, []);

  const handleConfirmClose = useCallback((result) => {
    if (dialog.resolve) {
      dialog.resolve(result);
    }
    setDialog(prev => ({ ...prev, open: false, resolve: null }));
  }, [dialog]);

  return (
    <AlertContext.Provider value={{ showAlert, showConfirm }}>
      {children}

      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={4000} 
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ zIndex: 9999 }}
      >
        <Alert 
          onClose={closeSnackbar} 
          severity={snackbar.severity} 
          sx={{ 
            width: '100%', 
            borderRadius: 3, 
            fontWeight: 600, 
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)' 
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      <Dialog 
        open={dialog.open} 
        onClose={() => handleConfirmClose(false)}
        PaperProps={{
          sx: { borderRadius: 3, padding: 1, boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: 'text.primary' }}>Confirmación</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: 'text.secondary', fontSize: '1.05rem' }}>
            {dialog.message}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ paddingRight: 3, paddingBottom: 2 }}>
          <Button 
            onClick={() => handleConfirmClose(false)} 
            sx={{ color: 'text.secondary', fontWeight: 600 }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={() => handleConfirmClose(true)} 
            variant="contained" 
            color="primary"
            sx={{ borderRadius: 50, px: 3, fontWeight: 600, boxShadow: 'none' }}
          >
            Aceptar
          </Button>
        </DialogActions>
      </Dialog>
    </AlertContext.Provider>
  );
};
