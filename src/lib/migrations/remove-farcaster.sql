-- Obtener los nombres reales de los constraints
DO $$ 
DECLARE
    constraint_record RECORD;
BEGIN
    FOR constraint_record IN 
        SELECT tc.table_name, tc.constraint_name
        FROM information_schema.table_constraints tc
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name IN ('user_responses', 'season_points', 'user_seen_images', 'extra_lives', 'shares')
    LOOP
        EXECUTE 'ALTER TABLE ' || constraint_record.table_name || ' DROP CONSTRAINT ' || constraint_record.constraint_name || ' CASCADE';
    END LOOP;
END $$;

-- Backup de la tabla users
CREATE TABLE users_backup AS SELECT * FROM users;

-- Eliminar columnas relacionadas con Farcaster y early access
ALTER TABLE users
  DROP COLUMN IF EXISTS farcaster_id,
  DROP COLUMN IF EXISTS early_access_requested,
  DROP COLUMN IF EXISTS is_whitelisted;

-- Hacer username único (si no lo es ya)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'users_username_unique'
  ) THEN
    ALTER TABLE users
      ADD CONSTRAINT users_username_unique UNIQUE (username);
  END IF;
END $$;

-- Agregar nuevas foreign keys
ALTER TABLE user_responses
  ADD CONSTRAINT user_responses_user_fk 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE season_points
  ADD CONSTRAINT season_points_user_fk 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE user_seen_images
  ADD CONSTRAINT user_seen_images_user_fk 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE extra_lives
  ADD CONSTRAINT extra_lives_user_fk 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE shares
  ADD CONSTRAINT shares_user_fk 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE; 