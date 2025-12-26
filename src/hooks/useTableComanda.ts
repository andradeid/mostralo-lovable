import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TableCustomerData {
  customerId: string;
  customerName: string;
  comandaId: string;
  comandaNumber: string;
  requireApproval: boolean;
}

interface UseTableComandaReturn {
  isLoading: boolean;
  error: string | null;
  customerData: TableCustomerData | null;
  checkCustomer: (phone: string, storeId: string, tableNumber: string) => Promise<{ exists: boolean; hasPassword: boolean; name?: string }>;
  registerCustomer: (data: { phone: string; name: string; password: string; storeId: string; tableNumber: string }) => Promise<boolean>;
  loginCustomer: (data: { phone: string; password: string; storeId: string; tableNumber: string }) => Promise<boolean>;
  createComanda: (data: { phone: string; storeId: string; tableNumber: string }) => Promise<boolean>;
  addItemToComanda: (item: { productId: string; productName: string; unitPrice: number; quantity: number; notes?: string; addons?: Record<string, unknown> }) => Promise<boolean>;
  clearSession: () => void;
}

const STORAGE_KEY = 'table_customer_session';

export function useTableComanda(): UseTableComandaReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customerData, setCustomerData] = useState<TableCustomerData | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const saveSession = useCallback((data: TableCustomerData) => {
    setCustomerData(data);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, []);

  const clearSession = useCallback(() => {
    setCustomerData(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const checkCustomer = useCallback(async (phone: string, storeId: string, tableNumber: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('table-customer-auth', {
        body: { action: 'check_customer', store_id: storeId, table_number: tableNumber, phone }
      });

      if (fnError) throw new Error(fnError.message);
      if (data.error) throw new Error(data.error);

      return {
        exists: data.exists,
        hasPassword: data.has_password,
        name: data.name
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao verificar cliente';
      setError(message);
      return { exists: false, hasPassword: false };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const registerCustomer = useCallback(async (data: { phone: string; name: string; password: string; storeId: string; tableNumber: string }) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: result, error: fnError } = await supabase.functions.invoke('table-customer-auth', {
        body: {
          action: 'register',
          store_id: data.storeId,
          table_number: data.tableNumber,
          phone: data.phone,
          name: data.name,
          password: data.password
        }
      });

      if (fnError) throw new Error(fnError.message);
      if (result.error) throw new Error(result.error);

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao cadastrar';
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loginCustomer = useCallback(async (data: { phone: string; password: string; storeId: string; tableNumber: string }) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: result, error: fnError } = await supabase.functions.invoke('table-customer-auth', {
        body: {
          action: 'login',
          store_id: data.storeId,
          table_number: data.tableNumber,
          phone: data.phone,
          password: data.password
        }
      });

      if (fnError) throw new Error(fnError.message);
      if (result.error) throw new Error(result.error);

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao fazer login';
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createComanda = useCallback(async (data: { phone: string; storeId: string; tableNumber: string }) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: result, error: fnError } = await supabase.functions.invoke('table-customer-auth', {
        body: {
          action: 'create_comanda',
          store_id: data.storeId,
          table_number: data.tableNumber,
          phone: data.phone
        }
      });

      if (fnError) throw new Error(fnError.message);
      if (result.error) throw new Error(result.error);

      // Buscar nome do cliente
      const checkResult = await checkCustomer(data.phone, data.storeId, data.tableNumber);

      saveSession({
        customerId: result.customer_id || '',
        customerName: checkResult.name || 'Cliente',
        comandaId: result.comanda_id,
        comandaNumber: result.comanda_number,
        requireApproval: result.require_approval ?? true
      });

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar comanda';
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [checkCustomer, saveSession]);

  const addItemToComanda = useCallback(async (item: { productId: string; productName: string; unitPrice: number; quantity: number; notes?: string; addons?: Record<string, unknown> }) => {
    if (!customerData?.comandaId) {
      setError('Nenhuma comanda ativa');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Usar any para contornar tipagem estrita do Supabase
      const insertPayload: Record<string, unknown> = {
        comanda_id: customerData.comandaId,
        product_id: item.productId,
        product_name: item.productName,
        unit_price: item.unitPrice,
        quantity: item.quantity,
        total_price: item.unitPrice * item.quantity,
        notes: item.notes || null,
        addons: item.addons || null,
        requires_approval: customerData.requireApproval,
        preparation_status: 'pending'
      };

      const { error: insertError } = await supabase
        .from('comanda_items')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .insert([insertPayload] as any);

      if (insertError) throw insertError;

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao adicionar item';
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [customerData]);

  return {
    isLoading,
    error,
    customerData,
    checkCustomer,
    registerCustomer,
    loginCustomer,
    createComanda,
    addItemToComanda,
    clearSession
  };
}
