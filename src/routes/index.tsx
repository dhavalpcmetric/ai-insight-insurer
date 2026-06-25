import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { TrendingUp, Users, Target, IndianRupee, Sparkles } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatINR } from "@/lib/mockData";
import { useLeads } from "@/lib/leadsStore";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Executive Dashboard · Insurance AI" },
      { name: "description", content: "KPIs and AI insights for insurance lead pipeline." },
    ],
  }),
  component: Dashboard,
});

const PRIORITY_COLORS: Record<string, string> = {
  High: "hsl(142 71% 45%)",
  Medium: "hsl(38 92% 50%)",
  Low: "hsl(0 84% 60%)",
};
const RISK_COLORS: Record<string, string> = {
  "Low Risk": "hsl(142 71% 45%)",
  "Medium Risk": "hsl(38 92% 50%)",
  "High Risk": "hsl(0 84% 60%)",
};

function KpiCard({ label, value, icon: Icon, hint }: { label: string; value: string; icon: React.ElementType; hint?: string }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
            {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Dashboard() {
  const LEADS = useLeads();
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const i = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(i);
  }, []);

  const stats = useMemo(() => {
    const total = LEADS.length || 1;
    const high = LEADS.filter((l) => l.priority === "High").length;
    const medium = LEADS.filter((l) => l.priority === "Medium").length;
    const low = LEADS.filter((l) => l.priority === "Low").length;
    const avgConv = Math.round(LEADS.reduce((s, l) => s + l.conversionProbability, 0) / total);
    const revenue = LEADS.reduce((s, l) => s + l.suggestedPremium * (l.conversionProbability / 100), 0);

    const priorityData = [
      { name: "High", value: high },
      { name: "Medium", value: medium },
      { name: "Low", value: low },
    ];
    const riskData = (["Low Risk", "Medium Risk", "High Risk"] as const).map((r) => ({
      name: r,
      value: LEADS.filter((l) => l.riskLevel === r).length,
    }));
    const sources = ["Website", "Mobile App", "Call Center", "Agent", "Broker", "Excel Upload", "CRM Sync"]
      .map((s) => ({ name: s, leads: LEADS.filter((l) => l.leadSource === s).length }))
      .filter((s) => s.leads > 0);
    const monthMap: Record<string, number> = {};
    LEADS.forEach((l) => {
      const m = l.leadDate.slice(0, 7);
      monthMap[m] = (monthMap[m] ?? 0) + l.suggestedPremium * (l.conversionProbability / 100);
    });
    const forecast = Object.entries(monthMap)
      .sort()
      .map(([m, v]) => ({ month: m, revenue: Math.round(v) }));

    return { total: LEADS.length, high, avgConv, revenue, priorityData, riskData, sources, forecast };
  }, [LEADS]);

  return (
    <div className="space-y-6">
      {/* Story Banner */}
      <Card className="overflow-hidden border-0 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
        <CardContent className="flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-foreground/15">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">AI-Powered Insurance Pricing & Lead Intelligence</h1>
              <p className="mt-1 max-w-2xl text-sm opacity-90">
                Prioritize high-value insurance leads, assess risk intelligently, and accelerate policy conversion using Agentic AI.
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <Badge variant="secondary" className="w-fit gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
              </span>
              Live · General Insurance · P&C
            </Badge>
            <span className="text-[11px] opacity-80">Updated {now.toLocaleTimeString()}</span>
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Total Leads" value={stats.total.toString()} icon={Users} hint="Last 60 days" />
        <KpiCard label="High Priority Leads" value={stats.high.toString()} icon={Target} hint={`${Math.round((stats.high / stats.total) * 100)}% of pipeline`} />
        <KpiCard label="Avg. Conversion Probability" value={`${stats.avgConv}%`} icon={TrendingUp} hint="AI-predicted" />
        <KpiCard label="Potential Premium Revenue" value={formatINR(stats.revenue)} icon={IndianRupee} hint="Probability-weighted" />
      </div>

      {/* Charts */}
      <ClientOnly fallback={<div className="h-[300px] rounded-lg border bg-card" />}>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Lead Priority Distribution</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={stats.priorityData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={95} paddingAngle={2}>
                  {stats.priorityData.map((d) => <Cell key={d.name} fill={PRIORITY_COLORS[d.name]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Risk Distribution</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={stats.riskData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={95} paddingAngle={2}>
                  {stats.riskData.map((d) => <Cell key={d.name} fill={RISK_COLORS[d.name]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Leads by Source</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={stats.sources}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="leads" fill="hsl(217 91% 60%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Premium Revenue Forecast</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={stats.forecast}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis fontSize={12} tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`} />
                <Tooltip formatter={(v: number) => formatINR(v)} />
                <Bar dataKey="revenue" fill="hsl(142 71% 45%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      </ClientOnly>
    </div>
  );
}
