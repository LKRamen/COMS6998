import { createClient, supabaseConfig } from "./supabase/server";
export type VisitCount = { country_code: string; visitor_count: number };
export async function getCommunityVisits(): Promise<VisitCount[]> {
  const { url, key } = supabaseConfig();
  const response = await fetch(new URL("/rest/v1/rpc/community_country_visits", url), {
    method: "POST", headers: { apikey: key, "Content-Type": "application/json" }, body: "{}", cache: "no-store",
  });
  if (!response.ok) throw new Error("The community map could not be loaded.");
  return await response.json() as VisitCount[];
}
export async function getMyVisits(supabase: Awaited<ReturnType<typeof createClient>>, userId: string): Promise<string[]> {
  const { data, error } = await supabase.from("country_visits").select("country_code").eq("user_id", userId);
  if (error) throw new Error("Your travel list could not be loaded.");
  return (data ?? []).map(row => row.country_code as string);
}
