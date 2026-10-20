ALTER TABLE public.store_sections ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;
