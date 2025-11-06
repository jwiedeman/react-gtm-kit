import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { DEFAULT_CONSENT } from './lib/gtm';
import { CONSENT_COOKIE_NAME, serializeConsentCookie } from './lib/consent-cookie';

const CONSENT_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  const hasConsentCookie = request.cookies.has(CONSENT_COOKIE_NAME);
  if (!hasConsentCookie) {
    response.cookies.set({
      name: CONSENT_COOKIE_NAME,
      value: encodeURIComponent(serializeConsentCookie(DEFAULT_CONSENT)),
      httpOnly: false,
      sameSite: 'lax',
      secure: request.nextUrl.protocol === 'https:',
      path: '/',
      maxAge: CONSENT_COOKIE_MAX_AGE
    });
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
};
