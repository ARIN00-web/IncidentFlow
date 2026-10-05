"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { api, type IncidentDetail } from "@/lib/api";
import { clearAuth, getToken } from "@/lib/auth";
import type {
  IncidentStatus,
  TimelineEvent,
  User,
} from "@/lib/types";

import {
  Avatar,
  Button,
  Card,
  SeverityBadge,
  StatusBadge,
} from "@/components/ui/primitives";

import {
  StatusFlow,
  Timeline,
} from "@/components/incidents/incident-ui";

function makeUser(
  id: number | null,
  name: string,
  role = "Incident participant",
): User {
  return {
    id: id ?? name,
    name,
    email: "",
    role,
    initials: name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase(),
  };
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function timelineKind(eventType: string): TimelineEvent["kind"] {
  switch (eventType) {
    case "INCIDENT_CREATED":
      return "alert";

    case "ENGINEER_ASSIGNED":
      return "assignment";

    case "INCIDENT_UPDATED":
      return "status";

    default:
      return "system";
  }
}

export default function IncidentRoom() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [incident, setIncident] =
    useState<IncidentDetail | null>(null);

  const [status, setStatus] =
    useState<IncidentStatus>("OPEN");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadIncident() {
      const token = getToken();

      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        const data = await api.getIncident(token, Number(id));

        setIncident(data);
        setStatus(data.status);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Failed to load incident.";

        setError(message);

        if (
          message.toLowerCase().includes("unauthorized") ||
          message.toLowerCase().includes("token")
        ) {
          clearAuth();
          router.replace("/login");
        }
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadIncident();
    }
  }, [id, router]);

  const timeline = useMemo<TimelineEvent[]>(() => {
    if (!incident) {
      return [];
    }

    return incident.timeline.map((event) => ({
      id: String(event.id),
      time: formatTime(event.created_at),
      kind: timelineKind(event.event_type),
      title: event.event_type
        .replaceAll("_", " ")
        .toLowerCase()
        .replace(/\b\w/g, (letter) => letter.toUpperCase()),
      detail: event.message,
      actor: event.actor_name
        ? makeUser(event.actor_id, event.actor_name)
        : undefined,
    }));
  }, [incident]);

  async function changeStatus(nextStatus: IncidentStatus) {
    const token = getToken();

    if (!token || !incident || saving) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      const updated = await api.updateIncident(
        token,
        incident.id,
        {
          status: nextStatus,
        },
      );

      setIncident((current) =>
        current
          ? {
              ...current,
              ...updated,
            }
          : current,
      );

      setStatus(updated.status);

      // Reload the complete incident so timeline/cache is fresh.
      const fresh = await api.getIncident(
        token,
        incident.id,
      );

      setIncident(fresh);
      setStatus(fresh.status);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to update incident.";

      setError(message);
      setStatus(incident.status);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <AppShell title="Incident">
        <div className="empty-state">
          <h3>Loading incident...</h3>
          <p>Fetching incident data from IncidentFlow.</p>
        </div>
      </AppShell>
    );
  }

  if (error && !incident) {
    return (
      <AppShell title="Incident">
        <div className="empty-state">
          <h3>Unable to load incident</h3>
          <p>{error}</p>
          <Button onClick={() => router.push("/incidents")}>
            Back to incidents
          </Button>
        </div>
      </AppShell>
    );
  }

  if (!incident) {
    return null;
  }

  const commander =
    incident.assignments.find(
      (user) =>
        user.role === "INCIDENT_COMMANDER" ||
        user.role === "ADMIN",
    ) ?? null;

  const assignee =
    incident.assignments.find(
      (user) =>
        user.role !== "INCIDENT_COMMANDER" &&
        user.role !== "ADMIN",
    ) ?? null;

  const participants =
    incident.assignments.length > 0
      ? incident.assignments
      : [
          {
            id: incident.created_by,
            name: incident.creator_name ?? "Incident creator",
            email: "",
            role: "Engineer",
            assigned_at: incident.created_at,
          },
        ];

  const duration = Math.max(
    0,
    Math.floor(
      (Date.now() -
        new Date(incident.created_at).getTime()) /
        60000,
    ),
  );

  return (
    <AppShell
      title={`INC-${incident.id}`}
      actions={
        <>
          <Button variant="secondary">
            Assign
          </Button>

          <Button
            onClick={() => changeStatus("RESOLVED")}
            disabled={
              saving ||
              incident.status === "RESOLVED"
            }
          >
            {saving ? "Updating..." : "Resolve"}
          </Button>
        </>
      }
    >
      <div className="room-header">
        <div>
          <div className="room-badges">
            <SeverityBadge severity={incident.severity} />
            <StatusBadge status={status} />
          </div>

          <h2>{incident.title}</h2>

          <p>
            Incident #{incident.id} · Open for{" "}
            {duration < 60
              ? `${duration}m`
              : `${Math.floor(duration / 60)}h ${duration % 60}m`}
          </p>
        </div>

        <select
          value={status}
          disabled={saving}
          onChange={(event) =>
            changeStatus(
              event.target.value as IncidentStatus,
            )
          }
          aria-label="Change incident status"
        >
          <option value="OPEN">OPEN</option>
          <option value="ACKNOWLEDGED">
            ACKNOWLEDGED
          </option>
          <option value="INVESTIGATING">
            INVESTIGATING
          </option>
          <option value="MITIGATED">
            MITIGATED
          </option>
          <option value="RESOLVED">
            RESOLVED
          </option>
        </select>
      </div>

      <StatusFlow status={status} />

      {error && (
        <div className="empty-state">
          <p>{error}</p>
        </div>
      )}

      <div className="room-grid">
        <div>
          <Card className="timeline-card">
            <div className="section-header">
              <div>
                <h2>Incident timeline</h2>
                <p>
                  Shared activity and operational context
                </p>
              </div>
            </div>

            <Timeline events={timeline} />

            <form
              className="composer"
              onSubmit={(event) => {
                event.preventDefault();
              }}
            >
              <textarea
                placeholder="Add an update..."
                aria-label="Add an incident update"
                disabled
              />

              <div>
                <Button
                  type="button"
                  variant="ghost"
                  disabled
                >
                  + Add event
                </Button>

                <Button type="submit" disabled>
                  Comment
                </Button>
              </div>
            </form>
          </Card>
        </div>

        <aside className="room-sidebar">
          <Card>
            <h3>Incident information</h3>

            <dl>
              <dt>Severity</dt>
              <dd>
                <SeverityBadge
                  severity={incident.severity}
                />
              </dd>

              <dt>Status</dt>
              <dd>
                <StatusBadge status={status} />
              </dd>

              <dt>Commander</dt>
              <dd className="assignee">
                {commander ? (
                  <>
                    <Avatar
                      user={makeUser(
                        commander.id,
                        commander.name,
                        commander.role,
                      )}
                      size="sm"
                    />
                    {commander.name}
                  </>
                ) : (
                  "Unassigned"
                )}
              </dd>

              <dt>Primary responder</dt>
              <dd className="assignee">
                {assignee ? (
                  <>
                    <Avatar
                      user={makeUser(
                        assignee.id,
                        assignee.name,
                        assignee.role,
                      )}
                      size="sm"
                    />
                    {assignee.name}
                  </>
                ) : (
                  "Unassigned"
                )}
              </dd>

              <dt>Created by</dt>
              <dd>
                {incident.creator_name ??
                  `User #${incident.created_by}`}
              </dd>

              <dt>Started</dt>
              <dd>
                {new Date(
                  incident.created_at,
                ).toLocaleString()}
              </dd>
            </dl>
          </Card>

          <Card>
            <h3>Participants</h3>

            <div className="participant-list">
              {participants.map((user) => (
                <div key={user.id}>
                  <Avatar
                    user={makeUser(
                      user.id,
                      user.name,
                      user.role,
                    )}
                  />

                  <div>
                    <b>{user.name}</b>
                    <small>{user.role}</small>
                  </div>

                  <span className="online" />
                </div>
              ))}
            </div>
          </Card>
        </aside>
      </div>
    </AppShell>
  );
}