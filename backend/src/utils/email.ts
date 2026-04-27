import nodemailer from 'nodemailer';
import config from '../config';
import logger from './logger';

const transporter = nodemailer.createTransport({
  host: config.smtpHost,
  port: config.smtpPort,
  secure: false,
  auth: {
    user: config.smtpUser,
    pass: config.smtpPass,
  },
});

export const sendVerificationEmail = async (email: string, token: string) => {
  const verificationUrl = `${config.frontendUrl}/verify-email?token=${token}`;
  
  const mailOptions = {
    from: config.emailFrom,
    to: email,
    subject: 'Verifica tu cuenta - E-Commerce',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Bienvenido a E-Commerce</h2>
        <p>Gracias por registrarte. Por favor, verifica tu correo electrónico haciendo clic en el siguiente enlace:</p>
        <a href="${verificationUrl}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verificar Email</a>
        <p>O copia y pega este enlace en tu navegador:</p>
        <p>${verificationUrl}</p>
        <p>Este enlace expirará en 24 horas.</p>
      </div>
    `,
  };
  
  try {
    await transporter.sendMail(mailOptions);
    logger.info(`Email de verificación enviado a ${email}`);
  } catch (error) {
    logger.error(`Error enviando email a ${email}:`, error);
  }
};

export const sendPasswordResetEmail = async (email: string, token: string) => {
  const resetUrl = `${config.frontendUrl}/reset-password?token=${token}`;
  
  const mailOptions = {
    from: config.emailFrom,
    to: email,
    subject: 'Recuperación de contraseña - E-Commerce',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Recuperación de Contraseña</h2>
        <p>Hemos recibido una solicitud para restablecer tu contraseña. Haz clic en el siguiente enlace:</p>
        <a href="${resetUrl}" style="background-color: #2196F3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Restablecer Contraseña</a>
        <p>O copia y pega este enlace en tu navegador:</p>
        <p>${resetUrl}</p>
        <p>Este enlace expirará en 1 hora.</p>
        <p>Si no solicitaste este cambio, ignora este mensaje.</p>
      </div>
    `,
  };
  
  try {
    await transporter.sendMail(mailOptions);
    logger.info(`Email de recuperación enviado a ${email}`);
  } catch (error) {
    logger.error(`Error enviando email a ${email}:`, error);
  }
};

export const sendOrderStatusEmail = async (
  email: string,
  ordenNumero: string,
  estado: string,
  comentario?: string
) => {
  const mailOptions = {
    from: config.emailFrom,
    to: email,
    subject: `Actualizacion de tu orden ${ordenNumero}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Estado de orden actualizado</h2>
        <p>Tu orden <strong>${ordenNumero}</strong> cambio a: <strong>${estado}</strong>.</p>
        ${comentario ? `<p>Comentario: ${comentario}</p>` : ''}
        <p>Gracias por comprar con nosotros.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.info(`Email de estado de orden enviado a ${email}`);
  } catch (error) {
    logger.error(`Error enviando email de estado a ${email}:`, error);
  }
};