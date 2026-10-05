import type {
  Incident,
  Team,
  TimelineEvent,
  User,
} from "./types";

export const users: User[] = [
  {
    id: "arin",
    name: "Arin Shah",
    email: "arin@incidentflow.dev",
    role: "Reliability Engineer",
    initials: "AS",
    color: "violet",
  },
  {
    id: "maya",
    name: "Maya Chen",
    email: "maya@incidentflow.dev",
    role: "Incident Commander",
    initials: "MC",
    color: "blue",
  },
  {
    id: "jules",
    name: "Jules Martin",
    email: "jules@incidentflow.dev",
    role: "Platform Engineer",
    initials: "JM",
    color: "green",
  },
  {
    id: "noah",
    name: "Noah Williams",
    email: "noah@incidentflow.dev",
    role: "Backend Engineer",
    initials: "NW",
    color: "orange",
  },
];

export const incidents: Incident[] = [
  {
    id: 1042,
    title: "Payment API latency",
    description:
      "Checkout requests are exceeding the service-level objective in production.",
    severity: "CRITICAL",
    status: "MITIGATED",
    service: "Payments API",
    environment: "Production",
    assignee: users[0],
    commander: users[1],
    team: "Core Platform",
    created_by: 1,
    created_at: "Today, 09:42",
    updated_at: "10 min ago",
    duration: "1h 18m",
  },
  {
    id: 1041,
    title: "Elevated queue processing delay",
    description:
      "Asynchronous fulfillment jobs are delayed.",
    severity: "HIGH",
    status: "INVESTIGATING",
    service: "Fulfillment Queue",
    environment: "Production",
    assignee: users[2],
    commander: users[1],
    team: "Infrastructure",
    created_by: 1,
    created_at: "Today, 10:18",
    updated_at: "4 min ago",
    duration: "42m",
  },
  {
    id: 1040,
    title: "Webhook delivery retries",
    description:
      "A third-party destination is returning intermittent 5xx responses.",
    severity: "MEDIUM",
    status: "ACKNOWLEDGED",
    service: "Events",
    environment: "Production",
    assignee: users[3],
    commander: users[0],
    team: "Developer Experience",
    created_by: 1,
    created_at: "Today, 08:34",
    updated_at: "22 min ago",
    duration: "2h 26m",
  },
  {
    id: 1039,
    title: "Stale search index",
    description:
      "New objects are not appearing in search results.",
    severity: "LOW",
    status: "OPEN",
    service: "Search",
    environment: "Staging",
    assignee: users[2],
    commander: users[0],
    team: "Core Platform",
    created_by: 1,
    created_at: "Yesterday",
    updated_at: "1h ago",
    duration: "1d 3h",
  },
  {
    id: 1038,
    title: "Auth refresh token errors",
    description:
      "Refresh requests failed after a rolling deployment.",
    severity: "HIGH",
    status: "RESOLVED",
    service: "Identity",
    environment: "Production",
    assignee: users[3],
    commander: users[1],
    team: "Identity",
    created_by: 1,
    created_at: "Yesterday",
    updated_at: "Yesterday",
    duration: "37m",
  },
];

export const teams: Team[] = [
  {
    id: "core",
    name: "Core Platform",
    description:
      "Shared platform services and reliability.",
    lead: users[1],
    members: [
      users[0],
      users[1],
      users[2],
    ],
    onCall: users[0],
    activeIncidents: 1,
    availability: "Attention",
  },
  {
    id: "infra",
    name: "Infrastructure",
    description:
      "Compute, network, and delivery systems.",
    lead: users[2],
    members: [
      users[2],
      users[3],
    ],
    onCall: users[2],
    activeIncidents: 1,
    availability: "Attention",
  },
  {
    id: "dx",
    name: "Developer Experience",
    description:
      "Developer-facing services and integrations.",
    lead: users[3],
    members: [
      users[0],
      users[3],
    ],
    onCall: users[3],
    activeIncidents: 0,
    availability: "Healthy",
  },
];

export const timeline: TimelineEvent[] = [
  {
    id: "1",
    time: "09:42",
    kind: "alert",
    title: "Incident created",
    detail:
      "Latency SLO breach detected for Payments API.",
  },
  {
    id: "2",
    time: "09:44",
    kind: "status",
    title: "Alert acknowledged",
    detail:
      "Status changed from Open to Acknowledged.",
    actor: users[1],
  },
  {
    id: "3",
    time: "09:47",
    kind: "assignment",
    title: "Arin assigned",
    detail:
      "Arin Shah joined as primary responder.",
    actor: users[1],
  },
  {
    id: "4",
    time: "09:52",
    kind: "comment",
    title: "Database latency detected",
    detail:
      "Connection-pool saturation correlates with increased query time.",
    actor: users[0],
  },
  {
    id: "5",
    time: "10:03",
    kind: "deployment",
    title: "Mitigation deployed",
    detail:
      "Connection pool limits increased and traffic shifted.",
    actor: users[2],
  },
  {
    id: "6",
    time: "10:09",
    kind: "status",
    title: "Incident mitigated",
    detail:
      "Latency is within SLO. Monitoring for regression.",
    actor: users[1],
  },
];