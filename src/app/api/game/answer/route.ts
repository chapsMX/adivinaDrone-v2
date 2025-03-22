import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, imageId, seasonId, answer, timeLeft } = body;

    if (!userId || !imageId || !seasonId || !answer || timeLeft === undefined) {
      console.log('Faltan parámetros:', { userId, imageId, seasonId, answer, timeLeft });
      return NextResponse.json(
        { error: 'Faltan parámetros requeridos' },
        { status: 400 }
      );
    }

    console.log('Procesando respuesta:', { userId, imageId, seasonId, answer, timeLeft });

    // Obtener el ID real de la temporada
    const seasonResult = await sql`
      SELECT id FROM seasons WHERE name = 'Season 00';
    `;

    if (seasonResult.length === 0) {
      console.log('No se encontró la temporada Season 00');
      return NextResponse.json(
        { error: 'Temporada no encontrada' },
        { status: 404 }
      );
    }

    const realSeasonId = seasonResult[0].id;
    console.log('ID real de la temporada:', realSeasonId);

    // Verificar si el usuario existe y crearlo si no existe
    const userResult = await sql`
      INSERT INTO users (farcaster_id)
      VALUES (${userId})
      ON CONFLICT (farcaster_id) DO UPDATE
      SET farcaster_id = EXCLUDED.farcaster_id
      RETURNING id;
    `;

    if (!userResult || userResult.length === 0) {
      console.log('Error al obtener/crear usuario');
      return NextResponse.json(
        { error: 'Error al procesar usuario' },
        { status: 500 }
      );
    }

    const realUserId = userResult[0].id;
    console.log('ID real del usuario:', realUserId);

    // Obtener la respuesta correcta
    const imageResult = await sql`
      SELECT correct_answer
      FROM images
      WHERE id = ${imageId}
      AND season_id = ${realSeasonId};
    `;

    if (imageResult.length === 0) {
      console.log('Imagen no encontrada:', { imageId, realSeasonId });
      return NextResponse.json(
        { error: 'Imagen no encontrada' },
        { status: 404 }
      );
    }

    const isCorrect = imageResult[0].correct_answer === answer;
    console.log('Resultado:', { isCorrect, correctAnswer: imageResult[0].correct_answer });

    // Marcar la imagen como vista
    await sql`
      INSERT INTO user_seen_images (user_id, image_id, season_id)
      VALUES (${realUserId}, ${imageId}, ${realSeasonId})
      ON CONFLICT (user_id, image_id) DO NOTHING;
    `;
    console.log('Imagen marcada como vista');

    // Guardar la respuesta del usuario
    const points = isCorrect ? timeLeft * 100 : 0; // Puntos basados en el tiempo restante
    const responseResult = await sql`
      INSERT INTO user_responses (
        user_id, 
        image_id, 
        selected_answer, 
        is_correct,
        response_time,
        points_earned
      )
      VALUES (
        ${realUserId}, 
        ${imageId}, 
        ${answer}, 
        ${isCorrect},
        ${90 - timeLeft},
        ${points}
      )
      RETURNING *;
    `;
    console.log('Respuesta guardada:', responseResult);

    // Calcular y guardar los puntos si la respuesta es correcta
    if (isCorrect) {
      try {
        // Primero verificar si ya existe un registro
        const existingPoints = await sql`
          SELECT * FROM season_points 
          WHERE user_id = ${realUserId} 
          AND season_id = ${realSeasonId};
        `;
        console.log('Puntos existentes:', existingPoints);

        if (existingPoints.length === 0) {
          // Si no existe, crear nuevo registro
          const insertResult = await sql`
            INSERT INTO season_points (user_id, season_id, total_points)
            VALUES (${realUserId}, ${realSeasonId}, ${points})
            ON CONFLICT (user_id, season_id) 
            DO UPDATE SET 
              total_points = EXCLUDED.total_points,
              last_updated = CURRENT_TIMESTAMP
            RETURNING *;
          `;
          console.log('Nuevo registro de puntos:', insertResult);
        } else {
          // Si existe, actualizar
          const updateResult = await sql`
            UPDATE season_points 
            SET total_points = total_points + ${points},
                last_updated = CURRENT_TIMESTAMP
            WHERE user_id = ${realUserId} 
            AND season_id = ${realSeasonId}
            RETURNING *;
          `;
          console.log('Puntos actualizados:', updateResult);
        }
      } catch (error) {
        console.error('Error al guardar puntos:', error);
        // No lanzamos el error aquí, solo lo registramos
      }
    }

    return NextResponse.json({
      isCorrect,
      correctAnswer: imageResult[0].correct_answer,
      userAnswer: answer
    });
  } catch (error) {
    console.error('Error procesando respuesta:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 