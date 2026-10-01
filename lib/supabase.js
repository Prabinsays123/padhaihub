import { createClient } from "@supabase/supabase-js";
export const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
export const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
export const toast = (m, t = "ok") => window.dispatchEvent(new CustomEvent("toast", { detail: { m, t } }));
export const fmt = (d) => new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
export async function signedUrl(path, download) {
  const { data, error } = await supabase.storage.from("notes").createSignedUrl(path, 3600, download ? { download } : undefined);
  if (error) throw error; return data.signedUrl;
}
