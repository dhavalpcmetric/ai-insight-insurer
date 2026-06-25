import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import * as XLSX from "xlsx";
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Download, Trash2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { leadFromRow, type Lead } from "@/lib/mockData";
import { leadsStore, useLeads } from "@/lib/leadsStore";

export const Route = createFileRoute("/upload")({
  head: () => ({
    meta: [
      { title: "Upload Leads · Insurance AI" },
      { name: "description", content: "Bulk upload insurance leads from Excel or CSV for AI scoring." },
    ],
  }),
  component: UploadPage,
});

function UploadPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [message, setMessage] = useState<string>("");
  const [preview, setPreview] = useState<Lead[]>([]);
  const leads = useLeads();
  const uploadedCount = leads.filter((l) => l.leadSource === "Excel Upload" || l.leadSource === "CRM Sync").length;

  async function handleFile(file: File) {
    setStatus("processing");
    setMessage(`Reading ${file.name}…`);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });
      if (!rows.length) throw new Error("No rows found in the file.");
      const newLeads = rows.map((r, i) => leadFromRow(r, i));
      leadsStore.add(newLeads);
      setPreview(newLeads.slice(0, 5));
      setStatus("success");
      setMessage(`Successfully scored ${newLeads.length} leads from ${file.name}.`);
    } catch (e: any) {
      setStatus("error");
      setMessage(e?.message ?? "Failed to parse file.");
    }
  }

  function downloadTemplate() {
    const sample = [
      { customerName: "Rohan Sharma", age: 34, gender: "Male", city: "Mumbai", insuranceType: "Motor Insurance", vehicleType: "SUV", vehicleValue: 1800000, annualIncome: 1500000, existingCustomer: "Yes", previousClaims: 1 },
      { customerName: "Priya Iyer", age: 29, gender: "Female", city: "Bangalore", insuranceType: "Motor Insurance", vehicleType: "Sedan", vehicleValue: 900000, annualIncome: 1200000, existingCustomer: "No", previousClaims: 0 },
    ];
    const ws = XLSX.utils.json_to_sheet(sample);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Leads");
    XLSX.writeFile(wb, "leads-template.xlsx");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Upload Leads</h1>
        <p className="text-sm text-muted-foreground">
          Bulk import leads from Excel (.xlsx) or CSV. The AI engine will score, risk-rate, and price each lead automatically.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Upload className="h-5 w-5" />Upload File</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer.files?.[0];
              if (f) handleFile(f);
            }}
            className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/30 p-10 text-center transition hover:border-primary hover:bg-primary/5"
          >
            <FileSpreadsheet className="h-10 w-10 text-muted-foreground" />
            <div>
              <p className="font-medium">Drop your Excel or CSV file here</p>
              <p className="text-sm text-muted-foreground">or click to browse · supports .xlsx, .xls, .csv</p>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={downloadTemplate}>
              <Download className="mr-2 h-4 w-4" />Download template
            </Button>
            {uploadedCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  leadsStore.replace(leads.filter((l) => l.leadSource !== "Excel Upload" && l.leadSource !== "CRM Sync"));
                  setPreview([]);
                  setStatus("idle");
                  setMessage("");
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />Clear uploaded ({uploadedCount})
              </Button>
            )}
          </div>

          {status !== "idle" && (
            <div
              className={`mt-4 flex items-start gap-2 rounded-md border p-3 text-sm ${
                status === "success"
                  ? "border-green-200 bg-green-50 text-green-800"
                  : status === "error"
                    ? "border-red-200 bg-red-50 text-red-800"
                    : "border-blue-200 bg-blue-50 text-blue-800"
              }`}
            >
              {status === "success" ? <CheckCircle2 className="h-4 w-4 mt-0.5" /> : status === "error" ? <AlertCircle className="h-4 w-4 mt-0.5" /> : <Upload className="h-4 w-4 mt-0.5 animate-pulse" />}
              <span>{message}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Expected columns</CardTitle></CardHeader>
        <CardContent className="text-sm">
          <p className="text-muted-foreground mb-3">Column names are matched case-insensitively. Missing fields use sensible defaults.</p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {["customerName", "age", "gender", "city", "insuranceType", "vehicleType", "vehicleValue", "annualIncome", "existingCustomer", "previousClaims"].map((c) => (
              <Badge key={c} variant="outline" className="justify-start font-mono">{c}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {preview.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Preview (first 5 scored leads)</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {preview.map((l) => (
              <div key={l.leadId} className="flex items-center justify-between rounded-md border p-3 text-sm">
                <div>
                  <p className="font-medium">{l.customerName}</p>
                  <p className="text-xs text-muted-foreground">{l.city} · {l.insuranceType}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary">Score {l.leadScore}</Badge>
                  <Badge className={l.priority === "High" ? "bg-green-100 text-green-700" : l.priority === "Medium" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}>{l.priority}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
