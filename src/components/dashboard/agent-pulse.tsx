"use client";

import type { AgentPhase } from "@/types/agent";

const phaseConfig: Record<
  AgentPhase,
  { color: string; bg: string; glow: string; animation: string; label: string }
> = {
  idle: {
    color: "bg-zinc-500",
    bg: "bg-zinc-500/20",
    glow: "shadow-zinc-500/40",
    animation: "animate-pulse-slow",
    label: "Idle",
  },
  discovering: {
    color: "bg-amber-500",
    bg: "bg-amber-500/20",
    glow: "shadow-amber-500/40",
    animation: "animate-pulse-medium",
    label: "Discovering Markets",
  },
  filtering: {
    color: "bg-amber-400",
    bg: "bg-amber-400/20",
    glow: "shadow-amber-400/40",
    animation: "animate-pulse-medium",
    label: "Filtering",
  },
  researching: {
    color: "bg-blue-500",
    bg: "bg-blue-500/20",
    glow: "shadow-blue-500/40",
    animation: "animate-pulse-fast",
    label: "Researching",
  },
  analyzing: {
    color: "bg-purple-500",
    bg: "bg-purple-500/20",
    glow: "shadow-purple-500/40",
    animation: "animate-pulse-fast",
    label: "Analyzing",
  },
  executing: {
    color: "bg-green-500",
    bg: "bg-green-500/20",
    glow: "shadow-green-500/40",
    animation: "",
    label: "Executing Trade",
  },
  monitoring: {
    color: "bg-cyan-500",
    bg: "bg-cyan-500/20",
    glow: "shadow-cyan-500/40",
    animation: "animate-pulse-slow",
    label: "Monitoring",
  },
  error: {
    color: "bg-red-500",
    bg: "bg-red-500/20",
    glow: "shadow-red-500/40",
    animation: "",
    label: "Error",
  },
};

interface AgentPulseProps {
  phase: AgentPhase;
  className?: string;
}

export function AgentPulse({ phase, className = "" }: AgentPulseProps) {
  const config = phaseConfig[phase];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative flex items-center justify-center">
        {/* Outer glow ring */}
        <div
          className={`absolute h-8 w-8 rounded-full ${config.bg} ${config.animation}`}
        />
        {/* Middle ring */}
        <div
          className={`absolute h-5 w-5 rounded-full ${config.bg} ${config.animation}`}
          style={{ animationDelay: "0.15s" }}
        />
        {/* Core dot */}
        <div
          className={`relative h-3 w-3 rounded-full ${config.color} shadow-lg ${config.glow}`}
        />
      </div>
      <div className="flex flex-col">
        <span className="text-xs font-medium text-foreground/90 leading-tight">
          {config.label}
        </span>
        <span className="text-[11px] text-muted-foreground leading-tight uppercase tracking-wider">
          Agent Status
        </span>
      </div>
    </div>
  );
}
