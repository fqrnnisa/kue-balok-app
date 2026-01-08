-- Filename: schema_database.sql
-- Description: Database schema for Inventory & Production System (Supabase Compatible)
-- Date: 2026-01-08

-- 1. Enable PGCrypto extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Create Custom Enum for User Roles
-- Checks if type exists to avoid errors on re-runs
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN 
        CREATE TYPE public.user_role AS ENUM ('staff', 'admin', 'owner'); 
    END IF; 
END $$;

-- 3. Create Tables

-- Table: Products (Master Data)
CREATE TABLE public.products (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  stock_qty numeric DEFAULT 0,
  product_result_expected numeric DEFAULT 0,
  is_active boolean DEFAULT true,
  image_url text DEFAULT ''::text,
  CONSTRAINT products_pkey PRIMARY KEY (id)
);

-- Table: Ingredients (Master Data)
CREATE TABLE public.ingredients (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  unit text NOT NULL,
  stock_qty numeric DEFAULT 0,
  min_stock_alert numeric DEFAULT 5,
  is_active boolean DEFAULT true,
  CONSTRAINT ingredients_pkey PRIMARY KEY (id)
);

-- Table: Profiles (Extends Supabase auth.users)
-- Note: 'auth.users' is a system table in Supabase.
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  email text,
  full_name text,
  role public.user_role DEFAULT 'staff'::public.user_role,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Table: Ingredient Logs (Stock Cards for Ingredients)
CREATE TABLE public.ingredient_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now(),
  ingredient_id uuid NOT NULL,
  change_qty numeric NOT NULL,
  current_stock_snapshot numeric,
  action_type text NOT NULL,
  created_by uuid,
  notes text,
  CONSTRAINT ingredient_logs_pkey PRIMARY KEY (id),
  CONSTRAINT ingredient_logs_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id),
  CONSTRAINT ingredient_logs_ingredient_id_fkey FOREIGN KEY (ingredient_id) REFERENCES public.ingredients(id)
);

-- Table: Product Recipes (BOM / Bill of Materials)
CREATE TABLE public.product_recipes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  product_id uuid,
  ingredient_id uuid,
  quantity_per_batch double precision NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT product_recipes_pkey PRIMARY KEY (id),
  CONSTRAINT product_recipes_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id),
  CONSTRAINT product_recipes_ingredient_id_fkey FOREIGN KEY (ingredient_id) REFERENCES public.ingredients(id)
);

-- Table: Standard Yields (Expected Output Ratios)
CREATE TABLE public.standard_yields (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  ingredient_id uuid,
  product_id uuid,
  expected_ratio numeric NOT NULL,
  CONSTRAINT standard_yields_pkey PRIMARY KEY (id),
  CONSTRAINT standard_yields_ingredient_id_fkey FOREIGN KEY (ingredient_id) REFERENCES public.ingredients(id),
  CONSTRAINT standard_yields_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);

-- Table: Production Logs (Manufacturing Results)
CREATE TABLE public.production_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now(),
  created_by uuid,
  yield_id uuid,
  ingredient_used_qty numeric,
  product_result_actual numeric NOT NULL,
  product_result_expected numeric,
  efficiency_status text,
  notes text,
  batch_qty double precision DEFAULT 1,
  product_id uuid,
  CONSTRAINT production_logs_pkey PRIMARY KEY (id),
  CONSTRAINT production_logs_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id),
  CONSTRAINT production_logs_yield_id_fkey FOREIGN KEY (yield_id) REFERENCES public.standard_yields(id),
  CONSTRAINT production_logs_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);

-- Table: Selling Units (SKUs / Variants)
CREATE TABLE public.selling_units (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  product_id uuid,
  name text NOT NULL,
  qty_content numeric NOT NULL,
  price numeric NOT NULL,
  CONSTRAINT selling_units_pkey PRIMARY KEY (id),
  CONSTRAINT selling_units_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);

-- Table: Sales Logs (Transaction History)
CREATE TABLE public.sales_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now(),
  created_by uuid,
  selling_unit_id uuid,
  qty_sold numeric NOT NULL,
  price_at_sale numeric,
  CONSTRAINT sales_logs_pkey PRIMARY KEY (id),
  CONSTRAINT sales_logs_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id),
  CONSTRAINT sales_logs_selling_unit_id_fkey FOREIGN KEY (selling_unit_id) REFERENCES public.selling_units(id)
);