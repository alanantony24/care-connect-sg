import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are helping a caregiver in Singapore prepare safe, clear instructions for a volunteer who will support a low-risk, non-medical caregiving task.

The volunteer is NOT allowed to administer medication, perform medical procedures, lift or transfer the senior, handle intimate care, or supervise high-risk medical conditions alone.

Convert the caregiver's informal note into clear volunteer-friendly instructions.

Be culturally aware for Singapore and Southeast Asia. Preserve useful local context such as ah ma, ah gong, preferred language, dialect, communication style, routines, and behavioural preferences.

Return the answer as plain text with these headings:
Summary
Preferred language
Mobility notes
Communication tips
Things to avoid
Safety reminders`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { rawNote } = await req.json();
    if (typeof rawNote !== "string" || rawNote.trim().length === 0) {
      return new Response(JSON.stringify({ error: "Please enter a care note first." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const accountId = Deno.env.get("CLOUDFLARE_ACCOUNT_ID");
    const apiToken = Deno.env.get("CLOUDFLARE_API_TOKEN");

    if (!accountId || !apiToken) {
      console.error("Missing Cloudflare AI secrets", {
        hasAccountId: Boolean(accountId),
        hasApiToken: Boolean(apiToken),
      });
      return new Response(
        JSON.stringify({ error: "AI credentials are not configured yet." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/aisingapore/gemma-sea-lion-v4-27b-it`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiToken}`,
        },
        body: JSON.stringify({
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: `Caregiver note:\n${rawNote.trim()}` },
          ],
        }),
      }
    );

    if (!aiResponse.ok) {
      const detail = await aiResponse.text();
      console.error("Cloudflare AI error", aiResponse.status, detail);
      return new Response(JSON.stringify({ error: "AI service could not generate notes." }), {
        status: aiResponse.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const json = await aiResponse.json();
    console.log("Cloudflare AI raw response:", JSON.stringify(json).slice(0, 1000));

    const r = json?.result;
    const text: string | undefined =
      (typeof r?.response === "string" ? r.response : undefined) ??
      (typeof r?.response?.response === "string" ? r.response.response : undefined) ??
      (typeof r?.output_text === "string" ? r.output_text : undefined) ??
      (Array.isArray(r?.choices) ? r.choices[0]?.message?.content : undefined) ??
      (typeof r === "string" ? r : undefined);

    if (typeof text !== "string" || text.trim().length === 0) {
      return new Response(
        JSON.stringify({
          error: "AI returned an empty response.",
          debug: json,
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ text: text.trim(), source: "sea-lion" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("care-notes function error", error);
    return new Response(JSON.stringify({ error: "Could not generate care notes." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
