import { createClient } from "@supabase/supabase-js";
const svc = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function superCaller(req) {
  const a = svc(); const t = (req.headers.get("authorization") || "").replace("Bearer ", "");
  const { data: { user } } = await a.auth.getUser(t); if (!user) return null;
  const { data: p } = await a.from("profiles").select("role").eq("id", user.id).maybeSingle();
  return p?.role === "super_admin" ? a : null;
}
const no = () => Response.json({ error: "Forbidden" }, { status: 403 });
export async function POST(req) {
  const a = await superCaller(req); if (!a) return no();
  const { email, password } = await req.json();
  if (!email || !password || password.length < 8) return Response.json({ error: "Email and a password of 8+ characters are required." }, { status: 400 });
  const { data, error } = await a.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) return Response.json({ error: error.message }, { status: 400 });
  await a.from("profiles").upsert({ id: data.user.id, email, role: "admin" });
  return Response.json({ ok: true });
}
export async function DELETE(req) {
  const a = await superCaller(req); if (!a) return no();
  const { id } = await req.json();
  const { data: p } = await a.from("profiles").select("role").eq("id", id).maybeSingle();
  if (!p || p.role === "super_admin") return Response.json({ error: "The super admin cannot be removed." }, { status: 400 });
  const { error } = await a.auth.admin.deleteUser(id);
  return error ? Response.json({ error: error.message }, { status: 400 }) : Response.json({ ok: true });
}
