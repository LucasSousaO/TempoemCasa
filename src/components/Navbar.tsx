import React from 'react';
import { 
  Dices, 
  CheckSquare, 
  BarChart3, 
  Settings, 
  Plus, 
  Sparkles, 
  ShoppingBag, 
  Trophy, 
  Users, 
  Zap 
} from 'lucide-react';
import { useTaskContext } from '../context/TaskContext';
import { getLevelInfo } from '../utils/gamification';

export type NavTab = 'roulette' | 'tasks' | 'shopping' | 'ranking' | 'routine';

interface NavbarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenNewTask: () => void;
  onOpenSettings: () => void;
  onOpenFamilyModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onOpenNewTask,
  onOpenSettings,
  onOpenFamilyModal,
}) => {
  const { stats, currentUser, userProfile, household } = useTaskContext();
  const currentPoints = userProfile?.points || 0;
  const levelInfo = getLevelInfo(currentPoints);

  return (
    <>
      {/* Top App Header (Mobile & Desktop) */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-3.5 sm:px-4 py-2.5">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-2">
          {/* Brand & Subtitle */}
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-linear-to-br from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center text-white shadow-md shadow-indigo-200 shrink-0">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300" />
            </div>
            <div className="min-w-0">
              <div className="font-black text-sm sm:text-base tracking-tight text-slate-900 flex items-center gap-1.5 truncate">
                <span>A dona da casa</span>
                <span className="hidden xs:inline-block text-[9px] uppercase font-bold tracking-widest px-1.5 py-0.2 rounded-md bg-purple-50 text-purple-700 border border-purple-100">
                  {household ? household.name : 'Gestão do Lar'}
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium truncate">
                {stats.overdueCount > 0 ? (
                  <span className="text-rose-600 font-semibold">{stats.overdueCount} atrasada{stats.overdueCount > 1 ? 's' : ''}</span>
                ) : (
                  <span className="text-emerald-600 font-semibold">Tudo em dia! ✨</span>
                )}
                {stats.groceryNeededCount > 0 && (
                  <span className="text-amber-600 font-medium ml-1.5">• {stats.groceryNeededCount} no mercado</span>
                )}
              </p>
            </div>
          </div>

          {/* Action buttons: Family / Gamification pill & Settings */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Family & Profile Pill */}
            <button
              onClick={onOpenFamilyModal}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100/80 border border-purple-200/70 text-slate-800 transition-all cursor-pointer shadow-2xs"
              title="Perfil & Compartilhamento Familiar"
            >
              {currentUser?.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt=""
                  className="w-5 h-5 rounded-full object-cover border border-purple-300"
                />
              ) : (
                <span className="text-xs">{levelInfo.currentLevel.badgeIcon}</span>
              )}

              <span className="text-[11px] font-black text-amber-700 font-mono flex items-center gap-0.5">
                <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                {currentPoints}
              </span>

              <Users className="w-3.5 h-3.5 text-purple-600" />
            </button>

            {/* Quick Add Button */}
            <button
              onClick={onOpenNewTask}
              className="w-8 h-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center transition-all shadow-xs cursor-pointer"
              title="Nova Atividade"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
            </button>

            {/* Settings */}
            <button
              onClick={onOpenSettings}
              className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              title="Ajustes"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-1 py-1 pb-safe shadow-lg">
        <div className="max-w-md mx-auto flex items-center justify-between">
          {/* Tab 1: Sorteador */}
          <button
            onClick={() => onSelectTab('roulette')}
            className={`flex-1 flex flex-col items-center gap-0.5 py-1 px-1 rounded-xl transition-all cursor-pointer ${
              currentTab === 'roulette'
                ? 'text-indigo-600 font-extrabold'
                : 'text-slate-400 hover:text-slate-600 font-medium'
            }`}
          >
            <div className={`p-1.5 rounded-xl transition-colors ${currentTab === 'roulette' ? 'bg-indigo-50 text-indigo-600' : ''}`}>
              <Dices className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span className="text-[9px] sm:text-[10px]">Sorteador</span>
          </button>

          {/* Tab 2: Atividades */}
          <button
            onClick={() => onSelectTab('tasks')}
            className={`flex-1 flex flex-col items-center gap-0.5 py-1 px-1 rounded-xl transition-all cursor-pointer ${
              currentTab === 'tasks'
                ? 'text-indigo-600 font-extrabold'
                : 'text-slate-400 hover:text-slate-600 font-medium'
            }`}
          >
            <div className={`p-1.5 rounded-xl transition-colors ${currentTab === 'tasks' ? 'bg-indigo-50 text-indigo-600' : ''}`}>
              <CheckSquare className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span className="text-[9px] sm:text-[10px]">Atividades</span>
          </button>

          {/* Tab 3: Compras (Supermercado & Desejos) */}
          <button
            onClick={() => onSelectTab('shopping')}
            className={`flex-1 relative flex flex-col items-center gap-0.5 py-1 px-1 rounded-xl transition-all cursor-pointer ${
              currentTab === 'shopping'
                ? 'text-indigo-600 font-extrabold'
                : 'text-slate-400 hover:text-slate-600 font-medium'
            }`}
          >
            <div className={`p-1.5 rounded-xl transition-colors relative ${currentTab === 'shopping' ? 'bg-indigo-50 text-indigo-600' : ''}`}>
              <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
              {stats.groceryNeededCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-500 text-white text-[8px] font-bold flex items-center justify-center">
                  {stats.groceryNeededCount > 9 ? '9+' : stats.groceryNeededCount}
                </span>
              )}
            </div>
            <span className="text-[9px] sm:text-[10px]">Compras</span>
          </button>

          {/* Tab 4: Ranking & Gamificação */}
          <button
            onClick={() => onSelectTab('ranking')}
            className={`flex-1 flex flex-col items-center gap-0.5 py-1 px-1 rounded-xl transition-all cursor-pointer ${
              currentTab === 'ranking'
                ? 'text-purple-600 font-extrabold'
                : 'text-slate-400 hover:text-slate-600 font-medium'
            }`}
          >
            <div className={`p-1.5 rounded-xl transition-colors relative ${currentTab === 'ranking' ? 'bg-purple-50 text-purple-600' : ''}`}>
              <Trophy className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span className="text-[9px] sm:text-[10px]">Ranking</span>
          </button>

          {/* Tab 5: Rotina & Saúde da Casa */}
          <button
            onClick={() => onSelectTab('routine')}
            className={`flex-1 flex flex-col items-center gap-0.5 py-1 px-1 rounded-xl transition-all cursor-pointer ${
              currentTab === 'routine'
                ? 'text-indigo-600 font-extrabold'
                : 'text-slate-400 hover:text-slate-600 font-medium'
            }`}
          >
            <div className={`p-1.5 rounded-xl transition-colors ${currentTab === 'routine' ? 'bg-indigo-50 text-indigo-600' : ''}`}>
              <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span className="text-[9px] sm:text-[10px]">Rotina</span>
          </button>
        </div>
      </nav>
    </>
  );
};
