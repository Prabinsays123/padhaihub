"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Empty, Skeleton, NoteCard } from "@/components/ui";
export default function SubjectPage() {
  const { id } = useParams(); const [sub, setSub] = useState(), [notes, setN] = useState(null);
  useEffect(() => { (async () => {
    const [s, n] = await Promise.all([supabase.from("subjects").select("*").eq("id", id).maybeSingle(),
      supabase.from("notes").select("id,title,created_at,subjects(name)").eq("subject_id", id).eq("published", true).order("created_at", { ascending: false })]);
    setSub(s.data || null); setN(n.data || []); })(); }, [id]);
  return (<>
    <Link href="/" className="text-sm text-mute hover:text-ink">← All subjects</Link>
    <h1 className="mb-8 mt-3 text-3xl font-semibold uppercase tracking-tight">{sub?.name || (notes ? "Subject not found" : "")}</h1>
    {!notes ? <Skeleton n={3} /> : notes.length === 0 ? <Empty /> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{notes.map((n) => <NoteCard key={n.id} n={n} />)}</div>}
  </>);
}
