-- Insertar Season 08 si no existe
INSERT INTO seasons (name, start_date, end_date, is_early_access, is_active)
SELECT 'Season 08', '2024-03-01', '2024-05-31', false, true
WHERE NOT EXISTS (
  SELECT 1 FROM seasons WHERE name = 'Season 08'
);

-- Actualizar temporadas anteriores
UPDATE seasons
SET is_active = false
WHERE name != 'Season 08'; 