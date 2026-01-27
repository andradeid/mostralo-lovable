import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SearchRequest {
  productName: string;
  laboratory?: string;
  storeId: string;
}

interface SearchResponse {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Parse request body
    const { productName, laboratory, storeId }: SearchRequest = await req.json();

    if (!productName || !storeId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Nome do produto e storeId são obrigatórios' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Fetch API config from database
    const { data: config, error: configError } = await supabaseAdmin
      .from('image_search_config')
      .select('*')
      .eq('is_active', true)
      .single();

    if (configError || !config) {
      return new Response(
        JSON.stringify({ success: false, error: 'API de busca de imagens não configurada' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Check and reset daily counter if needed
    const today = new Date().toISOString().split('T')[0];
    let searchesToday = config.searches_today;
    
    if (config.last_reset_date !== today) {
      // Reset counter for new day
      searchesToday = 0;
      await supabaseAdmin
        .from('image_search_config')
        .update({ searches_today: 0, last_reset_date: today })
        .eq('id', config.id);
    }

    // Check daily limit
    if (searchesToday >= config.daily_limit) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Limite diário de ${config.daily_limit} buscas atingido. Tente novamente amanhã.` 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429 }
      );
    }

    // Build search query
    let searchQuery = `${productName} produto medicamento`;
    if (laboratory) {
      searchQuery = `${productName} ${laboratory} medicamento`;
    }

    console.log(`[search-product-image] Buscando: "${searchQuery}"`);

    // Search Google Custom Search API
    const googleApiUrl = new URL('https://www.googleapis.com/customsearch/v1');
    googleApiUrl.searchParams.set('key', config.api_key);
    googleApiUrl.searchParams.set('cx', config.search_engine_id);
    googleApiUrl.searchParams.set('q', searchQuery);
    googleApiUrl.searchParams.set('searchType', 'image');
    googleApiUrl.searchParams.set('num', '1');
    googleApiUrl.searchParams.set('safe', 'active');
    googleApiUrl.searchParams.set('imgSize', 'medium');

    const searchResponse = await fetch(googleApiUrl.toString());
    
    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error('[search-product-image] Google API error:', errorText);
      
      // Increment counter even on API error
      await supabaseAdmin
        .from('image_search_config')
        .update({ searches_today: searchesToday + 1 })
        .eq('id', config.id);

      return new Response(
        JSON.stringify({ success: false, error: 'Erro na API do Google' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const searchData = await searchResponse.json();
    
    // Increment search counter
    await supabaseAdmin
      .from('image_search_config')
      .update({ searches_today: searchesToday + 1 })
      .eq('id', config.id);

    // Check if we found any images
    if (!searchData.items || searchData.items.length === 0) {
      // Try fallback search without laboratory
      if (laboratory) {
        console.log('[search-product-image] Tentando fallback sem laboratório...');
        
        googleApiUrl.searchParams.set('q', `${productName} medicamento`);
        const fallbackResponse = await fetch(googleApiUrl.toString());
        
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          
          // Increment counter for fallback search
          await supabaseAdmin
            .from('image_search_config')
            .update({ searches_today: searchesToday + 2 })
            .eq('id', config.id);

          if (fallbackData.items && fallbackData.items.length > 0) {
            const externalUrl = fallbackData.items[0].link;
            const internalUrl = await downloadAndSaveImage(supabaseAdmin, externalUrl, storeId);
            
            if (internalUrl) {
              return new Response(
                JSON.stringify({ success: true, imageUrl: internalUrl }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              );
            }
          }
        }
      }

      return new Response(
        JSON.stringify({ success: false, error: 'Nenhuma imagem encontrada' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the first image URL
    const externalUrl = searchData.items[0].link;
    console.log(`[search-product-image] Imagem encontrada: ${externalUrl}`);

    // Download and save image to Supabase Storage
    const internalUrl = await downloadAndSaveImage(supabaseAdmin, externalUrl, storeId);

    if (!internalUrl) {
      return new Response(
        JSON.stringify({ success: false, error: 'Falha ao salvar imagem no storage' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[search-product-image] Imagem salva: ${internalUrl}`);

    return new Response(
      JSON.stringify({ success: true, imageUrl: internalUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('[search-product-image] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

async function downloadAndSaveImage(
  supabaseClient: any,
  externalUrl: string,
  storeId: string
): Promise<string | null> {
  try {
    // Download the image
    const imageResponse = await fetch(externalUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MostraloBot/1.0)'
      }
    });

    if (!imageResponse.ok) {
      console.error(`[downloadAndSaveImage] Falha ao baixar: ${imageResponse.status}`);
      return null;
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    
    // Detect content type and extension
    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
    let extension = 'jpg';
    
    if (contentType.includes('png')) {
      extension = 'png';
    } else if (contentType.includes('webp')) {
      extension = 'webp';
    } else if (contentType.includes('gif')) {
      extension = 'gif';
    }

    // Generate unique filename
    const fileName = `products/${storeId}/${crypto.randomUUID()}.${extension}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabaseClient.storage
      .from('store-images')
      .upload(fileName, imageBuffer, {
        contentType,
        upsert: false
      });

    if (uploadError) {
      console.error('[downloadAndSaveImage] Upload error:', uploadError);
      return null;
    }

    // Get public URL
    const { data: urlData } = supabaseClient.storage
      .from('store-images')
      .getPublicUrl(fileName);

    return urlData.publicUrl;

  } catch (error) {
    console.error('[downloadAndSaveImage] Error:', error);
    return null;
  }
}
