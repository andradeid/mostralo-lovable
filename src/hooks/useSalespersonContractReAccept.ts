import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './use-auth';

interface SalespersonContractReAcceptState {
  needsReAccept: boolean;
  isLoading: boolean;
  currentVersion: string | null;
  acceptedVersion: string | null;
  salespersonId: string | null;
  salespersonType: string | null;
  error: string | null;
}

export const useSalespersonContractReAccept = () => {
  const { user } = useAuth();
  const [state, setState] = useState<SalespersonContractReAcceptState>({
    needsReAccept: false,
    isLoading: true,
    currentVersion: null,
    acceptedVersion: null,
    salespersonId: null,
    salespersonType: null,
    error: null,
  });

  useEffect(() => {
    const checkContractVersion = async () => {
      if (!user) {
        setState(prev => ({ ...prev, isLoading: false, needsReAccept: false }));
        return;
      }

      try {
        // 1. Buscar dados do vendedor
        const { data: salesperson, error: spError } = await supabase
          .from('salespeople')
          .select('id, salesperson_type, status')
          .eq('user_id', user.id)
          .maybeSingle();

        if (spError || !salesperson) {
          setState(prev => ({ ...prev, isLoading: false, needsReAccept: false }));
          return;
        }

        // Apenas Parceiros PJ ativos precisam verificar re-aceite
        if (salesperson.salesperson_type !== 'partner_pj' || salesperson.status !== 'active') {
          setState(prev => ({ 
            ...prev, 
            isLoading: false, 
            needsReAccept: false,
            salespersonId: salesperson.id,
            salespersonType: salesperson.salesperson_type
          }));
          return;
        }

        // 2. Buscar versão atual do template ativo
        const { data: template, error: templateError } = await supabase
          .from('salesperson_contract_templates')
          .select('version')
          .eq('is_active', true)
          .maybeSingle();

        if (templateError || !template) {
          setState(prev => ({ 
            ...prev, 
            isLoading: false, 
            error: 'Erro ao buscar template de contrato' 
          }));
          return;
        }

        // 3. Buscar versão do último contrato aceito
        const { data: lastContract, error: contractError } = await supabase
          .from('salesperson_contracts')
          .select('version')
          .eq('salesperson_id', salesperson.id)
          .order('accepted_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        const acceptedVersion = lastContract?.version || null;
        const needsReAccept = !acceptedVersion || acceptedVersion !== template.version;

        setState({
          needsReAccept,
          isLoading: false,
          currentVersion: template.version,
          acceptedVersion,
          salespersonId: salesperson.id,
          salespersonType: salesperson.salesperson_type,
          error: null,
        });
      } catch (err) {
        console.error('Erro ao verificar contrato:', err);
        setState(prev => ({ 
          ...prev, 
          isLoading: false, 
          error: 'Erro inesperado ao verificar contrato' 
        }));
      }
    };

    checkContractVersion();
  }, [user]);

  const acceptContract = async (): Promise<boolean> => {
    if (!user || !state.currentVersion || !state.salespersonId) return false;

    try {
      // Capturar dados de auditoria
      const userAgent = navigator.userAgent;
      
      // Capturar IP público
      let ipAddress: string | null = null;
      try {
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipResponse.json();
        ipAddress = ipData.ip;
      } catch (e) {
        console.warn('Não foi possível obter IP:', e);
      }

      // Gerar hash de verificação SHA-256
      const verificationData = `${state.salespersonId}|${state.currentVersion}|${new Date().toISOString()}|${ipAddress}`;
      const encoder = new TextEncoder();
      const data = encoder.encode(verificationData);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const verificationHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      // Buscar template completo para salvar o contrato
      const { data: template } = await supabase
        .from('salesperson_contract_templates')
        .select('id, contract_text')
        .eq('is_active', true)
        .single();

      if (!template) {
        console.error('Template não encontrado');
        return false;
      }

      // Inserir novo registro em salesperson_contracts
      const { error: insertError } = await supabase
        .from('salesperson_contracts')
        .insert({
          salesperson_id: state.salespersonId,
          contract_template_id: template.id,
          contract_text: template.contract_text,
          version: state.currentVersion,
          accepted_at: new Date().toISOString(),
          ip_address: ipAddress,
          user_agent: userAgent,
          verification_hash: verificationHash,
          commission_terms: { percentage: 10 },
          bonus_terms: { eligible: true },
        });

      if (insertError) {
        console.error('Erro ao inserir contrato:', insertError);
        return false;
      }

      // Atualizar contract_accepted_at no salespeople
      const { error: updateError } = await supabase
        .from('salespeople')
        .update({ contract_accepted_at: new Date().toISOString() })
        .eq('id', state.salespersonId);

      if (updateError) {
        console.error('Erro ao atualizar salespeople:', updateError);
        return false;
      }

      // Atualizar estado local
      setState(prev => ({
        ...prev,
        needsReAccept: false,
        acceptedVersion: state.currentVersion,
      }));

      return true;
    } catch (err) {
      console.error('Erro ao aceitar contrato:', err);
      return false;
    }
  };

  return {
    ...state,
    acceptContract,
  };
};
