import { Routes, Route } from 'react-router-dom';
import HeroPrompt from './components/ui/prompt';
import Registro_Usuario from './components/Registro_Usuario';
import LoginForm from './components/LoginForm';
import { Box } from '@mui/material';

function App() {
  return (
    <Box sx={{ backgroundColor: 'background.default', minHeight: '100vh' }}>
      <Routes>
        <Route path="/" element={<HeroPrompt />} />
        <Route path="/registro" element={
          <Registro_Usuario onSubmit={(data) => console.log('registro enviado:', data)} />
        } />
        <Route path="/login" element={
          <LoginForm onSubmit={(data) => console.log('login enviado:', data)} />
        } />
      </Routes>
    </Box>
  );
}

export default App;