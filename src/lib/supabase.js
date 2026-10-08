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
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  })
  : null;
