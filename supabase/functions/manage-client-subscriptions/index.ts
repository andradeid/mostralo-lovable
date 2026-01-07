import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  action: string;
  storeId?: string;
  planId?: string;
  customerId?: string;
  subscriptionId?: string;
  serviceId?: string;
  data?: Record<string, unknown>;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: RequestBody = await req.json();
    const { action, storeId, planId, customerId, subscriptionId, serviceId, data } = body;

    console.log(`[manage-client-subscriptions] Action: ${action}, User: ${user.id}`);

    let result: unknown;

    switch (action) {
      // ==================== PLANOS ====================
      case "list_plans": {
        if (!storeId) throw new Error("storeId required");
        
        const { data: plans, error } = await supabase
          .from("client_subscription_plans")
          .select(`
            *,
            plan_included_services (
              id,
              service_id,
              usage_limit_per_service,
              booking_services:service_id (id, name, price)
            )
          `)
          .eq("store_id", storeId)
          .order("display_order", { ascending: true });

        if (error) throw error;
        result = plans;
        break;
      }

      case "create_plan": {
        if (!storeId || !data) throw new Error("storeId and data required");
        
        const { includedServices, ...planData } = data as Record<string, unknown>;
        
        // Create plan
        const { data: plan, error: planError } = await supabase
          .from("client_subscription_plans")
          .insert({
            store_id: storeId,
            ...planData
          })
          .select()
          .single();

        if (planError) throw planError;

        // Add included services
        if (includedServices && Array.isArray(includedServices) && includedServices.length > 0) {
          const serviceInserts = includedServices.map((s: { serviceId: string; usageLimit?: number }) => ({
            plan_id: plan.id,
            service_id: s.serviceId,
            usage_limit_per_service: s.usageLimit || null
          }));

          const { error: servicesError } = await supabase
            .from("plan_included_services")
            .insert(serviceInserts);

          if (servicesError) {
            console.error("Error adding services:", servicesError);
          }
        }

        result = plan;
        break;
      }

      case "update_plan": {
        if (!planId || !data) throw new Error("planId and data required");
        
        const { includedServices, ...planData } = data as Record<string, unknown>;
        
        // Update plan
        const { data: plan, error: planError } = await supabase
          .from("client_subscription_plans")
          .update(planData)
          .eq("id", planId)
          .select()
          .single();

        if (planError) throw planError;

        // Update included services
        if (includedServices !== undefined && Array.isArray(includedServices)) {
          // Delete existing
          await supabase
            .from("plan_included_services")
            .delete()
            .eq("plan_id", planId);

          // Insert new ones
          if (includedServices.length > 0) {
            const serviceInserts = includedServices.map((s: { serviceId: string; usageLimit?: number }) => ({
              plan_id: planId,
              service_id: s.serviceId,
              usage_limit_per_service: s.usageLimit || null
            }));

            await supabase
              .from("plan_included_services")
              .insert(serviceInserts);
          }
        }

        result = plan;
        break;
      }

      case "delete_plan": {
        if (!planId) throw new Error("planId required");
        
        // Check if plan has active subscriptions
        const { data: activeSubscriptions } = await supabase
          .from("client_subscriptions")
          .select("id")
          .eq("plan_id", planId)
          .eq("status", "active")
          .limit(1);

        if (activeSubscriptions && activeSubscriptions.length > 0) {
          throw new Error("Não é possível excluir um plano com assinaturas ativas");
        }

        const { error } = await supabase
          .from("client_subscription_plans")
          .delete()
          .eq("id", planId);

        if (error) throw error;
        result = { success: true };
        break;
      }

      // ==================== ASSINATURAS ====================
      case "list_subscriptions": {
        if (!storeId) throw new Error("storeId required");
        
        const { data: subscriptions, error } = await supabase
          .from("client_subscriptions")
          .select(`
            *,
            customer:customer_id (id, name, phone, email),
            plan:plan_id (id, name, price, billing_cycle, plan_type, usage_limit)
          `)
          .eq("store_id", storeId)
          .order("created_at", { ascending: false });

        if (error) throw error;
        result = subscriptions;
        break;
      }

      case "create_subscription": {
        if (!storeId || !customerId || !planId) {
          throw new Error("storeId, customerId and planId required");
        }
        
        // Get plan details for billing cycle
        const { data: plan, error: planError } = await supabase
          .from("client_subscription_plans")
          .select("*")
          .eq("id", planId)
          .single();

        if (planError || !plan) throw new Error("Plano não encontrado");

        // Calculate period end date
        const startDate = new Date();
        const { data: periodEnd } = await supabase.rpc("calculate_subscription_period_end", {
          p_start_date: startDate.toISOString().split('T')[0],
          p_billing_cycle: plan.billing_cycle
        });

        const subscriptionData = {
          store_id: storeId,
          customer_id: customerId,
          plan_id: planId,
          status: "active",
          start_date: startDate.toISOString().split('T')[0],
          current_period_start: startDate.toISOString().split('T')[0],
          current_period_end: periodEnd,
          payment_amount: plan.price,
          next_payment_date: periodEnd,
          created_by: user.id,
          ...(data || {})
        };

        const { data: subscription, error } = await supabase
          .from("client_subscriptions")
          .insert(subscriptionData)
          .select(`
            *,
            customer:customer_id (id, name, phone, email),
            plan:plan_id (id, name, price, billing_cycle)
          `)
          .single();

        if (error) throw error;
        
        console.log(`[manage-client-subscriptions] Subscription created: ${subscription.id}`);
        result = subscription;
        break;
      }

      case "pause_subscription": {
        if (!subscriptionId) throw new Error("subscriptionId required");
        
        const { data: subscription, error } = await supabase
          .from("client_subscriptions")
          .update({
            status: "paused",
            paused_at: new Date().toISOString(),
            pause_reason: (data as Record<string, unknown>)?.reason || null
          })
          .eq("id", subscriptionId)
          .select()
          .single();

        if (error) throw error;
        result = subscription;
        break;
      }

      case "resume_subscription": {
        if (!subscriptionId) throw new Error("subscriptionId required");
        
        const { data: subscription, error } = await supabase
          .from("client_subscriptions")
          .update({
            status: "active",
            paused_at: null,
            pause_reason: null
          })
          .eq("id", subscriptionId)
          .select()
          .single();

        if (error) throw error;
        result = subscription;
        break;
      }

      case "cancel_subscription": {
        if (!subscriptionId) throw new Error("subscriptionId required");
        
        const { data: subscription, error } = await supabase
          .from("client_subscriptions")
          .update({
            status: "cancelled",
            cancelled_at: new Date().toISOString(),
            cancellation_reason: (data as Record<string, unknown>)?.reason || null
          })
          .eq("id", subscriptionId)
          .select()
          .single();

        if (error) throw error;
        result = subscription;
        break;
      }

      case "renew_subscription": {
        if (!subscriptionId) throw new Error("subscriptionId required");
        
        // Get current subscription with plan
        const { data: current, error: fetchError } = await supabase
          .from("client_subscriptions")
          .select(`
            *,
            plan:plan_id (billing_cycle)
          `)
          .eq("id", subscriptionId)
          .single();

        if (fetchError || !current) throw new Error("Assinatura não encontrada");

        // Calculate new period
        const newPeriodStart = new Date();
        const { data: newPeriodEnd } = await supabase.rpc("calculate_subscription_period_end", {
          p_start_date: newPeriodStart.toISOString().split('T')[0],
          p_billing_cycle: current.plan.billing_cycle
        });

        const { data: subscription, error } = await supabase
          .from("client_subscriptions")
          .update({
            status: "active",
            current_period_start: newPeriodStart.toISOString().split('T')[0],
            current_period_end: newPeriodEnd,
            next_payment_date: newPeriodEnd,
            usages_this_period: 0,
            last_payment_date: newPeriodStart.toISOString().split('T')[0]
          })
          .eq("id", subscriptionId)
          .select()
          .single();

        if (error) throw error;
        result = subscription;
        break;
      }

      // ==================== VERIFICAÇÃO DE COBERTURA ====================
      case "check_coverage": {
        if (!customerId || !storeId || !serviceId) {
          throw new Error("customerId, storeId and serviceId required");
        }

        const { data: coverage, error } = await supabase.rpc("check_subscription_coverage", {
          p_customer_id: customerId,
          p_store_id: storeId,
          p_service_id: serviceId
        });

        if (error) {
          console.error("Error checking coverage:", error);
          result = { has_coverage: false };
        } else {
          result = coverage && coverage.length > 0 
            ? coverage[0] 
            : { has_coverage: false };
        }
        break;
      }

      // ==================== REGISTRO DE USO ====================
      case "register_usage": {
        if (!subscriptionId || !serviceId) {
          throw new Error("subscriptionId and serviceId required");
        }

        const usageData = {
          subscription_id: subscriptionId,
          service_id: serviceId,
          booking_id: (data as Record<string, unknown>)?.bookingId || null,
          used_by_professional_id: (data as Record<string, unknown>)?.professionalId || null,
          notes: (data as Record<string, unknown>)?.notes || null
        };

        const { data: usage, error } = await supabase
          .from("subscription_usages")
          .insert(usageData)
          .select()
          .single();

        if (error) throw error;
        result = usage;
        break;
      }

      // ==================== HISTÓRICO DE USOS ====================
      case "list_usages": {
        if (!subscriptionId) throw new Error("subscriptionId required");
        
        const { data: usages, error } = await supabase
          .from("subscription_usages")
          .select(`
            *,
            service:service_id (id, name, price),
            professional:used_by_professional_id (id, name),
            booking:booking_id (id, booking_date, start_time)
          `)
          .eq("subscription_id", subscriptionId)
          .order("used_at", { ascending: false });

        if (error) throw error;
        result = usages;
        break;
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify({ success: true, data: result }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[manage-client-subscriptions] Error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Internal server error" 
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
