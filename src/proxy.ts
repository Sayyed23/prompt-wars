import { NextRequest, NextResponse } from 'next/server';
import { SECURITY_HEADERS } from '@/shared/lib/security-headers';

/**
 * Next.js Proxy (Requirements 9.5, 5.2)
 * Applies security headers, HTTPS enforcement, and rate limiting.
 *
 * Note: Rate limiting uses Redis which isn't available in Edge Runtime,
 * so rate limiting is applied at the API route level instead.
 * This middleware focuses on security headers and HTTPS redirect.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static assets and internal Next.js routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // 1. HTTPS Redirect in Production (Requirement 9.5)
  const proto = request.headers.get('x-forwarded-proto');
  if (process.env.NODE_ENV === 'production' && proto === 'http') {
    const httpsUrl = new URL(request.url);
    httpsUrl.protocol = 'https:';
    return NextResponse.redirect(httpsUrl, 301);
  }

  // 2. Apply Security Headers to all responses
  const response = NextResponse.next();

  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }

  // 3. Add request timing header for observability
  response.headers.set('X-Request-Start', Date.now().toString());

  // 4. Add session token if not present (anonymous attendee sessions)
  if (pathname.startsWith('/api/') && !request.headers.get('x-session-token')) {
    response.headers.set('X-Anonymous-Session', 'true');
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
