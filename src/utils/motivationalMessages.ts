export interface MotivationalMessage {
  type: 'morning' | 'afternoon' | 'evening' | 'achievement' | 'warning' | 'celebration';
  title: string;
  message: string;
  emoji: string;
}

export const getMotivationalMessage = (
  progress: number,
  streak: number,
  hour: number,
  daysInMonth: number,
  currentDay: number
): MotivationalMessage => {
  const timeOfDay = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
  const progressPercentage = (progress / 100) * 100;
  const expectedProgress = (currentDay / daysInMonth) * 100;
  const isAhead = progressPercentage >= expectedProgress;
  const isWayAhead = progressPercentage >= expectedProgress + 20;
  const isBehind = progressPercentage < expectedProgress - 10;
  const isWayBehind = progressPercentage < expectedProgress - 30;

  // Mensagens de celebração (acima do esperado)
  if (isWayAhead && streak >= 7) {
    return {
      type: 'celebration',
      title: '🔥 VOCÊ É UMA MÁQUINA! 🔥',
      message: `${streak} dias consecutivos batendo meta! Você está ${Math.round(progressPercentage - expectedProgress)}% ACIMA do esperado. Continua assim que você vai dominar o mercado!`,
      emoji: '🚀'
    };
  }

  if (isAhead && timeOfDay === 'morning') {
    return {
      type: 'morning',
      title: '☀️ BOM DIA, CAMPEÃO!',
      message: `Você está ${Math.round(progressPercentage)}% da meta! Continue esse ritmo e você vai conquistar tudo que sonhou. Hoje é dia de fazer acontecer!`,
      emoji: '💪'
    };
  }

  if (isAhead && timeOfDay === 'afternoon') {
    return {
      type: 'afternoon',
      title: '⚡ VOCÊ ESTÁ ARRASANDO!',
      message: `${Math.round(progressPercentage)}% da meta alcançados. Você está no caminho certo! Cada loja nova é um passo para a sua liberdade financeira.`,
      emoji: '🎯'
    };
  }

  // Mensagens de alerta (abaixo do esperado)
  if (isWayBehind) {
    return {
      type: 'warning',
      title: '🚨 ATENÇÃO: É HORA DE AGIR!',
      message: `Você está ${Math.round(expectedProgress - progressPercentage)}% abaixo do esperado. Mas ainda dá tempo! Foque em prospecção hoje. Lembre-se: cada "não" te aproxima do próximo "sim".`,
      emoji: '⚠️'
    };
  }

  if (isBehind && timeOfDay === 'evening') {
    return {
      type: 'warning',
      title: '🌙 O DIA AINDA NÃO ACABOU!',
      message: `Faltam ${Math.round(expectedProgress - progressPercentage)}% para você estar no ritmo certo. Que tal fazer mais algumas ligações antes de dormir? O você do futuro vai agradecer!`,
      emoji: '📞'
    };
  }

  // Mensagens de motivação para streak
  if (streak >= 30) {
    return {
      type: 'achievement',
      title: '👑 LENDA DO EMPREENDEDORISMO!',
      message: `30 DIAS SEGUIDOS batendo meta! Você é a prova viva que consistência gera resultados. Continue assim e você vai construir um império!`,
      emoji: '🏆'
    };
  }

  if (streak >= 14) {
    return {
      type: 'achievement',
      title: '🔥 2 SEMANAS DE FOGO!',
      message: `${streak} dias consecutivos! Você está criando um hábito vencedor. Não pare agora, você está só começando!`,
      emoji: '💎'
    };
  }

  // Mensagens padrão motivacionais
  if (timeOfDay === 'morning') {
    return {
      type: 'morning',
      title: '☀️ NOVO DIA, NOVAS OPORTUNIDADES!',
      message: `Cada manhã é uma chance de conquistar mais lojas. Você está construindo algo grande. Vamos nessa!`,
      emoji: '🌅'
    };
  }

  if (timeOfDay === 'afternoon') {
    return {
      type: 'afternoon',
      title: '⚡ TARDE PRODUTIVA!',
      message: `O mercado está aquecido! Este é o melhor momento para fechar negócios. Você está ${Math.round(progressPercentage)}% da sua meta!`,
      emoji: '📈'
    };
  }

  // Mensagem padrão noturna
  return {
    type: 'evening',
    title: '🌙 REFLITA SOBRE O SEU DIA',
    message: `Você está ${Math.round(progressPercentage)}% da meta. Amanhã é um novo dia para conquistar seus objetivos. Descanse bem, você merece!`,
    emoji: '✨'
  };
};

export const achievementsList = [
  {
    id: 'first_goal',
    name: 'Primeira Meta',
    description: 'Defina sua primeira meta',
    icon: '🎯',
    type: 'milestone'
  },
  {
    id: 'streak_7',
    name: 'Semana de Ouro',
    description: '7 dias consecutivos batendo meta',
    icon: '🔥',
    type: 'streak'
  },
  {
    id: 'streak_30',
    name: 'Mês Perfeito',
    description: '30 dias consecutivos batendo meta',
    icon: '👑',
    type: 'streak'
  },
  {
    id: 'goal_100',
    name: 'Centena',
    description: 'Alcance 100% de uma meta mensal',
    icon: '💯',
    type: 'milestone'
  },
  {
    id: 'goal_150',
    name: 'Supera-Meta',
    description: 'Supere 150% de uma meta mensal',
    icon: '🚀',
    type: 'milestone'
  },
  {
    id: 'stores_10',
    name: '10 Lojas',
    description: 'Alcance 10 lojas ativas',
    icon: '🏪',
    type: 'growth'
  },
  {
    id: 'stores_50',
    name: '50 Lojas',
    description: 'Alcance 50 lojas ativas',
    icon: '🏢',
    type: 'growth'
  },
  {
    id: 'stores_100',
    name: 'Centena de Lojas',
    description: 'Alcance 100 lojas ativas',
    icon: '🏙️',
    type: 'growth'
  },
  {
    id: 'mrr_10k',
    name: 'R$ 10k MRR',
    description: 'Alcance R$ 10.000 em MRR',
    icon: '💰',
    type: 'revenue'
  },
  {
    id: 'mrr_50k',
    name: 'R$ 50k MRR',
    description: 'Alcance R$ 50.000 em MRR',
    icon: '💎',
    type: 'revenue'
  },
  {
    id: 'mrr_100k',
    name: 'R$ 100k MRR',
    description: 'Alcance R$ 100.000 em MRR',
    icon: '🏆',
    type: 'revenue'
  }
];
