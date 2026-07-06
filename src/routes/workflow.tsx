import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown, Upload, Target, ShieldAlert, IndianRupee, MessageSquare, LayoutDashboard,
  CheckCircle2, Activity, RefreshCw, AlertCircle, Loader2,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/mockData";
import { useLeads } from "@/lib/leadsStore";
import { runLeadWorkflow, type WorkflowStages } from "@/lib/watsonx.functions";

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

const STAGE_META = [
  { key: "intake",         icon: Upload,          name: "Lead Intake Agent" },
  { key: "prioritization", icon: Target,          name: "Lead Prioritization Agent" },
  { key: "risk",           icon: ShieldAlert,     name: "Risk Assessment Agent" },
  { key: "pricing",        icon: IndianRupee,     name: "Pricing Agent" },
  { key: "recommendation", icon: MessageSquare,   name: "Sales Recommendation Agent" },
  { key: "manager",        icon: LayoutDashboard, name: "Manager Dashboard" },
] as const;

function fallbackStages(sample: ReturnType<typeof useLeads>[number]): WorkflowStages {
  return {
    intake:         { output: `Lead ${sample.leadId} ingested from ${sample.leadSource}`, recommendation: "Forwarded for prioritization." },
    prioritization: { output: `Score ${sample.leadScore}/100 · ${sample.conversionProbability}% conversion probability`, recommendation: `${sample.priority} priority. Route to senior advisor.` },
    risk:           { output: `Risk score ${sample.riskScore} · ${sample.riskLevel}`, recommendation: "Factors: age, claims history, vehicle profile." },
    pricing:        { output: `Suggested premium ${formatINR(sample.suggestedPremium)}`, recommendation: "Aligned with risk band and competitive market rate." },
    recommendation: { output: sample.aiSummary, recommendation: sample.nextBestAction },
    manager:        { output: "Lead surfaced with full AI context.", recommendation: "Ready for advisor pick-up." },
  };
}

function WorkflowPage() {
  const leads = useLeads();
  const [tick, setTick] = useState(0);
  const [cursor, setCursor] = useState(0);
  const runWorkflow = useServerFn(runLeadWorkflow);

  useEffect(() => {
    const tickInt = setInterval(() => setTick((t) => t + 1), 1000);
    const advanceInt = setInterval(() => setCursor((c) => c + 1), 15000);
    return () => { clearInterval(tickInt); clearInterval(advanceInt); };
  }, []);

  const highPriority = useMemo(() => leads.filter((l) => l.priority === "High"), [leads]);
  const sample = highPriority.length ? highPriority[cursor % highPriority.length] : leads[cursor % leads.length];

  const { data, isFetching, error, refetch, isError } = useQuery({
    queryKey: ["workflow", sample.leadId],
    queryFn: () => runWorkflow({ data: { lead: {
      leadId: sample.leadId, customerName: sample.customerName, age: sample.age, gender: sample.gender,
      city: sample.city, insuranceType: sample.insuranceType, vehicleType: sample.vehicleType,
      vehicleValue: sample.vehicleValue, annualIncome: sample.annualIncome,
      existingCustomer: sample.existingCustomer, previousClaims: sample.previousClaims,
      leadScore: sample.leadScore, priority: sample.priority,
      conversionProbability: sample.conversionProbability, riskScore: sample.riskScore,
      riskLevel: sample.riskLevel, suggestedPremium: sample.suggestedPremium,
    } } }),
    staleTime: 60_000,
    retry: false,
  });

  const stages: WorkflowStages = data?.stages ?? fallbackStages(sample);
  const usingFallback = !data?.stages;
  const backendError = data?.error ?? (isError ? (error as Error)?.message : null);

  const activity = useMemo(() => {
    const pool = highPriority.length ? highPriority : leads;
    return Array.from({ length: 6 }).map((_, i) => {
      const lead = pool[(cursor + i) % pool.length];
      return { lead, ts: new Date(Date.now() - i * 1000 * (30 + i * 17)) };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursor, leads, highPriority, tick]);

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
            {isFetching ? "Running IBM watsonx agents…" : `Live · ${leads.length} leads in pipeline`}
          </Badge>
          <Button variant="outline" size="sm" onClick={() => { setCursor((c) => c + 1); }}>
            <RefreshCw className="mr-2 h-3.5 w-3.5" />Next lead
          </Button>
          <Button variant="ghost" size="sm" onClick={() => refetch()}>
            <RefreshCw className={`mr-2 h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />Re-run
          </Button>
        </div>
      </div>

      {backendError && (
        <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <AlertCircle className="mt-0.5 h-4 w-4" />
          <div>
            <p className="font-medium">IBM watsonx orchestrator unavailable — showing local reasoning.</p>
            <p className="text-xs text-amber-800/80">{backendError}. Configure IBM_CLOUD_API_KEY, WATSONX_AGENT_URL and WATSONX_PROJECT_ID.</p>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-3">
          {STAGE_META.map((meta, idx) => {
            const s = stages[meta.key];
            return (
              <div key={meta.key}>
                <Card className="border-l-4 border-l-primary transition hover:shadow-md">
                  <CardContent className="flex gap-4 p-5">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <meta.icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-semibold">{meta.name}</h3>
                        <Badge variant={idx === STAGE_META.length - 1 ? "default" : "secondary"} className="gap-1">
                          {isFetching ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                          {isFetching ? "Running" : usingFallback ? "Local" : "Live"}
                        </Badge>
                      </div>
                      <p className="mt-2 text-sm"><span className="text-muted-foreground">Output: </span>{s.output}</p>
                      <p className="mt-1 text-sm"><span className="text-muted-foreground">Recommendation: </span>{s.recommendation}</p>
                    </div>
                  </CardContent>
                </Card>
                {idx < STAGE_META.length - 1 && (
                  <div className="flex justify-center py-1">
                    <ArrowDown className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

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
