import React, { useState, useMemo } from 'react';
import { 
  Trophy, 
  Crown, 
  Medal, 
  Zap, 
  Flame, 
  Users, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  ChevronRight,
  Share2,
  Heart,
  ThumbsUp
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useTaskContext } from '../context/TaskContext';
import { getLevelInfo, evaluateBadges } from '../utils/gamification';
import { HouseholdMember } from '../types';

interface LeaderboardViewProps {
  onOpenFamilyModal: () => void;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({ onOpenFamilyModal }) => {
  const { 
    currentUser, 
    userProfile, 
    household, 
    householdMembers, 
    logs, 
    tasks 
  } = useTaskContext();

  const [period, setPeriod] = useState<'weekly' | 'alltime'>('weekly');

  // Compute members with weekly stats vs alltime stats
  const computedMembers = useMemo(() => {
    // If no cloud members yet, build a simulated list or fallback with current user
    let rawList: HouseholdMember[] = [];

    if (householdMembers && householdMembers.length > 0) {
      rawList = [...householdMembers];
    } else {
      rawList = [
        {
          uid: currentUser?.uid || 'guest_user',
          displayName: currentUser?.displayName || userProfile?.displayName || 'Você (Dona/o da Casa)',
          photoURL: currentUser?.photoURL || userProfile?.photoURL,
          role: 'owner',
          points: userProfile?.points || 240,
          level: userProfile?.level || 2,
          completedTasksCount: userProfile?.completedTasksCount || 6,
          totalMinutesSpent: userProfile?.totalMinutesSpent || 65,
          joinedAt: new Date().toISOString(),
        },
      ];
    }

    if (period === 'weekly') {
      const oneWeekAgo = Date.now() - 7 * 24 * 3600 * 1000;
      const weeklyLogs = logs.filter((l) => new Date(l.completedAt).getTime() >= oneWeekAgo);

      return rawList.map((m) => {
        const memLogs = weeklyLogs.filter((l) => l.completedByUid === m.uid || (m.uid === 'guest_user' && !l.completedByUid));
        const weeklyPoints = memLogs.reduce((sum, l) => sum + (l.pointsEarned || 40), 0);
        const weeklyCount = memLogs.length;
        const weeklyMinutes = memLogs.reduce((sum, l) => sum + (l.minutesSpent || 0), 0);

        return {
          ...m,
          points: weeklyPoints > 0 ? weeklyPoints : Math.round((m.points || 0) * 0.4),
          completedTasksCount: weeklyCount > 0 ? weeklyCount : Math.round((m.completedTasksCount || 0) * 0.4),
          totalMinutesSpent: weeklyMinutes > 0 ? weeklyMinutes : Math.round((m.totalMinutesSpent || 0) * 0.4),
        };
      }).sort((a, b) => b.points - a.points);
    }

    return rawList.sort((a, b) => (b.points || 0) - (a.points || 0));
  }, [householdMembers, currentUser, userProfile, logs, period]);

  const top1 = computedMembers[0];
  const top2 = computedMembers[1];
  const top3 = computedMembers[2];
  const otherMembers = computedMembers.slice(3);

  // Gamification badges for current user
  const userBadges = useMemo(() => {
    const pts = userProfile?.points || 0;
    const count = userProfile?.completedTasksCount || 0;
    return evaluateBadges(pts, count, logs);
  }, [userProfile, logs]);

  const levelData = getLevelInfo(userProfile?.points || 0);

  const handleSendReaction = (emoji: string) => {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
    });
  };

  return (
    <div className="space-y-5 pb-8 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-black text-amber-600 uppercase tracking-wider">
            <Trophy className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span>Gamificação & Conquistas</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Ranking da Família
          </h1>
          <p className="text-xs text-slate-500">
            Valorizando quem mais cuida e mantém o lar brilhando!
          </p>
        </div>

        <button
          onClick={onOpenFamilyModal}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs rounded-2xl border border-purple-200/80 transition-all cursor-pointer shrink-0"
        >
          <Users className="w-4 h-4 text-purple-600" />
          <span>Família</span>
        </button>
      </div>

      {/* Period Filter Tabs: Esta Semana vs Histórico Geral */}
      <div className="bg-slate-200/80 p-1 rounded-2xl flex items-center gap-1">
        <button
          onClick={() => setPeriod('weekly')}
          className={`flex-1 py-2 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            period === 'weekly'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
          <span>Esta Semana (Destaque)</span>
        </button>

        <button
          onClick={() => setPeriod('alltime')}
          className={`flex-1 py-2 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            period === 'alltime'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Trophy className="w-3.5 h-3.5 text-amber-500" />
          <span>Histórico Geral</span>
        </button>
      </div>

      {/* 🏆 Podium Display (1st, 2nd, 3rd) */}
      <div className="bg-linear-to-b from-amber-50/70 via-white to-purple-50/40 border border-amber-200/60 rounded-3xl p-5 shadow-xs relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 right-1/2 translate-x-1/2 w-48 h-20 bg-amber-300/20 blur-2xl pointer-events-none" />

        {/* Podium Members */}
        <div className="flex items-end justify-center gap-2 sm:gap-4 pt-3 pb-2">
          {/* 2nd Place */}
          {top2 ? (
            <div className="flex-1 flex flex-col items-center max-w-[100px]">
              <div className="relative mb-2">
                {top2.photoURL ? (
                  <img src={top2.photoURL} alt="" className="w-12 h-12 rounded-2xl object-cover border-2 border-slate-300 shadow-xs" />
                ) : (
                  <div className="w-12 h-12 rounded-2xl bg-slate-200 text-slate-700 font-black text-sm flex items-center justify-center shadow-xs">
                    {top2.displayName ? top2.displayName[0] : '2'}
                  </div>
                )}
                <div className="absolute -bottom-2 -right-1 w-6 h-6 rounded-full bg-slate-300 text-slate-800 text-[10px] font-black flex items-center justify-center shadow-xs border-2 border-white">
                  2º
                </div>
              </div>
              <span className="font-bold text-xs text-slate-800 truncate text-center w-full">
                {top2.displayName?.split(' ')[0]}
              </span>
              <span className="font-mono text-[11px] font-black text-slate-600">
                {top2.points} XP
              </span>
              <div className="w-full h-16 bg-slate-200/80 rounded-t-2xl mt-2 flex flex-col items-center justify-center text-[10px] font-bold text-slate-500">
                <span>🥈 Prata</span>
                <span className="text-[9px]">{top2.completedTasksCount} tarefas</span>
              </div>
            </div>
          ) : (
            <div className="flex-1 max-w-[100px] opacity-40 text-center text-[10px] text-slate-400">
              <div className="w-12 h-12 rounded-2xl border border-dashed border-slate-300 mx-auto mb-2 flex items-center justify-center">
                ?
              </div>
              <span>2º Lugar</span>
            </div>
          )}

          {/* 1st Place (Champion with Crown) */}
          {top1 && (
            <div className="flex-1 flex flex-col items-center max-w-[120px] -mt-4 z-10">
              <div className="relative mb-2">
                <Crown className="w-6 h-6 text-amber-500 fill-amber-400 absolute -top-4 left-1/2 -translate-x-1/2 animate-bounce" />
                {top1.photoURL ? (
                  <img 
                    src={top1.photoURL} 
                    alt="" 
                    className="w-16 h-16 rounded-3xl object-cover border-3 border-amber-400 shadow-md shadow-amber-200" 
                  />
                ) : (
                  <div className="w-16 h-16 rounded-3xl bg-linear-to-tr from-amber-400 to-amber-500 text-white font-black text-xl flex items-center justify-center shadow-md shadow-amber-200">
                    {top1.displayName ? top1.displayName[0] : '1'}
                  </div>
                )}
                <div className="absolute -bottom-2 -right-1 w-7 h-7 rounded-full bg-amber-400 text-amber-950 text-xs font-black flex items-center justify-center shadow-md border-2 border-white">
                  👑
                </div>
              </div>
              <span className="font-black text-xs text-slate-900 truncate text-center w-full">
                {top1.displayName?.split(' ')[0]}
              </span>
              <span className="font-mono text-xs font-black text-amber-600">
                {top1.points} XP
              </span>
              <div className="w-full h-24 bg-linear-to-t from-amber-400 to-amber-300 text-amber-950 rounded-t-2xl mt-2 flex flex-col items-center justify-center shadow-md shadow-amber-200/50">
                <span className="text-xs font-black">1º Lugar</span>
                <span className="text-[10px] font-bold">🥇 Campeão(ã)</span>
                <span className="text-[9px] font-semibold mt-0.5">{top1.completedTasksCount} tarefas</span>
              </div>
            </div>
          )}

          {/* 3rd Place */}
          {top3 ? (
            <div className="flex-1 flex flex-col items-center max-w-[100px]">
              <div className="relative mb-2">
                {top3.photoURL ? (
                  <img src={top3.photoURL} alt="" className="w-12 h-12 rounded-2xl object-cover border-2 border-amber-700/40 shadow-xs" />
                ) : (
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 font-black text-sm flex items-center justify-center shadow-xs">
                    {top3.displayName ? top3.displayName[0] : '3'}
                  </div>
                )}
                <div className="absolute -bottom-2 -right-1 w-6 h-6 rounded-full bg-amber-700 text-white text-[10px] font-black flex items-center justify-center shadow-xs border-2 border-white">
                  3º
                </div>
              </div>
              <span className="font-bold text-xs text-slate-800 truncate text-center w-full">
                {top3.displayName?.split(' ')[0]}
              </span>
              <span className="font-mono text-[11px] font-black text-slate-600">
                {top3.points} XP
              </span>
              <div className="w-full h-12 bg-amber-200/70 rounded-t-2xl mt-2 flex flex-col items-center justify-center text-[10px] font-bold text-amber-900">
                <span>🥉 Bronze</span>
                <span className="text-[9px]">{top3.completedTasksCount} tarefas</span>
              </div>
            </div>
          ) : (
            <div className="flex-1 max-w-[100px] opacity-40 text-center text-[10px] text-slate-400">
              <div className="w-12 h-12 rounded-2xl border border-dashed border-slate-300 mx-auto mb-2 flex items-center justify-center">
                ?
              </div>
              <span>3º Lugar</span>
            </div>
          )}
        </div>

        {/* Highlight MVP Message */}
        {top1 && (
          <div className="mt-3 p-3 bg-white/80 rounded-2xl border border-amber-200/60 text-center text-xs">
            <span className="font-black text-amber-800">
              🌟 Destaque da Semana:{' '}
            </span>
            <span className="font-bold text-slate-700">
              {top1.displayName} realizou {top1.completedTasksCount} atividades e acumulou {top1.points} XP para manter a casa em ordem!
            </span>
          </div>
        )}
      </div>

      {/* Invite banner if only 1 member is in the house */}
      {computedMembers.length <= 1 && (
        <div 
          onClick={onOpenFamilyModal}
          className="p-4 rounded-3xl bg-linear-to-r from-purple-600 to-indigo-600 text-white flex items-center justify-between gap-3 shadow-md shadow-purple-200 cursor-pointer hover:opacity-95 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="font-black text-xs">Convide seus Familiares!</div>
              <div className="text-[11px] text-purple-100">
                Compartilhe o código da casa para disputarem o ranking juntos!
              </div>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 shrink-0 text-white/80" />
        </div>
      )}

      {/* Full Leaderboard List (if > 3 members) */}
      {otherMembers.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Demais Membros da Casa
          </h3>
          {otherMembers.map((m, idx) => (
            <div
              key={m.uid}
              className="p-3 bg-white rounded-2xl border border-slate-200 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <span className="w-6 text-center font-black text-xs text-slate-400">
                  {idx + 4}º
                </span>
                {m.photoURL ? (
                  <img src={m.photoURL} alt="" className="w-8 h-8 rounded-xl object-cover shrink-0" />
                ) : (
                  <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                    {m.displayName ? m.displayName[0] : 'M'}
                  </div>
                )}
                <div>
                  <div className="font-bold text-xs text-slate-900">{m.displayName}</div>
                  <div className="text-[10px] text-slate-400">{m.completedTasksCount} tarefas</div>
                </div>
              </div>
              <span className="font-mono text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg">
                {m.points} XP
              </span>
            </div>
          ))}
        </div>
      )}

      {/* 🏅 Mural de Conquistas & Atividades Recentes */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span>Mural de Conquistas Recentes</span>
          </h3>
          <span className="text-[10px] text-slate-400 font-semibold">Feed ao vivo</span>
        </div>

        {logs.length > 0 ? (
          <div className="space-y-2">
            {logs.slice(0, 5).map((log) => (
              <div
                key={log.id}
                className="p-3 bg-white rounded-2xl border border-slate-200/80 flex items-center justify-between gap-3 shadow-2xs hover:border-slate-300 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {log.completedByPhoto ? (
                    <img src={log.completedByPhoto} alt="" className="w-9 h-9 rounded-xl object-cover shrink-0" />
                  ) : (
                    <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs shrink-0">
                      {log.completedByName ? log.completedByName[0] : '⭐'}
                    </div>
                  )}

                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 truncate">
                      <span className="text-purple-700 font-black">{log.completedByName || 'Alguém'}</span>{' '}
                      concluiu{' '}
                      <span className="text-slate-800 font-medium">"{log.taskTitle}"</span>
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                      <span className="capitalize">{log.room}</span>
                      <span>•</span>
                      <span>{log.minutesSpent} min</span>
                      <span>•</span>
                      <span>{new Date(log.completedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <span className="font-mono text-xs font-black text-amber-600 bg-amber-50 px-2 py-1 rounded-xl">
                    +{log.pointsEarned || 40} XP
                  </span>

                  {/* Reaction Button */}
                  <button
                    onClick={() => handleSendReaction('👏')}
                    className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-xl transition-all cursor-pointer"
                    title="Mandar parabéns!"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 bg-white rounded-3xl border border-slate-200 text-center text-xs text-slate-400">
            Nenhuma atividade concluída ainda hoje. Gire a roleta ou marque uma tarefa como feita para pontuar!
          </div>
        )}
      </div>

      {/* 🎖️ Suas Conquistas e Nível (Badges) */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-purple-600">
              Seu Desempenho
            </div>
            <h3 className="font-black text-sm text-slate-900 flex items-center gap-1.5">
              <span>{levelData.currentLevel.badgeIcon}</span>
              <span>{levelData.currentLevel.title}</span>
            </h3>
          </div>

          <div className="text-right">
            <span className="font-mono text-base font-black text-amber-600 block">
              {userProfile?.points || 0} XP
            </span>
            <span className="text-[10px] text-slate-400 font-semibold">
              Nível {levelData.currentLevel.level} de 6
            </span>
          </div>
        </div>

        {/* Level progress bar */}
        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-linear-to-r from-purple-500 to-indigo-600 rounded-full transition-all duration-500"
            style={{ width: `${levelData.progressPercent}%` }}
          />
        </div>

        {/* Badges Grid */}
        <div className="pt-2">
          <h4 className="text-xs font-bold text-slate-700 mb-2">Medalhas Desbloqueáveis</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {userBadges.map((badge) => (
              <div
                key={badge.id}
                className={`p-2.5 rounded-2xl border text-left transition-all ${
                  badge.unlocked
                    ? 'border-purple-200 bg-purple-50/50'
                    : 'border-slate-200/60 bg-slate-50 opacity-50 grayscale'
                }`}
              >
                <div className="text-lg mb-0.5">{badge.icon}</div>
                <div className="font-bold text-xs text-slate-900 leading-tight">
                  {badge.name}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">
                  {badge.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
