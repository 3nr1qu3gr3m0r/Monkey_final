process.env.TZ = 'America/Mexico_City';
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');

// Configuración de variables de entorno
dotenv.config();

// Conexión a la base de datos
require('./config/db');
require('./cron'); // Inicia el vigilante de disputas
// 1. Importación de las rutas modulares
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
const notificacionRoutes =require('./routes/notification.routes');
const proveedorRoutes=require('./routes/proveedor.routes');
const clienteRoutes=require('./routes/client.routes');
const chatRoutes = require('./routes/chat.routes'); 
const searchRoutes = require('./routes/search.routes');
const walletRoutes = require('./routes/wallet.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuramos CORS con las variables de entorno
// Filtramos y limpiamos el origen
const allowedOrigins = [
  'https://frontend-production-6ca5.up.railway.app',
  'https://frontend-production-6ca5.up.railway.app/', // Con barra por si acaso
  'http://localhost:5173',
  'http://127.0.0.1:5173'
];

// Si tienes la variable de entorno, la limpiamos y la agregamos también
if (process.env.FRONTEND_URL) {
  const cleanUrl = process.env.FRONTEND_URL.replace(/\/$/, ""); // Quita la barra del final si existe
  allowedOrigins.push(cleanUrl);
  allowedOrigins.push(`${cleanUrl}/`);
}

const corsOptions = {
  origin: function (origin, callback) {
    // Permitir peticiones sin origen (como Postman o Server-to-Server)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log(`[CORS Bloqueado]: Intento de acceso desde ${origin}`);
      callback(new Error('No permitido por CORS'));
    }
  },
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  optionsSuccessStatus: 200 // Alivia problemas con algunos navegadores antiguos
};

// Middlewares
app.use(cors(corsOptions));

// Middlewares
app.use(cors(corsOptions));
app.use(express.json()); // Habilita la recepción de datos en formato JSON

// 2. Vinculación de rutas con prefijos globales
// Esto organiza la API bajo el estándar /api/recurso
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


// Ruta de salud del servidor (Health Check)
app.get('/', (req, res) => {
  res.send('Servidor del MonkeyMarket funcionando correctamente 🚀');
});

// Inicio del servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
  console.log(`Conexión Frontend permitida desde: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
});