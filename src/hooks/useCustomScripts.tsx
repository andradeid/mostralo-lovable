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
    headContainer: HTMLDivElement | null;
    bodyStartContainer: HTMLDivElement | null;
    bodyEndContainer: HTMLDivElement | null;
  }>({
    headContainer: null,
    bodyStartContainer: null,
    bodyEndContainer: null,
  });

  useEffect(() => {
    if (!customScripts || !storeId) return;

    // Cleanup containers anteriores dessa loja
    const cleanup = () => {
      if (injectedRef.current.headContainer) {
        injectedRef.current.headContainer.remove();
        injectedRef.current.headContainer = null;
      }
      if (injectedRef.current.bodyStartContainer) {
        injectedRef.current.bodyStartContainer.remove();
        injectedRef.current.bodyStartContainer = null;
      }
      if (injectedRef.current.bodyEndContainer) {
        injectedRef.current.bodyEndContainer.remove();
        injectedRef.current.bodyEndContainer = null;
      }
    };

    // Limpar antes de injetar novos scripts
    cleanup();

    // Função para executar scripts inline
    const executeScripts = (container: HTMLElement) => {
      const scripts = container.querySelectorAll('script');
      scripts.forEach((oldScript) => {
        const newScript = document.createElement('script');
        
        // Copiar atributos
        Array.from(oldScript.attributes).forEach(attr => {
          newScript.setAttribute(attr.name, attr.value);
        });
        
        // Se tem src, usar o src
        if (oldScript.src) {
          newScript.src = oldScript.src;
        } else {
          // Se não, copiar o conteúdo inline
          newScript.textContent = oldScript.textContent;
        }
        
        // Substituir o script antigo pelo novo (isso força a execução)
        oldScript.parentNode?.replaceChild(newScript, oldScript);
      });
    };

    // Injetar head_scripts
    if (customScripts.head_scripts?.trim()) {
      try {
        const headContainer = document.createElement('div');
        headContainer.id = `custom-scripts-head-${storeId}`;
        headContainer.innerHTML = customScripts.head_scripts;
        
        // Mover elementos para o head
        const children = Array.from(headContainer.children);
        children.forEach(child => {
          if (child.tagName === 'SCRIPT') {
            const script = document.createElement('script');
            Array.from(child.attributes).forEach(attr => {
              script.setAttribute(attr.name, attr.value);
            });
            if ((child as HTMLScriptElement).src) {
              script.src = (child as HTMLScriptElement).src;
            } else {
              script.textContent = child.textContent;
            }
            document.head.appendChild(script);
          } else {
            document.head.appendChild(child.cloneNode(true));
          }
        });
        
        injectedRef.current.headContainer = headContainer;
      } catch (error) {
        console.error('Erro ao injetar head_scripts:', error);
      }
    }

    // Injetar body_start_scripts
    if (customScripts.body_start_scripts?.trim()) {
      try {
        const bodyStartContainer = document.createElement('div');
        bodyStartContainer.id = `custom-scripts-body-start-${storeId}`;
        bodyStartContainer.innerHTML = customScripts.body_start_scripts;
        
        // Inserir no início do body
        if (document.body.firstChild) {
          document.body.insertBefore(bodyStartContainer, document.body.firstChild);
        } else {
          document.body.appendChild(bodyStartContainer);
        }
        
        executeScripts(bodyStartContainer);
        injectedRef.current.bodyStartContainer = bodyStartContainer;
      } catch (error) {
        console.error('Erro ao injetar body_start_scripts:', error);
      }
    }

    // Injetar body_end_scripts
    if (customScripts.body_end_scripts?.trim()) {
      try {
        const bodyEndContainer = document.createElement('div');
        bodyEndContainer.id = `custom-scripts-body-end-${storeId}`;
        bodyEndContainer.innerHTML = customScripts.body_end_scripts;
        
        // Inserir no final do body
        document.body.appendChild(bodyEndContainer);
        
        executeScripts(bodyEndContainer);
        injectedRef.current.bodyEndContainer = bodyEndContainer;
      } catch (error) {
        console.error('Erro ao injetar body_end_scripts:', error);
      }
    }

    // Cleanup ao desmontar
    return cleanup;
  }, [customScripts, storeId]);
}
