export const QUALIFICATION_LEVELS = {
  top: {
    label: "🥇 Top Candidate",
    shortLabel: "Top",
    minScore: 80,
    color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30",
    badgeColor: "bg-yellow-500",
  },
  promising: {
    label: "🥈 Promissor",
    shortLabel: "Promissor",
    minScore: 60,
    color: "bg-blue-500/10 text-blue-600 border-blue-500/30",
    badgeColor: "bg-blue-500",
  },
  beginner: {
    label: "🥉 Iniciante",
    shortLabel: "Iniciante",
    minScore: 40,
    color: "bg-green-500/10 text-green-600 border-green-500/30",
    badgeColor: "bg-green-500",
  },
  evaluation: {
    label: "📋 Em Avaliação",
    shortLabel: "Avaliação",
    minScore: 0,
    color: "bg-gray-500/10 text-gray-600 border-gray-500/30",
    badgeColor: "bg-gray-500",
  },
} as const;

export type QualificationLevel = keyof typeof QUALIFICATION_LEVELS;

export function getQualificationLevel(score: number): QualificationLevel {
  if (score >= 80) return "top";
  if (score >= 60) return "promising";
  if (score >= 40) return "beginner";
  return "evaluation";
}

export function getLevelConfig(level: QualificationLevel) {
  return QUALIFICATION_LEVELS[level] || QUALIFICATION_LEVELS.evaluation;
}
