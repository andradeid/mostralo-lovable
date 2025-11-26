/**
 * Safe Storage Wrapper
 * 
 * Wrapper seguro para localStorage que funciona em:
 * - Safari modo privado
 * - iPhones
 * - Navegadores com localStorage desabilitado
 * 
 * Falha silenciosamente em vez de quebrar a aplicação.
 */

export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.warn('[SafeStorage] getItem failed:', error);
      return null;
    }
  },

  setItem: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.warn('[SafeStorage] setItem failed (Safari private mode?):', error);
    }
  },

  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('[SafeStorage] removeItem failed:', error);
    }
  },

  clear: (): void => {
    try {
      localStorage.clear();
    } catch (error) {
      console.warn('[SafeStorage] clear failed:', error);
    }
  },

  key: (index: number): string | null => {
    try {
      return localStorage.key(index);
    } catch (error) {
      console.warn('[SafeStorage] key failed:', error);
      return null;
    }
  },

  get length(): number {
    try {
      return localStorage.length;
    } catch (error) {
      console.warn('[SafeStorage] length failed:', error);
      return 0;
    }
  }
};

/**
 * Storage wrapper para Supabase Auth
 * Interface compatível com o esperado pelo Supabase
 */
export const supabaseStorage = {
  getItem: (key: string) => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  
  setItem: (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Silently fail - Safari private mode
    }
  },
  
  removeItem: (key: string) => {
    try {
      localStorage.removeItem(key);
    } catch {
      // Silently fail
    }
  }
};
