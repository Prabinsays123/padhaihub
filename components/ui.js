import Link from "next/link";
import { fmt } from "@/lib/supabase";
export const Empty = ({ title = "No notes here yet.", sub = "New study material will appear here soon.", children }) => (
  <div className="rise rounded-2xl border border-dashed border-line py-16 text-center"><p className="font-medium">{title}</p><p className="mt-1 text-sm text-mute">{sub}</p>{children && <div className="mt-5">{children}</div>}</div>);
export const Skeleton = ({ n = 6 }) => (<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: n }).map((_, i) => <div key={i} className="skel h-28" />)}</div>);
export const NoteCard = ({ n }) => (<Link href={`/note/${n.id}`} className="card block"><p className="text-xs font-medium uppercase tracking-wide text-brand">{n.subjects?.name}</p>
  <p className="mt-1 font-medium">{n.title}</p><p className="mt-3 text-xs text-mute">Added {fmt(n.created_at)}</p></Link>);
