import { createClient } from "@supabase/supabase-js";

/** Service role client for webhooks and server-side operations (bypasses RLS). */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      db: { schema: "zapcomanda" },
    }
  );
}
