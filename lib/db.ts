import "server-only";
import { createClient } from "@supabase/supabase-js";

// Client admin : utilise la service_role key, bypass RLS.
// Ne JAMAIS importer ce fichier depuis un composant client.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);