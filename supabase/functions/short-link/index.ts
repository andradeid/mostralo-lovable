import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const { action, lat, lng, storeSlug, address, id } = await req.json();

    if (action === 'create') {
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

      // Gerar novo ID curto
      let shortId = generateShortId();
      let attempts = 0;
      
      // Verificar se o ID já existe e gerar outro se necessário
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

      // Inserir novo short link
      const { error: insertError } = await supabase
        .from('short_links')
        .insert({
          id: shortId,
          lat,
          lng,
          store_slug: storeSlug,
          address: address || null
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

    if (action === 'resolve') {
      // Buscar dados do short link
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
          address: link.address
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
