"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
export const Logo = () => (<span className="text-xl font-semibold tracking-tight">Padhai<span className="text-brand">Hub</span></span>);
function Toaster() {
  const [t, setT] = useState([]);
  useEffect(() => {
    const h = (e) => { const id = Math.random(); setT((x) => [...x, { id, ...e.detail }]); setTimeout(() => setT((x) => x.filter((i) => i.id !== id)), 3500); };
    window.addEventListener("toast", h); return () => window.removeEventListener("toast", h);
  }, []);
  return (<div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">{t.map((i) => (
    <div key={i.id} className={`rise rounded-xl px-4 py-3 text-sm text-white shadow-lg ${i.t === "err" ? "bg-red-600" : "bg-ink"}`}>{i.m}</div>))}</div>);
}
export default function Shell({ children }) {
  const path = usePathname(); const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]);
  const links = [["/", "Home"], ["/#subjects", "Subjects"], ["/#search", "Search"], ["/admin", "Admin"]];
  return (<div className="flex min-h-screen flex-col">
    <header className="sticky top-0 z-40 border-b border-line bg-paper/80 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link href="/"><Logo /></Link>
        <div className="hidden gap-7 text-sm text-mute md:flex">{links.map(([h, l]) => (<Link key={l} href={h} className="transition hover:text-ink">{l}</Link>))}</div>
        <button aria-label="Menu" className="rounded-lg p-2 md:hidden" onClick={() => setOpen(!open)}>{open ? "✕" : "☰"}</button>
      </nav>
      {open && <div className="rise flex flex-col gap-1 border-t border-line px-5 py-3 md:hidden">{links.map(([h, l]) => (<Link key={l} href={h} className="rounded-lg px-3 py-3 text-sm hover:bg-stone-100">{l}</Link>))}</div>}
    </header>
    <main key={path} className="rise mx-auto w-full max-w-6xl flex-1 px-5 py-10">{children}</main>
    <footer className="border-t border-line py-8"><div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-5 text-xs text-mute sm:flex-row">
      <Logo /><span>Made with ❤️ by prabinsays</span></div></footer>
    <Toaster />
  </div>);
}
