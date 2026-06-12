
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const login = async (email: string, password: string) => {
  console.log(`Testing login for email: ${email}`);
  try {
    const usuario = await prisma.seg_usuarios.findUnique({
      where: { email: email },
      include: { usuario_roles: { include: { rol: true } } },
    });
    console.log("Found user?", !!usuario);
    if (!usuario) throw new Error("Invalid credentials");

    console.log("Checking password...");
    const valid = await bcrypt.compare(password, usuario.password_hash);
    console.log("Password valid?", valid);

    if (valid) {
      console.log("SUCCESS! User details:", { email: usuario.email, roles: usuario.usuario_roles.map(ur => ur.rol.nombre) });
    } else {
      throw new Error("Password invalid");
    }
  } catch (err) {
    console.error("ERROR:", (err as Error).message);
  } finally {
    await prisma.$disconnect();
  }
};

login("cliente1@ecommerce.com", "Cliente123!");
login("admin@ecommerce.com", "Admin123!");
login("ventas@ecommerce.com", "Ventas123!");
login("inventario@ecommerce.com", "Inventario123!");
login("vendedor@ecommerce.com", "Vendedor123!");
