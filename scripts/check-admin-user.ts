import 'dotenv/config';
import prisma from '../src/lib/prisma';
import bcrypt from 'bcryptjs';

async function main() {
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { role: 'ADMIN' },
        { email: { contains: 'manchester', mode: 'insensitive' } }
      ]
    }
  });

  console.log('Found users matching admin/manchester:', users.map(u => ({ id: u.id, email: u.email, role: u.role })));

  const adminEmail = 'manchestertechnologiess@gmail.com';
  const newPassword = 'Bery0218';
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // Check if admin user exists with this email or single 's' email
  let admin = await prisma.user.findFirst({
    where: {
      email: { in: [adminEmail, 'manchestertechnologies@gmail.com'] }
    }
  });

  if (admin) {
    console.log(`Updating password for existing admin: ${admin.email}`);
    await prisma.user.update({
      where: { id: admin.id },
      data: { 
        email: adminEmail,
        password: hashedPassword 
      }
    });
    console.log(`Password successfully updated for ${adminEmail} to: ${newPassword}`);
  } else {
    console.log(`Admin user not found. Creating admin user: ${adminEmail}`);
    admin = await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        role: 'ADMIN'
      }
    });
    console.log(`Admin user created successfully with password: ${newPassword}`);
  }

  // Also verify all ADMIN users in DB
  const allAdmins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
  console.log('All ADMIN users currently in database:', allAdmins.map(a => ({ id: a.id, email: a.email, role: a.role })));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
