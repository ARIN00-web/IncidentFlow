"use client";

import { useState } from "react";
import { useParams } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { incidents, timeline, users } from "@/lib/mock-data";
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

export default function IncidentRoom() {
  const { id } = useParams<{ id: string }>();

  const incident =
    incidents.find((item) => String(item.id) === id) ?? incidents[0];

  const commander = incident.commander ?? users[0];
  const assignee = incident.assignee ?? users[1] ?? users[0];

  const [status, setStatus] = useState(incident.status);
  const [update, setUpdate] = useState("");
  const [added, setAdded] = useState<string[]>([]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!update.trim()) {
      return;
    }

    setAdded((previous) => [...previous, update.trim()]);
    setUpdate("");
  }

  return (
    <AppShell
      title={`INC-${incident.id}`}
      actions={
        <>
          <Button variant="secondary">Assign</Button>

          <Button onClick={() => setStatus("RESOLVED")}>
            Resolve
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
            {incident.service} · {incident.environment} · Open for{" "}
            {incident.duration}
          </p>
        </div>

        <select
          value={status}
          onChange={(event) =>
            setStatus(event.target.value as typeof status)
          }
          aria-label="Change incident status"
        >
          <option value="OPEN">OPEN</option>
          <option value="ACKNOWLEDGED">ACKNOWLEDGED</option>
          <option value="INVESTIGATING">INVESTIGATING</option>
          <option value="MITIGATED">MITIGATED</option>
          <option value="RESOLVED">RESOLVED</option>
        </select>
      </div>

      <StatusFlow status={status} />

      <div className="room-grid">
        <div>
          <Card className="timeline-card">
            <div className="section-header">
              <div>
                <h2>Incident timeline</h2>
                <p>Shared activity and operational context</p>
              </div>
            </div>

            <Timeline events={timeline} />

            {added.map((item, index) => (
              <div className="local-update" key={`${item}-${index}`}>
                <b>Just now · Arin Shah</b>
                <p>{item}</p>
              </div>
            ))}

            <form className="composer" onSubmit={handleSubmit}>
              <textarea
                value={update}
                onChange={(event) => setUpdate(event.target.value)}
                placeholder="Add an update..."
                aria-label="Add an incident update"
              />

              <div>
                <Button type="button" variant="ghost">
                  + Add event
                </Button>

                <Button type="submit" disabled={!update.trim()}>
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
                <SeverityBadge severity={incident.severity} />
              </dd>

              <dt>Status</dt>
              <dd>
                <StatusBadge status={status} />
              </dd>

              <dt>Service</dt>
              <dd>{incident.service}</dd>

              <dt>Environment</dt>
              <dd>{incident.environment}</dd>

              <dt>Commander</dt>
              <dd className="assignee">
                <Avatar user={commander} size="sm" />
                {commander.name}
              </dd>

              <dt>Primary responder</dt>
              <dd className="assignee">
                <Avatar user={assignee} size="sm" />
                {assignee.name}
              </dd>

              <dt>Started</dt>
              <dd>{incident.created_at}</dd>
            </dl>
          </Card>

          <Card>
            <h3>Participants</h3>

            <div className="participant-list">
              {users.slice(0, 3).map((user) => (
                <div key={user.id}>
                  <Avatar user={user} />

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