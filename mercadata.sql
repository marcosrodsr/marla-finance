-- ============================================================
-- MERCADATA — SQL para Supabase
-- Ejecutar en orden en el SQL Editor de Supabase
-- ============================================================

-- ============================================================
-- 1. market_products
-- ============================================================
CREATE TABLE IF NOT EXISTS public.market_products (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  name            TEXT NOT NULL,
  price_cents     INTEGER NOT NULL DEFAULT 0,
  tipo            TEXT NOT NULL CHECK (tipo IN ('comida', 'personal', 'casa')),
  usuario         TEXT NOT NULL CHECK (usuario IN ('pareja', 'marcos', 'camila')),
  establecimiento TEXT NOT NULL,
  unidad          TEXT NOT NULL DEFAULT 'unidad'
                    CHECK (unidad IN ('unidad', 'kg', 'g', 'litro')),
  is_active       BOOLEAN NOT NULL DEFAULT TRUE
);

-- Seed inicial de productos
INSERT INTO public.market_products
  (name, price_cents, tipo, usuario, establecimiento, unidad)
VALUES
  ('Nuggets',              260, 'comida',   'marcos',  'Mercadona', 'unidad'),
  ('Pechuga de pollo',     645, 'comida',   'pareja',  'Lidl',      'kg'),
  ('Yogur griego',         215, 'comida',   'camila',  'Mercadona', 'unidad'),
  ('Arroz integral',       195, 'comida',   'pareja',  'Carrefour', 'unidad'),
  ('Papel higiénico',      480, 'casa',     'pareja',  'Día',       'unidad'),
  ('Detergente para ropa', 575, 'casa',     'camila',  'Carrefour', 'unidad'),
  ('Lavavajillas',         189, 'casa',     'marcos',  'Lidl',      'unidad'),
  ('Champú',               399, 'personal', 'camila',  'Mercadona', 'unidad'),
  ('Desodorante',          285, 'personal', 'marcos',  'Día',       'unidad'),
  ('Crema corporal',       450, 'personal', 'pareja',  'Carrefour', 'unidad');

-- ============================================================
-- 2. market_purchases
-- ============================================================
CREATE TABLE IF NOT EXISTS public.market_purchases (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  date            DATE NOT NULL,
  paid_by         TEXT NOT NULL CHECK (paid_by IN ('marcos', 'camila')),
  establecimiento TEXT NOT NULL,
  total_cents     INTEGER NOT NULL DEFAULT 0,
  note            TEXT
);

-- ============================================================
-- 3. market_purchase_items
-- ============================================================
CREATE TABLE IF NOT EXISTS public.market_purchase_items (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  purchase_id   TEXT NOT NULL
                  REFERENCES public.market_purchases(id) ON DELETE CASCADE,
  product_id    TEXT REFERENCES public.market_products(id) ON DELETE SET NULL,
  name_snapshot TEXT NOT NULL,
  price_cents   INTEGER NOT NULL,
  qty           NUMERIC NOT NULL DEFAULT 1,
  tipo_usuario  TEXT NOT NULL CHECK (tipo_usuario IN ('pareja', 'marcos', 'camila'))
);

-- ============================================================
-- 4. Nueva columna market_purchase_id en transactions
-- ============================================================
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS market_purchase_id TEXT;

ALTER TABLE public.transactions
  ADD CONSTRAINT fk_transactions_market_purchase
    FOREIGN KEY (market_purchase_id)
    REFERENCES public.market_purchases(id)
    ON DELETE SET NULL;

-- ============================================================
-- 5. Índices
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_market_products_establecimiento
  ON public.market_products(establecimiento);
CREATE INDEX IF NOT EXISTS idx_market_products_usuario
  ON public.market_products(usuario);
CREATE INDEX IF NOT EXISTS idx_market_purchases_date
  ON public.market_purchases(date);
CREATE INDEX IF NOT EXISTS idx_market_purchase_items_purchase_id
  ON public.market_purchase_items(purchase_id);
CREATE INDEX IF NOT EXISTS idx_transactions_market_purchase_id
  ON public.transactions(market_purchase_id);
