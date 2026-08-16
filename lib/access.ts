import { createServerSupabaseClient } from '@/lib/supabase/server';

export const WEBAPP_SLUG = 'apuracao-assistida-xml';

type EntitlementRow = {
  source_type: 'admin' | 'subscription' | 'payment' | 'manual';
  plan_id: string | null;
  xml_limit: number | null;
};

export type AccessSummary = {
  hasAccess: boolean;
  label: string;
  xmlLimit: number | null;
};

const noAccess: AccessSummary = {
  hasAccess: false,
  label: 'Acesso não liberado',
  xmlLimit: 0,
};

export async function getAccessSummary(): Promise<AccessSummary> {
  const supabase = await createServerSupabaseClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (claimsError || typeof userId !== 'string') return noAccess;

  const { data, error } = await supabase
    .from('webapp_entitlements')
    .select('source_type,plan_id,xml_limit')
    .eq('user_id', userId)
    .eq('webapp_slug', WEBAPP_SLUG)
    .in('status', ['active', 'trialing'])
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);

  if (error || !data?.length) return noAccess;

  const entitlements = data as EntitlementRow[];
  if (entitlements.some((item) => item.source_type === 'admin')) {
    return { hasAccess: true, label: 'Administrador', xmlLimit: null };
  }

  if (entitlements.some((item) => item.xml_limit === null)) {
    return { hasAccess: true, label: 'Acima de 1.000 XML/mês', xmlLimit: null };
  }

  const xmlLimit = Math.max(...entitlements.map((item) => item.xml_limit ?? 0));
  return {
    hasAccess: true,
    label: xmlLimit <= 100 ? 'Até 100 XML/mês' : 'Até 1.000 XML/mês',
    xmlLimit,
  };
}
