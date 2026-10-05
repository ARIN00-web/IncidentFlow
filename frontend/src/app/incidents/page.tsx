"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { IncidentTable } from "@/components/incidents/incident-ui";
import { api } from "@/lib/api";
import { clearAuth, getToken } from "@/lib/auth";
import type { Incident } from "@/lib/types";

export default function IncidentsPage() {
  const router = useRouter();

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [q, setQ] = useState("");
  const [sev, setSev] = useState("All severity");
  const [status, setStatus] = useState("All statuses");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadIncidents() {
      const token = getToken();

      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        const response = await api.getIncidents(token);
        setIncidents(response.data);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load incidents.";

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

    loadIncidents();
  }, [router]);

  const items = useMemo(() => {
    return incidents.filter(
      (incident) =>
        (!q ||
          incident.title.toLowerCase().includes(q.toLowerCase()) ||
          String(incident.id).includes(q)) &&
        (sev === "All severity" || incident.severity === sev) &&
        (status === "All statuses" || incident.status === status),
    );
  }, [incidents, q, sev, status]);

  return (
    <AppShell
      title="Incidents"
      actions={
        <Link
          className="button button-primary"
          href="/incidents/new"
        >
          + Create incident
        </Link>
      }
    >
      <div className="page-intro">
        <div>
          <h2>Incident registry</h2>
          <p>
            Track, coordinate, and resolve active production issues.
          </p>
        </div>

        <span>{items.length} incidents</span>
      </div>

      <div className="filters">
        <label>
          ⌕
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search incidents..."
          />
        </label>

        <select
          value={sev}
          onChange={(e) => setSev(e.target.value)}
        >
          <option>All severity</option>
          <option>CRITICAL</option>
          <option>HIGH</option>
          <option>MEDIUM</option>
          <option>LOW</option>
        </select>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option>All statuses</option>
          <option>OPEN</option>
          <option>ACKNOWLEDGED</option>
          <option>INVESTIGATING</option>
          <option>MITIGATED</option>
          <option>RESOLVED</option>
        </select>
      </div>

      <section className="card incident-table-card">
        {loading ? (
          <div className="empty-state">
            <h3>Loading incidents...</h3>
            <p>Fetching incidents from IncidentFlow.</p>
          </div>
        ) : error ? (
          <div className="empty-state">
            <h3>Unable to load incidents</h3>
            <p>{error}</p>
          </div>
        ) : (
          <>
            <IncidentTable items={items} />

            {!items.length && (
              <div className="empty-state">
                <span>⌕</span>
                <h3>No incidents found</h3>
                <p>Try another search or filter.</p>
              </div>
            )}

            <footer className="table-footer">
              Showing {items.length} of {incidents.length} incidents

              <div>
                <button disabled>← Previous</button>
                <button disabled>Next →</button>
              </div>
            </footer>
          </>
        )}
      </section>
    </AppShell>
  );
}