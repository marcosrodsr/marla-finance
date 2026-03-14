-- Añadir columna de ordenamiento si no existe
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "order" integer DEFAULT 0;

-- Añadir columna de estado activo (soft-delete) si no existe
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "is_active" boolean DEFAULT true;
