import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { z } from "zod";
import {
  User, MapPin, Calendar, Briefcase, TrendingUp, ShieldAlert, IndianRupee, Sparkles, ArrowRight, Phone,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/mockData";
import { useLeads } from "@/lib/leadsStore";

const searchSchema = z.object({ id: z.string().optional() });

export const Route = createFileRoute("/lead-details")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Lead Details · Insurance AI" },
      { name: "description", content: "Detailed AI analysis for an individual insurance lead." },
    ],
  }),
  component: LeadDetails,
});

function LeadDetails() {
  const { id } = Route.useSearch();
  const LEADS = useLeads();
  const lead = useMemo(() => LEADS.find((l) => l.leadId === id) ?? LEADS[0], [id, LEADS]);

  const priorityColor = lead.priority === "High" ? "text-green-600" : lead.priority === "Medium" ? "text-amber-600" : "text-red-600";
  const riskColor = lead.riskLevel === "Low Risk" ? "text-green-600" : lead.riskLevel === "Medium Risk" ? "text-amber-600" : "text-red-600";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{lead.customerName}</h1>
          <p className="text-sm text-muted-foreground">{lead.leadId} · {lead.insuranceType}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild><Link to="/leads">Back to list</Link></Button>
          <Button><Phone className="mr-2 h-4 w-4" />Contact Customer</Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Customer Info */}
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle className="flex items-center gap-2"><User className="h-5 w-5" />Customer Information</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Info label="Age" value={`${lead.age} years`} />
            <Info label="Gender" value={lead.gender} />
            <Info label="City" value={lead.city} icon={MapPin} />
            <Info label="Annual Income" value={formatINR(lead.annualIncome)} icon={Briefcase} />
            <Info label="Existing Customer" value={lead.existingCustomer ? "Yes" : "No"} />
            <Info label="Previous Claims" value={lead.previousClaims.toString()} />
            <Info label="Vehicle Type" value={lead.vehicleType} />
            <Info label="Vehicle Value" value={formatINR(lead.vehicleValue)} />
            <Info label="Lead Source" value={lead.leadSource} />
            <Info label="Lead Date" value={lead.leadDate} icon={Calendar} />
          </CardContent>
        </Card>

        {/* Analysis */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5" />Lead Analysis</CardTitle></CardHeader>
            <CardContent className="grid gap-6 sm:grid-cols-3">
              <Metric label="Lead Score" value={lead.leadScore} suffix="/100" />
              <div>
                <p className="text-sm text-muted-foreground">Priority</p>
                <p className={`mt-2 text-3xl font-bold ${priorityColor}`}>{lead.priority}</p>
              </div>
              <Metric label="Conversion Probability" value={lead.conversionProbability} suffix="%" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><ShieldAlert className="h-5 w-5" />Risk Assessment</CardTitle></CardHeader>
            <CardContent className="grid gap-6 sm:grid-cols-2">
              <Metric label="Risk Score" value={lead.riskScore} suffix="/100" />
              <div>
                <p className="text-sm text-muted-foreground">Risk Level</p>
                <p className={`mt-2 text-3xl font-bold ${riskColor}`}>{lead.riskLevel}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><IndianRupee className="h-5 w-5" />Pricing Recommendation</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Suggested Annual Premium</p>
              <p className="mt-1 text-4xl font-bold text-primary">{formatINR(lead.suggestedPremium)}</p>
              <p className="mt-2 text-xs text-muted-foreground">Calculated from risk profile, vehicle value, and claim history.</p>
            </CardContent>
          </Card>

          <Card className="border-primary/30 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" />AI Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Badge variant="secondary" className="mb-2">AI Summary</Badge>
                <p className="text-sm">{lead.aiSummary}</p>
              </div>
              <div>
                <Badge className="mb-2">Next Best Action <ArrowRight className="ml-1 h-3 w-3" /></Badge>
                <p className="text-sm font-medium">{lead.nextBestAction}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value, icon: Icon }: { label: string; value: string; icon?: React.ElementType }) {
  return (
    <div className="flex items-center justify-between border-b py-2 last:border-0">
      <span className="flex items-center gap-2 text-muted-foreground">
        {Icon && <Icon className="h-3.5 w-3.5" />}{label}
      </span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function Metric({ label, value, suffix }: { label: string; value: number; suffix?: string }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-bold">{value}<span className="text-base text-muted-foreground">{suffix}</span></p>
      <Progress value={value} className="mt-2" />
    </div>
  );
}
