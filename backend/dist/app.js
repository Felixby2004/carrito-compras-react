"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const config_1 = __importDefault(require("./config"));
const errorHandler_1 = require("./middlewares/errorHandler");
const audit_middleware_1 = require("./middlewares/audit.middleware");
const wishlist_routes_1 = __importDefault(require("./routes/wishlist.routes"));
const resena_routes_1 = __importDefault(require("./routes/resena.routes"));
const path_1 = __importDefault(require("path"));
const orden_routes_1 = __importDefault(require("./routes/orden.routes"));
const app = (0, express_1.default)();
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
                url: `http://localhost:${config_1.default.port}/api/v1`,
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
const swaggerSpec = (0, swagger_jsdoc_1.default)(swaggerOptions);
// ========== CONFIGURACIÓN DE SEGURIDAD ==========
// Helmet para headers de seguridad
app.use((0, helmet_1.default)({
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
    config_1.default.frontendUrl,
    process.env.FRONTEND_URL,
].filter(Boolean);
// CORS configurado para el frontend
app.use((0, cors_1.default)({
    origin: function (origin, callback) {
        // Permitir requests sin origen (como Postman, mobile apps, curl)
        if (!origin)
            return callback(null, true);
        // Verificar si el origen está permitido
        if (allowedOrigins.includes(origin) || origin.includes('vercel.app')) {
            callback(null, true);
        }
        else {
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
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads'), {
    setHeaders: (res) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    },
}));
// Body parser
app.use(express_1.default.json({ limit: '50mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '50mb' }));
app.use((0, cookie_parser_1.default)());
// ========== RATE LIMITING ==========
// Rate limiter general para toda la API
const limiterGeneral = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    message: 'Demasiadas solicitudes desde esta IP',
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.path === '/health',
    validate: { xForwardedForHeader: false } // 👈 Adiós error
});
// Rate limiter estricto para login y auth
const limiterAuth = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Demasiados intentos de login, intente más tarde',
    skipSuccessfulRequests: true,
    validate: { xForwardedForHeader: false }
});
// Rate limiter para cambios críticos (post, put, delete)
const limiterWrite = (0, express_rate_limit_1.default)({
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
app.use(audit_middleware_1.auditMiddleware);
// Swagger UI
app.use('/api/docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swaggerSpec));
// ========== IMPORTAR RUTAS ==========
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const producto_routes_1 = __importDefault(require("./routes/producto.routes"));
const carrito_routes_1 = __importDefault(require("./routes/carrito.routes"));
const cliente_routes_1 = __importDefault(require("./routes/cliente.routes"));
const dashboard_routes_1 = __importDefault(require("./routes/dashboard.routes"));
const inventario_routes_1 = __importDefault(require("./routes/inventario.routes"));
const proveedor_routes_1 = __importDefault(require("./routes/proveedor.routes"));
const perfil_routes_1 = __importDefault(require("./routes/perfil.routes"));
const cupon_routes_1 = __importDefault(require("./routes/cupon.routes"));
const reporte_routes_1 = __importDefault(require("./routes/reporte.routes"));
const configuracion_routes_1 = __importDefault(require("./routes/configuracion.routes"));
// ========== RUTAS API ==========
const apiPrefix = '/api/v1';
app.use(`${apiPrefix}/auth`, auth_routes_1.default);
app.use(`${apiPrefix}/perfil`, perfil_routes_1.default);
app.use(`${apiPrefix}/productos`, producto_routes_1.default);
app.use(`${apiPrefix}/carrito`, carrito_routes_1.default);
app.use(`${apiPrefix}/clientes`, cliente_routes_1.default);
app.use(`${apiPrefix}/dashboard`, dashboard_routes_1.default);
app.use(`${apiPrefix}/inventario`, limiterWrite, inventario_routes_1.default);
app.use(`${apiPrefix}/proveedores`, limiterWrite, proveedor_routes_1.default);
app.use(`${apiPrefix}/cupones`, limiterWrite, cupon_routes_1.default);
app.use(`${apiPrefix}/wishlist`, wishlist_routes_1.default);
app.use(`${apiPrefix}/resenas`, limiterWrite, resena_routes_1.default);
app.use(`${apiPrefix}/ordenes`, limiterWrite, orden_routes_1.default);
app.use(`${apiPrefix}/reportes`, reporte_routes_1.default);
app.use(`${apiPrefix}/configuracion`, configuracion_routes_1.default);
// Health check
app.get('/health', (_req, res) => {
    res.json({ status: 'OK', timestamp: new Date() });
});
// Manejo de errores
app.use(errorHandler_1.notFound);
app.use(errorHandler_1.errorHandler);
exports.default = app;
