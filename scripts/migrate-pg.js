require('dotenv').config({ path: '.env' });
const { Client } = require('pg');

const connString = process.env.DATABASE_URL.replace('?sslmode=require', '');
const client = new Client({
  connectionString: connString,
  ssl: {
    rejectUnauthorized: false
  }
});

async function main() {
  try {
    await client.connect();
    console.log("Connected to DB, running migration...");
    await client.query(`ALTER TABLE categories ADD COLUMN IF NOT EXISTS "order" integer DEFAULT 0;`);
    await client.query(`ALTER TABLE categories ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;`);
    console.log("Migration completed successfully");
  } catch (err) {
    console.error("Migration failed", err);
  } finally {
    await client.end();
  }
}

main();
