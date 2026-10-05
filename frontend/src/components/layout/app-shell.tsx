"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { users } from "@/lib/mock-data";
import { Avatar, Button } from "@/components/ui/primitives";

const nav = [["Dashboard", "/dashboard", "⌂"], ["Incidents", "/incidents", "!"], ["Teams", "/teams", "♧"], ["Analytics", "/analytics", "◔"], ["Settings", "/settings", "⚙"]] as const;
export function AppShell({ children, title, actions }: { children: ReactNode; title: string; actions?: ReactNode }) {
 const path = usePathname(); const router = useRouter(); const [open,setOpen]=useState(false); const [command,setCommand]=useState(false); const [query,setQuery]=useState("");
 useEffect(()=>{const handler=(e:KeyboardEvent)=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==="k"){e.preventDefault();setCommand(true)} if(e.key==="Escape")setCommand(false)};addEventListener("keydown",handler);return()=>removeEventListener("keydown",handler)},[]);
 const commands: ReadonlyArray<readonly [string, string, string]> = [...nav, ["Create incident", "/incidents/new", "+"]];
 const matchingCommands = commands.filter(([name]) => name.toLowerCase().includes(query.toLowerCase()));
 return <div className="app-shell">
   <aside className={open?"sidebar open":"sidebar"}><Link href="/dashboard" className="brand"><i>✦</i><span>IncidentFlow</span></Link><div className="workspace"><span className="workspace-dot"/> Acme Engineering <b>⌄</b></div><nav>{nav.map(([name,href,icon])=><Link onClick={()=>setOpen(false)} className={path===href||path.startsWith(href+"/")?"nav-link active":"nav-link"} href={href} key={href}><i>{icon}</i><span>{name}</span></Link>)}</nav><div className="sidebar-bottom"><div className="user-row"><Avatar user={users[0]} size="sm"/><div><b>Arin Shah</b><small>Reliability Engineer</small></div><button aria-label="Account options">•••</button></div></div></aside>
   <div className="app-main"><header className="topbar"><button className="mobile-menu" onClick={()=>setOpen(!open)} aria-label="Toggle navigation">☰</button><div><p className="eyebrow">OPERATIONS / {title.toUpperCase()}</p><h1>{title}</h1></div><div className="top-actions"><button className="search-trigger" onClick={()=>setCommand(true)}>⌕ <span>Search</span><kbd>⌘ K</kbd></button>{actions}</div></header><main className="page-content">{children}</main></div>
   {command && <div className="dialog-backdrop" onMouseDown={()=>setCommand(false)}><div className="command" role="dialog" aria-modal="true" aria-label="Command palette" onMouseDown={e=>e.stopPropagation()}><input autoFocus value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search commands..." aria-label="Search commands"/><p>QUICK ACTIONS</p>{matchingCommands.length ? matchingCommands.map(([name,href,icon])=><button key={href} onClick={()=>{router.push(href);setCommand(false)}}><i>{icon}</i>{name}<span>↵</span></button>) : <div className="command-empty">No commands found</div>}</div></div>}
 </div>;
}
