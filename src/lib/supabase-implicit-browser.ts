import { createClient as createSupabaseClient } from "@supabase/supabase-js";

let implicitClient: ReturnType<typeof createSupabaseClient> | null = null;

export function createImplicitClient() {
  if (implicitClient) {
    return implicitClient;
  }

  implicitClient = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        flowType: "implicit",
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true,
        storageKey: "poolr-implicit-session",
      },
    }
  );

  return implicitClient;
}
