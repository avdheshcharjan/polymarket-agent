"use client";

import { useState, useEffect } from "react";
import { useSettings } from "@/hooks/use-portfolio";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Save,
  AlertTriangle,
  Shield,
  Cpu,
  DollarSign,
  Loader2,
} from "lucide-react";
import type { AgentConfig } from "@/types/agent";
import { DEFAULT_AGENT_CONFIG } from "@/types/agent";

export default function SettingsPage() {
  const { data: settings, mutate } = useSettings();
  const [config, setConfig] = useState<AgentConfig>(DEFAULT_AGENT_CONFIG);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pendingLiveMode, setPendingLiveMode] = useState(false);

  useEffect(() => {
    if (settings) {
      setConfig({ ...DEFAULT_AGENT_CONFIG, ...settings });
    }
  }, [settings]);

  async function handleSave() {
    setSaving(true);
    try {
      await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      await mutate();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  function confirmLiveMode() {
    setConfig((prev) => ({ ...prev, mode: "real" }));
    setPendingLiveMode(false);
  }

  function handleModeToggle(checked: boolean) {
    if (checked) {
      setPendingLiveMode(true);
    } else {
      setConfig((prev) => ({ ...prev, mode: "paper" }));
    }
  }

  function updateField<K extends keyof AgentConfig>(key: K, value: AgentConfig[K]) {
    setConfig((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Configure agent behavior and risk parameters
        </p>
      </div>

      {/* LLM Provider */}
      <Card className="border-white/[0.06] bg-surface-1">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10">
              <Cpu className="h-4.5 w-4.5 text-blue-500" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-foreground">
                LLM Provider
              </h3>
              <p className="text-xs text-muted-foreground">
                Choose the intelligence backend for analysis
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => updateField("llmProvider", "exa")}
              className={`flex-1 rounded-lg border px-4 py-3 text-left transition-all ${
                config.llmProvider === "exa"
                  ? "border-blue-500/40 bg-blue-500/10"
                  : "border-white/[0.06] bg-surface-2 hover:border-white/[0.1]"
              }`}
            >
              <p className="text-sm font-medium text-foreground">Exa</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Search-native intelligence
              </p>
            </button>
            <button
              onClick={() => updateField("llmProvider", "claude")}
              className={`flex-1 rounded-lg border px-4 py-3 text-left transition-all ${
                config.llmProvider === "claude"
                  ? "border-purple-500/40 bg-purple-500/10"
                  : "border-white/[0.06] bg-surface-2 hover:border-white/[0.1]"
              }`}
            >
              <p className="text-sm font-medium text-foreground">Claude</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Anthropic reasoning model
              </p>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Trading Mode */}
      <Card className="border-white/[0.06] bg-surface-1">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10">
                <Shield className="h-4.5 w-4.5 text-amber-500" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-foreground">
                  Trading Mode
                </h3>
                <p className="text-xs text-muted-foreground">
                  Paper mode uses simulated funds
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">Paper</span>

              <Dialog
                open={pendingLiveMode}
                onOpenChange={(open) => {
                  if (!open) setPendingLiveMode(false);
                }}
              >
                <DialogTrigger>
                  <Switch
                    checked={config.mode === "real"}
                    onCheckedChange={handleModeToggle}
                  />
                </DialogTrigger>
                <DialogContent className="bg-surface-1 border-white/[0.08]">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-foreground">
                      <AlertTriangle className="h-5 w-5 text-red-400" />
                      Switch to Live Trading?
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                      Live mode will execute real trades on Polymarket using your
                      connected wallet. This involves real money and cannot be undone.
                      Make sure you understand the risks before proceeding.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter className="gap-2">
                    <DialogClose render={<Button variant="outline" className="border-white/[0.08]" />}>
                      Cancel
                    </DialogClose>
                    <DialogClose render={<Button onClick={confirmLiveMode} className="bg-red-600 hover:bg-red-500 text-white border-0" />}>
                      Enable Live Trading
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <span className="text-xs text-muted-foreground">Live</span>
              {config.mode === "real" && (
                <Badge className="bg-red-500/15 text-red-400 border-red-500/20 text-[11px] uppercase tracking-wider animate-live-pulse">
                  Active
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk Parameters */}
      <Card className="border-white/[0.06] bg-surface-1">
        <CardContent className="p-5 space-y-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-500/10">
              <DollarSign className="h-4.5 w-4.5 text-green-500" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-foreground">
                Risk Parameters
              </h3>
              <p className="text-xs text-muted-foreground">
                Configure position sizing and thresholds
              </p>
            </div>
          </div>

          <Separator className="bg-white/[0.06]" />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">
                Max Position Size ($)
              </label>
              <Input
                type="number"
                value={config.maxPositionSize}
                onChange={(e) =>
                  updateField("maxPositionSize", Number(e.target.value))
                }
                className="bg-surface-2 border-white/[0.06] font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">
                Max Open Positions
              </label>
              <Input
                type="number"
                value={config.maxOpenPositions}
                onChange={(e) =>
                  updateField("maxOpenPositions", Number(e.target.value))
                }
                className="bg-surface-2 border-white/[0.06] font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">
                Min Edge (%)
              </label>
              <Input
                type="number"
                step="0.01"
                value={config.minEdge}
                onChange={(e) =>
                  updateField("minEdge", Number(e.target.value))
                }
                className="bg-surface-2 border-white/[0.06] font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">
                Min Confidence (0-1)
              </label>
              <Input
                type="number"
                step="0.05"
                value={config.minConfidence}
                onChange={(e) =>
                  updateField("minConfidence", Number(e.target.value))
                }
                className="bg-surface-2 border-white/[0.06] font-mono"
              />
            </div>
          </div>

          <Separator className="bg-white/[0.06]" />

          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">
              Starting Balance ($)
            </label>
            <Input
              type="number"
              value={config.startingBalance}
              onChange={(e) =>
                updateField("startingBalance", Number(e.target.value))
              }
              className="bg-surface-2 border-white/[0.06] font-mono max-w-xs"
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex items-center gap-3">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white border-0 shadow-lg shadow-green-500/15"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Settings
        </Button>
        {saved && (
          <span className="text-sm text-green-400 animate-slide-in-right">
            Settings saved
          </span>
        )}
      </div>
    </div>
  );
}
