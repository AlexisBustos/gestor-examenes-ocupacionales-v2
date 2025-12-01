// backend/scripts/create-admin.js

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@vitam.cl';
  const passwordPlain = 'Vitam2025!';

  // 1) Hasheamos la contraseña en texto plano
  const passwordHash = await bcrypt.hash(passwordPlain, 10);

  // 2) Preparamos el objeto de datos:
  // OJO: el campo en el modelo se llama "password"
  const data = {
    email,
    name: 'Administrador',
    role: 'ADMIN_VITAM',
    password: passwordHash, // 👈 AQUÍ VA EL HASH, NO EL TEXTO PLANO
  };

  const user = await prisma.user.upsert({
    where: { email },
    update: data,   // si ya existe ese email → lo actualiza
    create: data,   // si no existe → lo crea
  });

  console.log('✅ Usuario admin listo:');
  console.log({
    id: user.id,
    email: user.email,
    role: user.role,
  });
}

main()
  .catch((e) => {
    console.error('❌ Error creando admin:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
