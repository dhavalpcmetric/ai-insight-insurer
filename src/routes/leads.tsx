import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, ArrowUpDown } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatINR, type Lead } from "@/lib/mockData";
import { useLeads } from "@/lib/leadsStore";

export const Route = createFileRoute("/leads")({
  head: () => ({
    meta: [
      { title: "Lead Intelligence · Insurance AI" },
      { name: "description", content: "Search, filter, and prioritize insurance leads with AI scoring." },
    ],
  }),
  component: LeadsPage,
});

function priorityBadge(p: Lead["priority"]) {
  const map = {
    High: "bg-green-100 text-green-700 hover:bg-green-100",
    Medium: "bg-amber-100 text-amber-700 hover:bg-amber-100",
    Low: "bg-red-100 text-red-700 hover:bg-red-100",
  } as const;
  return <Badge className={map[p]}>{p}</Badge>;
}
function riskBadge(r: Lead["riskLevel"]) {
  const map = {
    "Low Risk": "bg-green-100 text-green-700 hover:bg-green-100",
    "Medium Risk": "bg-amber-100 text-amber-700 hover:bg-amber-100",
    "High Risk": "bg-red-100 text-red-700 hover:bg-red-100",
  } as const;
  return <Badge variant="outline" className={map[r]}>{r}</Badge>;
}

function LeadsPage() {
  const navigate = useNavigate();
  const LEADS = useLeads();
  const [query, setQuery] = useState("");
  const [priority, setPriority] = useState<string>("all");
  const [insurance, setInsurance] = useState<string>("all");
  const [sortKey, setSortKey] = useState<keyof Lead>("leadScore");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const filtered = useMemo(() => {
    let rows = LEADS.filter((l) => {
      const q = query.toLowerCase();
      const matches = !q || l.customerName.toLowerCase().includes(q) || l.leadId.toLowerCase().includes(q);
      const matchP = priority === "all" || l.priority === priority;
      const matchI = insurance === "all" || l.insuranceType === insurance;
      return matches && matchP && matchI;
    });
    rows = [...rows].sort((a, b) => {
      const va = a[sortKey] as number | string;
      const vb = b[sortKey] as number | string;
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return rows;
  }, [LEADS, query, priority, insurance, sortKey, sortDir]);

  const toggleSort = (k: keyof Lead) => {
    if (sortKey === k) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(k); setSortDir("desc"); }
  };

  const SortHead = ({ k, label }: { k: keyof Lead; label: string }) => (
    <TableHead>
      <button onClick={() => toggleSort(k)} className="inline-flex items-center gap-1 font-medium hover:text-foreground">
        {label}<ArrowUpDown className="h-3 w-3 opacity-50" />
      </button>
    </TableHead>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Lead Intelligence</h1>
        <p className="text-sm text-muted-foreground">AI-scored insurance leads with risk and pricing signals.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <div className="relative min-w-64 flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by name or lead ID…" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-8" />
            </div>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger className="w-44"><SelectValue placeholder="Priority" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select value={insurance} onValueChange={setInsurance}>
              <SelectTrigger className="w-52"><SelectValue placeholder="Insurance Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Insurance Types</SelectItem>
                <SelectItem value="Motor Insurance">Motor Insurance</SelectItem>
                <SelectItem value="Travel Insurance">Travel Insurance</SelectItem>
                <SelectItem value="Home Insurance">Home Insurance</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <SortHead k="leadId" label="Lead ID" />
                <SortHead k="customerName" label="Customer" />
                <SortHead k="insuranceType" label="Type" />
                <SortHead k="leadScore" label="Score" />
                <TableHead>Priority</TableHead>
                <SortHead k="conversionProbability" label="Conv. Prob." />
                <TableHead>Risk</TableHead>
                <SortHead k="suggestedPremium" label="Premium" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((l) => (
                <TableRow
                  key={l.leadId}
                  className="cursor-pointer"
                  onClick={() => navigate({ to: "/lead-details", search: { id: l.leadId } })}
                >
                  <TableCell className="font-mono text-xs">{l.leadId}</TableCell>
                  <TableCell className="font-medium">{l.customerName}</TableCell>
                  <TableCell>{l.insuranceType}</TableCell>
                  <TableCell className="font-semibold">{l.leadScore}</TableCell>
                  <TableCell>{priorityBadge(l.priority)}</TableCell>
                  <TableCell>{l.conversionProbability}%</TableCell>
                  <TableCell>{riskBadge(l.riskLevel)}</TableCell>
                  <TableCell className="font-medium">{formatINR(l.suggestedPremium)}</TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-10">No leads match the filters.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
