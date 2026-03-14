require('dotenv').config({ path: '.env' });
const postgres = require('postgres');

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

async function main() {
  try {
    console.log("Connected to DB, running migration...");
    await sql`ALTER TABLE categories ADD COLUMN IF NOT EXISTS "order" integer DEFAULT 0;`;
    await sql`ALTER TABLE categories ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;`;
    console.log("Migration completed successfully");
  } catch (err) {
    console.error("Migration failed", err);
  } finally {
    await sql.end();
  }
}

main();
