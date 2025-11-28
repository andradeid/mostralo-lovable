import { BibleVerse } from './bibleVerses';

export interface AccountabilityMessage {
  title: string;
  message: string;
  tone: 'celebration' | 'encouragement' | 'warning' | 'strong';
  emoji: string;
}

export const getAccountabilityMessage = (
  hour: number,
  progressPercentage: number,
  completedTasks: number,
  totalTasks: number,
  verse: BibleVerse
): AccountabilityMessage => {
  const remainingTasks = totalTasks - completedTasks;
  
  // MANHÃ (5h-11h)
  if (hour >= 5 && hour < 12) {
    // 0% - Cobrança forte
    if (progressPercentage === 0) {
      return {
        title: "🔥 ACORDA, GUERREIRO!",
        message: `Já são ${hour}h e você ainda NÃO FEZ NADA! ${verse.text} — ${verse.reference}\n\nChega de desculpas! Levanta e COMEÇA AGORA!`,
        tone: "strong",
        emoji: "🔥"
      };
    }
    
    // 1-30% - Cobrança moderada
    if (progressPercentage < 30) {
      return {
        title: "⚠️ VOCÊ ESTÁ ATRASADO!",
        message: `${completedTasks}/${totalTasks} tarefas. Ainda faltam ${remainingTasks}!\n\n${verse.text} — ${verse.reference}\n\nO DIA NÃO ESPERA! Acelera!`,
        tone: "warning",
        emoji: "⚠️"
      };
    }
    
    // 30-70% - Encorajamento
    if (progressPercentage < 70) {
      return {
        title: "💪 BOA! CONTINUE ASSIM!",
        message: `${completedTasks}/${totalTasks} feitas. Você está no caminho certo!\n\n${verse.text} — ${verse.reference}\n\nNão pare agora, falta pouco!`,
        tone: "encouragement",
        emoji: "💪"
      };
    }
    
    // 70-99% - Quase lá
    if (progressPercentage < 100) {
      return {
        title: "🚀 QUASE NO TOPO!",
        message: `${completedTasks}/${totalTasks}! Só mais ${remainingTasks} e você DOMINA o dia!\n\n${verse.text} — ${verse.reference}`,
        tone: "encouragement",
        emoji: "🚀"
      };
    }
    
    // 100% - MANHÃ - Celebração
    return {
      title: "🏆 MANHÃ PERFEITA!",
      message: `100% DAS TAREFAS DA MANHÃ!\n\n${verse.text} — ${verse.reference}\n\nVocê DOMINOU o dia antes do almoço! CAMPEÃO!`,
      tone: "celebration",
      emoji: "🏆"
    };
  }
  
  // TARDE (12h-17h)
  if (hour >= 12 && hour < 18) {
    // 0-20% - Cobrança MUITO forte
    if (progressPercentage < 20) {
      return {
        title: "🚨 EMERGÊNCIA!",
        message: `${hour}h da tarde e só ${completedTasks}/${totalTasks}?!\n\n${verse.text} — ${verse.reference}\n\nVOCÊ VAI DORMIR SEM FAZER NADA HOJE? REAGE!`,
        tone: "strong",
        emoji: "🚨"
      };
    }
    
    // 20-50% - Cobrança
    if (progressPercentage < 50) {
      return {
        title: "⏰ O TEMPO ESTÁ PASSANDO!",
        message: `${completedTasks}/${totalTasks}. Metade do dia já foi!\n\n${verse.text} — ${verse.reference}\n\nSem pausa! ACELERA!`,
        tone: "warning",
        emoji: "⏰"
      };
    }
    
    // 50-80% - Encorajamento
    if (progressPercentage < 80) {
      return {
        title: "💯 VOCÊ É IMPARÁVEL!",
        message: `${completedTasks}/${totalTasks}! Metade está feita!\n\n${verse.text} — ${verse.reference}\n\nTermina forte!`,
        tone: "encouragement",
        emoji: "💯"
      };
    }
    
    // 80-99%
    if (progressPercentage < 100) {
      return {
        title: "⭐ FALTA MUITO POUCO!",
        message: `${completedTasks}/${totalTasks}! Você está ARRASANDO!\n\n${verse.text} — ${verse.reference}\n\nFinaliza agora!`,
        tone: "encouragement",
        emoji: "⭐"
      };
    }
    
    // 100% - TARDE - Celebração
    return {
      title: "🎉 MISSÃO CUMPRIDA!",
      message: `100% COMPLETO! VOCÊ É UM MONSTRO!\n\n${verse.text} — ${verse.reference}\n\nHoje você provou que é IMBATÍVEL!`,
      tone: "celebration",
      emoji: "🎉"
    };
  }
  
  // NOITE (18h-23h)
  if (hour >= 18 && hour < 24) {
    // 0-30% - Reflexão forte
    if (progressPercentage < 30) {
      return {
        title: "😔 O DIA ACABOU...",
        message: `Apenas ${completedTasks}/${totalTasks} tarefas.\n\n${verse.text} — ${verse.reference}\n\nAmanhã você vai se arrepender de não ter feito mais HOJE. Ainda dá tempo de recuperar!`,
        tone: "strong",
        emoji: "😔"
      };
    }
    
    // 30-70% - Reflexão moderada
    if (progressPercentage < 70) {
      return {
        title: "🌙 DIA MÉDIO...",
        message: `${completedTasks}/${totalTasks} tarefas. Poderia ter sido melhor.\n\n${verse.text} — ${verse.reference}\n\nAmanhã você VAI DAR MAIS!`,
        tone: "warning",
        emoji: "🌙"
      };
    }
    
    // 70-99% - Parabéns
    if (progressPercentage < 100) {
      return {
        title: "🎯 DIA PRODUTIVO!",
        message: `${completedTasks}/${totalTasks}! Você trabalhou bem!\n\n${verse.text} — ${verse.reference}\n\nDescanse, você merece!`,
        tone: "encouragement",
        emoji: "🎯"
      };
    }
    
    // 100% - Celebração máxima
    return {
      title: "👑 VOCÊ É UM CAMPEÃO!",
      message: `100% DAS TAREFAS COMPLETAS!\n\n${verse.text} — ${verse.reference}\n\nHoje você PLANTOU sementes. A colheita virá!`,
      tone: "celebration",
      emoji: "👑"
    };
  }
  
  // MADRUGADA (0h-4h) - Planejamento do próximo dia
  if (progressPercentage === 0) {
    return {
      title: "🌅 PREPARE-SE PARA VENCER!",
      message: `Amanhã será um grande dia!\n\n${verse.text} — ${verse.reference}\n\nDescanse bem, guerreiro. Amanhã você DOMINA!`,
      tone: "encouragement",
      emoji: "🌅"
    };
  }
  
  // Último check do dia (antes de dormir)
  if (progressPercentage < 100) {
    return {
      title: "⚡ ÚLTIMA CHANCE!",
      message: `Faltam ${remainingTasks} tarefas!\n\n${verse.text} — ${verse.reference}\n\nVocê vai dormir sem completar?`,
      tone: "warning",
      emoji: "⚡"
    };
  }
  
  // 100% completo à noite
  return {
    title: "✨ DIA PERFEITO!",
    message: `100% COMPLETO!\n\n${verse.text} — ${verse.reference}\n\nDescanse em paz. Você foi um GUERREIRO hoje!`,
    tone: "celebration",
    emoji: "✨"
  };
};
