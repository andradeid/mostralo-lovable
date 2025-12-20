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
        const { data, error } = await supabase
          .from('whatsapp_instances')
          .select('status')
          .eq('store_id', storeId)
          .limit(1);
        
        if (error) {
          console.error('Error checking WhatsApp:', error);
          setHasConnectedWhatsApp(false);
          return;
        }
        
        const instance = data?.[0];
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
