"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";

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

import { api } from "@/lib/api";
import { getToken, getUser } from "@/lib/auth";

import {
  useIncidentSocket,
} from "@/hooks/useIncidentSocket";

import type {
  Incident,
  IncidentStatus,
  TimelineEvent,
  User,
} from "@/lib/types";

export default function IncidentRoom() {
  const params =
    useParams<{ id: string }>();

  const router = useRouter();

  const incidentId = Number(params.id);

  const [incident, setIncident] =
    useState<Incident | null>(null);

  const [timeline, setTimeline] =
    useState<TimelineEvent[]>([]);

  const [participants, setParticipants] =
    useState<User[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [status, setStatus] =
    useState<IncidentStatus>("OPEN");

  const [updatingStatus, setUpdatingStatus] =
    useState(false);

  const [update, setUpdate] =
    useState("");

  const [localUpdates, setLocalUpdates] =
    useState<string[]>([]);

  const {
    events: socketEvents,
    connected,
  } = useIncidentSocket(
    Number.isFinite(incidentId)
      ? incidentId
      : undefined,
  );

  const currentUser = getUser();

  useEffect(() => {
    if (
      !Number.isFinite(incidentId)
    ) {
      setError("Invalid incident ID.");
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadIncident() {
      const token = getToken();

      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        setLoading(true);
        setError("");

        const [
          incidentResult,
          timelineResult,
          assignmentsResult,
        ] = await Promise.all([
          api.getIncident(
            token,
            incidentId,
          ),

          api.getTimeline(
            token,
            incidentId,
          ),

          api.getAssignments(
            token,
            incidentId,
          ),
        ]);

        if (cancelled) {
          return;
        }

        setIncident(incidentResult);

        setStatus(
          incidentResult.status,
        );

        /*
         * Normalize backend timeline into
         * the UI TimelineEvent shape.
         */
        const normalizedTimeline =
  timelineResult.map(
    (item, index): TimelineEvent => ({
      id: String(
        item.id ??
          `timeline-${index}`,
      ),

      time:
        item.created_at ??
        item.timestamp ??
        "",

      kind:
        (item.kind ??
          item.type ??
          item.event_type ??
          "system") as TimelineEvent["kind"],

      title:
        item.title ??
        item.message ??
        "Incident activity",

      detail:
        item.detail ??
        item.message ??
        "",
    }),
  );
        /*
         * Assignments can come back in different
         * shapes depending on the backend layer.
         */
        const normalizedParticipants =
          assignmentsResult.flatMap(
            (item): User[] => {
              if (item.user) {
                return [
                  {
                    id: item.user.id,
                    name: item.user.name,
                    email: item.user.email,
                    role: item.user.role,
                  },
                ];
              }

              if (
                item.user_id &&
                item.name &&
                item.email
              ) {
                return [
                  {
                    id: item.user_id,
                    name: item.name,
                    email: item.email,
                    role:
                      item.role ??
                      "ENGINEER",
                  },
                ];
              }

              return [];
            },
          );

        setParticipants(
          normalizedParticipants,
        );
      } catch (err) {
        if (cancelled) {
          return;
        }

        const message =
          err instanceof Error
            ? err.message
            : "Unable to load incident.";

        setError(message);

        if (
          message.includes("401") ||
          message
            .toLowerCase()
            .includes("unauthorized")
        ) {
          router.replace("/login");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadIncident();

    return () => {
      cancelled = true;
    };
  }, [incidentId, router]);

  /*
   * Merge server timeline + socket events.
   */
  const visibleTimeline =
    useMemo(
      () => [
        ...timeline,
        ...socketEvents,
      ],
      [timeline, socketEvents],
    );

  async function changeStatus(
    nextStatus: IncidentStatus,
  ) {
    if (!incident) {
      return;
    }

    const token = getToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    try {
      setUpdatingStatus(true);

      const updated =
        await api.updateIncident(
          token,
          incident.id,
          {
            status: nextStatus,
          },
        );

      setIncident(updated);
      setStatus(updated.status);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update incident.",
      );
    } finally {
      setUpdatingStatus(false);
    }
  }

  function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const value = update.trim();

    if (!value) {
      return;
    }

    setLocalUpdates((previous) => [
      ...previous,
      value,
    ]);

    setUpdate("");
  }

  if (loading) {
    return (
      <AppShell title="Incident">
        <section className="card empty-state">
          <h3>
            Loading incident...
          </h3>

          <p>
            Fetching incident data from
            IncidentFlow.
          </p>
        </section>
      </AppShell>
    );
  }

  if (error || !incident) {
    return (
      <AppShell title="Incident">
        <section className="card empty-state">
          <h3>
            Unable to load incident
          </h3>

          <p>
            {error ||
              "The incident does not exist."}
          </p>

          <Link
            className="button button-primary"
            href="/incidents"
          >
            Back to incidents
          </Link>
        </section>
      </AppShell>
    );
  }

  const commander =
    incident.commander;

  const assignee =
    incident.assignee;

  return (
    <AppShell
      title={`INC-${incident.id}`}
      actions={
        <>
          <Link
            className="button button-secondary"
            href="/incidents"
          >
            Back
          </Link>

          <Button
            onClick={() =>
              changeStatus("RESOLVED")
            }
            disabled={
              updatingStatus ||
              status === "RESOLVED"
            }
          >
            {updatingStatus
              ? "Updating..."
              : "Resolve"}
          </Button>
        </>
      }
    >
      <div className="room-header">
        <div>
          <div className="room-badges">
            <SeverityBadge
              severity={
                incident.severity
              }
            />

            <StatusBadge
              status={status}
            />
          </div>

          <h2>
            {incident.title}
          </h2>

          <p>
            {incident.service ??
              "Unknown service"}{" "}
            ·{" "}
            {incident.environment ??
              "production"}
          </p>
        </div>

        <div>
          <select
            value={status}
            disabled={updatingStatus}
            onChange={(event) =>
              changeStatus(
                event.target
                  .value as IncidentStatus,
              )
            }
            aria-label="Change incident status"
          >
            <option value="OPEN">
              OPEN
            </option>

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

          <div
            style={{
              marginTop: "8px",
              fontSize: "12px",
              opacity: 0.7,
            }}
          >
            {connected
              ? "● Live"
              : "○ Connecting..."}
          </div>
        </div>
      </div>

      <StatusFlow
        status={status}
      />

      <div className="room-grid">
        <div>
          <Card className="timeline-card">
            <div className="section-header">
              <div>
                <h2>
                  Incident timeline
                </h2>

                <p>
                  Shared activity and
                  operational context
                </p>
              </div>
            </div>

            {visibleTimeline.length >
            0 ? (
              <Timeline
                events={
                  visibleTimeline
                }
              />
            ) : (
              <div className="empty-state">
                <p>
                  No timeline activity yet.
                </p>
              </div>
            )}

            {localUpdates.map(
              (item, index) => (
                <div
                  className="local-update"
                  key={`${item}-${index}`}
                >
                  <b>
                    Just now ·{" "}
                    {currentUser?.name ??
                      "You"}
                  </b>

                  <p>{item}</p>
                </div>
              ),
            )}

            <form
              className="composer"
              onSubmit={
                handleSubmit
              }
            >
              <textarea
                value={update}
                onChange={(event) =>
                  setUpdate(
                    event.target.value,
                  )
                }
                placeholder="Add an update..."
                aria-label="Add an incident update"
              />

              <div>
                <Button
                  type="button"
                  variant="ghost"
                >
                  + Add event
                </Button>

                <Button
                  type="submit"
                  disabled={
                    !update.trim()
                  }
                >
                  Comment
                </Button>
              </div>
            </form>
          </Card>
        </div>

        <aside className="room-sidebar">
          <Card>
            <h3>
              Incident information
            </h3>

            <dl>
              <dt>Severity</dt>

              <dd>
                <SeverityBadge
                  severity={
                    incident.severity
                  }
                />
              </dd>

              <dt>Status</dt>

              <dd>
                <StatusBadge
                  status={status}
                />
              </dd>

              <dt>Service</dt>

              <dd>
                {incident.service ??
                  "—"}
              </dd>

              <dt>Environment</dt>

              <dd>
                {incident.environment ??
                  "—"}
              </dd>

              {commander && (
                <>
                  <dt>
                    Commander
                  </dt>

                  <dd className="assignee">
                    <Avatar
                      user={
                        commander
                      }
                      size="sm"
                    />

                    {
                      commander.name
                    }
                  </dd>
                </>
              )}

              {assignee && (
                <>
                  <dt>
                    Primary responder
                  </dt>

                  <dd className="assignee">
                    <Avatar
                      user={
                        assignee
                      }
                      size="sm"
                    />

                    {
                      assignee.name
                    }
                  </dd>
                </>
              )}

              <dt>Created</dt>

              <dd>
                {new Date(
                  incident.created_at,
                ).toLocaleString()}
              </dd>

              <dt>Updated</dt>

              <dd>
                {new Date(
                  incident.updated_at,
                ).toLocaleString()}
              </dd>
            </dl>
          </Card>

          <Card>
            <h3>
              Participants
            </h3>

            {participants.length >
            0 ? (
              <div className="participant-list">
                {participants.map(
                  (user) => (
                    <div
                      key={String(
                        user.id,
                      )}
                    >
                      <Avatar
                        user={user}
                      />

                      <div>
                        <b>
                          {user.name}
                        </b>

                        <small>
                          {user.role}
                        </small>
                      </div>

                      <span className="online" />
                    </div>
                  ),
                )}
              </div>
            ) : (
              <p>
                No responders assigned.
              </p>
            )}
          </Card>
        </aside>
      </div>
    </AppShell>
  );
}