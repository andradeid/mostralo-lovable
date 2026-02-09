import { useEffect, useRef } from 'react';

interface CustomScripts {
  head_scripts?: string;
  body_start_scripts?: string;
  body_end_scripts?: string;
}

/**
 * Hook para injetar scripts personalizados na página da loja
 * Injeta scripts no <head> e no <body> de forma segura
 */
export function useCustomScripts(customScripts: CustomScripts | null | undefined, storeId: string | undefined) {
  const injectedRef = useRef<{
    headElements: Node[];
    bodyStartContainer: HTMLDivElement | null;
    bodyEndContainer: HTMLDivElement | null;
  }>({
    headElements: [],
    bodyStartContainer: null,
    bodyEndContainer: null,
  });

  // Referência para evitar re-injeção desnecessária
  const lastScriptsRef = useRef<string>('');

  useEffect(() => {
    if (!customScripts || !storeId) return;

    // Criar hash simples para comparar se os scripts mudaram
    const scriptsHash = JSON.stringify(customScripts);
    if (scriptsHash === lastScriptsRef.current) return;
    lastScriptsRef.current = scriptsHash;

    // Cleanup containers anteriores dessa loja
    const cleanup = () => {
      injectedRef.current.headElements.forEach(el => {
        try { el.parentNode?.removeChild(el); } catch (e) { /* ignore */ }
      });
      injectedRef.current.headElements = [];

      if (injectedRef.current.bodyStartContainer) {
        try { injectedRef.current.bodyStartContainer.remove(); } catch (e) { /* ignore */ }
        injectedRef.current.bodyStartContainer = null;
      }
      if (injectedRef.current.bodyEndContainer) {
        try { injectedRef.current.bodyEndContainer.remove(); } catch (e) { /* ignore */ }
        injectedRef.current.bodyEndContainer = null;
      }
    };

    // Limpar antes de injetar novos scripts
    cleanup();

    // Função para criar e executar um script a partir de um elemento existente
    const createExecutableScript = (oldScript: HTMLScriptElement): HTMLScriptElement => {
      const newScript = document.createElement('script');
      Array.from(oldScript.attributes).forEach(attr => {
        newScript.setAttribute(attr.name, attr.value);
      });
      if (oldScript.src) {
        newScript.src = oldScript.src;
      } else {
        newScript.textContent = oldScript.textContent;
      }
      return newScript;
    };

    // Função para injetar HTML + executar scripts em sequência
    const injectContent = (html: string, parentElement: HTMLElement, insertPosition: 'prepend' | 'append' = 'append'): HTMLDivElement => {
      const container = document.createElement('div');
      container.id = `custom-scripts-${storeId}-${Date.now()}`;
      container.setAttribute('data-store-scripts', storeId);
      
      // Separar scripts do HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      
      // Extrair scripts antes de inserir no DOM
      const scriptElements: HTMLScriptElement[] = [];
      tempDiv.querySelectorAll('script').forEach((script) => {
        scriptElements.push(script as HTMLScriptElement);
        script.remove();
      });
      
      // Inserir HTML (sem scripts) no container
      container.innerHTML = tempDiv.innerHTML;
      
      // Inserir container no DOM
      if (insertPosition === 'prepend' && parentElement.firstChild) {
        parentElement.insertBefore(container, parentElement.firstChild);
      } else {
        parentElement.appendChild(container);
      }
      
      // Agora executar scripts (após o HTML já estar no DOM)
      // Usar setTimeout para garantir que o DOM esteja atualizado
      setTimeout(() => {
        scriptElements.forEach((oldScript) => {
          const newScript = createExecutableScript(oldScript);
          container.appendChild(newScript);
        });
      }, 100);
      
      return container;
    };

    // Injetar head_scripts
    if (customScripts.head_scripts?.trim()) {
      try {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = customScripts.head_scripts;
        
        const elements: Node[] = [];
        Array.from(tempDiv.children).forEach(child => {
          if (child.tagName === 'SCRIPT') {
            const script = createExecutableScript(child as HTMLScriptElement);
            document.head.appendChild(script);
            elements.push(script);
          } else {
            const clone = child.cloneNode(true);
            document.head.appendChild(clone);
            elements.push(clone);
          }
        });
        
        injectedRef.current.headElements = elements;
      } catch (error) {
        console.error('Erro ao injetar head_scripts:', error);
      }
    }

    // Injetar body_start_scripts
    if (customScripts.body_start_scripts?.trim()) {
      try {
        injectedRef.current.bodyStartContainer = injectContent(
          customScripts.body_start_scripts,
          document.body,
          'prepend'
        );
      } catch (error) {
        console.error('Erro ao injetar body_start_scripts:', error);
      }
    }

    // Injetar body_end_scripts
    if (customScripts.body_end_scripts?.trim()) {
      try {
        injectedRef.current.bodyEndContainer = injectContent(
          customScripts.body_end_scripts,
          document.body,
          'append'
        );
      } catch (error) {
        console.error('Erro ao injetar body_end_scripts:', error);
      }
    }

    // Cleanup ao desmontar
    return () => {
      cleanup();
      lastScriptsRef.current = '';
    };
  }, [customScripts, storeId]);
}
