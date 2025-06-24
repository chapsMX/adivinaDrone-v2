import { NextResponse } from 'next/server';
import { UserService } from '@/lib/database';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    console.log('Status check requested for user:', username);

    try {
      // Intentar encontrar o crear el usuario
      const user = await UserService.createOrUpdate({
        username: username || 'Anónimo'
      });
      console.log('User found/created:', user);

      return NextResponse.json({
        exists: true
      });
    } catch (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error checking user status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 