import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { invoice_id } = await req.json();
    
    if (!invoice_id) {
      console.error("invoice_id não fornecido");
      return new Response(
        JSON.stringify({ error: "invoice_id é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Buscando fatura:", invoice_id);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: invoice, error } = await supabase
      .from("external_invoices")
      .select(`
        id,
        invoice_number,
        amount,
        description,
        due_date,
        payment_status,
        paid_at,
        notes,
        pix_txid,
        pix_copia_cola,
        pix_qrcode_base64,
        pix_expires_at,
        boleto_codigo_barras,
        boleto_linha_digitavel,
        boleto_pdf_url,
        boleto_view_url,
        boleto_expires_at,
        external_clients(name, email, phone, document, address_street, address_number, address_neighborhood, address_city, address_state, address_zipcode),
        external_services(name)
      `)
      .eq("id", invoice_id)
      .single();

    if (error) {
      console.error("Erro ao buscar fatura:", error);
      return new Response(
        JSON.stringify({ error: "Fatura não encontrada" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!invoice) {
      console.error("Fatura não encontrada para ID:", invoice_id);
      return new Response(
        JSON.stringify({ error: "Fatura não encontrada" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Fatura encontrada:", invoice.id, "Cliente:", invoice.external_clients);

    // Formatar para o frontend
    const formattedInvoice = {
      ...invoice,
      client: invoice.external_clients,
      service: invoice.external_services,
    };

    return new Response(
      JSON.stringify({ invoice: formattedInvoice }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Erro:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
