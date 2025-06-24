-- Backup de la tabla users
CREATE TABLE users_backup AS SELECT * FROM users;

-- Agregar columna farcaster_id
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS farcaster_id VARCHAR(255);

-- Hacer farcaster_id único
ALTER TABLE users
  ADD CONSTRAINT IF NOT EXISTS users_farcaster_id_unique UNIQUE (farcaster_id);

-- Actualizar las foreign keys en otras tablas para usar id
ALTER TABLE user_responses
  DROP CONSTRAINT IF EXISTS user_responses_user_fk CASCADE,
  ADD CONSTRAINT user_responses_user_fk 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE season_points
  DROP CONSTRAINT IF EXISTS season_points_user_fk CASCADE,
  ADD CONSTRAINT season_points_user_fk 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE user_seen_images
  DROP CONSTRAINT IF EXISTS user_seen_images_user_fk CASCADE,
  ADD CONSTRAINT user_seen_images_user_fk 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE extra_lives
  DROP CONSTRAINT IF EXISTS extra_lives_user_fk CASCADE,
  ADD CONSTRAINT extra_lives_user_fk 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE shares
  DROP CONSTRAINT IF EXISTS shares_user_fk CASCADE,
  ADD CONSTRAINT shares_user_fk 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE; 