export type RoomCategory = 
  | 'cozinha'
  | 'banheiro'
  | 'sala'
  | 'quarto'
  | 'lavanderia'
  | 'quintal'
  | 'geral';

export type EffortLevel = 'leve' | 'moderado' | 'pesado';

export type FrequencyType = 
  | 'daily'           // Todo dia (1 dia)
  | 'days_interval'   // A cada X dias
  | 'weekly'          // 1 vez por semana (7 dias)
  | 'biweekly'        // A cada 15 dias
  | 'monthly'         // A cada 30 dias
  | 'as_needed';      // Sob demanda

export type TaskStatus = 'overdue' | 'due_today' | 'due_soon' | 'up_to_date' | 'as_needed';

export type GroceryCategory =
  | 'hortifruti'
  | 'mercearia'
  | 'limpeza'
  | 'higiene'
  | 'carnes'
  | 'laticinios'
  | 'bebidas'
  | 'padaria'
  | 'outros';

export type GroceryStatus = 'need_to_buy' | 'already_have' | 'in_cart';

export interface GroceryItem {
  id: string;
  name: string;
  category: GroceryCategory;
  quantity: number;
  unit: 'un' | 'kg' | 'g' | 'l' | 'pct' | 'cx' | 'fardo';
  estimatedPrice?: number;
  status: GroceryStatus; // need_to_buy = precisa comprar, already_have = já tem em casa, in_cart = no carrinho
  notes?: string;
  updatedAt: string;
}

export type WishlistTerm = 'curto' | 'medio' | 'longo'; // Curto (urgente/próximos dias), Médio (1-3 meses), Longo (planejamento)

export interface WishlistItem {
  id: string;
  title: string;
  room?: RoomCategory;
  estimatedCost: number;
  term: WishlistTerm;
  notes?: string;
  link?: string;
  isPurchased: boolean;
  purchasedAt?: string;
  createdAt: string;
}

export interface DomesticTask {
  id: string;
  title: string;
  description?: string;
  room: RoomCategory;
  estimatedMinutes: number;
  effort: EffortLevel;
  frequencyType: FrequencyType;
  intervalDays?: number; // Usado quando frequencyType === 'days_interval'
  lastCompletedAt: string | null; // ISO Date string
  completedCount: number;
  isFavorite?: boolean;
  assignedToUid?: string;
  assignedToName?: string;
  createdAt: string;
}

export interface TaskCompletionLog {
  id: string;
  taskId: string;
  taskTitle: string;
  room: RoomCategory;
  minutesSpent: number;
  completedAt: string;
  completedByUid?: string;
  completedByName?: string;
  completedByPhoto?: string;
  pointsEarned?: number;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  householdId: string;
  points: number;
  level: number;
  completedTasksCount: number;
  totalMinutesSpent: number;
  currentStreak: number;
  lastActiveAt?: string;
  updatedAt?: string;
}

export interface Household {
  id: string;
  name: string;
  inviteCode: string;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
}

export interface HouseholdMember {
  uid: string;
  displayName: string;
  photoURL?: string;
  role: 'owner' | 'member';
  points: number;
  level: number;
  completedTasksCount: number;
  totalMinutesSpent: number;
  joinedAt: string;
}

export interface UserPreferences {
  soundEnabled: boolean;
  hapticEnabled: boolean;
  prioritizeOverdueInDraw: boolean;
  viewMode: 'mobile' | 'responsive';
}
