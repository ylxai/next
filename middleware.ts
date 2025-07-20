import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'; 
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  
  const { data: { session } } = await supabase.auth.getSession();
  
  if (req.nextUrl.pathname.startsWith('/admin')) {
    // Jika tidak ada session, redirect ke login
    if (!session) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
    
    // Periksa apakah user adalah admin
    const { data: userData, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();
    
    // Jika bukan admin atau error, redirect ke login
    if (error || !userData || userData.role !== 'admin') {
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }
  
  return res;
}

export const config = {
  matcher: ['/admin/:path*', '/event/:path*'],
}; 