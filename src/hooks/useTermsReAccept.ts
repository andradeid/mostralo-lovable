import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './use-auth';

interface TermsReAcceptState {
  needsReAccept: boolean;
  isLoading: boolean;
  currentVersion: string | null;
  userVersion: string | null;
  changelog: string | null;
  error: string | null;
}

export const useTermsReAccept = () => {
  const { user, profile } = useAuth();
  const [state, setState] = useState<TermsReAcceptState>({
    needsReAccept: false,
    isLoading: true,
    currentVersion: null,
    userVersion: null,
    changelog: null,
    error: null,
  });

  useEffect(() => {
    const checkTermsVersion = async () => {
      // Não verificar se não está autenticado
      if (!user || !profile) {
        setState(prev => ({ ...prev, isLoading: false, needsReAccept: false }));
        return;
      }

      try {
        // Buscar versão atual do sistema
        const { data: configData, error: configError } = await supabase
          .from('system_terms_config')
          .select('config_key, config_value')
          .in('config_key', ['current_terms_version', 'terms_changelog']);

        if (configError) {
          console.error('Erro ao buscar config de termos:', configError);
          setState(prev => ({ 
            ...prev, 
            isLoading: false, 
            error: 'Erro ao verificar versão dos termos' 
          }));
          return;
        }

        const currentVersionConfig = configData?.find(c => c.config_key === 'current_terms_version');
        const changelogConfig = configData?.find(c => c.config_key === 'terms_changelog');
        
        const currentVersion = currentVersionConfig?.config_value || '1.0';
        const changelog = changelogConfig?.config_value || null;
        
        // Buscar versão aceita pelo usuário diretamente do profile já carregado
        // ou da tabela profiles se não estiver no contexto
        const userVersion = (profile as any)?.accepted_terms_version || null;

        // Verificar se precisa re-aceitar
        const needsReAccept = !userVersion || userVersion !== currentVersion;

        setState({
          needsReAccept,
          isLoading: false,
          currentVersion,
          userVersion,
          changelog,
          error: null,
        });
      } catch (err) {
        console.error('Erro ao verificar termos:', err);
        setState(prev => ({ 
          ...prev, 
          isLoading: false, 
          error: 'Erro inesperado ao verificar termos' 
        }));
      }
    };

    checkTermsVersion();
  }, [user, profile]);

  const acceptTerms = async (): Promise<boolean> => {
    if (!user || !state.currentVersion) return false;

    try {
      // Capturar dados de auditoria
      const userAgent = navigator.userAgent;
      
      // Gerar hash de verificação (simplificado - em produção usar Edge Function)
      const verificationData = `${user.id}|${state.currentVersion}|${new Date().toISOString()}`;
      const encoder = new TextEncoder();
      const data = encoder.encode(verificationData);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const verificationHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      // Verificar se já existe aceite para esta versão (evitar duplicação)
      const { data: existingAcceptance } = await supabase
        .from('merchant_contract_acceptance')
        .select('id')
        .eq('user_id', user.id)
        .eq('contract_version', state.currentVersion)
        .maybeSingle();

      if (existingAcceptance) {
        console.log('Aceite já existe para esta versão, atualizando estado local');
        setState(prev => ({
          ...prev,
          needsReAccept: false,
          userVersion: state.currentVersion,
        }));
        return true;
      }

      // Registrar aceite em merchant_contract_acceptance
      const { error: acceptError } = await supabase
        .from('merchant_contract_acceptance')
        .insert({
          user_id: user.id,
          contract_version: state.currentVersion,
          terms_accepted: true,
          privacy_accepted: true,
          cookies_accepted: true,
          marketing_accepted: false,
          user_agent: userAgent,
          verification_hash: verificationHash,
          accepted_at: new Date().toISOString(),
        });

      if (acceptError) {
        console.error('Erro ao registrar aceite:', acceptError);
        return false;
      }

      // Atualizar profiles com versão aceita
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          accepted_terms_version: state.currentVersion,
          terms_accepted_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('Erro ao atualizar profile:', updateError);
        return false;
      }

      // Atualizar estado local
      setState(prev => ({
        ...prev,
        needsReAccept: false,
        userVersion: state.currentVersion,
      }));

      return true;
    } catch (err) {
      console.error('Erro ao aceitar termos:', err);
      return false;
    }
  };

  return {
    ...state,
    acceptTerms,
  };
};
