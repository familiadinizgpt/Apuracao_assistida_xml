import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { WEBAPP_SLUG } from '@/lib/access';
import { supabasePublishableKey, supabaseUrl } from '@/lib/supabase/config';

function redirectWithCookies(request: NextRequest, response: NextResponse, path: string) {
  const redirectResponse = NextResponse.redirect(new URL(path, request.url));
  response.cookies.getAll().forEach((cookie) => redirectResponse.cookies.set(cookie));
  return redirectResponse;
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (claimsError || typeof userId !== 'string') {
    return redirectWithCookies(
      request,
      response,
      `/acesso?retorno=${encodeURIComponent(request.nextUrl.pathname)}`,
    );
  }

  const { data, error } = await supabase
    .from('webapp_entitlements')
    .select('id')
    .eq('user_id', userId)
    .eq('webapp_slug', WEBAPP_SLUG)
    .in('status', ['active', 'trialing'])
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .limit(1);

  if (error || !data?.length) {
    return redirectWithCookies(request, response, '/acesso?erro=sem-acesso');
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!acesso|auth/callback|_next/static|_next/image|favicon.ico|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
