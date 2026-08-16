import { NextResponse } from 'next/server';
import { WEBAPP_SLUG } from '@/lib/access';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');

  if (code) {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      const { data: access } = await supabase
        .from('webapp_entitlements')
        .select('id')
        .eq('user_id', data.user.id)
        .eq('webapp_slug', WEBAPP_SLUG)
        .in('status', ['active', 'trialing'])
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
        .limit(1);

      if (access?.length) return NextResponse.redirect(new URL('/', url.origin));
      await supabase.auth.signOut();
      return NextResponse.redirect(new URL('/acesso?erro=sem-acesso', url.origin));
    }
  }

  return NextResponse.redirect(new URL('/acesso?erro=callback', url.origin));
}
