import type { ButtonHTMLAttributes, ReactNode } from "react";
import type { IncidentSeverity, IncidentStatus, User } from "@/lib/types";

export function Button({ children, variant = "primary", className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "danger" | "ghost" }) { return <button className={`button button-${variant} ${className}`} {...props}>{children}</button>; }
export function Avatar({ user, size = "md" }: { user: User; size?: "sm" | "md" }) { return <span className={`avatar avatar-${size} ${user.color}`} aria-label={user.name}>{user.initials}</span>; }
export function SeverityBadge({ severity }: { severity: IncidentSeverity }) { return <span className={`badge severity-${severity.toLowerCase()}`}>{severity}</span>; }
export function StatusBadge({ status }: { status: IncidentStatus }) { return <span className={`badge status-${status.toLowerCase()}`}>{status.replace("_", " ")}</span>; }
export function Card({ children, className = "" }: { children: ReactNode; className?: string }) { return <section className={`card ${className}`}>{children}</section>; }
export function EmptyState({ title, detail }: { title: string; detail: string }) { return <div className="empty-state"><span>◇</span><h3>{title}</h3><p>{detail}</p></div>; }
