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
    const message =
      typeof body === "object" &&
      body !== null &&
      "message" in body
        ? String((body as { message: unknown }).message)
        : `Request failed (${response.status})`;

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

export interface IncidentAssignment {
  id: number;
  name: string;
  email: string;
  role: string;
  assigned_at: string;
}

export interface IncidentTimelineItem {
  id: number;
  event_type: string;
  message: string;
  created_at: string;
  actor_id: number | null;
  actor_name: string | null;
}

export interface IncidentDetail extends Incident {
  creator_name?: string;
  timeline: IncidentTimelineItem[];
  assignments: IncidentAssignment[];
}

export interface IncidentListResponse {
  data: Incident[];
  page: number;
  limit: number;
  total: number;
}

export const api = {
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

  getIncidents: (token: string) =>
    request<IncidentListResponse>("/incidents", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }),

  getIncident: (token: string, id: number) =>
    request<IncidentDetail>(`/incidents/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }),

  createIncident: (
    token: string,
    data: {
      title: string;
      severity: IncidentSeverity;
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
};