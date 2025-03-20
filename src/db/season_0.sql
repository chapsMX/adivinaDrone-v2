-- Insertar temporada 0 (pruebas)
INSERT INTO seasons (name, start_date, end_date, is_active)
VALUES (
    'Season 00',
    CURRENT_DATE,  -- Inicia hoy
    CURRENT_DATE + INTERVAL '7 days',  -- Dura una semana
    true  -- Activa inmediatamente
); 