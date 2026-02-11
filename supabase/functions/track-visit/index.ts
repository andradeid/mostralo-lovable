import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://noshwvwpjtnvndokbfjx.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Parse user agent para extrair browser e OS
function parseBrowser(ua: string): string {
  if (!ua) return "Unknown";
  if (ua.includes("Edg/")) return "Edge";
  if (ua.includes("OPR/") || ua.includes("Opera")) return "Opera";
  if (ua.includes("Chrome") && !ua.includes("Edg")) return "Chrome";
  if (ua.includes("Safari") && !ua.includes("Chrome")) return "Safari";
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("MSIE") || ua.includes("Trident")) return "IE";
  return "Other";
}

function parseOS(ua: string): string {
  if (!ua) return "Unknown";
  if (ua.includes("Android")) return "Android";
  if (ua.includes("iPhone") || ua.includes("iPad") || ua.includes("iPod")) return "iOS";
  if (ua.includes("Windows")) return "Windows";
  if (ua.includes("Mac OS")) return "macOS";
  if (ua.includes("Linux")) return "Linux";
  if (ua.includes("CrOS")) return "Chrome OS";
  return "Other";
}

function parseDeviceType(ua: string): string {
  if (!ua) return "desktop";
  if (/Mobi|Android.*Mobile|iPhone|iPod/i.test(ua)) return "mobile";
  if (/iPad|Android(?!.*Mobile)|Tablet/i.test(ua)) return "tablet";
  return "desktop";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const {
      page_url,
      session_id,
      referrer,
      user_agent,
      utm_source,
      utm_medium,
      utm_campaign,
      utm_content,
      utm_term,
      store_id,
      event_type,
      event_label,
    } = body;

    if (!page_url) {
      return new Response(JSON.stringify({ error: "page_url is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extrair informações do user agent
    const browser = parseBrowser(user_agent || "");
    const os = parseOS(user_agent || "");
    const device_type = parseDeviceType(user_agent || "");

    // Geolocalização via headers do Supabase/Deno Deploy
    const country = req.headers.get("x-country") || req.headers.get("cf-ipcountry") || null;
    const city = req.headers.get("x-city") || req.headers.get("cf-ipcity") || null;
    const region = req.headers.get("x-region") || null;

    // IP do visitante
    const ip_address =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      null;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { error } = await supabase.from("page_visits").insert({
      page_url,
      session_id: session_id || null,
      referrer: referrer || null,
      user_agent: user_agent || null,
      device_type,
      browser,
      os,
      country,
      city,
      region,
      utm_source: utm_source || null,
      utm_medium: utm_medium || null,
      utm_campaign: utm_campaign || null,
      utm_content: utm_content || null,
      utm_term: utm_term || null,
      store_id: store_id || null,
      ip_address,
    });

    if (error) {
      console.error("Error inserting visit:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Track visit error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
