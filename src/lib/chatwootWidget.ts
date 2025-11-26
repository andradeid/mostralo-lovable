/**
 * Widget Chatwoot para suporte ao vivo
 * Carrega apenas nas áreas de entregador e lojista
 */

interface ChatwootWindow extends Window {
  chatwootSDK?: {
    run: (config: ChatwootConfig) => void;
  };
}

interface ChatwootConfig {
  websiteToken: string;
  baseUrl: string;
}

declare const window: ChatwootWindow;

/**
 * Inicializa o widget Chatwoot
 */
export const initializeChatwoot = () => {
  // Verificar se já foi carregado
  if (window.chatwootSDK) {
    console.log('ℹ️ Chatwoot já está carregado');
    return;
  }

  const BASE_URL = "https://app.hubsac.com.br";
  const WEBSITE_TOKEN = "x6Gdi3vDCDinzec1NJ44Jzky";

  // Criar script element
  const script = document.createElement('script');
  script.src = `${BASE_URL}/packs/js/sdk.js`;
  script.async = true;
  
  // Callback quando o script carregar
  script.onload = () => {
    if (window.chatwootSDK) {
      window.chatwootSDK.run({
        websiteToken: WEBSITE_TOKEN,
        baseUrl: BASE_URL
      });
      console.log('✅ Chatwoot inicializado com sucesso');
    }
  };

  // Adicionar script ao DOM
  const firstScript = document.getElementsByTagName('script')[0];
  firstScript.parentNode?.insertBefore(script, firstScript);
};

/**
 * Remove o widget Chatwoot (útil ao sair da área)
 */
export const removeChatwoot = () => {
  // Remover o widget do DOM se existir
  const chatwootContainer = document.querySelector('#chatwoot_live_chat_widget');
  if (chatwootContainer) {
    chatwootContainer.remove();
    console.log('✅ Chatwoot removido');
  }
  
  // Limpar a referência global
  if (window.chatwootSDK) {
    delete window.chatwootSDK;
  }
};
