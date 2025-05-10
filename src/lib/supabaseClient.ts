// src/lib/supabaseClient.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL and Anon Key are required.");
  // Or handle this more gracefully, perhaps redirecting to an error page
  // or logging a more user-friendly message.
  // For development, throwing an error quickly highlights misconfiguration.
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
