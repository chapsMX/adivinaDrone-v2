import { NextResponse } from 'next/server';
import { UserService } from '@/lib/database';
import { validateFarcasterId } from '@/lib/validations';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    console.log('Status check requested for user:', userId);

    const validation = validateFarcasterId(userId || '');
    if (!validation.isValid) {
      console.log('Validación fallida:', validation.errors);
      return NextResponse.json(
        { error: validation.errors[0].message },
        { status: 400 }
      );
    }

    const user = await UserService.findByFarcasterId(userId!);
    console.log('Database query result:', user);

    if (!user) {
      console.log('No user found, returning default values');
      return NextResponse.json({
        early_access_requested: false,
        is_whitelisted: false
      });
    }

    console.log('Returning user status:', {
      early_access_requested: user.early_access_requested,
      is_whitelisted: user.is_whitelisted
    });

    return NextResponse.json({
      early_access_requested: user.early_access_requested,
      is_whitelisted: user.is_whitelisted
    });
  } catch (error) {
    console.error('Error checking user status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 