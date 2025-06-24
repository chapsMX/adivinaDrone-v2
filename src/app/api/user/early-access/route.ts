import { NextResponse } from 'next/server';
import { UserService } from '@/lib/database';
import { validateFarcasterId } from '@/lib/validations';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, username } = body;

    console.log('Early access requested for:', { userId, username });

    // Validar userId
    const validation = validateFarcasterId(userId || '');
    if (!validation.isValid) {
      console.log('Validación fallida:', validation.errors);
      return NextResponse.json(
        { error: validation.errors[0].message },
        { status: 400 }
      );
    }

    // Mantener compatibilidad pero sin activar early access
    const user = await UserService.createOrUpdate({
      farcaster_id: userId,
      username,
      early_access_requested: false,  // Siempre false
      is_whitelisted: false          // Siempre false
    });

    console.log('Usuario actualizado:', user);

    // Retornar respuesta exitosa pero sin activar early access
    return NextResponse.json({
      early_access_requested: false,
      is_whitelisted: false
    });
  } catch (error) {
    console.error('Error procesando early access:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 