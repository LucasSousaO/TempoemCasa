import { DomesticTask, TaskCompletionLog } from '../types';

export interface LevelInfo {
  level: number;
  title: string;
  minPoints: number;
  maxPoints: number;
  badgeIcon: string;
}

export const LEVELS: LevelInfo[] = [
  { level: 1, title: 'Iniciante do Lar', minPoints: 0, maxPoints: 99, badgeIcon: '🪴' },
  { level: 2, title: 'Ajudante Prático', minPoints: 100, maxPoints: 299, badgeIcon: '🧹' },
  { level: 3, title: 'Organizador Eficiente', minPoints: 300, maxPoints: 699, badgeIcon: '🧺' },
  { level: 4, title: 'Guardião da Casa', minPoints: 700, maxPoints: 1399, badgeIcon: '🛡️' },
  { level: 5, title: 'Mestre do Lar', minPoints: 1400, maxPoints: 2499, badgeIcon: '✨' },
  { level: 6, title: 'Dono(a) Supremo(a) do Lar', minPoints: 2500, maxPoints: 999999, badgeIcon: '👑' },
];

export function getLevelInfo(points: number): {
  currentLevel: LevelInfo;
  nextLevel: LevelInfo | null;
  progressPercent: number;
} {
  const current = LEVELS.slice().reverse().find((l) => points >= l.minPoints) || LEVELS[0];
  const nextIndex = LEVELS.findIndex((l) => l.level === current.level) + 1;
  const next = nextIndex < LEVELS.length ? LEVELS[nextIndex] : null;

  let progressPercent = 100;
  if (next) {
    const range = next.minPoints - current.minPoints;
    const earnedInCurrent = points - current.minPoints;
    progressPercent = Math.min(100, Math.max(0, Math.round((earnedInCurrent / range) * 100)));
  }

  return {
    currentLevel: current,
    nextLevel: next,
    progressPercent,
  };
}

export function calculateTaskPoints(
  task: DomesticTask,
  minutesSpent: number,
  isOverdue: boolean = false
): { totalPoints: number; breakdown: { label: string; points: number }[] } {
  const breakdown: { label: string; points: number }[] = [];

  // Base points by minutes
  const basePoints = Math.max(10, Math.round(minutesSpent * 5));
  breakdown.push({ label: `${minutesSpent} min de dedicação`, points: basePoints });

  // Effort bonus
  let effortPoints = 15;
  if (task.effort === 'pesado') effortPoints = 35;
  else if (task.effort === 'moderado') effortPoints = 25;
  breakdown.push({ label: `Esforço ${task.effort}`, points: effortPoints });

  // Overdue bonus (saving the day!)
  if (isOverdue) {
    breakdown.push({ label: 'Salvou tarefa atrasada! 🚀', points: 30 });
  }

  const totalPoints = breakdown.reduce((sum, item) => sum + item.points, 0);
  return { totalPoints, breakdown };
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
}

export function evaluateBadges(
  points: number,
  completedCount: number,
  logs: TaskCompletionLog[]
): Badge[] {
  return [
    {
      id: 'first_task',
      name: 'Primeiro Passo',
      description: 'Concluiu a 1ª tarefa doméstica',
      icon: '🌱',
      unlocked: completedCount >= 1,
    },
    {
      id: 'task_10',
      name: 'Mão na Massa',
      description: 'Completou 10 tarefas da casa',
      icon: '💪',
      unlocked: completedCount >= 10,
    },
    {
      id: 'task_50',
      name: 'Heroi Doméstico',
      description: 'Completou 50 tarefas da casa',
      icon: '🏆',
      unlocked: completedCount >= 50,
    },
    {
      id: 'cozinha_lover',
      name: 'Chef da Limpeza',
      description: 'Concluiu 5 tarefas na Cozinha',
      icon: '🍳',
      unlocked: logs.filter((l) => l.room === 'cozinha').length >= 5,
    },
    {
      id: 'points_500',
      name: 'Clube dos 500 XP',
      description: 'Acumulou 500 pontos de dedicação',
      icon: '⭐',
      unlocked: points >= 500,
    },
    {
      id: 'points_1500',
      name: 'Lenda da Casa',
      description: 'Alcançou 1500 XP na jornada familiar',
      icon: '👑',
      unlocked: points >= 1500,
    },
  ];
}
