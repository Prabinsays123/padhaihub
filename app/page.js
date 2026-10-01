"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Empty, Skeleton, NoteCard } from "@/components/ui";
export default function Home() {
  const [subjects, setS] = useState(null), [notes, setN] = useState([]), [q, setQ] = useState("");
  useEffect(() => { (async () => {
    const [s, n] = await Promise.all([
      supabase.from("subjects").select("id,name,notes(count)").order("name"),
      supabase.from("notes").select("id,title,created_at,subject_id,subjects(name)").eq("published", true).order("created_at", { ascending: false })]);
    setS(s.data || []); setN(n.data || []); })(); }, []);
  const k = q.trim().toLowerCase();
  const sm = (subjects || []).filter((s) => s.name.toLowerCase().includes(k));
  const nm = notes.filter((n) => n.title.toLowerCase().includes(k) || n.subjects?.name.toLowerCase().includes(k));
  return (<>
    <section className="py-8 text-center sm:py-14">
      <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">Padhai, organized.</h1>
      <p className="mx-auto mt-4 max-w-xl text-mute">Find your notes, subjects and study materials in one place.</p>
      <div id="search" className="mx-auto mt-8 max-w-lg"><input className="input !rounded-full !py-3.5 px-5 shadow-sm" placeholder="Search notes or subjects…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      {!k && <a href="#subjects" className="btn mt-5">Explore Notes</a>}
    </section>
    {k ? (<section className="rise"><h2 className="mb-4 text-lg font-semibold">Results for “{q}”</h2>
      {sm.length + nm.length === 0 ? <Empty title="Nothing found." sub="Try a different keyword." /> : (<>
        <div className="mb-4 flex flex-wrap gap-2">{sm.map((s) => <Link key={s.id} href={`/subject/${s.id}`} className="rounded-full border border-line bg-white px-4 py-1.5 text-sm hover:border-brand">{s.name}</Link>)}</div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{nm.map((n) => <NoteCard key={n.id} n={n} />)}</div></>)}</section>) : (<>
      <section id="subjects" className="scroll-mt-24"><h2 className="mb-5 text-xl font-semibold">Explore Subjects</h2>
        {!subjects ? <Skeleton /> : subjects.length === 0 ? <Empty title="No subjects yet." /> :
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{subjects.map((s) => (
            <Link key={s.id} href={`/subject/${s.id}`} className="card group flex items-center justify-between">
              <div><p className="text-lg font-medium">{s.name}</p><p className="mt-1 text-sm text-mute">{s.notes[0]?.count || 0} notes</p></div>
              <span className="text-mute transition group-hover:translate-x-1 group-hover:text-brand">→</span></Link>))}</div>}
      </section>
      <section className="mt-14"><h2 className="mb-5 text-xl font-semibold">Recently Added</h2>
        {!subjects ? <Skeleton n={3} /> : notes.length === 0 ? <Empty /> :
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{notes.slice(0, 6).map((n) => <NoteCard key={n.id} n={n} />)}</div>}
      </section></>)}
  </>);
}
