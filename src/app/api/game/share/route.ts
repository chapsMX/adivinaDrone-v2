import { NextResponse } from 'next/server';
import { 
  UserService,
  SeasonService,
  ShareService
} from '@/lib/database';
import { validateFarcasterId } from '@/lib/validations';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId } = body;

    console.log('Share requested for:', userId);

    // Validar userId
    const validation = validateFarcasterId(userId || '');
    if (!validation.isValid) {
      console.log('Validación fallida:', validation.errors);
      return NextResponse.json(
        { error: validation.errors[0].message },
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

    // Verificar si ya compartió hoy
    const hasShared = await ShareService.hasSharedToday(user.id, currentSeason.id);
    if (hasShared) {
      console.log('Usuario ya compartió hoy');
      return NextResponse.json(
        { error: 'Ya has compartido hoy' },
        { status: 403 }
      );
    }

    // Registrar share y dar bonus
    const share = await ShareService.create(user.id, currentSeason.id);
    await ShareService.addShareBonus(user.id, currentSeason.id);

    console.log('Share registrado y bonus otorgado');

    return NextResponse.json({
      success: true,
      message: '¡Gracias por compartir! Has recibido puntos bonus.',
      share
    });
  } catch (error) {
    console.error('Error procesando share:', error);
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

    console.log('Verificando share para:', userId);

    // Validar userId
    const validation = validateFarcasterId(userId || '');
    if (!validation.isValid) {
      console.log('Validación fallida:', validation.errors);
      return NextResponse.json(
        { error: validation.errors[0].message },
        { status: 400 }
      );
    }

    // Obtener usuario y temporada
    const [user, currentSeason] = await Promise.all([
      UserService.findByFarcasterId(userId!),
      SeasonService.getCurrentSeason()
    ]);

    if (!user || !currentSeason) {
      console.log('Usuario o temporada no encontrados');
      return NextResponse.json({ hasShared: false });
    }

    // Verificar share
    const hasShared = await ShareService.hasSharedToday(user.id, currentSeason.id);
    console.log('Estado de share:', hasShared);

    return NextResponse.json({ hasShared });
  } catch (error) {
    console.error('Error verificando share:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 