import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

const envPath = path.resolve(__dirname, '../../.env');
const envExists = fs.existsSync(envPath);

console.log('📄 Cargando variables de entorno desde:', envPath, envExists ? '' : '(no existe)');
if (process.env.NODE_ENV !== 'production') {
  // En desarrollo, usamos `.env` local y sobreescribimos variables del sistema.
  dotenv.config({ path: envPath, override: true });
} else {
  // En producción no sobreescribimos las variables del entorno con un `.env` local.
  dotenv.config({ path: envPath, override: false });
}

if (!process.env.DATABASE_URL) {
  console.warn('⚠️ DATABASE_URL no está configurada. Revisa tu archivo .env o la variable de entorno.');
} else if (process.env.NODE_ENV !== 'production') {
  try {
    const url = new URL(process.env.DATABASE_URL);
    console.log(`🔗 Conectando a la base de datos en: ${url.hostname}`);
  } catch {
    console.log('🔗 DATABASE_URL establecida, pero no se pudo parsear el host.');
  }
}

// Validación de variables críticas en producción
if (process.env.NODE_ENV === 'production') {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    console.error('❌ ERROR: JWT_SECRET debe tener al menos 32 caracteres en producción');
  }
  if (!process.env.JWT_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET.length < 32) {
    console.error('❌ ERROR: JWT_REFRESH_SECRET debe tener al menos 32 caracteres en producción');
  }
}

export const config = {
  // Servidor
  port: parseInt(process.env.PORT || '3000'),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Base de datos
  databaseUrl: process.env.DATABASE_URL || '',
  
  // JWT
  jwtSecret: process.env.JWT_SECRET || 'default_secret_change_me',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'default_refresh_secret_change_me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  
  // Email
  smtpHost: process.env.SMTP_HOST,
  smtpPort: parseInt(process.env.SMTP_PORT || '587'),
  smtpUser: process.env.SMTP_USER,
  smtpPass: process.env.SMTP_PASS,
  emailFrom: process.env.EMAIL_FROM || 'noreply@ecommerce.com',
  
  // Stripe
  stripeSecretKey: process.env.STRIPE_SECRET_KEY,
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  
  // Mercado Pago
  mercadoPagoPublicKey: process.env.MERCADOPAGO_PUBLIC_KEY,
  mercadoPagoToken: process.env.MERCADOPAGO_TOKEN,
  
  // Frontend
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',

  // Backend
  backendUrl: process.env.BACKEND_URL || (process.env.NODE_ENV === 'production' 
    ? 'https://carrito-compras-react-f7qf.onrender.com' 
    : `http://localhost:${process.env.PORT || '3000'}`),
  
  // Sistema
  taxPercentage: parseFloat(process.env.TAX_PERCENTAGE || '18'),
  stockReserveMinutes: parseInt(process.env.STOCK_RESERVE_MINUTES || '15'),
};

export default config;