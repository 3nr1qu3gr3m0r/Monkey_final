process.env.TZ = 'America/Mexico_City';
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');

// Configuración de variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ==========================================
// 1. CONFIGURACIÓN COMPLETA Y ÚNICA DE CORS
// ==========================================
const allowedOrigins = [
  'https://frontend-production-6ca5.up.railway.app',
  'https://frontend-production-6ca5.up.railway.app/',
  'http://localhost:5173',
  'http://127.0.0.1:5173'
];

if (process.env.FRONTEND_URL) {
  const cleanUrl = process.env.FRONTEND_URL.replace(/\/$/, "");
  allowedOrigins.push(cleanUrl);
  allowedOrigins.push(`${cleanUrl}/`);
}

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log(`[CORS Bloqueado]: Intento de acceso desde ${origin}`);
      callback(new Error('No permitido por CORS'));
    }
  },
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'], // Aseguramos OPTIONS
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
};

// Aplicar CORS de inmediato, antes que cualquier otra cosa
app.use(cors(corsOptions));
app.use(express.json()); // Habilita la recepción de datos en formato JSON

// ==========================================
// 2. CONEXIONES Y SERVICIOS DE BASE DE DATOS
// ==========================================
require('./config/db');
require('./cron'); // Inicia el vigilante de disputas

// ==========================================
// 3. IMPORTACIÓN DE RUTAS (AHORA DEBAJO DEL CORS)
// ==========================================
const authRoutes = require('./routes/auth.routes');
const productRoutes = require('./routes/products.routes');
const cartRoutes = require('./routes/cart.routes');
const aiRoutes = require('./routes/ai.routes');
const userRoutes = require('./routes/user.routes'); 
const serviceRoutes = require('./routes/service.routes');
const direccionRoutes = require('./routes/direccion.routes'); 
const uploadRoutes = require('./routes/upload.routes');
const paymentRoutes = require('./routes/payment.routes');
const orderRoutes = require('./routes/order.routes');
const notificacionRoutes = require('./routes/notification.routes');
const proveedorRoutes = require('./routes/proveedor.routes');
const clienteRoutes = require('./routes/client.routes');
const chatRoutes = require('./routes/chat.routes'); 
const searchRoutes = require('./routes/search.routes');
const walletRoutes = require('./routes/wallet.routes');
const adminRoutes = require('./routes/admin.routes');
const recommendationsRoutes = require('./routes/recommendations.routes');

// ==========================================
// 4. VINCULACIÓN DE RUTAS GLOBALES
// ==========================================
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/users', userRoutes); 
app.use('/api/services', serviceRoutes);
app.use('/api/direcciones', direccionRoutes); 
app.use('/api/upload', uploadRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/pedidos', orderRoutes);
app.use('/api/notificaciones', notificacionRoutes);
app.use('/api/proveedor', proveedorRoutes);
app.use('/api/cliente', clienteRoutes);
app.use('/api/chat', chatRoutes); 
app.use('/api/search', searchRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/admin', adminRoutes);

app.use('/api/recommendations', recommendationsRoutes);

// Ruta de salud del servidor
app.get('/', (req, res) => {
  res.send('Servidor del MonkeyMarket funcionando correctamente 🚀');
});

// Inicio del servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
  console.log(`Conexión Frontend permitida desde: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
});