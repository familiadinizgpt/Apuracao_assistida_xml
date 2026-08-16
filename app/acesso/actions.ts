'use server';

import { redirect } from 'next/navigation';
import { WEBAPP_SLUG } from '@/lib/access';
import { createServerSupabaseClient } from '@/lib/supabase/server';

function safeReturnTo(value: FormDataEntryValue | null) {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//')
    ? value
    : '/';
}

async function hasEntitlement(userId: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('webapp_entitlements')
    .select('id')
    .eq('user_id', userId)
    .eq('webapp_slug', WEBAPP_SLUG)
    .eq('source_type', 'admin')
    .in('status', ['active', 'trialing'])
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .limit(1);

  return !error && Boolean(data?.length);
}

export async function adminSignIn(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');
  const returnTo = safeReturnTo(formData.get('returnTo'));

  if (!email || password.length < 8) redirect('/acesso?erro=credenciais');

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) redirect('/acesso?erro=credenciais');

  if (!(await hasEntitlement(data.user.id))) {
    await supabase.auth.signOut();
    redirect('/acesso?erro=sem-acesso');
  }

  redirect(returnTo);
}

export async function requestClientAccess(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  if (!email || !email.includes('@')) redirect('/acesso?erro=email');

  const appCallback = 'https://apuracao-assistida-xml.vercel.app/auth/callback';
  const hubCallback = new URL('https://consultordoagro.com.br/auth/callback');
  hubCallback.searchParams.set('next', appCallback);

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: hubCallback.toString(),
      shouldCreateUser: true,
    },
  });

  if (error) redirect('/acesso?erro=envio');
  redirect('/acesso?mensagem=link-enviado');
}

export async function logoutAction() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect('/acesso?mensagem=saiu');
}
