import type {
  Incident,
  IncidentSeverity,
  IncidentStatus,
} from "@/lib/types";

const BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api";

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });

  const text = await response.text();

  let body: unknown = {};

  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = text;
  }

  if (!response.ok) {
    let message = `Request failed (${response.status})`;

    if (
      typeof body === "object" &&
      body !== null &&
      "message" in body
    ) {
      const apiMessage = (body as { message: unknown }).message;

      if (Array.isArray(apiMessage)) {
        message = apiMessage.join(", ");
      } else if (typeof apiMessage === "string") {
        message = apiMessage;
      }
    }

    throw new Error(message);
  }

  return body as T;
}

export interface ApiUser {
  id: number;
  name: string;
  email: string;
  role: string;
}

export interface AuthResponse {
  accessToken: string;
  user: ApiUser;
}

export interface TimelineItem {
  id?: number | string;
  event_type?: string;
  type?: string;
  kind?: string;
  message?: string;
  detail?: string;
  title?: string;
  created_at?: string;
  timestamp?: string;
  actor_id?: number;
  actor_name?: string;
  metadata?: Record<string, unknown>;
}

export interface AssignmentItem {
  id?: number | string;
  user_id?: number;
  incident_id?: number;
  name?: string;
  email?: string;
  role?: string;
  user?: ApiUser;
}

export const api = {
  // --------------------------------------------------
  // HEALTH
  // --------------------------------------------------

  health: () =>
    request<{
      status: string;
      service: string;
      timestamp: string;
    }>("/health"),

  // --------------------------------------------------
  // AUTH
  // --------------------------------------------------

  register: (data: {
    name: string;
    email: string;
    password: string;
  }) =>
    request<ApiUser>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  login: (data: {
    email: string;
    password: string;
  }) =>
    request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // --------------------------------------------------
  // INCIDENTS
  // --------------------------------------------------

  getIncidents: (token: string) =>
    request<Incident[]>("/incidents", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }),

  getIncident: (token: string, id: number) =>
    request<Incident>(`/incidents/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }),

  createIncident: (
    token: string,
    data: {
      title: string;
      severity: IncidentSeverity;
      description?: string;
      service?: string;
      environment?: string;
    },
  ) =>
    request<Incident>("/incidents", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    }),

  updateIncident: (
    token: string,
    id: number,
    data: {
      title?: string;
      severity?: IncidentSeverity;
      status?: IncidentStatus;
    },
  ) =>
    request<Incident>(`/incidents/${id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    }),

  deleteIncident: (token: string, id: number) =>
    request<void>(`/incidents/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }),

  getTimeline: (token: string, id: number) =>
    request<TimelineItem[]>(`/incidents/${id}/timeline`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }),

  getAssignments: (token: string, id: number) =>
    request<AssignmentItem[]>(`/incidents/${id}/assignments`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }),

  assignIncident: (
    token: string,
    incidentId: number,
    userId: number,
  ) =>
    request<unknown>(
      `/incidents/${incidentId}/assign/${userId}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    ),

  // --------------------------------------------------
  // USERS
  // --------------------------------------------------

  getUsers: (token: string) =>
    request<ApiUser[]>("/users", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }),

  getUser: (token: string, id: number) =>
    request<ApiUser>(`/users/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }),

  // --------------------------------------------------
  // TEAMS
  // --------------------------------------------------

  getTeams: (token: string) =>
    request<unknown[]>("/teams", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }),

  getTeam: (token: string, id: number) =>
    request<unknown>(`/teams/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }),
};