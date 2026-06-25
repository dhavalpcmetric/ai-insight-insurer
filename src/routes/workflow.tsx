import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown, Upload, Target, ShieldAlert, IndianRupee, MessageSquare, LayoutDashboard,
  CheckCircle2, Activity, RefreshCw,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/mockData";
import { useLeads } from "@/lib/leadsStore";

export const Route = createFileRoute("/workflow")({
  head: () => ({
    meta: [
      { title: "AI Workflow · Insurance AI" },
      { name: "description", content: "Live agentic AI pipeline processing insurance leads in real time." },
    ],
  }),
  component: WorkflowPage,
});

function timeAgo(d: Date): string {
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

function WorkflowPage() {
  const leads = useLeads();
  const [tick, setTick] = useState(0);
  const [cursor, setCursor] = useState(0);

  // Auto-advance through leads every 8 seconds; auto-refresh "time ago" every second
  useEffect(() => {
    const tickInt = setInterval(() => setTick((t) => t + 1), 1000);
    const advanceInt = setInterval(() => setCursor((c) => c + 1), 8000);
    return () => { clearInterval(tickInt); clearInterval(advanceInt); };
  }, []);

  const highPriority = useMemo(() => leads.filter((l) => l.priority === "High"), [leads]);
  const sample = highPriority.length ? highPriority[cursor % highPriority.length] : leads[cursor % leads.length];

  // Live activity feed — last 6 leads processed, with timestamps
  const activity = useMemo(() => {
    const pool = highPriority.length ? highPriority : leads;
    return Array.from({ length: 6 }).map((_, i) => {
      const lead = pool[(cursor + i) % pool.length];
      return {
        lead,
        ts: new Date(Date.now() - i * 1000 * (30 + i * 17)),
      };
    });
  }, [cursor, leads, highPriority, tick]);

  const agents = [
    { icon: Upload, name: "Lead Intake Agent", output: `Lead ${sample.leadId} ingested from ${sample.leadSource}`, recommendation: "Forwarded for prioritization." },
    { icon: Target, name: "Lead Prioritization Agent", output: `Score ${sample.leadScore}/100 · ${sample.conversionProbability}% conversion probability`, recommendation: `${sample.priority} priority. Route to senior advisor.` },
    { icon: ShieldAlert, name: "Risk Assessment Agent", output: `Risk score ${sample.riskScore} · ${sample.riskLevel}`, recommendation: "Factors: age, claims history, vehicle profile." },
    { icon: IndianRupee, name: "Pricing Agent", output: `Suggested premium ${formatINR(sample.suggestedPremium)}`, recommendation: "Aligned with risk band and competitive market rate." },
    { icon: MessageSquare, name: "Sales Recommendation Agent", output: sample.aiSummary, recommendation: sample.nextBestAction },
    { icon: LayoutDashboard, name: "Manager Dashboard", output: "Lead surfaced with full AI context.", recommendation: "Ready for advisor pick-up." },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Agentic AI Workflow</h1>
          <p className="text-sm text-muted-foreground">
            Multi-agent pipeline currently processing lead <span className="font-mono">{sample.leadId}</span> — {sample.customerName}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
            </span>
            Live · {leads.length} leads in pipeline
          </Badge>
          <Button variant="outline" size="sm" onClick={() => setCursor((c) => c + 1)}>
            <RefreshCw className="mr-2 h-3.5 w-3.5" />Next lead
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Pipeline */}
        <div className="lg:col-span-2 space-y-3">
          {agents.map((a, idx) => (
            <div key={a.name}>
              <Card className="border-l-4 border-l-primary transition hover:shadow-md">
                <CardContent className="flex gap-4 p-5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <a.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-semibold">{a.name}</h3>
                      <Badge variant={idx === agents.length - 1 ? "default" : "secondary"} className="gap-1">
                        <CheckCircle2 className="h-3 w-3" />{idx === agents.length - 1 ? "Live" : "Completed"}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm"><span className="text-muted-foreground">Output: </span>{a.output}</p>
                    <p className="mt-1 text-sm"><span className="text-muted-foreground">Recommendation: </span>{a.recommendation}</p>
                  </div>
                </CardContent>
              </Card>
              {idx < agents.length - 1 && (
                <div className="flex justify-center py-1">
                  <ArrowDown className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Live Activity Feed */}
        <Card className="h-fit lg:sticky lg:top-20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5" />Live Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activity.map(({ lead, ts }, i) => (
              <div key={`${lead.leadId}-${i}`} className="flex items-start gap-3 rounded-md border p-3 text-sm">
                <div className={`mt-1 h-2 w-2 shrink-0 rounded-full ${lead.priority === "High" ? "bg-green-500" : lead.priority === "Medium" ? "bg-amber-500" : "bg-red-500"}`} />
                <div className="flex-1 min-w-0">
                  <p className="truncate font-medium">{lead.customerName}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {lead.priority} · {lead.riskLevel} · {formatINR(lead.suggestedPremium)}
                  </p>
                  <p className="mt-1 text-[10px] text-muted-foreground">{timeAgo(ts)}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
