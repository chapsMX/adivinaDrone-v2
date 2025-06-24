import { NextResponse } from 'next/server';
import { 
  UserService,
  SeasonService,
  ExtraLifeService
} from '@/lib/database';
import { 
  validateFarcasterId,
  validateTransactionHash
} from '@/lib/validations';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, transactionHash } = body;

    console.log('Extra life requested:', { userId, transactionHash });

    // Validar userId
    const userValidation = validateFarcasterId(userId || '');
    if (!userValidation.isValid) {
      console.log('Validación de usuario fallida:', userValidation.errors);
      return NextResponse.json(
        { error: userValidation.errors[0].message },
        { status: 400 }
      );
    }

    // Validar hash de transacción
    const hashValidation = validateTransactionHash(transactionHash || '');
    if (!hashValidation.isValid) {
      console.log('Validación de transacción fallida:', hashValidation.errors);
      return NextResponse.json(
        { error: hashValidation.errors[0].message },
        { status: 400 }
      );
    }

    // Obtener temporada actual
    const currentSeason = await SeasonService.getCurrentSeason();
    if (!currentSeason) {
      const status = await SeasonService.getSeasonStatus(
        (await SeasonService.getAll({ limit: 1 }))[0]?.id || 0
      );
      return NextResponse.json(
        { 
          error: status.message || 'No hay temporada activa',
          seasonStatus: status.status
        },
        { status: 403 }
      );
    }

    // Obtener usuario
    const user = await UserService.findByFarcasterId(userId);
    if (!user) {
      console.log('Usuario no encontrado');
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Verificar si ya tiene vida extra hoy
    const hasExtraLife = await ExtraLifeService.hasExtraLifeToday(user.id);
    if (hasExtraLife) {
      console.log('Usuario ya tiene vida extra hoy');
      return NextResponse.json(
        { error: 'Ya has comprado una vida extra hoy' },
        { status: 403 }
      );
    }

    // Crear vida extra
    const extraLife = await ExtraLifeService.create(
      user.id,
      currentSeason.id,
      transactionHash
    );

    console.log('Vida extra creada:', extraLife);

    return NextResponse.json({
      success: true,
      message: '¡Vida extra activada! Tienes un intento adicional.',
      extraLife
    });
  } catch (error) {
    console.error('Error procesando vida extra:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    console.log('Verificando vida extra para:', userId);

    // Validar userId
    const validation = validateFarcasterId(userId || '');
    if (!validation.isValid) {
      console.log('Validación fallida:', validation.errors);
      return NextResponse.json(
        { error: validation.errors[0].message },
        { status: 400 }
      );
    }

    // Obtener usuario
    const user = await UserService.findByFarcasterId(userId!);
    if (!user) {
      console.log('Usuario no encontrado');
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Verificar vida extra
    const hasExtraLife = await ExtraLifeService.hasExtraLifeToday(user.id);
    console.log('Estado de vida extra:', hasExtraLife);

    return NextResponse.json({ hasExtraLife });
  } catch (error) {
    console.error('Error verificando vida extra:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 