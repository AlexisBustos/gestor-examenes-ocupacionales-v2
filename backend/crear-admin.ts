import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('⏳ Conectando a la base de datos de Render...');

  const email = 'admin@geovitam.com';

  // 1. Borrar usuario anterior si existe (para empezar limpio)
  try {
      await prisma.user.deleteMany({
          where: { email: email }
      });
      console.log('🗑️ Usuario limpiado (si existía).');
  } catch (e) {
      // Ignorar errores de borrado
  }

  // 2. Crear el Usuario Maestro con el ROL CORRECTO
  // Clave: 123456
  const passwordHash = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4hXw.U/Gg.';

  const admin = await prisma.user.create({
    data: {
      email: email,
      name: 'ADMIN VITAM MAESTRO',
      password: passwordHash, 
      // 👇 AQUÍ ESTÁ LA CORRECCIÓN CLAVE:
      role: UserRole.ADMIN_VITAM, 
    },
  });

  console.log('=========================================');
  console.log('✅ ¡ÉXITO! Usuario creado en RENDER');
  console.log('=========================================');
  console.log(`👤 Email: ${admin.email}`);
  console.log(`🔑 Role:  ${admin.role}`); // Debería decir ADMIN_VITAM
  console.log('=========================================');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });