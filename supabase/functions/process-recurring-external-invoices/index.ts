import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ProcessResult {
  total_processed: number;
  invoices_created: Array<{
    id: string;
    invoice_number: string;
    client_name: string;
    amount: number;
    due_date: string;
    whatsapp_sent: boolean;
  }>;
  errors: string[];
  whatsapp_sent_count: number;
}

function calculateNextDueDate(dueDate: string, recurrenceType: string): string {
  const date = new Date(dueDate);
  switch (recurrenceType) {
    case "monthly":
      date.setMonth(date.getMonth() + 1);
      break;
    case "quarterly":
      date.setMonth(date.getMonth() + 3);
      break;
    case "yearly":
      date.setFullYear(date.getFullYear() + 1);
      break;
    default:
      return dueDate;
  }
  return date.toISOString().split("T")[0];
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body first (before any other operations)
    let requestBody: { source?: string } = {};
    try {
      requestBody = await req.json();
    } catch {
      // No body or invalid JSON - use defaults
    }
    const executionSource = requestBody?.source === "manual" ? "manual" : "cron";

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const today = new Date().toISOString().split("T")[0];
    
    console.log(`[process-recurring] Starting processing for date: ${today}, source: ${executionSource}`);

    // Find eligible recurring invoices
    // Criteria:
    // - is_recurring = true
    // - payment_status = 'paid'
    // - next_due_date <= today
    // - recurrence_current < recurrence_count OR recurrence_count IS NULL (infinite)
    const { data: eligibleInvoices, error: fetchError } = await supabase
      .from("external_invoices")
      .select(`
        *,
        client:external_clients(*),
        service:external_services(*)
      `)
      .eq("is_recurring", true)
      .eq("payment_status", "paid")
      .lte("next_due_date", today)
      .order("next_due_date", { ascending: true });

    if (fetchError) {
      console.error("[process-recurring] Error fetching invoices:", fetchError);
      throw fetchError;
    }

    console.log(`[process-recurring] Found ${eligibleInvoices?.length || 0} eligible invoices`);

    const result: ProcessResult = {
      total_processed: 0,
      invoices_created: [],
      errors: [],
      whatsapp_sent_count: 0,
    };

    if (!eligibleInvoices || eligibleInvoices.length === 0) {
      // Save log even when no invoices to process
      await supabase.from("recurring_invoice_logs").insert({
        executed_at: new Date().toISOString(),
        total_processed: 0,
        invoices_created: 0,
        whatsapp_sent: 0,
        errors_count: 0,
        execution_details: { invoices: [], errors: [] },
        execution_source: executionSource,
      });

      return new Response(JSON.stringify({
        success: true,
        message: "Nenhuma fatura recorrente pendente de processamento",
        result
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Process each eligible invoice
    for (const invoice of eligibleInvoices) {
      try {
        // Check if we should still create (respecting recurrence_count)
        if (invoice.recurrence_count !== null && 
            invoice.recurrence_current >= invoice.recurrence_count) {
          console.log(`[process-recurring] Invoice ${invoice.id} reached max recurrence count`);
          continue;
        }

        const newDueDate = invoice.next_due_date;
        const nextNextDueDate = calculateNextDueDate(newDueDate, invoice.recurrence_type);

        // Create new invoice
        const { data: newInvoice, error: createError } = await supabase
          .from("external_invoices")
          .insert({
            client_id: invoice.client_id,
            service_id: invoice.service_id,
            description: invoice.description,
            amount: invoice.amount,
            due_date: newDueDate,
            is_recurring: true,
            recurrence_type: invoice.recurrence_type,
            recurrence_count: invoice.recurrence_count,
            recurrence_current: invoice.recurrence_current + 1,
            parent_invoice_id: invoice.id,
            next_due_date: nextNextDueDate,
            payment_status: "pending",
            auto_send_whatsapp: invoice.auto_send_whatsapp,
            notes: `Gerada automaticamente a partir de ${invoice.invoice_number}`,
            created_by: invoice.created_by,
          })
          .select()
          .single();

        if (createError) {
          console.error(`[process-recurring] Error creating invoice for ${invoice.id}:`, createError);
          result.errors.push(`Erro ao criar fatura para cliente ${invoice.client?.name}: ${createError.message}`);
          continue;
        }

        // Update original invoice with new next_due_date
        const { error: updateError } = await supabase
          .from("external_invoices")
          .update({
            next_due_date: nextNextDueDate,
            recurrence_current: invoice.recurrence_current + 1,
          })
          .eq("id", invoice.id);

        if (updateError) {
          console.error(`[process-recurring] Error updating original invoice ${invoice.id}:`, updateError);
        }

        let whatsappSent = false;

        // Check if should send WhatsApp
        const shouldSendWhatsApp = invoice.auto_send_whatsapp || invoice.client?.auto_send_invoices;
        
        if (shouldSendWhatsApp && invoice.client?.phone) {
          try {
            const normalizedPhone = invoice.client.phone.replace(/\D/g, "");
            
            // Call the WhatsApp sending function
            const { error: whatsappError } = await supabase.functions.invoke(
              "send-external-invoice-whatsapp",
              {
                body: {
                  invoice_id: newInvoice.id,
                  phone_number: normalizedPhone,
                },
              }
            );

            if (whatsappError) {
              console.error(`[process-recurring] WhatsApp error for ${newInvoice.id}:`, whatsappError);
            } else {
              whatsappSent = true;
              result.whatsapp_sent_count++;
            }
          } catch (whatsappErr) {
            console.error(`[process-recurring] WhatsApp exception for ${newInvoice.id}:`, whatsappErr);
          }
        }

        result.total_processed++;
        result.invoices_created.push({
          id: newInvoice.id,
          invoice_number: newInvoice.invoice_number,
          client_name: invoice.client?.name || "N/A",
          amount: newInvoice.amount,
          due_date: newInvoice.due_date,
          whatsapp_sent: whatsappSent,
        });

        console.log(`[process-recurring] Created invoice ${newInvoice.invoice_number} for ${invoice.client?.name}`);

      } catch (invoiceError) {
        const errorMsg = invoiceError instanceof Error ? invoiceError.message : "Erro desconhecido";
        console.error(`[process-recurring] Error processing invoice ${invoice.id}:`, invoiceError);
        result.errors.push(`Erro ao processar fatura ${invoice.invoice_number}: ${errorMsg}`);
      }
    }

    console.log(`[process-recurring] Completed. Created: ${result.total_processed}, WhatsApp: ${result.whatsapp_sent_count}, Errors: ${result.errors.length}`);

    // Save execution log to recurring_invoice_logs table
    const { error: logError } = await supabase
      .from("recurring_invoice_logs")
      .insert({
        executed_at: new Date().toISOString(),
        total_processed: result.total_processed,
        invoices_created: result.invoices_created.length,
        whatsapp_sent: result.whatsapp_sent_count,
        errors_count: result.errors.length,
        execution_details: {
          invoices: result.invoices_created,
          errors: result.errors,
        },
        execution_source: executionSource,
      });

    if (logError) {
      console.error("[process-recurring] Failed to save execution log:", logError);
    } else {
      console.log("[process-recurring] Execution log saved successfully");
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Processamento concluído. ${result.total_processed} fatura(s) criada(s).`,
      result
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[process-recurring] Unexpected error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Erro inesperado",
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
