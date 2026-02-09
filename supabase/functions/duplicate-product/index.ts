import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Client com token do usuário para verificar autenticação
    const supabaseAuth = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Client admin para operações de storage
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { productId } = await req.json();
    if (!productId) {
      return new Response(JSON.stringify({ error: "productId é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Buscar produto original
    const { data: original, error: fetchError } = await supabaseAdmin
      .from("products")
      .select("*")
      .eq("id", productId)
      .single();

    if (fetchError || !original) {
      return new Response(JSON.stringify({ error: "Produto não encontrado" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Função auxiliar para duplicar imagem no storage
    const duplicateImage = async (imageUrl: string): Promise<string> => {
      try {
        // Baixar a imagem pela URL pública
        const response = await fetch(imageUrl);
        if (!response.ok) return imageUrl; // Se falhar, mantém a URL original

        const blob = await response.blob();
        const ext = imageUrl.split('.').pop()?.split('?')[0] || 'jpg';
        const timestamp = Date.now();
        const randomId = crypto.randomUUID().substring(0, 8);
        const newFileName = `${original.store_id}/products/dup_${timestamp}_${randomId}.${ext}`;

        const { error: uploadError } = await supabaseAdmin.storage
          .from("product-images")
          .upload(newFileName, blob, {
            contentType: response.headers.get("content-type") || "image/jpeg",
            upsert: false,
          });

        if (uploadError) {
          console.error("Erro ao duplicar imagem:", uploadError);
          return imageUrl; // Fallback: mantém URL original
        }

        const { data: publicUrlData } = supabaseAdmin.storage
          .from("product-images")
          .getPublicUrl(newFileName);

        return publicUrlData.publicUrl;
      } catch (e) {
        console.error("Erro ao processar imagem:", e);
        return imageUrl;
      }
    };

    // 3. Duplicar imagem principal
    let newImageUrl = original.image_url;
    if (original.image_url) {
      newImageUrl = await duplicateImage(original.image_url);
    }

    // 4. Duplicar galeria de imagens
    let newGallery: string[] | null = null;
    if (original.image_gallery && original.image_gallery.length > 0) {
      newGallery = await Promise.all(
        original.image_gallery.map((url: string) => duplicateImage(url))
      );
    }

    // 5. Inserir novo produto
    const { data: newProduct, error: insertError } = await supabaseAdmin
      .from("products")
      .insert({
        name: `${original.name} (duplicado)`,
        description: original.description,
        price: original.price,
        image_url: newImageUrl,
        image_gallery: newGallery,
        button_text: original.button_text,
        is_available: original.is_available,
        is_featured: original.is_featured,
        show_in_menu: original.show_in_menu,
        display_order: (original.display_order || 0) + 1,
        store_id: original.store_id,
        category_id: original.category_id,
        is_on_offer: original.is_on_offer,
        original_price: original.original_price,
        offer_price: original.offer_price,
        track_stock: original.track_stock,
        stock_quantity: original.stock_quantity,
        stock_alert_threshold: original.stock_alert_threshold,
        recurrence_days: original.recurrence_days,
        slug: null, // Será gerado automaticamente se houver trigger
      })
      .select("id")
      .single();

    if (insertError || !newProduct) {
      console.error("Erro ao inserir produto duplicado:", insertError);
      return new Response(JSON.stringify({ error: "Erro ao duplicar produto" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 6. Duplicar addons vinculados
    const { data: addons } = await supabaseAdmin
      .from("product_addons")
      .select("*")
      .eq("product_id", productId);

    if (addons && addons.length > 0) {
      const newAddons = addons.map((a: any) => ({
        product_id: newProduct.id,
        addon_id: a.addon_id,
        is_required: a.is_required,
        max_quantity: a.max_quantity,
      }));
      await supabaseAdmin.from("product_addons").insert(newAddons);
    }

    // 7. Duplicar variantes
    const { data: variants } = await supabaseAdmin
      .from("product_variants")
      .select("*")
      .eq("product_id", productId);

    if (variants && variants.length > 0) {
      const newVariants = variants.map((v: any) => ({
        product_id: newProduct.id,
        name: v.name,
        description: v.description,
        price: v.price,
        display_order: v.display_order,
        is_available: v.is_available,
        is_default: v.is_default,
        track_stock: v.track_stock,
        stock_quantity: v.stock_quantity,
      }));
      await supabaseAdmin.from("product_variants").insert(newVariants);
    }

    return new Response(
      JSON.stringify({ success: true, newProductId: newProduct.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Erro na edge function:", error);
    return new Response(JSON.stringify({ error: "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
