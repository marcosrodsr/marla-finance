const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Running migration...");
  await prisma.$executeRawUnsafe(`ALTER TABLE categories ADD COLUMN IF NOT EXISTS "order" integer DEFAULT 0;`);
  await prisma.$executeRawUnsafe(`ALTER TABLE categories ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;`);
  console.log("Migration successful");
}

main().catch((e) => {
  console.error("Migration failed:", e);
}).finally(() => prisma.$disconnect());
