-- Obtener el ID de la temporada 0
DO $$
DECLARE
    season_id INTEGER;
BEGIN
    -- Obtener el ID de la temporada 0
    SELECT id INTO season_id FROM seasons WHERE name = 'Season 00';
    
    -- Insertar las imágenes
    INSERT INTO images (season_id, image_number, correct_answer, option_1, option_2, option_3)
    VALUES 
        (season_id, 1, 'CDMX, MX', 'Florencia, IT', 'Mendoza, AR', 'Tuxtla'),    
        (season_id, 2, 'CDMX, MX', 'Madrid, ES', 'Turin, IT', 'Tuxtla Gutierrez'),
        (season_id, 3, 'Veracrúz, MX', 'Los Cabos', 'Florencia, IT', 'Navojoa'),
        (season_id, 4, 'Buenos Aires, AR', 'Puerto Vallarta', 'Madrid, ES', 'Zapotitlan'),
        (season_id, 5, 'Buenos Aires, AR', 'Zapotitlan', 'Florencia, IT', 'Guasave'),
        (season_id, 6, 'Buenos Aires, AR', 'Asuncion', 'Madrid, ES', 'Los Mochis'),
        (season_id, 7, 'CDMX, MX', 'San Miguel', 'Los Cabos', 'Culiacan'),
        (season_id, 8, 'CDMX, MX', 'Hermosillo', 'Puerto Vallarta', 'Cordoba'),
        (season_id, 9, 'CDMX, MX', 'Toluca', 'Zapotitlan', 'Asuncion'),
        (season_id, 10, 'Can Cun, MX', 'Mendoza, AR', 'Madrid, ES', 'San Miguel'),
        (season_id, 11, 'CDMX, MX', 'Turin, IT', 'Los Cabos', 'Hermosillo'),
        (season_id, 12, 'CDMX, MX', 'Florencia, IT', 'Puerto Vallarta', 'Florencia, IT'),
        (season_id, 13, 'CDMX, MX', 'Madrid, ES', 'Zapotitlan', 'Madrid, ES'),
        (season_id, 14, 'Salta, AR', 'Los Cabos', 'Florencia, IT', 'Los Cabos'),
        (season_id, 15, 'Colonia, UR', 'Puerto Vallarta', 'Madrid, ES', 'Puerto Vallarta'),
        (season_id, 16, 'Colonia, UR', 'Zapotitlan', 'Los Cabos', 'Zapotitlan'),
        (season_id, 17, 'Colonia, UR', 'Guasave', 'Puerto Vallarta', 'Florencia, IT'),
        (season_id, 18, 'CDMX, MX', 'Los Mochis', 'Zapotitlan', 'Madrid, ES'),
        (season_id, 19, 'Acapulco, MX', 'Culiacan', 'Arlington, TX', 'Los Cabos'),
        (season_id, 20, 'CDMX, MX', 'Sinaloa', 'Miami, US', 'Puerto Vallarta'),
        (season_id, 21, 'Tulum, MX', 'Santiago, CL', 'Texas', 'Zapotitlan'),
        (season_id, 22, 'CDMX, MX', 'Viña del Mar, CL', 'Colorado', 'Arkansas, US'),
        (season_id, 23, 'Manhattan, US', 'Peñasquito', 'Puerto Vallarta', 'Yellowstone, US'),
        (season_id, 24, 'Philadelphia, US', 'Aguascalientes', 'Zapotitlan', 'El Bronks'),
        (season_id, 25, 'Manhattan, US', 'San Cristobal', 'Guasave', 'Cordoba'),
        (season_id, 26, 'Buenos Aires, AR', 'Tuxtla', 'Los Mochis', 'Asuncion'),
        (season_id, 27, 'Manhattan, US', 'Tuxtla Gutierrez', 'Culiacan', 'San Miguel'),
        (season_id, 28, 'Malaga, ES', 'Navojoa', 'Guasave', 'Hermosillo'),
        (season_id, 29, 'Barcelona, ES', 'Puerto Vallarta', 'Los Mochis', 'Tuxtla'),
        (season_id, 30, 'Barcelona, ES', 'Zapotitlan', 'Denver, US', 'Tuxtla Gutierrez'),
        (season_id, 31, 'Milano, IT', 'Guasave', 'Maine, US', 'Navojoa'),
        (season_id, 32, 'Milano, IT', 'Los Mochis', 'Murano, IT', 'Lisboa, PT'),
        (season_id, 33, 'Milano, IT', 'Culiacan', 'Florencia, IT', 'Rome, IT'),
        (season_id, 34, 'Bruge, BE', 'Florencia, IT', 'Sicily, IT', 'Bruxels, BE'),
        (season_id, 35, 'Bruge, BE', 'Madrid, ES', 'Los Cabos', 'Lisbon'),
        (season_id, 36, 'Marfa, US', 'Los Cabos', 'Puerto Vallarta', 'Maravatio, MX'),
        (season_id, 37, 'Can Cun, MX', 'Puerto Vallarta', 'Zapotitlan', 'Guasave'),
        (season_id, 38, 'Venice Beach, US', 'Zapotitlan', 'Guasave', 'Los Mochis'),
        (season_id, 39, 'CDMX, MX', 'Cordoba', 'Los Mochis', 'Florencia, IT'),
        (season_id, 40, 'Lisbon, PT', 'Guasave', 'Culiacan', 'Madrid, ES'),
        (season_id, 41, 'Lisbon, PT', 'Los Mochis', 'Sinaloa', 'Los Cabos'),
        (season_id, 42, 'Lisbon, PT', 'Hermosillo', 'Bucios, BR', 'Puerto Vallarta'),
        (season_id, 43, 'Nayarit, MX', 'Guasave', 'Sao Paulo, BR', 'Montevideo, UR');
END $$; 