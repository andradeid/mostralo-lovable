import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface WhatsAppStatusResult {
  hasConnectedWhatsApp: boolean;
  isLoading: boolean;
}

export function useWhatsAppStatus(storeId?: string): WhatsAppStatusResult {
  const [hasConnectedWhatsApp, setHasConnectedWhatsApp] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkWhatsApp() {
      if (!storeId) {
        setHasConnectedWhatsApp(false);
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        // Use explicit typing to avoid TS2589 with deep type instantiation
        const response = await (supabase as unknown as { 
          from: (table: string) => { 
            select: (cols: string) => { 
              eq: (col: string, val: string) => { 
                eq: (col: string, val: boolean) => { 
                  limit: (n: number) => Promise<{ data: Array<{ status: string }> | null; error: unknown }> 
                } 
              } 
            } 
          } 
        }).from('whatsapp_instances').select('status').eq('store_id', storeId).eq('is_active', true).limit(1);
        
        const instance = response.data?.[0];
        setHasConnectedWhatsApp(instance?.status === 'connected');
      } catch (err) {
        console.error('Error checking WhatsApp:', err);
        setHasConnectedWhatsApp(false);
      } finally {
        setIsLoading(false);
      }
    }
    
    checkWhatsApp();
  }, [storeId]);

  return { hasConnectedWhatsApp, isLoading };
}
