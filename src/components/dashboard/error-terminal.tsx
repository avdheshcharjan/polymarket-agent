"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronUp, Terminal, X, AlertTriangle, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { AgentEvent, AgentPhase } from "@/types/agent";

interface LogEntry {
  timestamp: string;
  level: "error" | "warn" | "info";
  message: string;
}

function eventToLogEntries(
  event: AgentEvent & { timestamp: string }
): LogEntry[] {
  const ts = new Date(event.timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  switch (event.type) {
    case "error":
      return [{ timestamp: ts, level: "error", message: event.message }];
    case "phase_change":
      if (event.phase === "error") {
        return [
          {
            timestamp: ts,
            level: "error",
            message: event.detail ?? "Agent entered error state",
          },
        ];
      }
      return [
        {
          timestamp: ts,
          level: "info",
          message: `Phase → ${event.phase}${event.detail ? `: ${event.detail}` : ""}`,
        },
      ];
    case "trade_executed":
      if (event.trade.status === "failed") {
        return [
          {
            timestamp: ts,
            level: "error",
            message: `Trade failed: ${event.trade.action} ${event.trade.outcome} ($${event.trade.size.toFixed(2)})`,
          },
        ];
      }
      return [];
    default:
      return [];
  }
}

interface ErrorTerminalProps {
  events: (AgentEvent & { timestamp: string })[];
  phase: AgentPhase;
  error: string | null;
  connected: boolean;
}

export function ErrorTerminal({
  events,
  phase,
  error,
  connected,
}: ErrorTerminalProps) {
  const [collapsed, setCollapsed] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const logs: LogEntry[] = events.flatMap(eventToLogEntries).reverse();

  // Add connection errors
  if (!connected) {
    logs.push({
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
      level: "warn",
      message: "SSE connection lost — attempting reconnect",
    });
  }

  // Add current error state
  if (phase === "error" && error) {
    const alreadyShown = logs.some(
      (l) => l.level === "error" && l.message === error
    );
    if (!alreadyShown) {
      logs.push({
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
        level: "error",
        message: error,
      });
    }
  }

  const errorCount = logs.filter((l) => l.level === "error").length;
  const warnCount = logs.filter((l) => l.level === "warn").length;

  // Auto-expand when a new error arrives
  useEffect(() => {
    if (errorCount > 0) {
      setCollapsed(false);
    }
  }, [errorCount]);

  // Scroll to bottom on new logs
  useEffect(() => {
    if (!collapsed && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs.length, collapsed]);

  const levelStyle = {
    error: "text-red-400",
    warn: "text-amber-400",
    info: "text-zinc-500",
  };

  const levelPrefix = {
    error: "ERR",
    warn: "WRN",
    info: "INF",
  };

  return (
    <div
      className={`fixed bottom-0 left-0 w-64 z-50 border-t border-r border-white/[0.06] bg-[#0c0c12]/95 backdrop-blur-xl transition-all duration-300 ${
        collapsed ? "h-10" : "h-72"
      }`}
    >
      {/* Header bar */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex w-full items-center justify-between h-10 px-3 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-2">
          <Terminal className="h-3 w-3 text-zinc-500" />
          <span className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400">
            Console
          </span>
          {errorCount > 0 && (
            <Badge className="bg-red-500/15 text-red-400 border-red-500/25 text-[11px] px-1.5 py-0 font-bold tabular-nums">
              {errorCount}
            </Badge>
          )}
          {warnCount > 0 && errorCount === 0 && (
            <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/25 text-[11px] px-1.5 py-0 font-bold tabular-nums">
              {warnCount}
            </Badge>
          )}
        </div>
        {collapsed ? (
          <ChevronUp className="h-3 w-3 text-zinc-600" />
        ) : (
          <ChevronDown className="h-3 w-3 text-zinc-600" />
        )}
      </button>

      {/* Terminal body */}
      {!collapsed && (
        <div
          ref={scrollRef}
          className="h-[calc(100%-2.5rem)] overflow-y-auto overscroll-contain px-3 pb-3 font-mono"
        >
          {logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-zinc-600">
              <Terminal className="h-6 w-6 mb-2 opacity-30" />
              <p className="text-[11px]">No logs yet</p>
            </div>
          ) : (
            <div className="space-y-0.5 pt-1">
              {logs.map((log, i) => (
                <div key={`${log.timestamp}-${i}`} className="flex gap-2 leading-tight">
                  <span className="text-[11px] text-zinc-600 shrink-0 pt-px tabular-nums">
                    {log.timestamp}
                  </span>
                  <span
                    className={`text-[11px] font-bold shrink-0 pt-px w-6 ${levelStyle[log.level]}`}
                  >
                    {levelPrefix[log.level]}
                  </span>
                  <span
                    className={`text-[11px] break-all ${
                      log.level === "error"
                        ? "text-red-300/90"
                        : log.level === "warn"
                        ? "text-amber-300/80"
                        : "text-zinc-500"
                    }`}
                  >
                    {log.message}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
