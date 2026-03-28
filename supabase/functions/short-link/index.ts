import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
};

// Gerar ID curto de 6 caracteres
function generateShortId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const { action } = body;

    // ========== CREATE LOCATION SHORT LINK (existing) ==========
    if (action === 'create') {
      const { lat, lng, storeSlug, address } = body;

      // Verificar se já existe um link para essas coordenadas e loja
      const { data: existing } = await supabase
        .from('short_links')
        .select('id')
        .eq('store_slug', storeSlug)
        .eq('lat', lat)
        .eq('lng', lng)
        .maybeSingle();

      if (existing) {
        return new Response(
          JSON.stringify({ success: true, id: existing.id }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      let shortId = generateShortId();
      let attempts = 0;
      while (attempts < 5) {
        const { data: existingId } = await supabase
          .from('short_links')
          .select('id')
          .eq('id', shortId)
          .maybeSingle();
        if (!existingId) break;
        shortId = generateShortId();
        attempts++;
      }

      const { error: insertError } = await supabase
        .from('short_links')
        .insert({
          id: shortId,
          lat,
          lng,
          store_slug: storeSlug,
          address: address || null,
          link_type: 'location'
        });

      if (insertError) {
        console.error('Erro ao criar short link:', insertError);
        return new Response(
          JSON.stringify({ success: false, error: insertError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, id: shortId }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ========== CREATE URL SHORT LINK (new - generic) ==========
    if (action === 'create_url') {
      const { targetUrl, storeSlug } = body;

      if (!targetUrl) {
        return new Response(
          JSON.stringify({ success: false, error: 'targetUrl é obrigatório' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verificar se já existe um link para essa URL e loja
      const { data: existing } = await supabase
        .from('short_links')
        .select('id')
        .eq('store_slug', storeSlug || '')
        .eq('target_url', targetUrl)
        .eq('link_type', 'url')
        .maybeSingle();

      if (existing) {
        return new Response(
          JSON.stringify({ success: true, id: existing.id }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      let shortId = generateShortId();
      let attempts = 0;
      while (attempts < 5) {
        const { data: existingId } = await supabase
          .from('short_links')
          .select('id')
          .eq('id', shortId)
          .maybeSingle();
        if (!existingId) break;
        shortId = generateShortId();
        attempts++;
      }

      const { error: insertError } = await supabase
        .from('short_links')
        .insert({
          id: shortId,
          lat: 0,
          lng: 0,
          store_slug: storeSlug || '',
          target_url: targetUrl,
          link_type: 'url'
        });

      if (insertError) {
        console.error('Erro ao criar short link de URL:', insertError);
        return new Response(
          JSON.stringify({ success: false, error: insertError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, id: shortId }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ========== RESOLVE SHORT LINK ==========
    if (action === 'resolve') {
      const { id } = body;

      const { data: link, error } = await supabase
        .from('short_links')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !link) {
        return new Response(
          JSON.stringify({ success: false, error: 'Link não encontrado' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Incrementar contador de clicks
      await supabase
        .from('short_links')
        .update({ clicks: (link.clicks || 0) + 1 })
        .eq('id', id);

      return new Response(
        JSON.stringify({ 
          success: true, 
          lat: link.lat,
          lng: link.lng,
          storeSlug: link.store_slug,
          address: link.address,
          targetUrl: link.target_url,
          linkType: link.link_type || 'location'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Ação inválida' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('Erro na função short-link:', error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
