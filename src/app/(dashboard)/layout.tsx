"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BarChart3,
  Search,
  History,
  Settings,
  Play,
  Brain,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AgentPulse } from "@/components/dashboard/agent-pulse";
import { ErrorTerminal } from "@/components/dashboard/error-terminal";
import { useAgentStream } from "@/hooks/use-agent-stream";
import { useSettings } from "@/hooks/use-portfolio";

const navItems = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/markets", label: "Markets", icon: BarChart3 },
  { href: "/research", label: "Research", icon: Search },
  { href: "/trades", label: "Trades", icon: History },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { connected, agentState, events, triggerRun } = useAgentStream();
  const { data: settings } = useSettings();

  const tradingMode = settings?.mode ?? "paper";

  const breadcrumb = navItems.find(
    (item) => item.href === pathname || (item.href !== "/" && pathname.startsWith(item.href))
  ) ?? navItems[0];

  return (
    <div className="flex h-screen overflow-hidden bg-surface-0">
      {/* Sidebar */}
      <aside className="flex w-64 flex-col border-r border-white/[0.06] bg-surface-1">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-white/[0.06]">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
            <Brain className="h-4.5 w-4.5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold tracking-tight text-foreground">
              PolyAgent IPL
            </span>
            <span className="text-[11px] text-muted-foreground tracking-wide uppercase">
              Cricket AI · Exa-Powered
            </span>
          </div>
        </div>

        {/* Agent Status */}
        <div className="px-5 py-4 border-b border-white/[0.06]">
          <AgentPulse phase={agentState.phase} />
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-3 space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? "bg-white/[0.08] text-foreground"
                    : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Trading Mode Badge */}
        <div className="px-5 py-4 border-t border-white/[0.06]">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">
              Mode
            </span>
            {tradingMode === "paper" ? (
              <Badge className="bg-green-500/15 text-green-400 border-green-500/20 hover:bg-green-500/15 text-[11px] uppercase tracking-wider font-semibold">
                Paper
              </Badge>
            ) : (
              <Badge className="bg-red-500/15 text-red-400 border-red-500/20 hover:bg-red-500/15 text-[11px] uppercase tracking-wider font-semibold animate-live-pulse">
                Live
              </Badge>
            )}
          </div>
          {agentState.cycleCount > 0 && (
            <p className="text-[11px] text-muted-foreground mt-2">
              {agentState.cycleCount} cycles completed
            </p>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-14 items-center justify-between border-b border-white/[0.06] bg-surface-1/50 backdrop-blur-sm px-6">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">PolyAgent</span>
            <span className="text-muted-foreground/40">/</span>
            <span className="text-foreground font-medium">
              {breadcrumb.label}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* SSE Connection indicator */}
            <div className="flex items-center gap-2">
              <div
                className={`h-2 w-2 rounded-full ${
                  connected
                    ? "bg-green-500 shadow-sm shadow-green-500/50"
                    : "bg-red-500 shadow-sm shadow-red-500/50"
                }`}
              />
              <span className="text-xs text-muted-foreground">
                {connected ? "Connected" : "Disconnected"}
              </span>
            </div>

            {/* Run Agent button */}
            <Button
              size="sm"
              onClick={triggerRun}
              disabled={agentState.isRunning}
              className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white border-0 shadow-lg shadow-blue-500/20 transition-all duration-200 disabled:opacity-50"
            >
              <Play className="h-3.5 w-3.5 mr-1.5" />
              {agentState.isRunning ? "Running..." : "Run Agent"}
            </Button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>

      {/* Error terminal */}
      <ErrorTerminal
        events={events}
        phase={agentState.phase}
        error={agentState.error}
        connected={connected}
      />
    </div>
  );
}
