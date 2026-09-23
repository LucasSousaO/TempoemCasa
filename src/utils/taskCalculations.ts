import { DomesticTask, FrequencyType, RoomCategory, TaskStatus } from '../types';

export function getFrequencyDays(type: FrequencyType, intervalDays?: number): number {
  switch (type) {
    case 'daily':
      return 1;
    case 'weekly':
      return 7;
    case 'biweekly':
      return 15;
    case 'monthly':
      return 30;
    case 'days_interval':
      return Math.max(1, intervalDays || 1);
    case 'as_needed':
      return 999;
  }
}

export function getFrequencyLabel(type: FrequencyType, intervalDays?: number): string {
  switch (type) {
    case 'daily':
      return 'Diariamente';
    case 'weekly':
      return 'Semanal (7 dias)';
    case 'biweekly':
      return 'Quinzenal (15 dias)';
    case 'monthly':
      return 'Mensal (30 dias)';
    case 'days_interval':
      return intervalDays === 1 ? 'Todo dia' : `A cada ${intervalDays || 2} dias`;
    case 'as_needed':
      return 'Quando precisar';
  }
}

export interface TaskStatusInfo {
  status: TaskStatus;
  label: string;
  badgeClass: string;
  daysDiff: number; // dias desde a última conclusão
  targetDays: number;
  progressPercent: number; // 0% recém-feita, 100% no prazo, >100% atrasada
  nextDueDate: Date | null;
}

export function computeTaskStatus(task: DomesticTask): TaskStatusInfo {
  if (task.frequencyType === 'as_needed') {
    return {
      status: 'as_needed',
      label: 'Sob demanda',
      badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
      daysDiff: 0,
      targetDays: 999,
      progressPercent: 50,
      nextDueDate: null,
    };
  }

  const targetDays = getFrequencyDays(task.frequencyType, task.intervalDays);

  if (!task.lastCompletedAt) {
    // Nunca foi feita!
    return {
      status: 'overdue',
      label: 'Pendente',
      badgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
      daysDiff: 99,
      targetDays,
      progressPercent: 100,
      nextDueDate: new Date(),
    };
  }

  const lastDate = new Date(task.lastCompletedAt);
  const now = new Date();
  const msDiff = now.getTime() - lastDate.getTime();
  const daysDiff = Math.max(0, msDiff / (1000 * 60 * 60 * 24));
  
  const nextDueDate = new Date(lastDate.getTime() + targetDays * 24 * 60 * 60 * 1000);
  const progressPercent = Math.min(200, Math.round((daysDiff / targetDays) * 100));

  if (daysDiff >= targetDays) {
    const overdueDays = Math.floor(daysDiff - targetDays);
    return {
      status: 'overdue',
      label: overdueDays <= 0 ? 'Fazer hoje' : `Atrasada (${overdueDays}d)`,
      badgeClass: 'bg-rose-100 text-rose-800 border-rose-300 font-semibold',
      daysDiff,
      targetDays,
      progressPercent,
      nextDueDate,
    };
  }

  if (targetDays - daysDiff <= 1) {
    return {
      status: 'due_soon',
      label: 'Vence em breve',
      badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
      daysDiff,
      targetDays,
      progressPercent,
      nextDueDate,
    };
  }

  return {
    status: 'up_to_date',
    label: 'Em dia',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    daysDiff,
    targetDays,
    progressPercent,
    nextDueDate,
  };
}

export interface RoomMeta {
  key: RoomCategory;
  name: string;
  iconName: string;
  bgLight: string;
  colorText: string;
  accent: string;
}

export const ROOMS: Record<RoomCategory, RoomMeta> = {
  cozinha: {
    key: 'cozinha',
    name: 'Cozinha',
    iconName: 'Utensils',
    bgLight: 'bg-amber-50',
    colorText: 'text-amber-700',
    accent: '#f59e0b',
  },
  banheiro: {
    key: 'banheiro',
    name: 'Banheiro',
    iconName: 'Sparkles',
    bgLight: 'bg-cyan-50',
    colorText: 'text-cyan-700',
    accent: '#06b6d4',
  },
  sala: {
    key: 'sala',
    name: 'Sala',
    iconName: 'Armchair',
    bgLight: 'bg-indigo-50',
    colorText: 'text-indigo-700',
    accent: '#6366f1',
  },
  quarto: {
    key: 'quarto',
    name: 'Quarto',
    iconName: 'BedDouble',
    bgLight: 'bg-purple-50',
    colorText: 'text-purple-700',
    accent: '#a855f7',
  },
  lavanderia: {
    key: 'lavanderia',
    name: 'Lavanderia',
    iconName: 'Shirt',
    bgLight: 'bg-blue-50',
    colorText: 'text-blue-700',
    accent: '#3b82f6',
  },
  quintal: {
    key: 'quintal',
    name: 'Quintal / Varanda',
    iconName: 'Flower2',
    bgLight: 'bg-emerald-50',
    colorText: 'text-emerald-700',
    accent: '#10b981',
  },
  geral: {
    key: 'geral',
    name: 'Geral da Casa',
    iconName: 'Home',
    bgLight: 'bg-slate-100',
    colorText: 'text-slate-700',
    accent: '#64748b',
  },
};

export const EFFORT_LABELS: Record<string, { label: string; color: string }> = {
  leve: { label: 'Rápida / Leve', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  moderado: { label: 'Moderada', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  pesado: { label: 'Faxina Pesada', color: 'bg-purple-50 text-purple-700 border-purple-200' },
};

/**
 * Filter and randomly pick a task matching criteria
 */
export function drawRandomTask(
  tasks: DomesticTask[],
  options: {
    maxMinutes: number;
    room?: RoomCategory | 'all';
    effort?: string | 'all';
    prioritizeOverdue?: boolean;
    excludeTaskId?: string;
  }
): DomesticTask | null {
  let candidates = tasks.filter((t) => t.estimatedMinutes <= options.maxMinutes);

  if (options.excludeTaskId && candidates.length > 1) {
    candidates = candidates.filter((t) => t.id !== options.excludeTaskId);
  }

  if (options.room && options.room !== 'all') {
    candidates = candidates.filter((t) => t.room === options.room);
  }

  if (options.effort && options.effort !== 'all') {
    candidates = candidates.filter((t) => t.effort === options.effort);
  }

  if (candidates.length === 0) {
    return null;
  }

  if (options.prioritizeOverdue) {
    // Give overdue tasks higher weights (3x), due soon (2x), others (1x)
    const weightedPool: DomesticTask[] = [];
    for (const t of candidates) {
      const status = computeTaskStatus(t).status;
      let weight = 1;
      if (status === 'overdue') weight = 4;
      else if (status === 'due_soon') weight = 2;
      
      for (let i = 0; i < weight; i++) {
        weightedPool.push(t);
      }
    }
    const randomIndex = Math.floor(Math.random() * weightedPool.length);
    return weightedPool[randomIndex];
  }

  const randomIndex = Math.floor(Math.random() * candidates.length);
  return candidates[randomIndex];
}

export function formatTimeRelative(isoDate: string | null): string {
  if (!isoDate) return 'Nunca realizada';
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 1) return 'Agora a pouco';
  if (diffHours < 24) return `Hoje (${diffHours}h atrás)`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Ontem';
  return `Há ${diffDays} dias`;
}
