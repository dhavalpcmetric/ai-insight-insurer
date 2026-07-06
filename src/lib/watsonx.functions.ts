import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// The 6 workflow stages the UI renders. Agent must reply with this shape.
const StageSchema = z.object({
  output: z.string(),
  recommendation: z.string(),
});

const WorkflowResultSchema = z.object({
  intake: StageSchema,
  prioritization: StageSchema,
  risk: StageSchema,
  pricing: StageSchema,
  recommendation: StageSchema,
  manager: StageSchema,
});

export type WorkflowStages = z.infer<typeof WorkflowResultSchema>;

const LeadInputSchema = z.object({
  leadId: z.string(),
  customerName: z.string(),
  age: z.number(),
  gender: z.string(),
  city: z.string(),
  insuranceType: z.string(),
  vehicleType: z.string(),
  vehicleValue: z.number(),
  annualIncome: z.number(),
  existingCustomer: z.boolean(),
  previousClaims: z.number(),
  leadScore: z.number().optional(),
  priority: z.string().optional(),
  conversionProbability: z.number().optional(),
  riskScore: z.number().optional(),
  riskLevel: z.string().optional(),
  suggestedPremium: z.number().optional(),
});

const SYSTEM_PROMPT = `You are an insurance lead workflow orchestrator running 6 specialized agents:
intake, prioritization, risk, pricing, recommendation, manager.
Given a lead JSON, produce a JSON object with exactly these keys: intake, prioritization,
risk, pricing, recommendation, manager. Each value must be an object with two string fields:
"output" (what the agent observed) and "recommendation" (the next action).
Return ONLY the raw JSON — no markdown, no code fences, no commentary.`;

function extractJson(text: string): unknown {
  // Strip ```json fences if the agent wrapped output
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fence ? fence[1] : text;
  // Fall back to first { … last }
  const first = raw.indexOf("{");
  const last = raw.lastIndexOf("}");
  if (first === -1 || last === -1) throw new Error("No JSON object in agent reply");
  return JSON.parse(raw.slice(first, last + 1));
}

export const runLeadWorkflow = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ lead: LeadInputSchema }).parse(input))
  .handler(async ({ data }) => {
    const { getIbmIamToken, getWatsonxConfig } = await import("./watsonx.server");

    try {
      const token = await getIbmIamToken();
      const { url, projectId } = getWatsonxConfig();

      const body: Record<string, unknown> = {
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: JSON.stringify(data.lead) },
        ],
      };
      if (projectId) body.project_id = projectId;

      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.error("watsonx agent error", res.status, text.slice(0, 500));
        return { stages: null as WorkflowStages | null, error: `Agent responded ${res.status}` };
      }

      const payload = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
        output?: string;
        result?: string;
      };
      // watsonx.ai deployed agents typically return OpenAI-compatible choices
      const text =
        payload.choices?.[0]?.message?.content ??
        payload.output ??
        payload.result ??
        "";

      const parsed = WorkflowResultSchema.safeParse(extractJson(text));
      if (!parsed.success) {
        console.error("watsonx agent schema mismatch", parsed.error.flatten());
        return { stages: null, error: "Agent reply did not match expected schema" };
      }
      return { stages: parsed.data, error: null };
    } catch (e) {
      console.error("runLeadWorkflow failed", e);
      return { stages: null as WorkflowStages | null, error: e instanceof Error ? e.message : "Unknown error" };
    }
  });
