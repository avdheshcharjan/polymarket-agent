import { EventEmitter } from "events";
import type { AgentEvent, AgentState } from "@/types/agent";

class AgentEventBus extends EventEmitter {
  private state: AgentState = {
    phase: "idle",
    isRunning: false,
    currentMarketId: null,
    currentStrategy: null,
    lastRunAt: null,
    nextRunAt: null,
    cycleCount: 0,
    error: null,
  };

  private runMutex = false;

  getState(): AgentState {
    return { ...this.state };
  }

  isLocked(): boolean {
    return this.runMutex;
  }

  acquireLock(): boolean {
    if (this.runMutex) return false;
    this.runMutex = true;
    this.state.isRunning = true;
    return true;
  }

  releaseLock(): void {
    this.runMutex = false;
    this.state.isRunning = false;
  }

  emitEvent(event: AgentEvent): void {
    if (event.type === "phase_change") {
      this.state.phase = event.phase;
    }
    if (event.type === "research_started") {
      this.state.currentMarketId = event.marketId;
      this.state.currentStrategy = event.strategy;
    }
    if (event.type === "error") {
      this.state.error = event.message;
      this.state.phase = "error";
    }
    this.emit("agent-event", event);
  }

  incrementCycle(): void {
    this.state.cycleCount++;
    this.state.lastRunAt = new Date().toISOString();
  }
}

export const agentBus = new AgentEventBus();
