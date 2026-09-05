-- Add created_at to missions table if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'missions' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE missions ADD COLUMN created_at timestamptz DEFAULT now();
    UPDATE missions SET created_at = now() WHERE created_at IS NULL;
  END IF;
END $$;
