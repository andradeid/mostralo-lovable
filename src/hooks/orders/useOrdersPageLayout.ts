// Layout da tela de pedidos: seção de configurações recolhível, modo tela cheia do Kanban
// (com Esc e aviso ao AdminLayout) e tutorial de onboarding. Código movido da OrdersPage sem mudança.
import { useState, useEffect } from 'react';
import { useSidebar } from '@/components/ui/sidebar';

export type HighlightButton = 'exit' | 'config' | 'help';

export function useOrdersPageLayout() {
  // Estado para seção de configurações colapsável
  const [configExpanded, setConfigExpanded] = useState<boolean>(() => {
    const saved = localStorage.getItem('ordersConfigExpanded');
    return saved === 'true'; // Padrão: fechado
  });

  // Estado para modo tela cheia do Kanban
  const [isFullscreen, setIsFullscreen] = useState<boolean>(true);

  // Estado para tutorial de onboarding
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    return localStorage.getItem('ordersPageTutorialHidden') !== 'true';
  });
  const [tutorialStep, setTutorialStep] = useState(0);

  // Classe de destaque para botões durante tutorial
  const getHighlightClass = (buttonType: HighlightButton) => {
    if (!showTutorial) return '';
    const stepMap = { exit: 0, config: 1, help: 2 };
    if (tutorialStep === stepMap[buttonType]) {
      return 'ring-2 ring-primary ring-offset-2 relative z-[60] animate-pulse bg-white';
    }
    return '';
  };

  // Hook do sidebar para controlar colapso
  const { setOpen: setSidebarOpen } = useSidebar();

  // Persistir estado da seção colapsável
  useEffect(() => {
    localStorage.setItem('ordersConfigExpanded', String(configExpanded));
  }, [configExpanded]);

  // Toggle e persistência do modo tela cheia
  const toggleFullscreen = () => {
    const newState = !isFullscreen;
    setIsFullscreen(newState);
    localStorage.setItem('kanbanFullscreen', String(newState));

    // Dispara evento para AdminLayout ocultar/mostrar header
    window.dispatchEvent(new CustomEvent('kanbanFullscreenChange', {
      detail: { isFullscreen: newState }
    }));

    // Colapsa ou expande sidebar
    setSidebarOpen(!newState);
  };

  // Atalho Escape para sair do modo tela cheia
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Sincronizar estado do fullscreen ao montar (caso venha do localStorage)
  useEffect(() => {
    if (isFullscreen) {
      window.dispatchEvent(new CustomEvent('kanbanFullscreenChange', {
        detail: { isFullscreen: true }
      }));
      setSidebarOpen(false);
    }

    // Cleanup: restaurar ao desmontar
    return () => {
      if (isFullscreen) {
        window.dispatchEvent(new CustomEvent('kanbanFullscreenChange', {
          detail: { isFullscreen: false }
        }));
      }
    };
  }, []);

  /** Fecha o tutorial (e guarda "não mostrar de novo" se marcado). */
  const completeTutorial = (dontShowAgain: boolean) => {
    if (dontShowAgain) {
      localStorage.setItem('ordersPageTutorialHidden', 'true');
    }
    setShowTutorial(false);
    setTutorialStep(0);
  };

  return {
    configExpanded,
    setConfigExpanded,
    isFullscreen,
    toggleFullscreen,
    showTutorial,
    setShowTutorial,
    setTutorialStep,
    completeTutorial,
    getHighlightClass,
  };
}
