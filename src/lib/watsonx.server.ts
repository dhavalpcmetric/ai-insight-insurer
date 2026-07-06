// Server-only IBM watsonx helpers. Never imported from client code.
// IAM tokens are cached in module scope for their reported lifetime.

type CachedToken = { token: string; expiresAt: number };
let cachedToken: CachedToken | undefined;

export async function getIbmIamToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + 60_000) {
    return cachedToken.token;
  }
  const apiKey = process.env.IBM_CLOUD_API_KEY;
  if (!apiKey) throw new Error("IBM_CLOUD_API_KEY is not configured");

  const res = await fetch("https://iam.cloud.ibm.com/identity/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: new URLSearchParams({
      grant_type: "urn:ibm:params:oauth:grant-type:apikey",
      apikey: apiKey,
    }),
  });
  if (!res.ok) {
    throw new Error(`IBM IAM token exchange failed (${res.status})`);
  }
  const json = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = {
    token: json.access_token,
    expiresAt: now + json.expires_in * 1000,
  };
  return cachedToken.token;
}

export function getWatsonxConfig() {
  const url = process.env.WATSONX_AGENT_URL;
  const projectId = process.env.WATSONX_PROJECT_ID;
  if (!url) throw new Error("WATSONX_AGENT_URL is not configured");
  return { url, projectId };
}
