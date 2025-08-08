import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const cookieStore = await cookies();
    
    // Eliminar todas las cookies de sesión
    const response = NextResponse.json({ 
      success: true, 
      message: 'Sesiones eliminadas exitosamente' 
    });
    
    // Eliminar cookie de sesión
    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // Expires immediately
      path: '/'
    });
    
    // También eliminar session si existe
    response.cookies.set('session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // Expires immediately
      path: '/'
    });
    
    // También eliminar cualquier otra cookie relacionada
    response.cookies.set('next-auth.session-token', '', {
      maxAge: 0,
      path: '/'
    });
    
    return response;
  } catch (error) {
    console.error('Error clearing sessions:', error);
    return NextResponse.json(
      { error: 'Failed to clear sessions' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get('auth-token');
    const sessionCookie = cookieStore.get('session');
    
    return NextResponse.json({
      hasAuthToken: !!authToken,
      hasSession: !!sessionCookie,
      authTokenValue: authToken?.value ? 'EXISTS' : 'NO_TOKEN',
      sessionValue: sessionCookie?.value ? 'EXISTS' : 'NO_SESSION',
      allCookies: [...cookieStore.getAll()].map(c => ({ name: c.name, hasValue: !!c.value }))
    });
  } catch (error) {
    console.error('Error checking session:', error);
    return NextResponse.json(
      { error: 'Failed to check session' },
      { status: 500 }
    );
  }
}
