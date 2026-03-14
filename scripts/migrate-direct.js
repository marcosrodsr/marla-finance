require('dotenv').config({ path: '.env' });
const postgres = require('postgres');

// The .env has the pooler URL which is failing with XX000 on DDL.
// Construct direct connection from NEXT_PUBLIC_SUPABASE_URL project ref
const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL.replace('https://', '').split('.')[0];
// Ensure password is correct from the pooler URL
const dbUrl = process.env.DATABASE_URL;
const passwordMatch = dbUrl.match(/:([^:@]+)@aws/);
const password = passwordMatch ? passwordMatch[1] : '';

const directUrl = `postgresql://postgres:${password}@db.${projectRef}.supabase.co:5432/postgres`;

const sql = postgres(directUrl, { ssl: 'require' });

async function main() {
  try {
    console.log("Connected to direct DB, running migration...");
    await sql`ALTER TABLE categories ADD COLUMN IF NOT EXISTS "order" integer DEFAULT 0;`;
    await sql`ALTER TABLE categories ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;`;
    console.log("Migration completed successfully!!!");
  } catch (err) {
    console.error("Migration failed", err);
  } finally {
    await sql.end();
  }
}

main();
