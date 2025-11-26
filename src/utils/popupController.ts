interface PopupConfig {
  storeId: string;
  promotionId: string;
  frequencyType: 'once_browser' | 'once_session' | 'custom_count';
  maxDisplays?: number;
}

export class PopupController {
  private static getStorageKey(storeId: string, promotionId: string): string {
    return `popup_${storeId}_${promotionId}`;
  }

  /**
   * Verifica se o popup deve ser exibido
   */
  static shouldShowPopup(config: PopupConfig): boolean {
    const { storeId, promotionId, frequencyType, maxDisplays = 1 } = config;
    const key = this.getStorageKey(storeId, promotionId);

    switch (frequencyType) {
      case 'once_browser': {
        // localStorage - permanente
        const shown = localStorage.getItem(key);
        return shown !== 'true';
      }

      case 'once_session': {
        // sessionStorage - por sessão
        const shown = sessionStorage.getItem(key);
        return shown !== 'true';
      }

      case 'custom_count': {
        // localStorage com contador
        const countStr = localStorage.getItem(key);
        const currentCount = countStr ? parseInt(countStr, 10) : 0;
        return currentCount < maxDisplays;
      }

      default:
        return false;
    }
  }

  /**
   * Registra que o popup foi exibido
   */
  static markAsShown(config: PopupConfig): void {
    const { storeId, promotionId, frequencyType } = config;
    const key = this.getStorageKey(storeId, promotionId);

    switch (frequencyType) {
      case 'once_browser':
        localStorage.setItem(key, 'true');
        break;

      case 'once_session':
        sessionStorage.setItem(key, 'true');
        break;

      case 'custom_count': {
        const countStr = localStorage.getItem(key);
        const currentCount = countStr ? parseInt(countStr, 10) : 0;
        localStorage.setItem(key, (currentCount + 1).toString());
        break;
      }
    }
  }

  /**
   * Limpa os registros de um popup específico (útil para testes)
   */
  static resetPopup(storeId: string, promotionId: string): void {
    const key = this.getStorageKey(storeId, promotionId);
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  }

  /**
   * Obtém estatísticas de exibição (para custom_count)
   */
  static getDisplayCount(storeId: string, promotionId: string): number {
    const key = this.getStorageKey(storeId, promotionId);
    const countStr = localStorage.getItem(key);
    return countStr ? parseInt(countStr, 10) : 0;
  }
}
