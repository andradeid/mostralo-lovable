import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

// Lista de user-agents de crawlers de redes sociais
const CRAWLER_AGENTS = [
  "facebookexternalhit",
  "Facebot",
  "Twitterbot",
  "WhatsApp",
  "TelegramBot",
  "LinkedInBot",
  "Slackbot",
  "Discordbot",
  "Googlebot",
  "bingbot",
];

function isCrawler(userAgent: string): boolean {
  return CRAWLER_AGENTS.some((bot) =>
    userAgent.toLowerCase().includes(bot.toLowerCase())
  );
}

function escapeHtml(str: string): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const slug = url.searchParams.get("slug");

  if (!slug) {
    return new Response("Missing slug", { status: 400 });
  }

  // Buscar dados da página legacy
  const { data: page, error } = await supabase
    .from("store_legacy_pages")
    .select("store_name, subtitle, logo_url, og_title, og_description, og_image, slug")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (error || !page) {
    return new Response("Page not found", { status: 404 });
  }

  const title = escapeHtml(page.og_title || page.store_name || "Mostralo");
  const description = escapeHtml(page.og_description || page.subtitle || "");
  const image = page.og_image || page.logo_url || "";
  const pageUrl = `https://mostralo.com.br/p/${page.slug}`;

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <meta name="description" content="${description}" />

  <!-- Open Graph -->
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:url" content="${pageUrl}" />
  <meta property="og:site_name" content="Mostralo" />
  <meta property="og:locale" content="pt_BR" />
  ${image ? `<meta property="og:image" content="${escapeHtml(image)}" />
  <meta property="og:image:width" content="800" />
  <meta property="og:image:height" content="600" />` : ""}

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  ${image ? `<meta name="twitter:image" content="${escapeHtml(image)}" />` : ""}

  <!-- Redirect para o SPA -->
  <meta http-equiv="refresh" content="0;url=${pageUrl}" />
</head>
<body>
  <p>Redirecionando para <a href="${pageUrl}">${title}</a>...</p>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=600",
    },
  });
});
