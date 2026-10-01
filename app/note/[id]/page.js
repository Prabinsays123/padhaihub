"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase, signedUrl, fmt } from "@/lib/supabase";
import { Empty } from "@/components/ui";
export default function NotePage() {
  const { id } = useParams(); const [n, setN] = useState(), [url, setUrl] = useState(), [dl, setDl] = useState(), [err, setErr] = useState(false);
  useEffect(() => { (async () => {
    const { data } = await supabase.from("notes").select("*,subjects(id,name)").eq("id", id).eq("published", true).maybeSingle();
    if (!data) return setErr(true); setN(data);
    try { setUrl(await signedUrl(data.file_path)); setDl(await signedUrl(data.file_path, data.title + ".pdf")); } catch { setErr(true); } })(); }, [id]);
  if (err) return <Empty title="This note isn't available." sub="It may have been removed." />;
  if (!n) return <div className="skel h-[70vh]" />;
  return (<>
    <Link href={`/subject/${n.subjects.id}`} className="text-sm text-mute hover:text-ink">← {n.subjects.name}</Link>
    <div className="mb-6 mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div><h1 className="text-3xl font-semibold tracking-tight">{n.title}</h1>
        {n.description && <p className="mt-2 max-w-2xl text-mute">{n.description}</p>}
        <p className="mt-2 text-xs text-mute">Added {fmt(n.created_at)}</p></div>
      <div className="flex gap-2"><a href={url} target="_blank" className="btn btn-ghost">Open full screen</a>{dl && <a href={dl} className="btn">Download</a>}</div>
    </div>
    {url ? <iframe src={url} title={n.title} className="rise h-[75vh] w-full rounded-2xl border border-line bg-white" /> : <div className="skel h-[70vh]" />}
    <p className="mt-3 text-center text-xs text-mute sm:hidden">Trouble viewing on mobile? Use “Open full screen”.</p>
  </>);
}
