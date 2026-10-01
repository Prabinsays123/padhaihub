"use client";
import { useEffect, useState, useCallback } from "react";
import { supabase, slug, toast, fmt } from "@/lib/supabase";
import { Empty } from "@/components/ui";

function upload(path, file, onProgress) {
  return new Promise(async (res, rej) => {
    const { data: { session } } = await supabase.auth.getSession();
    const x = new XMLHttpRequest();
    x.open("POST", `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/notes/${path}`);
    x.setRequestHeader("Authorization", `Bearer ${session.access_token}`);
    x.setRequestHeader("apikey", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    x.setRequestHeader("Content-Type", "application/pdf");
    x.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    x.onload = () => (x.status < 300 ? res() : rej(new Error("Upload failed")));
    x.onerror = () => rej(new Error("Network error"));
    x.send(file);
  });
}
const Confirm = ({ c, close }) => c && (<div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4"><div className="rise w-full max-w-sm rounded-2xl bg-white p-6">
  <p className="font-medium">{c.title}</p><p className="mt-1 text-sm text-mute">{c.body}</p>
  <div className="mt-5 flex justify-end gap-2"><button className="btn btn-ghost" onClick={close}>Cancel</button>
  <button className="btn !bg-red-600" onClick={async () => { await c.run(); close(); }}>Delete</button></div></div></div>);

function Login() {
  const [e, setE] = useState(""), [p, setP] = useState(""), [busy, setB] = useState(false);
  const go = async (ev) => { ev.preventDefault(); setB(true);
    const { error } = await supabase.auth.signInWithPassword({ email: e, password: p });
    if (error) toast(error.message, "err"); setB(false); };
  return (<form onSubmit={go} className="card mx-auto mt-10 max-w-sm space-y-4 hover:!translate-y-0">
    <h1 className="text-xl font-semibold">Admin Login</h1>
    <input className="input" type="email" placeholder="Email" required value={e} onChange={(x) => setE(x.target.value)} />
    <input className="input" type="password" placeholder="Password" required value={p} onChange={(x) => setP(x.target.value)} />
    <button className="btn w-full" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button></form>);
}

function NoteForm({ subjects, note, reload, done }) {
  const [f, setF] = useState({ title: note?.title || "", description: note?.description || "", subject_id: note?.subject_id || "", newSub: "", published: note?.published ?? true });
  const [file, setFile] = useState(null), [pct, setPct] = useState(null);
  const set = (k, v) => setF((o) => ({ ...o, [k]: v }));
  const submit = async (ev) => { ev.preventDefault();
    try {
      let sid = f.subject_id, sname = subjects.find((s) => s.id === sid)?.name;
      if (sid === "__new") { const { data, error } = await supabase.from("subjects").insert({ name: f.newSub.trim() }).select().single(); if (error) throw error; sid = data.id; sname = data.name; }
      if (!sid) throw new Error("Choose a subject");
      if (!note && !file) throw new Error("Choose a PDF");
      let path = note?.file_path;
      if (file) { if (file.type !== "application/pdf") throw new Error("Only PDF files are allowed");
        path = `${slug(sname)}/${Date.now()}-${slug(f.title)}.pdf`; setPct(0); await upload(path, file, setPct); }
      const row = { title: f.title.trim(), description: f.description.trim() || null, subject_id: sid, file_path: path, published: f.published, updated_at: new Date().toISOString() };
      const q = note ? supabase.from("notes").update(row).eq("id", note.id) : supabase.from("notes").insert(row);
      const { error } = await q; if (error) throw error;
      if (note && file) await supabase.storage.from("notes").remove([note.file_path]);
      toast(note ? "Note updated" : "Note published 🎉"); await reload(); done();
    } catch (er) { toast(er.message, "err"); setPct(null); } };
  return (<form onSubmit={submit} className="card max-w-xl space-y-4 hover:!translate-y-0">
    <h2 className="text-lg font-semibold">{note ? "Edit Note" : "Upload New Note"}</h2>
    <select className="input" required value={f.subject_id} onChange={(e) => set("subject_id", e.target.value)}>
      <option value="">Select subject…</option>{subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}<option value="__new">+ Create new subject</option></select>
    {f.subject_id === "__new" && <input className="input" placeholder="New subject name" required value={f.newSub} onChange={(e) => set("newSub", e.target.value)} />}
    <input className="input" placeholder="Note name" required value={f.title} onChange={(e) => set("title", e.target.value)} />
    <textarea className="input" rows={3} placeholder="Description (optional)" value={f.description} onChange={(e) => set("description", e.target.value)} />
    <input className="input" type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files[0])} />
    {note && <p className="text-xs text-mute">Leave the file empty to keep the current PDF.</p>}
    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.published} onChange={(e) => set("published", e.target.checked)} /> Published (visible to students)</label>
    {pct !== null && <div className="h-2 overflow-hidden rounded-full bg-stone-200"><div className="h-full bg-brand transition-all" style={{ width: pct + "%" }} /></div>}
    <div className="flex gap-2"><button className="btn" disabled={pct !== null}>{note ? "Save changes" : "Publish Note"}</button>{note && <button type="button" className="btn btn-ghost" onClick={done}>Cancel</button>}</div></form>);
}

function Notes({ notes, subjects, reload, setEdit, setConfirm, go }) {
  const [q, setQ] = useState(""), [sf, setSf] = useState("");
  const list = notes.filter((n) => n.title.toLowerCase().includes(q.toLowerCase()) && (!sf || n.subject_id === sf));
  const del = (n) => setConfirm({ title: `Delete “${n.title}”?`, body: "The note and its PDF file will be permanently removed.", run: async () => {
    await supabase.storage.from("notes").remove([n.file_path]); const { error } = await supabase.from("notes").delete().eq("id", n.id);
    error ? toast(error.message, "err") : toast("Note deleted"); reload(); } });
  return (<div><div className="mb-4 flex flex-col gap-2 sm:flex-row"><input className="input" placeholder="Search notes…" value={q} onChange={(e) => setQ(e.target.value)} />
    <select className="input sm:max-w-48" value={sf} onChange={(e) => setSf(e.target.value)}><option value="">All subjects</option>{subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
    {list.length === 0 ? <Empty title="No notes found." sub="Upload your first note to get started."><button className="btn" onClick={() => go("upload")}>+ Upload Note</button></Empty> :
      <div className="divide-y divide-line rounded-2xl border border-line bg-white">{list.map((n) => (
        <div key={n.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="font-medium">{n.title} {!n.published && <span className="ml-1 rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-700">Draft</span>}</p>
            <p className="text-xs text-mute">{n.subjects?.name} · {fmt(n.created_at)}</p></div>
          <div className="flex gap-2"><button className="btn btn-ghost !py-1.5" onClick={() => { setEdit(n); go("upload"); }}>Edit</button><button className="btn btn-danger !py-1.5" onClick={() => del(n)}>Delete</button></div></div>))}</div>}</div>);
}

function Subjects({ subjects, notes, reload, setConfirm }) {
  const [name, setName] = useState("");
  const add = async (e) => { e.preventDefault(); const { error } = await supabase.from("subjects").insert({ name: name.trim() });
    error ? toast(error.message, "err") : (toast("Subject created"), setName(""), reload()); };
  const rename = async (s) => { const v = prompt("Rename subject", s.name); if (!v || v === s.name) return;
    const { error } = await supabase.from("subjects").update({ name: v.trim() }).eq("id", s.id); error ? toast(error.message, "err") : (toast("Renamed"), reload()); };
  const del = (s) => { const mine = notes.filter((n) => n.subject_id === s.id);
    setConfirm({ title: `Delete “${s.name}”?`, body: mine.length ? `This also deletes ${mine.length} note(s) and their PDFs.` : "This subject is empty.", run: async () => {
      if (mine.length) await supabase.storage.from("notes").remove(mine.map((n) => n.file_path));
      const { error } = await supabase.from("subjects").delete().eq("id", s.id); error ? toast(error.message, "err") : toast("Subject deleted"); reload(); } }); };
  return (<div className="max-w-xl"><form onSubmit={add} className="mb-4 flex gap-2"><input className="input" placeholder="Subject name" required value={name} onChange={(e) => setName(e.target.value)} /><button className="btn">Create</button></form>
    {subjects.length === 0 ? <Empty title="No subjects yet." sub="Create your first subject above." /> :
      <div className="divide-y divide-line rounded-2xl border border-line bg-white">{subjects.map((s) => (<div key={s.id} className="flex items-center justify-between p-4">
        <span>{s.name} <span className="text-xs text-mute">· {notes.filter((n) => n.subject_id === s.id).length} notes</span></span>
        <div className="flex gap-2"><button className="btn btn-ghost !py-1.5" onClick={() => rename(s)}>Rename</button><button className="btn btn-danger !py-1.5" onClick={() => del(s)}>Delete</button></div></div>))}</div>}</div>);
}

function Admins({ setConfirm }) {
  const [list, setL] = useState([]), [e, setE] = useState(""), [p, setP] = useState("");
  const load = useCallback(async () => { const { data } = await supabase.from("profiles").select("*").order("created_at"); setL(data || []); }, []);
  useEffect(() => { load(); }, [load]);
  const call = async (method, body) => { const { data: { session } } = await supabase.auth.getSession();
    const r = await fetch("/api/admins", { method, headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify(body) });
    const j = await r.json(); if (!r.ok) throw new Error(j.error); };
  const add = async (ev) => { ev.preventDefault(); try { await call("POST", { email: e, password: p }); toast("Admin added"); setE(""); setP(""); load(); } catch (x) { toast(x.message, "err"); } };
  return (<div className="max-w-xl"><form onSubmit={add} className="card mb-4 space-y-3 hover:!translate-y-0"><h2 className="font-semibold">Add Admin</h2>
    <input className="input" type="email" placeholder="Email" required value={e} onChange={(x) => setE(x.target.value)} />
    <input className="input" type="text" placeholder="Temporary password (8+ chars)" required minLength={8} value={p} onChange={(x) => setP(x.target.value)} />
    <button className="btn">Add Admin</button></form>
    <div className="divide-y divide-line rounded-2xl border border-line bg-white">{list.map((a) => (<div key={a.id} className="flex items-center justify-between p-4">
      <span className="text-sm">{a.email} <span className="ml-1 rounded bg-stone-100 px-1.5 py-0.5 text-xs">{a.role === "super_admin" ? "Super Admin" : "Admin"}</span></span>
      {a.role !== "super_admin" && <button className="btn btn-danger !py-1.5" onClick={() => setConfirm({ title: `Remove ${a.email}?`, body: "They will lose admin access.", run: async () => { try { await call("DELETE", { id: a.id }); toast("Admin removed"); load(); } catch (x) { toast(x.message, "err"); } } })}>Remove</button>}</div>))}</div></div>);
}

export default function Admin() {
  const [session, setSession] = useState(undefined), [me, setMe] = useState(null), [subjects, setS] = useState([]), [notes, setN] = useState([]);
  const [tab, setTab] = useState("home"), [edit, setEdit] = useState(null), [confirm, setConfirm] = useState(null);
  useEffect(() => { supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_, s) => setSession(s)); return () => data.subscription.unsubscribe(); }, []);
  const reload = useCallback(async () => {
    const [s, n] = await Promise.all([supabase.from("subjects").select("*").order("name"), supabase.from("notes").select("*,subjects(name)").order("created_at", { ascending: false })]);
    setS(s.data || []); setN(n.data || []); }, []);
  useEffect(() => { if (!session) return setMe(null);
    supabase.from("profiles").select("*").eq("id", session.user.id).maybeSingle().then(({ data }) => { setMe(data || false); if (data) reload(); }); }, [session, reload]);
  if (session === undefined) return <div className="skel h-64" />;
  if (!session) return <Login />;
  if (me === false) return <Empty title="This account is not an admin." sub="Ask the super admin to add you."><button className="btn" onClick={() => supabase.auth.signOut()}>Sign out</button></Empty>;
  if (!me) return <div className="skel h-64" />;
  const go = (t) => { if (t !== "upload") setEdit(null); setTab(t); };
  const tabs = [["home", "Overview"], ["upload", "Upload Note"], ["notes", "Manage Notes"], ["subjects", "Subjects"], ...(me.role === "super_admin" ? [["admins", "Manage Admins"]] : [])];
  return (<>
    <div className="mb-6 flex items-center justify-between"><div><h1 className="text-2xl font-semibold">Admin Dashboard</h1><p className="text-sm text-mute">Welcome back, {me.email}</p></div>
      <button className="btn btn-ghost" onClick={() => supabase.auth.signOut()}>Sign out</button></div>
    <div className="mb-8 flex gap-1 overflow-x-auto border-b border-line">{tabs.map(([k, l]) => (
      <button key={k} onClick={() => go(k)} className={`whitespace-nowrap border-b-2 px-4 py-2.5 text-sm transition ${tab === k ? "border-brand text-ink" : "border-transparent text-mute hover:text-ink"}`}>{l}</button>))}</div>
    <div key={tab} className="rise">
      {tab === "home" && (<><div className="mb-6 grid gap-4 sm:grid-cols-3">{[["Total Subjects", subjects.length], ["Total Notes", notes.length], ["Total Admins", "—"]].map(([l, v], i) => (
        <div key={l} className="card"><p className="text-sm text-mute">{l}</p><p className="mt-1 text-3xl font-semibold">{i === 2 ? <AdminCount /> : v}</p></div>))}</div>
        <div className="flex flex-wrap gap-2"><button className="btn" onClick={() => go("upload")}>+ Upload Note</button><button className="btn btn-ghost" onClick={() => go("subjects")}>+ Add Subject</button>
          <button className="btn btn-ghost" onClick={() => go("notes")}>Manage Notes</button>{me.role === "super_admin" && <button className="btn btn-ghost" onClick={() => go("admins")}>Manage Admins</button>}</div></>)}
      {tab === "upload" && <NoteForm key={edit?.id || "new"} subjects={subjects} note={edit} reload={reload} done={() => go("notes")} />}
      {tab === "notes" && <Notes {...{ notes, subjects, reload, setEdit, setConfirm, go }} />}
      {tab === "subjects" && <Subjects {...{ subjects, notes, reload, setConfirm }} />}
      {tab === "admins" && <Admins setConfirm={setConfirm} />}
    </div>
    <Confirm c={confirm} close={() => setConfirm(null)} /></>);
}
function AdminCount() { const [n, setN] = useState("…");
  useEffect(() => { supabase.from("profiles").select("id", { count: "exact", head: true }).then(({ count }) => setN(count ?? 0)); }, []); return n; }
