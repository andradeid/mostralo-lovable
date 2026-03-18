import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const IDLE_TIMEOUT_MS = 4 * 60 * 60 * 1000; // 4 horas
const WARNING_BEFORE_MS = 5 * 60 * 1000; // Aviso 5 min antes
const IDLE_EVENTS = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart', 'pointerdown'];
const STORAGE_KEY = 'idle_last_activity';
const DISCONNECTED_KEY = 'idle_disconnected';

/**
 * Hook que monitora inatividade do usuário.
 * Após 4h sem interação, faz logout automático.
 * Mostra aviso 5 min antes do logout.
 */
export function useIdleTimeout() {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigate = useNavigate();

  const clearTimers = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);
  }, []);

  const performLogout = useCallback(async () => {
    clearTimers();
    
    // Marcar que foi desconectado por inatividade
    try {
      localStorage.setItem(DISCONNECTED_KEY, 'true');
    } catch {}

    // Fazer logout
    try {
      await supabase.auth.signOut();
    } catch {
      // Silenciar - vamos redirecionar de qualquer forma
    }

    // Limpar dados de sessão
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}

    // Redirecionar para auth
    window.location.replace('/auth?reason=idle');
  }, [clearTimers]);

  const showWarning = useCallback(() => {
    // Disparar evento customizado que o componente de UI pode escutar
    window.dispatchEvent(new CustomEvent('idleWarning', { detail: { minutesLeft: 5 } }));
  }, []);

  const resetTimer = useCallback(() => {
    clearTimers();

    // Salvar timestamp da última atividade
    try {
      localStorage.setItem(STORAGE_KEY, Date.now().toString());
    } catch {}

    // Timer de aviso (3h55min)
    warningRef.current = setTimeout(() => {
      showWarning();
    }, IDLE_TIMEOUT_MS - WARNING_BEFORE_MS);

    // Timer de logout (4h)
    timeoutRef.current = setTimeout(() => {
      performLogout();
    }, IDLE_TIMEOUT_MS);
  }, [clearTimers, showWarning, performLogout]);

  useEffect(() => {
    // Verificar se já estava inativo ao carregar
    try {
      const lastActivity = localStorage.getItem(STORAGE_KEY);
      if (lastActivity) {
        const elapsed = Date.now() - parseInt(lastActivity, 10);
        if (elapsed >= IDLE_TIMEOUT_MS) {
          // Já passou do tempo - deslogar imediatamente
          performLogout();
          return;
        }
      }
    } catch {}

    // Iniciar timer
    resetTimer();

    // Ouvir eventos de atividade (throttled)
    let throttleTimer: ReturnType<typeof setTimeout> | null = null;
    const handleActivity = () => {
      if (throttleTimer) return;
      throttleTimer = setTimeout(() => {
        throttleTimer = null;
        resetTimer();
      }, 30000); // Throttle: atualiza no máximo a cada 30s
    };

    IDLE_EVENTS.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Sincronizar entre abas
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        resetTimer();
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      clearTimers();
      if (throttleTimer) clearTimeout(throttleTimer);
      IDLE_EVENTS.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      window.removeEventListener('storage', handleStorage);
    };
  }, [resetTimer, performLogout, clearTimers]);
}

/**
 * Verifica se o usuário foi desconectado por inatividade
 * e limpa a flag. Retorna true se foi desconectado.
 */
export function checkIdleDisconnect(): boolean {
  try {
    const was = localStorage.getItem(DISCONNECTED_KEY) === 'true';
    if (was) localStorage.removeItem(DISCONNECTED_KEY);
    return was;
  } catch {
    return false;
  }
}
