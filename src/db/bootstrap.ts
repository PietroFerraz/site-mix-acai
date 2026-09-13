import { sql } from "drizzle-orm";
import { db } from "@/db";

/**
 * DDL that matches src/db/schema.ts.
 *
 * Running this on the first request means a brand new cloud database
 * (Neon, Supabase, Railway...) bootstraps itself, so deploying is just a matter
 * of setting DATABASE_URL — no manual `drizzle-kit push` needed.
 */
const SCHEMA_SQL = `
DO $$ BEGIN
  CREATE TYPE order_status AS ENUM
    ('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS restaurants (
  id serial PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  tagline text,
  cover_image text,
  logo_image text,
  facebook_url text,
  instagram_url text,
  whatsapp text,
  address text,
  opening_hours text,
  currency text NOT NULL DEFAULT 'BRL',
  locale text NOT NULL DEFAULT 'pt-BR',
  is_open boolean NOT NULL DEFAULT true,
  delivery_fee numeric(10,2) NOT NULL DEFAULT '0',
  created_at timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS promotions (
  id serial PRIMARY KEY,
  restaurant_id integer NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  badge text NOT NULL,
  title text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS categories (
  id serial PRIMARY KEY,
  restaurant_id integer NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS menu_items (
  id serial PRIMARY KEY,
  category_id integer NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price numeric(10,2) NOT NULL,
  original_price numeric(10,2),
  image_url text,
  is_available boolean NOT NULL DEFAULT true,
  is_featured boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS menu_item_variants (
  id serial PRIMARY KEY,
  item_id integer NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  name text NOT NULL,
  price numeric(10,2) NOT NULL,
  sort_order integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS orders (
  id serial PRIMARY KEY,
  restaurant_id integer NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  fulfillment text NOT NULL DEFAULT 'pickup',
  address text,
  payment_method text NOT NULL DEFAULT 'pix',
  notes text,
  subtotal numeric(10,2) NOT NULL,
  delivery_fee numeric(10,2) NOT NULL DEFAULT '0',
  total numeric(10,2) NOT NULL,
  status order_status NOT NULL DEFAULT 'pending',
  created_at timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS order_items (
  id serial PRIMARY KEY,
  order_id integer NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id integer REFERENCES menu_items(id) ON DELETE SET NULL,
  variant_id integer REFERENCES menu_item_variants(id) ON DELETE SET NULL,
  variant_name text,
  name text NOT NULL,
  quantity integer NOT NULL,
  unit_price numeric(10,2) NOT NULL,
  notes text
);

CREATE INDEX IF NOT EXISTS menu_items_category_id_idx ON menu_items (category_id);
CREATE INDEX IF NOT EXISTS categories_restaurant_id_idx ON categories (restaurant_id);
CREATE INDEX IF NOT EXISTS orders_restaurant_id_idx ON orders (restaurant_id);
`;

const globalForSchema = globalThis as typeof globalThis & {
  __mixRlSchemaReady?: Promise<void>;
};

/**
 * Creates the tables when they are missing. Runs at most once per process and
 * never throws more than once, so a transient database outage does not loop.
 */
export function ensureSchema(): Promise<void> {
  if (!globalForSchema.__mixRlSchemaReady) {
    globalForSchema.__mixRlSchemaReady = (async () => {
      await db.execute(sql.raw(SCHEMA_SQL));
    })().catch((error) => {
      globalForSchema.__mixRlSchemaReady = undefined;
      throw error;
    });
  }
  return globalForSchema.__mixRlSchemaReady;
}
