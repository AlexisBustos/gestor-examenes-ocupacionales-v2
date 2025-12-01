const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@vitam.cl';
  const plainPassword = 'Vitam2025!'; // Cambia esta clave si quieres

  console.log('Generando hash...');
  const hash = await bcrypt.hash(plainPassword, 10);

  console.log('Actualizando/creando usuario admin...');
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      password: hash,
      role: 'ADMIN_VITAM',
      name: 'Administrador Vitam',
    },
    create: {
      email,
      password: hash,
      role: 'ADMIN_VITAM',
      name: 'Administrador Vitam',
    },
  });

  console.log('Listo. Usuario admin actualizado/creado:');
  console.log({ id: user.id, email: user.email, role: user.role });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
