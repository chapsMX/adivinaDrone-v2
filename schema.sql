-- Eliminar funciones si existen (para evitar errores en re-ejecución)
DROP FUNCTION IF EXISTS get_random_unseen_images(INTEGER, INTEGER);
DROP FUNCTION IF EXISTS calculate_points(INTEGER, BOOLEAN);

-- Eliminar tablas si existen (para evitar errores en re-ejecución)
DROP TABLE IF EXISTS shares;
DROP TABLE IF EXISTS season_points;
DROP TABLE IF EXISTS extra_lives;
DROP TABLE IF EXISTS user_responses;
DROP TABLE IF EXISTS user_seen_images;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS images;
DROP TABLE IF EXISTS seasons;

-- 1. Crear tablas
CREATE TABLE seasons (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT false,
    is_early_access BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE images (
    id SERIAL PRIMARY KEY,
    season_id INTEGER REFERENCES seasons(id),
    image_number INTEGER NOT NULL,
    correct_answer VARCHAR(100) NOT NULL,
    option_1 VARCHAR(100) NOT NULL,
    option_2 VARCHAR(100) NOT NULL,
    option_3 VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(season_id, image_number)
);

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    farcaster_id VARCHAR(50) NOT NULL UNIQUE,
    username VARCHAR(50),
    early_access_requested BOOLEAN DEFAULT false,
    is_whitelisted BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_seen_images (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    image_id INTEGER REFERENCES images(id),
    season_id INTEGER REFERENCES seasons(id),
    seen_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, image_id)
);

CREATE TABLE user_responses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    image_id INTEGER REFERENCES images(id),
    selected_answer VARCHAR(100) NOT NULL,
    is_correct BOOLEAN NOT NULL,
    response_time INTEGER NOT NULL,
    points_earned INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE extra_lives (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    season_id INTEGER REFERENCES seasons(id),
    transaction_hash VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE season_points (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    season_id INTEGER REFERENCES seasons(id),
    total_points INTEGER DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, season_id)
);

CREATE TABLE shares (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    season_id INTEGER REFERENCES seasons(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Crear índices
CREATE INDEX idx_images_season ON images(season_id);
CREATE INDEX idx_user_responses_user ON user_responses(user_id);
CREATE INDEX idx_user_responses_image ON user_responses(image_id);
CREATE INDEX idx_user_seen_images_user ON user_seen_images(user_id);
CREATE INDEX idx_user_seen_images_image ON user_seen_images(image_id);
CREATE INDEX idx_extra_lives_user ON extra_lives(user_id);
CREATE INDEX idx_extra_lives_season ON extra_lives(season_id);
CREATE INDEX idx_season_points_user ON season_points(user_id);
CREATE INDEX idx_season_points_season ON season_points(season_id);

-- 3. Crear funciones
CREATE OR REPLACE FUNCTION get_random_unseen_images(
    p_user_id INTEGER,
    p_season_id INTEGER
) RETURNS TABLE (
    image_id INTEGER,
    correct_answer VARCHAR,
    option_1 VARCHAR,
    option_2 VARCHAR,
    option_3 VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.id,
        i.correct_answer,
        i.option_1,
        i.option_2,
        i.option_3
    FROM images i
    WHERE i.season_id = p_season_id
    AND NOT EXISTS (
        SELECT 1 FROM user_seen_images usi
        WHERE usi.user_id = p_user_id
        AND usi.image_id = i.id
    )
    ORDER BY RANDOM()
    LIMIT 3;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION calculate_points(
    p_response_time INTEGER,
    p_is_correct BOOLEAN
) RETURNS INTEGER AS $$
BEGIN
    IF NOT p_is_correct THEN
        RETURN 0;
    END IF;
    
    -- 90 segundos = 1 punto
    -- 45 segundos = 2 puntos
    -- 30 segundos = 3 puntos
    -- 15 segundos = 4 puntos
    -- 5 segundos = 5 puntos
    IF p_response_time <= 5 THEN
        RETURN 5;
    ELSIF p_response_time <= 15 THEN
        RETURN 4;
    ELSIF p_response_time <= 30 THEN
        RETURN 3;
    ELSIF p_response_time <= 45 THEN
        RETURN 2;
    ELSE
        RETURN 1;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 4. Insertar temporada inicial (Season 07)
INSERT INTO seasons (name, start_date, end_date, is_active)
VALUES (
    'Season 07',
    '2024-04-01',
    '2024-04-30',
    false
);