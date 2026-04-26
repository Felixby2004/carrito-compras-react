import { PrismaClient, Prisma } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import config from '../config';
import { AppError } from '../middlewares/errorHandler';
import { RegisterInput, LoginInput } from '../schemas/auth.schema';
// import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/email';

const prisma = new PrismaClient();

export class AuthService {
  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }
  
  private async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
  
  private generateAccessToken(userId: number, email: string): string {
    const payload = { id: userId, email };
    const secret = config.jwtSecret;
    const options: jwt.SignOptions = { expiresIn: config.jwtExpiresIn as jwt.SignOptions['expiresIn'] };
    return jwt.sign(payload, secret, options);
  }
  
  private generateRefreshToken(): string {
    return crypto.randomBytes(40).toString('hex');
  }
  
  async register(data: RegisterInput) {
    // Verificar si el email ya existe
    const existingUser = await prisma.seg_usuarios.findUnique({
      where: { email: data.email },
    });
    
    if (existingUser) {
      throw new AppError('El email ya está registrado', 409);
    }
    
    // Hash password
    const hashedPassword = await this.hashPassword(data.password);
    
    // Crear verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    
    // Crear usuario en transacción
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const usuario = await tx.seg_usuarios.create({
        data: {
          email: data.email,
          password_hash: hashedPassword,
          token_verificacion: verificationToken,
          activo: true,
        },
      });
      
      // Crear perfil de cliente
      const cliente = await tx.cli_clientes.create({
        data: {
          usuario_id: usuario.id,
          telefono: data.telefono,
          total_gastado: 0,
          segmento: 'nuevo',
        },
      });
      
      // Asignar rol de cliente
      const rolCliente = await tx.seg_roles.findFirst({
        where: { nombre: 'cliente' },
      });
      
      if (rolCliente) {
        await tx.seg_usuario_rol.create({
          data: {
            usuario_id: usuario.id,
            rol_id: rolCliente.id,
          },
        });
      }
      
      return { usuario, cliente };
    });
    
    // Enviar email de verificación
    // await sendVerificationEmail(data.email, verificationToken);
    
    // Generar tokens
    const accessToken = this.generateAccessToken(result.usuario.id, result.usuario.email);
    const refreshToken = this.generateRefreshToken();
    
    // Guardar refresh token
    await prisma.seg_refresh_tokens.create({
      data: {
        usuario_id: result.usuario.id,
        token: refreshToken,
        expira_en: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        revocado: false,
      },
    });
    
    return {
      user: {
        id: result.usuario.id,
        email: result.usuario.email,
      },
      accessToken,
      refreshToken,
    };
  }
  
  async login(data: LoginInput) {
    const usuario = await prisma.seg_usuarios.findUnique({
      where: { email: data.email },
      include: {
        usuario_roles: {
          include: {
            rol: true,
          },
        },
      },
    });
    
    if (!usuario) {
      throw new AppError('Credenciales inválidas', 401);
    }
    
    if (!usuario.activo) {
      throw new AppError('Usuario desactivado', 401);
    }
    
    const isValidPassword = await this.comparePassword(data.password, usuario.password_hash);
    
    if (!isValidPassword) {
      throw new AppError('Credenciales inválidas', 401);
    }
    
    // Actualizar último login
    await prisma.seg_usuarios.update({
      where: { id: usuario.id },
      data: { fecha_ultimo_login: new Date() },
    });
    
    // Generar tokens
    const accessToken = this.generateAccessToken(usuario.id, usuario.email);
    const refreshToken = this.generateRefreshToken();
    
    // Guardar refresh token
    await prisma.seg_refresh_tokens.create({
      data: {
        usuario_id: usuario.id,
        token: refreshToken,
        expira_en: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        revocado: false,
      },
    });
    
    return {
      user: {
        id: usuario.id,
        email: usuario.email,
        roles: usuario.usuario_roles.map((ur: any) => ur.rol.nombre),
      },
      accessToken,
      refreshToken,
    };
  }
  
  async refreshToken(refreshToken: string) {
    const tokenRecord = await prisma.seg_refresh_tokens.findFirst({
      where: {
        token: refreshToken,
        revocado: false,
        expira_en: { gt: new Date() },
      },
      include: {
        usuario: true,
      },
    });
    
    if (!tokenRecord) {
      throw new AppError('Refresh token inválido o expirado', 401);
    }
    
    // Revocar el refresh token usado
    await prisma.seg_refresh_tokens.update({
      where: { id: tokenRecord.id },
      data: { revocado: true },
    });
    
    // Generar nuevos tokens
    const accessToken = this.generateAccessToken(tokenRecord.usuario.id, tokenRecord.usuario.email);
    const newRefreshToken = this.generateRefreshToken();
    
    await prisma.seg_refresh_tokens.create({
      data: {
        usuario_id: tokenRecord.usuario.id,
        token: newRefreshToken,
        expira_en: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        revocado: false,
      },
    });
    
    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  }
  
  async logout(userId: number, refreshToken: string) {
    await prisma.seg_refresh_tokens.updateMany({
      where: {
        usuario_id: userId,
        token: refreshToken,
      },
      data: { revocado: true },
    });
    
    return { success: true };
  }
  
  async verifyEmail(token: string) {
    const usuario = await prisma.seg_usuarios.findFirst({
      where: { token_verificacion: token },
    });
    
    if (!usuario) {
      throw new AppError('Token de verificación inválido', 400);
    }
    
    await prisma.seg_usuarios.update({
      where: { id: usuario.id },
      data: {
        email_verificado: true,
        token_verificacion: null,
      },
    });
    
    return { success: true };
  }
  
  async forgotPassword(email: string) {
    const usuario = await prisma.seg_usuarios.findUnique({
      where: { email },
    });
    
    if (!usuario) {
      // No revelar si el email existe por seguridad
      return { success: true };
    }
    
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    await prisma.seg_usuarios.update({
      where: { id: usuario.id },
      data: {
        token_verificacion: resetToken,
      },
    });
    
    //await sendPasswordResetEmail(email, resetToken);
    
    return { success: true };
  }
  
  async resetPassword(token: string, newPassword: string) {
    const usuario = await prisma.seg_usuarios.findFirst({
      where: { token_verificacion: token },
    });
    
    if (!usuario) {
      throw new AppError('Token inválido o expirado', 400);
    }
    
    const hashedPassword = await this.hashPassword(newPassword);
    
    await prisma.seg_usuarios.update({
      where: { id: usuario.id },
      data: {
        password_hash: hashedPassword,
        token_verificacion: null,
      },
    });
    
    return { success: true };
  }
}