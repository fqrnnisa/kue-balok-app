-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.ingredients (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  unit text NOT NULL,
  stock_qty numeric DEFAULT 0,
  min_stock_alert numeric DEFAULT 5,
  is_active boolean DEFAULT true,
  CONSTRAINT ingredients_pkey PRIMARY KEY (id)
);
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
CREATE TABLE public.products (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  stock_qty numeric DEFAULT 0,
  product_result_expected numeric DEFAULT 0,
  is_active boolean DEFAULT true,
  image_url text DEFAULT ''::text,
  CONSTRAINT products_pkey PRIMARY KEY (id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  email text,
  full_name text,
  role USER-DEFINED DEFAULT 'staff'::user_role,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
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
CREATE TABLE public.selling_units (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  product_id uuid,
  name text NOT NULL,
  qty_content numeric NOT NULL,
  price numeric NOT NULL,
  CONSTRAINT selling_units_pkey PRIMARY KEY (id),
  CONSTRAINT selling_units_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);
CREATE TABLE public.standard_yields (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  ingredient_id uuid,
  product_id uuid,
  expected_ratio numeric NOT NULL,
  CONSTRAINT standard_yields_pkey PRIMARY KEY (id),
  CONSTRAINT standard_yields_ingredient_id_fkey FOREIGN KEY (ingredient_id) REFERENCES public.ingredients(id),
  CONSTRAINT standard_yields_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);