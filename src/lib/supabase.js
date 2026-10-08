import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

function hasValidConfiguration(url, anonKey) {
  if (!url || !anonKey || anonKey.includes("YOUR_SUPABASE")) return false;
  try {
    return new URL(url).protocol === "https:" && !url.includes("YOUR_SUPABASE");
  } catch {
    return false;
  }
}

export const isSupabaseConfigured = Boolean(
  hasValidConfiguration(supabaseUrl, supabaseAnonKey),
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
<<<<<<< HEAD
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
=======
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
>>>>>>> 493150d2c0828f1d32c652a8a8210939d5bc0637
    },
  })
  : null;
