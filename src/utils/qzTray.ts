/**
 * Integração com QZ Tray para impressão térmica com corte automático
 * QZ Tray é um software gratuito e open-source que permite comunicação
 * direta com impressoras térmicas via JavaScript/WebSocket
 * 
 * Download: https://qz.io/download/
 */

// Tipagem básica para QZ Tray
declare global {
  interface Window {
    qz?: {
      websocket: {
        connect: () => Promise<void>;
        disconnect: () => Promise<void>;
        isActive: () => boolean;
      };
      printers: {
        find: (printerName?: string) => Promise<string[]>;
        getDefault: () => Promise<string>;
      };
      print: (config: any, data: any[]) => Promise<void>;
      version: string;
    };
  }
}

/**
 * Verifica se QZ Tray está disponível e conectado
 */
export const isQZAvailable = (): boolean => {
  return typeof window !== 'undefined' && !!window.qz;
};

/**
 * Conecta ao QZ Tray via WebSocket
 */
export const connectQZ = async (): Promise<boolean> => {
  if (!isQZAvailable()) {
    throw new Error('QZ Tray não está instalado. Baixe em https://qz.io/download/');
  }

  try {
    if (!window.qz!.websocket.isActive()) {
      await window.qz!.websocket.connect();
    }
    return true;
  } catch (error) {
    console.error('Erro ao conectar QZ Tray:', error);
    throw new Error('Não foi possível conectar ao QZ Tray. Verifique se o software está aberto.');
  }
};

/**
 * Desconecta do QZ Tray
 */
export const disconnectQZ = async (): Promise<void> => {
  if (isQZAvailable() && window.qz!.websocket.isActive()) {
    await window.qz!.websocket.disconnect();
  }
};

/**
 * Lista todas as impressoras disponíveis
 */
export const getPrinters = async (): Promise<string[]> => {
  await connectQZ();
  return await window.qz!.printers.find();
};

/**
 * Obtém a impressora padrão do sistema
 */
export const getDefaultPrinter = async (): Promise<string> => {
  await connectQZ();
  return await window.qz!.printers.getDefault();
};

/**
 * Comandos ESC/POS para corte de papel
 */
const ESC_POS_CUT_COMMANDS = {
  // Corte total: ESC i (1B 69)
  fullCut: '\x1B\x69',
  // Corte parcial: GS V 66 (1D 56 42)
  partialCut: '\x1D\x56\x42',
  // Avanço de papel antes do corte
  feedAndCut: '\x1B\x64\x03\x1D\x56\x42', // ESC d 3 + GS V 66
};

/**
 * Imprime HTML com corte automático usando QZ Tray
 * 
 * @param printerName Nome da impressora (ex: "EPSON TM-T20")
 * @param htmlContent Conteúdo HTML para impressão
 * @param cutType Tipo de corte: 'partial' (padrão) ou 'full'
 */
export const printWithCut = async (
  printerName: string,
  htmlContent: string,
  cutType: 'partial' | 'full' = 'partial'
): Promise<void> => {
  await connectQZ();

  const config: any = {
    printer: printerName,
    encoding: 'UTF-8',
    copies: 1,
  };

  const cutCommand = cutType === 'full' 
    ? ESC_POS_CUT_COMMANDS.fullCut 
    : ESC_POS_CUT_COMMANDS.feedAndCut;

  // Dados para impressão: HTML + comando de corte
  const data: any[] = [
    {
      type: 'html',
      format: 'plain',
      data: htmlContent,
    },
    {
      type: 'raw',
      format: 'command',
      data: cutCommand,
    },
  ];

  await window.qz!.print(config, data);
};

/**
 * Testa impressão com QZ Tray
 */
export const testPrint = async (printerName: string): Promise<void> => {
  const testHTML = `
    <div style="font-family: monospace; text-align: center; padding: 20px;">
      <h2>🖨️ Teste de Impressão</h2>
      <p>Sistema Mostralo</p>
      <p>Impressora: ${printerName}</p>
      <p>Data/Hora: ${new Date().toLocaleString('pt-BR')}</p>
      <hr style="border: 1px dashed #000; margin: 10px 0;" />
      <p style="font-size: 12px;">Se você está lendo isso, a impressão funcionou!</p>
      <p style="font-size: 10px;">www.mostralo.app</p>
    </div>
  `;

  await printWithCut(printerName, testHTML, 'partial');
};

/**
 * Obtém o status de conexão do QZ Tray
 */
export const getQZStatus = (): {
  installed: boolean;
  connected: boolean;
  version?: string;
} => {
  const installed = isQZAvailable();
  const connected = installed && window.qz!.websocket.isActive();
  const version = installed ? window.qz!.version : undefined;

  return { installed, connected, version };
};
