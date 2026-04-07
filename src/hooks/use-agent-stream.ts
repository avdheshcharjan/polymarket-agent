"use client";

import { useEffect, useReducer, useCallback } from "react";
import type { AgentEvent, AgentState } from "@/types/agent";

interface StreamState {
  connected: boolean;
  agentState: AgentState;
  events: (AgentEvent & { timestamp: string })[];
}

type StreamAction =
  | { type: "connected" }
  | { type: "disconnected" }
  | { type: "init"; state: AgentState }
  | { type: "event"; event: AgentEvent };

const initialState: StreamState = {
  connected: false,
  agentState: {
    phase: "idle",
    isRunning: false,
    currentMarketId: null,
    currentStrategy: null,
    lastRunAt: null,
    nextRunAt: null,
    cycleCount: 0,
    error: null,
  },
  events: [],
};

function reducer(state: StreamState, action: StreamAction): StreamState {
  switch (action.type) {
    case "connected":
      return { ...state, connected: true };
    case "disconnected":
      return { ...state, connected: false };
    case "init":
      return { ...state, agentState: action.state };
    case "event": {
      const newEvent = { ...action.event, timestamp: new Date().toISOString() };
      const events = [newEvent, ...state.events].slice(0, 100);

      let agentState = { ...state.agentState };
      if (action.event.type === "phase_change") {
        agentState = { ...agentState, phase: action.event.phase };
      }
      if (action.event.type === "error") {
        agentState = { ...agentState, phase: "error", error: action.event.message };
      }

      return { ...state, agentState, events };
    }
    default:
      return state;
  }
}

export function useAgentStream() {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";
    const es = new EventSource(`${baseUrl}/api/agent/stream`);

    es.onopen = () => dispatch({ type: "connected" });
    es.onerror = () => dispatch({ type: "disconnected" });

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === "init") {
          dispatch({ type: "init", state: data.state });
        } else {
          dispatch({ type: "event", event: data });
        }
      } catch {
        // Ignore parse errors (heartbeats, etc.)
      }
    };

    return () => es.close();
  }, []);

  const triggerRun = useCallback(async () => {
    await fetch("/api/agent/run", { method: "POST" });
  }, []);

  return { ...state, triggerRun };
}
