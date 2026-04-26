import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import config from './config';
import { errorHandler, notFound } from './middlewares/errorHandler';
import wishlistRoutes from './routes/wishlist.routes';
import resenaRoutes from './routes/resena.routes';
import path from 'path';


const app = express();

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

// Middlewares globales
app.use(helmet());

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Session-Id'],
}));
app.use('/uploads', express.static(path.join(__dirname, '../uploads'), {
  setHeaders: (res) => {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  },
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Importar rutas
import authRoutes from './routes/auth.routes';
import productoRoutes from './routes/producto.routes';
import carritoRoutes from './routes/carrito.routes';

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 solicitudes por ventana
  message: 'Demasiadas solicitudes desde esta IP',
});
app.use('/api', limiter);

// Swagger UI
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Rutas API
const apiPrefix = '/api/v1';
app.use(`${apiPrefix}/auth`, authRoutes);
app.use(`${apiPrefix}/productos`, productoRoutes);
app.use(`${apiPrefix}/carrito`, carritoRoutes);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Manejo de errores
app.use(notFound);
app.use(errorHandler);

app.use(`${apiPrefix}/wishlist`, wishlistRoutes);
app.use(`${apiPrefix}/resenas`, resenaRoutes);

export default app;