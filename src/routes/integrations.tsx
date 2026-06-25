import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plug, CheckCircle2, Link2, Database, Mail, MessageSquare, Loader2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/integrations")({
  head: () => ({
    meta: [
      { title: "Integrations · Insurance AI" },
      { name: "description", content: "Connect your CRM and data sources to power AI lead intelligence." },
    ],
  }),
  component: IntegrationsPage,
});

type ConnectionState = "disconnected" | "connecting" | "connected";

function IntegrationsPage() {
  const [crm, setCrm] = useState("salesforce");
  const [endpoint, setEndpoint] = useState("https://yourcompany.my.salesforce.com");
  const [apiKey, setApiKey] = useState("");
  const [autoSync, setAutoSync] = useState(true);
  const [state, setState] = useState<ConnectionState>("disconnected");
  const [lastSync, setLastSync] = useState<string | null>(null);

  function handleConnect() {
    if (!apiKey || !endpoint) return;
    setState("connecting");
    setTimeout(() => {
      setState("connected");
      setLastSync(new Date().toLocaleString());
    }, 1400);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Integrations</h1>
        <p className="text-sm text-muted-foreground">
          Connect your CRM, communication, and data systems to feed the AI engine with live lead activity.
        </p>
      </div>

      {/* CRM Connection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plug className="h-5 w-5" />CRM Connection
            {state === "connected" && <Badge className="ml-2 bg-green-100 text-green-700"><CheckCircle2 className="mr-1 h-3 w-3" />Connected</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label>CRM Provider</Label>
            <Select value={crm} onValueChange={setCrm}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="salesforce">Salesforce</SelectItem>
                <SelectItem value="hubspot">HubSpot</SelectItem>
                <SelectItem value="zoho">Zoho CRM</SelectItem>
                <SelectItem value="dynamics">Microsoft Dynamics 365</SelectItem>
                <SelectItem value="pipedrive">Pipedrive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Environment</Label>
            <Select defaultValue="production">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="production">Production</SelectItem>
                <SelectItem value="sandbox">Sandbox</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2 md:col-span-2">
            <Label>API Endpoint / Instance URL</Label>
            <Input value={endpoint} onChange={(e) => setEndpoint(e.target.value)} placeholder="https://yourcompany.my.salesforce.com" />
          </div>
          <div className="grid gap-2 md:col-span-2">
            <Label>API Key / Access Token</Label>
            <Input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="••••••••••••••••" />
            <p className="text-xs text-muted-foreground">Credentials are encrypted at rest. Required scopes: Leads.Read, Leads.Write, Contacts.Read.</p>
          </div>
          <div className="grid gap-2">
            <Label>Sync Frequency</Label>
            <Select defaultValue="15min">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="realtime">Real-time (webhook)</SelectItem>
                <SelectItem value="5min">Every 5 minutes</SelectItem>
                <SelectItem value="15min">Every 15 minutes</SelectItem>
                <SelectItem value="hourly">Hourly</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <div className="flex items-center justify-between gap-3 rounded-md border p-3 w-full">
              <div>
                <Label className="text-sm">Auto-sync new leads</Label>
                <p className="text-xs text-muted-foreground">Auto-score incoming leads with AI.</p>
              </div>
              <Switch checked={autoSync} onCheckedChange={setAutoSync} />
            </div>
          </div>

          <div className="md:col-span-2 flex flex-wrap items-center gap-3 pt-2">
            <Button onClick={handleConnect} disabled={state === "connecting" || !apiKey || !endpoint}>
              {state === "connecting" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {state === "connected" ? "Reconnect" : "Test & Connect"}
            </Button>
            {state === "connected" && (
              <Button variant="outline" onClick={() => { setLastSync(new Date().toLocaleString()); }}>
                Sync now
              </Button>
            )}
            {lastSync && <span className="text-xs text-muted-foreground">Last sync: {lastSync}</span>}
          </div>
        </CardContent>
      </Card>

      {/* Other connectors */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <ConnectorCard name="PostgreSQL Data Warehouse" desc="Pull historical claims, policies, and demographic features." icon={Database} status="Connected" />
        <ConnectorCard name="Email Gateway (SMTP)" desc="Trigger personalized outreach for high-priority leads." icon={Mail} status="Configure" />
        <ConnectorCard name="WhatsApp Business API" desc="Send quotes and policy documents directly." icon={MessageSquare} status="Configure" />
        <ConnectorCard name="Webhook Endpoint" desc="Stream new leads from your website forms." icon={Link2} status="Connected" />
      </div>
    </div>
  );
}

function ConnectorCard({ name, desc, icon: Icon, status }: { name: string; desc: string; icon: React.ElementType; status: "Connected" | "Configure" }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </div>
          {status === "Connected" ? (
            <Badge className="bg-green-100 text-green-700"><CheckCircle2 className="mr-1 h-3 w-3" />Connected</Badge>
          ) : (
            <Badge variant="outline">Not configured</Badge>
          )}
        </div>
        <h3 className="mt-3 font-semibold">{name}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
        <Button size="sm" variant={status === "Connected" ? "outline" : "default"} className="mt-3">
          {status === "Connected" ? "Manage" : "Configure"}
        </Button>
      </CardContent>
    </Card>
  );
}
