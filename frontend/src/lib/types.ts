export type IncidentSeverity =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export type IncidentStatus =
  | "OPEN"
  | "ACKNOWLEDGED"
  | "INVESTIGATING"
  | "MITIGATED"
  | "RESOLVED";

export type TimelineKind =
  | "alert"
  | "status"
  | "assignment"
  | "comment"
  | "deployment"
  | "system";

export interface User {
  id: string | number;
  name: string;
  email: string;
  role: string;
  initials?: string;
  color?: string;
}

export interface Team {
  id: string;
  name: string;
  description: string;
  lead?: User;
  members?: User[];
  onCall?: User;
  activeIncidents?: number;
  availability?: "Healthy" | "Attention";
}

export interface Incident {
  id: number;
  title: string;
  description?: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  service?: string;
  environment?: string;
  assignee?: User;
  commander?: User;
  team?: string;
  created_by: number;
  created_at: string;
  updated_at: string;
  duration?: string;
}

export interface TimelineEvent {
  id: string;
  time: string;
  kind: TimelineKind;
  title: string;
  detail: string;
  actor?: User;
}