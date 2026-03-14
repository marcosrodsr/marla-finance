ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "order" integer DEFAULT 0;
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
