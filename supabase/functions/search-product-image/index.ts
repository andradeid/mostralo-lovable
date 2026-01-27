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

    console.log(`[search-product-image] Provider: ${config.provider || 'google'}, Buscando: "${searchQuery}"`);

    // Choose provider
    const provider = config.provider || 'google';
    let imageUrl: string | null = null;
    let searchError: string | null = null;

    if (provider === 'serpapi') {
      // Use SerpAPI
      const result = await searchWithSerpAPI(config.serpapi_key, searchQuery);
      if (result.success) {
        imageUrl = result.imageUrl!;
      } else {
        searchError = result.error!;
      }
    } else {
      // Use Google Custom Search API
      const result = await searchWithGoogle(config.api_key, config.search_engine_id, searchQuery, laboratory, productName);
      if (result.success) {
        imageUrl = result.imageUrl!;
      } else {
        searchError = result.error!;
      }
    }

    // Increment search counter
    await supabaseAdmin
      .from('image_search_config')
      .update({ searches_today: searchesToday + 1 })
      .eq('id', config.id);

    if (searchError) {
      return new Response(
        JSON.stringify({ success: false, error: searchError }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    if (!imageUrl) {
      return new Response(
        JSON.stringify({ success: false, error: 'Nenhuma imagem encontrada' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Download and save image to Supabase Storage
    const internalUrl = await downloadAndSaveImage(supabaseAdmin, imageUrl, storeId);

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

// Search using SerpAPI
async function searchWithSerpAPI(
  apiKey: string,
  query: string
): Promise<{ success: boolean; imageUrl?: string; error?: string }> {
  try {
    if (!apiKey) {
      return { success: false, error: 'SerpAPI Key não configurada' };
    }

    const serpApiUrl = new URL('https://serpapi.com/search.json');
    serpApiUrl.searchParams.set('api_key', apiKey);
    serpApiUrl.searchParams.set('engine', 'google_images');
    serpApiUrl.searchParams.set('q', query);
    serpApiUrl.searchParams.set('num', '1');
    serpApiUrl.searchParams.set('safe', 'active');

    console.log(`[searchWithSerpAPI] Buscando: "${query}"`);

    const response = await fetch(serpApiUrl.toString());
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[searchWithSerpAPI] Error:', errorText);
      
      let errorMessage = 'Erro na SerpAPI';
      try {
        const parsed = JSON.parse(errorText);
        if (parsed?.error) {
          errorMessage = parsed.error;
        }
      } catch {
        // keep default
      }

      return { success: false, error: errorMessage };
    }

    const data = await response.json();
    
    // Check for images_results
    if (data.images_results && data.images_results.length > 0) {
      const imageUrl = data.images_results[0].original || data.images_results[0].thumbnail;
      console.log(`[searchWithSerpAPI] Imagem encontrada: ${imageUrl}`);
      return { success: true, imageUrl };
    }

    return { success: false, error: 'Nenhuma imagem encontrada na SerpAPI' };
  } catch (error) {
    console.error('[searchWithSerpAPI] Exception:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Erro na SerpAPI' };
  }
}

// Search using Google Custom Search API
async function searchWithGoogle(
  apiKey: string,
  searchEngineId: string,
  query: string,
  laboratory?: string,
  productName?: string
): Promise<{ success: boolean; imageUrl?: string; error?: string }> {
  try {
    const googleApiUrl = new URL('https://www.googleapis.com/customsearch/v1');
    googleApiUrl.searchParams.set('key', apiKey);
    googleApiUrl.searchParams.set('cx', searchEngineId);
    googleApiUrl.searchParams.set('q', query);
    googleApiUrl.searchParams.set('searchType', 'image');
    googleApiUrl.searchParams.set('num', '1');
    googleApiUrl.searchParams.set('safe', 'active');
    googleApiUrl.searchParams.set('imgSize', 'medium');

    const searchResponse = await fetch(googleApiUrl.toString());
    
    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error('[searchWithGoogle] Google API error:', errorText);
      
      let googleMessage = 'Erro na API do Google';
      try {
        const parsed = JSON.parse(errorText);
        const msg = parsed?.error?.message;
        if (typeof msg === 'string' && msg.trim()) {
          googleMessage = msg;
        }
      } catch {
        // keep default
      }

      // Friendly message for a common blocker
      if (
        searchResponse.status === 403 &&
        googleMessage.toLowerCase().includes('custom search json api') &&
        googleMessage.toLowerCase().includes('access')
      ) {
        googleMessage =
          'Sem acesso à Custom Search JSON API neste projeto/chave. Se o projeto é novo, o Google pode bloquear novos clientes nessa API; use um projeto antigo que já tinha acesso ou troque o provedor de busca.';
      }

      return { success: false, error: googleMessage };
    }

    const searchData = await searchResponse.json();

    // Check if we found any images
    if (!searchData.items || searchData.items.length === 0) {
      // Try fallback search without laboratory
      if (laboratory && productName) {
        console.log('[searchWithGoogle] Tentando fallback sem laboratório...');
        
        googleApiUrl.searchParams.set('q', `${productName} medicamento`);
        const fallbackResponse = await fetch(googleApiUrl.toString());
        
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          if (fallbackData.items && fallbackData.items.length > 0) {
            return { success: true, imageUrl: fallbackData.items[0].link };
          }
        }
      }

      return { success: false, error: 'Nenhuma imagem encontrada' };
    }

    return { success: true, imageUrl: searchData.items[0].link };
  } catch (error) {
    console.error('[searchWithGoogle] Exception:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Erro no Google' };
  }
}

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
