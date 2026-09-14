-- Store products: add type column (buy = student pays talents, sell = student earns talents)
ALTER TABLE store_products ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'buy';

-- Update existing rows to have type='buy' if null
UPDATE store_products SET type = 'buy' WHERE type IS NULL;
