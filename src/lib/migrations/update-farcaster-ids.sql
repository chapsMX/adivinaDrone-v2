-- Actualizar los registros existentes con un Farcaster ID temporal basado en su ID
UPDATE users
SET farcaster_id = CAST(id AS VARCHAR)
WHERE farcaster_id IS NULL;

-- Verificar que no haya registros sin farcaster_id
SELECT COUNT(*) as missing_fids
FROM users
WHERE farcaster_id IS NULL; 