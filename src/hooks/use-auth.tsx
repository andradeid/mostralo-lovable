import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  email: string;
  full_name?: string;
  user_type: 'master_admin' | 'store_admin';
  avatar_url?: string;
  approval_status?: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  userRole: 'delivery_driver' | 'store_admin' | 'master_admin' | 'customer' | 'attendant' | null;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signOut: (redirectTo?: string) => Promise<void>;
  impersonateUser: (userId: string) => Promise<{ error: any }>;
  stopImpersonation: () => void;
  isImpersonating: boolean;
  originalAdmin: Profile | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<'delivery_driver' | 'store_admin' | 'master_admin' | 'customer' | 'attendant' | null>(null);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [originalAdmin, setOriginalAdmin] = useState<Profile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  useEffect(() => {
    // Carregar sessão inicial de forma mais rápida
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('🔐 Initial session:', !!session);
      setSession(session);
      setUser(session?.user ?? null);
      
      // Se não há sessão, já pode parar o loading
      if (!session?.user) {
        setLoading(false);
        setIsLoadingProfile(false);
      }
    });

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('🔐 Auth state changed:', event, !!session);
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (!session?.user) {
          setProfile(null);
          setUserRole(null);
          setLoading(false);
          setIsLoadingProfile(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    let active = true;
    
    const loadProfileAndRole = async () => {
      if (!user?.id) {
        if (active) {
          setProfile(null);
          setUserRole(null);
          setLoading(false);
          setIsLoadingProfile(false);
        }
        return;
      }
      
      if (active) {
        setLoading(true);
        setIsLoadingProfile(true);
      }
      
      try {
        console.log('👤 Loading profile and role for:', user.id);
        
        const { data: prof } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (!active) return;
        setProfile(prof ?? null);

        // 🔒 PRIORIDADE 1: Buscar role em user_roles PRIMEIRO
        // Roles administrativas (store_admin, master_admin, attendant, delivery_driver) 
        // têm prioridade sobre ser cliente
        // Buscar APENAS UMA role (a primeira)
        const { data: roleDataArray, error: roleError } = await supabase
          .from('user_roles')
          .select('role, store_id')
          .eq('user_id', user.id)
          .limit(1);

        if (!active) return;
        
        console.log('🔍 Busca de role:', { roleDataArray, roleError, userId: user.id });

        const roleData = roleDataArray && roleDataArray.length > 0 ? roleDataArray[0] : null;
        
        console.log('🔍 Role encontrada:', roleData);

        if (roleData) {
          // Usuário tem role administrativa - usar essa (prioridade sobre customer)
          setUserRole(roleData.role as any);
          console.log('✅ Role definida:', roleData.role, '(prioridade sobre customer)');
          console.log('✅ Profile and role loaded:', !!prof, roleData.role);
          return;
        }

        // 🔒 PRIORIDADE 2: Verificar se é CLIENTE (apenas se não tiver role administrativa)
        // Só é cliente se não tiver role em user_roles
        const { data: customerData } = await supabase
          .from('customers')
          .select('id')
          .eq('auth_user_id', user.id)
          .maybeSingle();

        if (!active) return;

        if (customerData) {
          // Usuário é CLIENTE (sem role administrativa)
          console.log('👤 Usuário identificado como CLIENTE (sem role administrativa)');
          setUserRole('customer');
          console.log('✅ Role definida: customer');
          console.log('✅ Profile and role loaded:', !!prof, 'customer');
          return;
        }

        // Usuário sem role e sem registro como cliente
        console.warn('⚠️ SECURITY: Usuário sem role definida - acesso negado', { roleError });
        setUserRole(null);
        console.log('✅ Profile and role loaded:', !!prof, 'NO_ROLE');
      } catch (error) {
        console.error('❌ Error loading profile/role:', error);
        if (active) {
          setProfile(null);
          setUserRole(null);
        }
      } finally {
        if (active) {
          setLoading(false);
          setIsLoadingProfile(false);
        }
      }
    };

    loadProfileAndRole();

    return () => { active = false; };
  }, [user?.id]);

  // Timeout de segurança: se loading ficar travado por mais de 5s, forçar descarregamento
  useEffect(() => {
    if (!loading && !isLoadingProfile) return;
    
    const timeout = setTimeout(() => {
      if (loading || isLoadingProfile) {
        console.warn('⚠️ Loading timeout - forçando descarregamento');
        setLoading(false);
        setIsLoadingProfile(false);
      }
    }, 5000); // Reduzido de 10s para 5s
    
    return () => clearTimeout(timeout);
  }, [loading, isLoadingProfile]);

  const signIn = async (email: string, password: string) => {
    // Validações básicas
    if (!email || !email.includes('@')) {
      return { 
        error: { 
          message: 'Email inválido. Verifique o formato do email.',
          status: 400,
          name: 'ValidationError'
        } 
      };
    }

    if (!password || password.length === 0) {
      return { 
        error: { 
          message: 'Senha é obrigatória.',
          status: 400,
          name: 'ValidationError'
        } 
      };
    }

    // Normalizar email
    const normalizedEmail = email.trim().toLowerCase();
    
    try {
      // 🔒 LIMPEZA COMPLETA: Remover todas as sessões e dados relacionados
      console.log('🧹 Limpando sessões anteriores...');
      
      // 1. Fazer logout do Supabase
      await supabase.auth.signOut();
      
      // 2. Limpar localStorage completamente (apenas chaves relacionadas ao Supabase)
      const supabaseKeys = [
        'sb-noshwvwpjtnvndokbfjx-auth-token',
        'sb-noshwvwpjtnvndokbfjx-auth-token-code-verifier',
      ];
      
      // Limpar todas as chaves que começam com 'customer_'
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('customer_') || supabaseKeys.includes(key)) {
          localStorage.removeItem(key);
        }
      });
      
      // 3. Aguardar um pouco para garantir limpeza
      await new Promise(resolve => setTimeout(resolve, 200));
      
      console.log('✅ Limpeza concluída, tentando login...');

      // 4. Tentar login
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password
      });
      
      if (error) {
        console.error('❌ Erro no login:', error.message);
        
        // Mensagem amigável
        let friendlyMessage = 'Email ou senha incorretos.';
        if (error.message === 'Invalid login credentials') {
          friendlyMessage = 'Email ou senha incorretos. Verifique suas credenciais.';
        } else if (error.message.includes('Email not confirmed')) {
          friendlyMessage = 'Email não confirmado. Verifique sua caixa de entrada.';
        }

        return { 
          error: {
            ...error,
            message: friendlyMessage
          }
        };
      }
      
      console.log('✅ Login bem-sucedido');
      return { error: null };
      
    } catch (err: any) {
      console.error('❌ Erro inesperado:', err);
      return { 
        error: { 
          message: 'Erro ao fazer login. Tente novamente.',
          status: 500,
          name: 'UnexpectedError'
        } 
      };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName
        }
      }
    });
    return { error };
  };

  const signOut = async (redirectTo?: string) => {
    console.log('🚪 SignOut solicitado');

    // 🔒 LIMPEZA COMPLETA: Remover TODAS as sessões e dados
    
    // IMPORTANTE: Salvar userRole ANTES de limpar (para saber onde redirecionar)
    const currentUserRole = userRole;
    console.log('📝 UserRole atual antes de limpar:', currentUserRole);
    
    // 1) Limpar dados do cliente do localStorage (se houver)
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('customer_')) {
          localStorage.removeItem(key);
        }
      });
      console.log('🧹 Dados de cliente removidos do localStorage');
    } catch (error) {
      console.error('Erro ao limpar dados do cliente:', error);
    }
    
    try {
      // 2) Limpar estados locais ANTES de fazer logout do Supabase
      setIsImpersonating(false);
      setOriginalAdmin(null);
      setUser(null);
      setSession(null);
      setProfile(null);
      setUserRole(null);

      // 3) Fazer logout do Supabase (SEM timeout para garantir limpeza completa)
      try {
        await supabase.auth.signOut();
        console.log('✅ Logout do Supabase concluído');
      } catch (signOutError) {
        console.error('⚠️ Erro ao fazer logout do Supabase (continuando limpeza):', signOutError);
        // Continuar mesmo com erro - forçar limpeza local
      }

      // 4) Limpar localStorage COMPLETO (tokens, sessão e preferências ligadas à sessão)
      const extraKeys = new Set([
        'impersonation_data',
        'delivery_driver_online',
        'deliverySoundEnabled',
        'orderSoundEnabled',
        'orderNotificationSound',
        'cookie-consent',
        'privacy-consent',
        'legal-consent',
      ]);

      // Limpar TODAS as chaves relacionadas ao Supabase e cliente
      for (const key of Object.keys(localStorage)) {
        if (
          key.startsWith('sb-') ||                 // tokens Supabase
          key.includes('supabase') ||              // qualquer chave ligada ao supabase
          key.startsWith('customer_') ||           // dados de cliente por loja
          extraKeys.has(key)
        ) {
          localStorage.removeItem(key);
          console.log('🗑️ Removido do localStorage:', key);
        }
      }

      console.log('✅ Limpeza completa concluída');

      // 5) Aguardar um pouco para garantir que a limpeza foi processada
      await new Promise(resolve => setTimeout(resolve, 300));

      // 6) Redirecionar baseado no tipo de usuário
      let targetPath = redirectTo;
      
      // Se não foi especificado redirectTo, definir baseado no tipo de usuário
      if (!targetPath) {
        // Clientes redirecionam para a loja deles
        if (currentUserRole === 'customer') {
          // Buscar slug da loja do cliente
          try {
            // Primeiro, buscar o customer_id
            const { data: customerData } = await supabase
              .from('customers')
              .select('id')
              .eq('auth_user_id', user?.id || '')
              .maybeSingle();
            
            if (customerData?.id) {
              // Buscar a última loja que o cliente usou (último pedido)
              const { data: lastOrder } = await supabase
                .from('orders')
                .select('store_id')
                .eq('customer_id', customerData.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();
              
              if (lastOrder?.store_id) {
                // Buscar o slug da loja
                const { data: storeData } = await supabase
                  .from('stores')
                  .select('slug')
                  .eq('id', lastOrder.store_id)
                  .maybeSingle();
                
                if (storeData?.slug) {
                  targetPath = `/loja/${storeData.slug}`;
                  console.log('🏪 Cliente redirecionando para loja:', storeData.slug);
                } else {
                  // Fallback: buscar primeira loja do customer_stores
                  const { data: customerStore } = await supabase
                    .from('customer_stores')
                    .select('store_id')
                    .eq('customer_id', customerData.id)
                    .order('first_order_at', { ascending: true })
                    .limit(1)
                    .maybeSingle();
                  
                  if (customerStore?.store_id) {
                    const { data: storeData2 } = await supabase
                      .from('stores')
                      .select('slug')
                      .eq('id', customerStore.store_id)
                      .maybeSingle();
                    
                    if (storeData2?.slug) {
                      targetPath = `/loja/${storeData2.slug}`;
                      console.log('🏪 Cliente redirecionando para primeira loja:', storeData2.slug);
                    } else {
                      targetPath = '/';
                    }
                  } else {
                    targetPath = '/';
                  }
                }
              } else {
                // Se não tem pedidos, buscar primeira loja do customer_stores
                const { data: customerStore } = await supabase
                  .from('customer_stores')
                  .select('store_id')
                  .eq('customer_id', customerData.id)
                  .order('first_order_at', { ascending: true })
                  .limit(1)
                  .maybeSingle();
                
                if (customerStore?.store_id) {
                  const { data: storeData } = await supabase
                    .from('stores')
                    .select('slug')
                    .eq('id', customerStore.store_id)
                    .maybeSingle();
                  
                  if (storeData?.slug) {
                    targetPath = `/loja/${storeData.slug}`;
                    console.log('🏪 Cliente redirecionando para primeira loja:', storeData.slug);
                  } else {
                    targetPath = '/';
                  }
                } else {
                  targetPath = '/';
                }
              }
            } else {
              targetPath = '/';
            }
          } catch (error) {
            console.error('❌ Erro ao buscar loja do cliente:', error);
            targetPath = '/';
          }
        } else {
          // Master admin, store admin, atendentes e entregadores vão para /auth
          targetPath = '/auth';
        }
      }
      
      console.log('🚪 Redirecionando para:', targetPath, '| Tipo de usuário:', currentUserRole);
      
      // 7) Forçar recarregamento completo para garantir que não há sessão residual
      if (window.location.pathname === targetPath) {
        window.location.reload();
      } else {
        window.location.replace(targetPath);
      }
    } catch (e) {
      console.error('❌ Erro no signOut', e);
      localStorage.clear();
      window.location.replace(redirectTo || '/auth');
    }
  };

  const impersonateUser = async (userId: string) => {
    if (profile?.user_type !== 'master_admin') {
      return { error: 'Acesso negado' };
    }

    try {
      // Store original admin profile
      if (!isImpersonating) {
        setOriginalAdmin(profile);
      }

      // Fetch target user profile
      const { data: targetProfile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !targetProfile) {
        return { error: 'Usuário não encontrado' };
      }

      // Set impersonation state
      setIsImpersonating(true);
      setProfile(targetProfile);
      
      return { error: null };
    } catch (error) {
      return { error: 'Erro ao impersonar usuário' };
    }
  };

  const stopImpersonation = () => {
    if (originalAdmin) {
      setProfile(originalAdmin);
      setIsImpersonating(false);
      setOriginalAdmin(null);
    }
  };

  const value = {
    user,
    session,
    profile,
    loading,
    userRole,
    signIn,
    signUp,
    signOut,
    impersonateUser,
    stopImpersonation,
    isImpersonating,
    originalAdmin
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}