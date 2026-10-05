"use client";

import { useCallback, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import type { TimelineEvent } from "@/lib/types";

const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL ??
  "http://localhost:3000/incidents";

export function useIncidentSocket(incidentId?: number) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [connected, setConnected] = useState(false);

  const appendLocalEvent = useCallback(
    (event: TimelineEvent) => {
      setEvents((old) => [...old, event]);
    },
    [],
  );

  useEffect(() => {
    if (!incidentId) return;

    const socket: Socket = io(WS_URL, {
      transports: ["websocket"],
    });

    socket.on("connect", () => {
      setConnected(true);

      socket.emit("join-incident", {
        incidentId,
      });
    });

    socket.on("disconnect", () => {
      setConnected(false);
    });

    socket.on("incident.updated", (incident) => {
      const event: TimelineEvent = {
        id: `socket-${Date.now()}`,
        time: new Date().toLocaleTimeString(),
        kind: "status",
        title: "Incident updated",
        detail: `Incident #${incident.id} was updated.`,
      };

      setEvents((old) => [...old, event]);
    });

    return () => {
      socket.emit("leave-incident", {
        incidentId,
      });

      socket.disconnect();
    };
  }, [incidentId]);

  return {
    events,
    appendLocalEvent,
    connected,
  };
}