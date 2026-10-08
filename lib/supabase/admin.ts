import "server-only";
import { createClient } from "@supabase/supabase-js";
import { supabaseConfig } from "./server";
export function createAdminClient() {
 const { url } = supabaseConfig();
 const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
 if (!key) throw new Error("Photo uploads and generation are not configured yet. Please try again later.");
 return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
