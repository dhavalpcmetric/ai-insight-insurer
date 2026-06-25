import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings · Insurance AI" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Configure AI thresholds and notification preferences.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>AI Scoring Thresholds</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label>High priority threshold</Label>
              <Input defaultValue={80} type="number" />
            </div>
            <div className="grid gap-2">
              <Label>Medium priority threshold</Label>
              <Input defaultValue={50} type="number" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Notifications</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Row label="Email alerts for high-priority leads" defaultChecked />
            <Row label="Daily executive summary" defaultChecked />
            <Row label="Risk escalation alerts" />
            <Row label="Slack notifications" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, defaultChecked }: { label: string; defaultChecked?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <Label className="text-sm">{label}</Label>
      <Switch defaultChecked={defaultChecked} />
    </div>
  );
}
