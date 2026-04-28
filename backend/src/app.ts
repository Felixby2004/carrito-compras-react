import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import config from './config';
import { errorHandler, notFound } from './middlewares/errorHandler';
import { auditMiddleware } from './middlewares/audit.middleware';
import wishlistRoutes from './routes/wishlist.routes';
import resenaRoutes from './routes/resena.routes';
import path from 'path';
import ordenRoutes from './routes/orden.routes';


const app = express();

if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'E-Commerce API',
      version: '1.0.0',
      description: 'API para sistema de e-commerce con carrito de compras',
    },
    servers: [
      {
        url: `http://localhost:${config.port}/api/v1`,
        description: 'Servidor de desarrollo',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// ========== CONFIGURACIÓN DE SEGURIDAD ==========

// Helmet para headers de seguridad
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  hsts: {
    maxAge: 31536000, // 1 año
    includeSubDomains: true,
    preload: true,
  },
}));

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:10000',
  'https://carrito-compras-react-f7qf.onrender.com',
  config.frontendUrl,
  process.env.FRONTEND_URL,
].filter(Boolean);

// CORS configurado para el frontend
app.use(cors({
  origin: function (origin, callback) {
    // Permitir requests sin origen (como Postman, mobile apps, curl)
    if (!origin) return callback(null, true);
    
    // Verificar si el origen está permitido
    if (allowedOrigins.includes(origin) || origin.includes('vercel.app')) {
      callback(null, true);
    } else {
      console.warn(`🚫 CORS bloqueado: ${origin}`);
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Session-Id', 'X-Requested-With'],
  maxAge: 86400,
}));

// Servir archivos estáticos con CORS
app.use('/uploads', express.static(path.join(__dirname, '../uploads'), {
  setHeaders: (res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  },
}));

// Body parser
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// ========== RATE LIMITING ==========

// Rate limiter general para toda la API
const limiterGeneral = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: 'Demasiadas solicitudes desde esta IP',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/health',
  validate: { xForwardedForHeader: false } // 👈 Adiós error
});

// Rate limiter estricto para login y auth
const limiterAuth = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Demasiados intentos de login, intente más tarde',
  skipSuccessfulRequests: true,
  validate: { xForwardedForHeader: false }
});

// Rate limiter para cambios críticos (post, put, delete)
const limiterWrite = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: 'Demasiadas operaciones de escritura, intente más tarde',
  skip: (req) => ['GET', 'HEAD', 'OPTIONS'].includes(req.method),
  validate: { xForwardedForHeader: false }
});


app.use('/api', limiterGeneral);
app.use('/api/v1/auth/login', limiterAuth);
app.use('/api/v1/auth/register', limiterAuth);

// Middleware de auditoría
app.use(auditMiddleware);

// Swagger UI
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ========== IMPORTAR RUTAS ==========

import authRoutes from './routes/auth.routes';
import productoRoutes from './routes/producto.routes';
import carritoRoutes from './routes/carrito.routes';
import clienteRoutes from './routes/cliente.routes';
import dashboardRoutes from './routes/dashboard.routes';
import inventarioRoutes from './routes/inventario.routes';
import proveedorRoutes from './routes/proveedor.routes';
import perfilRoutes from './routes/perfil.routes';
import cuponRoutes from './routes/cupon.routes';
import reporteRoutes from './routes/reporte.routes';
import configuracionRoutes from './routes/configuracion.routes';

// ========== RUTAS API ==========

const apiPrefix = '/api/v1';
app.use(`${apiPrefix}/auth`, authRoutes);
app.use(`${apiPrefix}/perfil`, perfilRoutes);
app.use(`${apiPrefix}/productos`, productoRoutes);
app.use(`${apiPrefix}/carrito`, carritoRoutes);
app.use(`${apiPrefix}/clientes`, clienteRoutes);
app.use(`${apiPrefix}/dashboard`, dashboardRoutes);
app.use(`${apiPrefix}/inventario`, limiterWrite, inventarioRoutes);
app.use(`${apiPrefix}/proveedores`, limiterWrite, proveedorRoutes);
app.use(`${apiPrefix}/cupones`, limiterWrite, cuponRoutes);
app.use(`${apiPrefix}/wishlist`, wishlistRoutes);
app.use(`${apiPrefix}/resenas`, limiterWrite, resenaRoutes);
app.use(`${apiPrefix}/ordenes`, limiterWrite, ordenRoutes);
app.use(`${apiPrefix}/reportes`, reporteRoutes);
app.use(`${apiPrefix}/configuracion`, configuracionRoutes);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Manejo de errores
app.use(notFound);
app.use(errorHandler);

export default app;