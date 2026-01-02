export interface PopupVariation {
  title: string;
  subtitle: string;
  description: string;
  ctaText: string;
  closeText: string;
}

export const POPUP_VARIATIONS: Record<'A' | 'B' | 'C' | 'D', PopupVariation> = {
  A: {
    title: 'Antes de continuar...',
    subtitle: 'Talvez você NÃO precise da nossa tecnologia.',
    description: 'Faça o diagnóstico gratuito em 2 minutos e descubra se realmente faz sentido para o seu negócio.',
    ctaText: 'Fazer Diagnóstico Gratuito',
    closeText: 'Fechar'
  },
  B: {
    title: 'Esse diagnóstico não é para todos',
    subtitle: 'Somente 23% dos negócios conseguem economizar com nosso sistema.',
    description: 'Descubra em 2 minutos se você está entre eles — ou se está melhor onde está.',
    ctaText: 'Descobrir Minha Situação',
    closeText: 'Prefiro não saber'
  },
  C: {
    title: 'Você realmente precisa de um app próprio?',
    subtitle: 'Muitos restaurantes NÃO precisam sair do iFood.',
    description: 'Em 2 minutos, descubra se faz sentido investir em delivery próprio — ou se é melhor continuar como está.',
    ctaText: 'Fazer o Teste',
    closeText: 'Continuar no iFood'
  },
  D: {
    title: 'Você pode estar jogando R$ 7.500 fora todo mês',
    subtitle: 'Ou não.',
    description: 'Só o diagnóstico pode confirmar. São apenas 2 minutos para descobrir quanto você realmente perde.',
    ctaText: 'Ver Quanto Estou Perdendo',
    closeText: 'Prefiro não saber'
  }
} as const;
