"use client";

import {
  FormEvent,
  useState,
} from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import {
  Button,
  Card,
} from "@/components/ui/primitives";

import { api } from "@/lib/api";
import { getToken } from "@/lib/auth";

import type {
  IncidentSeverity,
} from "@/lib/types";

export default function NewIncidentPage() {
  const router = useRouter();

  const [title, setTitle] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [severity, setSeverity] =
    useState<IncidentSeverity>("MEDIUM");

  const [service, setService] =
    useState("");

  const [environment, setEnvironment] =
    useState("production");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");

    const token = getToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    if (!title.trim()) {
      setError(
        "Incident title is required.",
      );
      return;
    }

    try {
      setLoading(true);

      const incident =
        await api.createIncident(
          token,
          {
            title: title.trim(),
            severity,
            description:
              description.trim() ||
              undefined,
            service:
              service.trim() ||
              undefined,
            environment:
              environment.trim() ||
              undefined,
          },
        );

      /*
       * IMPORTANT:
       * Navigate using the ID returned by
       * PostgreSQL/backend.
       *
       * Do not use a mock ID.
       */
      router.push(
        `/incidents/${incident.id}`,
      );
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to create incident.";

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
      setLoading(false);
    }
  }

  return (
    <AppShell
      title="Create incident"
      actions={
        <Link
          className="button button-secondary"
          href="/incidents"
        >
          Cancel
        </Link>
      }
    >
      <div className="page-intro">
        <div>
          <h2>New incident</h2>

          <p>
            Create a production incident and
            start coordinating the response.
          </p>
        </div>
      </div>

      <Card>
        <form
          className="incident-form"
          onSubmit={handleSubmit}
        >
          {error && (
            <div className="auth-error">
              {error}
            </div>
          )}

          <div className="incident-form-grid">
            <div className="incident-form-main">
              <label>
                Incident title

                <input
                  value={title}
                  onChange={(event) =>
                    setTitle(event.target.value)
                  }
                  placeholder="API latency increased"
                  required
                />
              </label>

              <div className="incident-form-row">
                <label>
                  Severity

                  <select
                    value={severity}
                    onChange={(event) =>
                      setSeverity(
                        event.target
                          .value as IncidentSeverity,
                      )
                    }
                  >
                    <option value="LOW">
                      LOW
                    </option>

                    <option value="MEDIUM">
                      MEDIUM
                    </option>

                    <option value="HIGH">
                      HIGH
                    </option>

                    <option value="CRITICAL">
                      CRITICAL
                    </option>
                  </select>
                </label>

                <label>
                  Service

                  <input
                    value={service}
                    onChange={(event) =>
                      setService(event.target.value)
                    }
                    placeholder="payments-api"
                  />
                </label>

                <label>
                  Environment

                  <select
                    value={environment}
                    onChange={(event) =>
                      setEnvironment(
                        event.target.value,
                      )
                    }
                  >
                    <option value="production">
                      production
                    </option>

                    <option value="staging">
                      staging
                    </option>

                    <option value="development">
                      development
                    </option>
                  </select>
                </label>
              </div>
            </div>

            <div className="incident-form-side">
              <label>
                Description

                <textarea
                  value={description}
                  onChange={(event) =>
                    setDescription(
                      event.target.value,
                    )
                  }
                  placeholder="Describe what happened, impact, symptoms, or relevant context..."
                  rows={7}
                />
              </label>
            </div>
          </div>

          <div className="incident-form-actions">
            <Link
              className="button button-secondary"
              href="/incidents"
            >
              Cancel
            </Link>

            <Button
              type="submit"
              disabled={loading}
            >
              {loading
                ? "Creating..."
                : "Create incident"}
            </Button>
          </div>
        </form>
      </Card>
    </AppShell>
  );
}