import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
	const res = NextResponse.next();
	const supabase = createMiddlewareClient({ req, res });

	// Refresh session if expired
	const {
		data: { session },
	} = await supabase.auth.getSession();

	// If no session and trying to access protected routes, redirect to login
	if (!session && isProtectedRoute(req.nextUrl.pathname)) {
		const redirectUrl = new URL('/auth/login', req.url);
		redirectUrl.searchParams.set('redirectTo', req.nextUrl.pathname);
		return NextResponse.redirect(redirectUrl);
	}

	return res;
}

// Define protected routes
function isProtectedRoute(pathname: string): boolean {
	const protectedRoutes = ['/chat', '/insights', '/preferences', '/author'];
	return protectedRoutes.some(route => pathname.startsWith(route));
}

// Configure which routes to run middleware on
export const config = {
	matcher: [
		/*
		 * Match all request paths except:
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 * - public folder
		 * - auth routes (to prevent redirect loops)
		 */
		'/((?!_next/static|_next/image|favicon.ico|public|auth).*)',
	],
};
