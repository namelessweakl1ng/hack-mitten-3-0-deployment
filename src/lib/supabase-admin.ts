import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

export function hasSupabaseStorageConfig(): boolean {
  return Boolean(supabaseUrl && supabaseSecretKey);
}

export const supabaseAdmin = hasSupabaseStorageConfig()
  ? createClient(supabaseUrl!, supabaseSecretKey!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

export function assertSupabaseStorageConfigured(): void {
  if (!hasSupabaseStorageConfig()) {
    throw new Error("SUPABASE_URL and SUPABASE_SECRET_KEY must be configured for Supabase Storage");
  }
}
