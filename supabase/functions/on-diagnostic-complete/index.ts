/* ============================================================
   IGNEA LABS — Edge Function: on-diagnostic-complete
   Triggered after a diagnostic submission is saved to Supabase.
   1. Sends email notification via Resend (< 60s)
   2. Runs Claude AI analysis on the diagnostic data
   3. Stores AI analysis back in the diagnostics row
   4. Creates an engagement row for CRM pipeline
   ============================================================ */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;
const NOTIFY_EMAIL = Deno.env.get("NOTIFY_EMAIL") || "team@ignealabs.com";
const SITE_URL = Deno.env.get("SITE_URL") || "https://ignealabs.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const { diagnostic_id } = await req.json();

    if (!diagnostic_id) {
      return new Response(
        JSON.stringify({ error: "diagnostic_id required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // 1. Fetch the diagnostic row
    const { data: diag, error: fetchErr } = await supabase
      .from("diagnostics")
      .select("*")
      .eq("id", diagnostic_id)
      .single();

    if (fetchErr || !diag) {
      return new Response(
        JSON.stringify({ error: "Diagnostic not found", detail: fetchErr?.message }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Send email notification via Resend (fire immediately, don't block on AI)
    const emailPromise = sendNotification(diag);

    // 3. Run AI analysis via Claude
    const aiPromise = runAIAnalysis(diag);

    // Wait for both in parallel
    const [emailResult, analysis] = await Promise.all([emailPromise, aiPromise]);

    // 4. Update diagnostic with AI analysis
    await supabase
      .from("diagnostics")
      .update({ ai_analysis: analysis, status: "analyzed" })
      .eq("id", diagnostic_id);

    // 5. Create engagement for CRM pipeline
    await supabase.from("engagements").insert([
      {
        diagnostic_id: diagnostic_id,
        pipeline_stage: "new",
        notes: `Auto-created: ${diag.company_name} (${diag.industry}) — Score ${diag.total_score}/100`,
      },
    ]);

    return new Response(
      JSON.stringify({
        ok: true,
        email_sent: emailResult.ok,
        ai_analyzed: !analysis.parse_error,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Internal error", detail: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

/* ---- EMAIL NOTIFICATION VIA RESEND ---- */

interface DiagRow {
  id: string;
  contact_name: string;
  contact_email: string;
  contact_phone?: string;
  company_name: string;
  industry?: string;
  company_size?: string;
  total_score?: number;
  level?: string;
  scores_json?: Record<string, number>;
  roi_json?: Record<string, number>;
  language?: string;
  created_at: string;
}

async function sendNotification(diag: DiagRow): Promise<{ ok: boolean; error?: string }> {
  if (!RESEND_API_KEY || RESEND_API_KEY === "RESEND_API_KEY") {
    return { ok: false, error: "Resend API key not configured" };
  }

  const roi = diag.roi_json || {};
  const scores = diag.scores_json || {};
  const monthlyCost = (roi as Record<string, number>).totalMonthlyCost;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: #08080D; color: #EAEAF0; padding: 32px;">
  <div style="max-width: 560px; margin: 0 auto;">
    <h2 style="color: #00E5BF; margin-bottom: 4px;">New Diagnostic Submission</h2>
    <p style="color: #6E6E88; font-size: 13px; margin-top: 0;">${new Date(diag.created_at).toLocaleString("en-US", { timeZone: "America/Puerto_Rico" })}</p>

    <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
      <tr><td style="padding:6px 0; color:#6E6E88; width:120px;">Contact</td><td style="padding:6px 0;">${diag.contact_name}</td></tr>
      <tr><td style="padding:6px 0; color:#6E6E88;">Email</td><td style="padding:6px 0;"><a href="mailto:${diag.contact_email}" style="color:#00E5BF;">${diag.contact_email}</a></td></tr>
      ${diag.contact_phone ? `<tr><td style="padding:6px 0; color:#6E6E88;">Phone</td><td style="padding:6px 0;">${diag.contact_phone}</td></tr>` : ""}
      <tr><td style="padding:6px 0; color:#6E6E88;">Company</td><td style="padding:6px 0;">${diag.company_name}</td></tr>
      <tr><td style="padding:6px 0; color:#6E6E88;">Industry</td><td style="padding:6px 0;">${diag.industry || "N/A"}</td></tr>
      <tr><td style="padding:6px 0; color:#6E6E88;">Size</td><td style="padding:6px 0;">${diag.company_size || "N/A"} employees</td></tr>
    </table>

    <div style="background: #0E0E16; border: 1px solid #1A1A2A; padding: 16px; margin: 16px 0;">
      <p style="margin: 0 0 8px; color: #6E6E88; font-size: 11px; text-transform: uppercase; letter-spacing: 2px;">Score</p>
      <p style="margin: 0; font-size: 32px; font-weight: 700; color: #00E5BF;">${diag.total_score ?? "—"}<span style="font-size: 16px; color: #6E6E88;">/100</span></p>
      <p style="margin: 4px 0 0; color: #6E6E88; text-transform: capitalize;">${diag.level || "N/A"}</p>
    </div>

    ${monthlyCost ? `<p style="color: #F0997B;">Monthly cost of inaction: <strong>$${Math.round(monthlyCost).toLocaleString("en-US")}</strong></p>` : ""}

    <div style="margin-top: 24px;">
      <a href="${SITE_URL}/results.html?id=${diag.id}" style="display:inline-block; background:#00E5BF; color:#08080D; padding:12px 24px; text-decoration:none; font-weight:600;">View Full Report</a>
    </div>

    <p style="color: #3A3A50; font-size: 11px; margin-top: 32px;">Ignea Labs — Operational Intelligence for PR SMBs</p>
  </div>
</body>
</html>`;

  try {
    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Ignea Labs <diagnostics@ignealabs.com>",
        to: [NOTIFY_EMAIL],
        subject: `[Ignea] ${diag.company_name} — ${diag.total_score ?? "?"}/100 (${diag.level || "new"})`,
        html: html,
      }),
    });

    if (!resp.ok) {
      const errBody = await resp.text();
      return { ok: false, error: errBody };
    }

    return { ok: true };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

/* ---- AI ANALYSIS VIA CLAUDE ---- */

interface AIAnalysis {
  executive_summary_es?: string;
  executive_summary_en?: string;
  top_opportunities?: Array<{
    area: string;
    impact_es: string;
    impact_en: string;
    estimated_savings: number;
  }>;
  recommended_solutions?: Array<{
    name_es: string;
    name_en: string;
    description_es: string;
    description_en: string;
    priority: number;
  }>;
  risk_assessment_es?: string;
  risk_assessment_en?: string;
  quick_wins?: string[];
  parse_error?: boolean;
  raw?: string;
}

async function runAIAnalysis(diag: DiagRow): Promise<AIAnalysis> {
  if (!ANTHROPIC_API_KEY || ANTHROPIC_API_KEY === "ANTHROPIC_API_KEY") {
    return { parse_error: true, raw: "Anthropic API key not configured" };
  }

  const prompt = `You are an operational efficiency consultant specializing in SMBs in Puerto Rico.

Analyze this diagnostic submission and provide actionable recommendations.

COMPANY: ${diag.company_name}
INDUSTRY: ${diag.industry || "general"}
SIZE: ${diag.company_size || "unknown"} employees
LANGUAGE: ${diag.language || "es"}

SCORES (0-25 per stream, 100 total):
${JSON.stringify(diag.scores_json, null, 2)}

TOTAL SCORE: ${diag.total_score}/100 (Level: ${diag.level})

ROI ANALYSIS:
${JSON.stringify(diag.roi_json, null, 2)}

Provide a JSON response with these exact keys:
{
  "executive_summary_es": "2-3 sentence overview in Spanish",
  "executive_summary_en": "2-3 sentence overview in English",
  "top_opportunities": [
    {
      "area": "stream name or business area",
      "impact_es": "1-2 sentence impact description in Spanish",
      "impact_en": "1-2 sentence impact description in English",
      "estimated_savings": monthly_dollar_amount_number
    }
  ],
  "recommended_solutions": [
    {
      "name_es": "Solution name in Spanish",
      "name_en": "Solution name in English",
      "description_es": "1-2 sentence description in Spanish",
      "description_en": "1-2 sentence description in English",
      "priority": 1
    }
  ],
  "risk_assessment_es": "1-2 sentences on cost of inaction in Spanish",
  "risk_assessment_en": "1-2 sentences on cost of inaction in English",
  "quick_wins": ["3 things they can do this week, in Spanish"]
}

RULES:
- Keep language practical and direct. These are busy Puerto Rico business owners, not Fortune 500 executives.
- Use realistic dollar amounts (not inflated).
- Include exactly 3 top_opportunities and 3 recommended_solutions.
- Quick wins should be concrete actions, not vague advice.
- Respond ONLY with valid JSON. No markdown, no explanation.`;

  try {
    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1500,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      return { parse_error: true, raw: `API error ${resp.status}: ${errText}` };
    }

    const result = await resp.json();
    const text = result.content?.[0]?.text || "";

    try {
      return JSON.parse(text) as AIAnalysis;
    } catch {
      return { parse_error: true, raw: text };
    }
  } catch (err) {
    return { parse_error: true, raw: (err as Error).message };
  }
}
