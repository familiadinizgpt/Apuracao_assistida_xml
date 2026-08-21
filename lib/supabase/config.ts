export const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  'https://iwyeobqzqfrfflgddbuo.supabase.co';

// Publishable keys are intentionally safe for browser use; authorization remains in RLS.
export const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  'sb_publishable_bsHBlsU8SDgZcV2q3Q-qtQ_BMg3XgkQ';
