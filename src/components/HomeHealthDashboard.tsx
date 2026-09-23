import React from 'react';
import { 
  HeartHandshake, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  RotateCcw, 
  Home, 
  ChevronRight,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { useTaskContext } from '../context/TaskContext';
import { ROOMS, computeTaskStatus, formatTimeRelative } from '../utils/taskCalculations';
import { RoomCategory } from '../types';
import { RoomIcon } from './RoomIcon';

interface HomeHealthDashboardProps {
  onSelectRoomFilter: (room: RoomCategory) => void;
  onGoToChoreDraw: () => void;
}

export const HomeHealthDashboard: React.FC<HomeHealthDashboardProps> = ({
  onSelectRoomFilter,
  onGoToChoreDraw,
}) => {
  const { tasks, logs, stats, undoCompleteTask } = useTaskContext();

  // Compute breakdown per room
  const roomBreakdowns = (Object.keys(ROOMS) as RoomCategory[]).map((rKey) => {
    const roomTasks = tasks.filter((t) => t.room === rKey);
    let overdue = 0;
    let upToDate = 0;
    roomTasks.forEach((t) => {
      const s = computeTaskStatus(t).status;
      if (s === 'overdue') overdue++;
      else if (s === 'up_to_date' || s === 'due_soon') upToDate++;
    });

    const percent = roomTasks.length === 0 ? 100 : Math.round((upToDate / roomTasks.length) * 100);

    return {
      room: rKey,
      meta: ROOMS[rKey],
      total: roomTasks.length,
      overdue,
      percent,
    };
  }).filter((r) => r.total > 0);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (score >= 50) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-rose-600 bg-rose-50 border-rose-200';
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Saúde & Rotina do Lar
        </h1>
        <p className="text-xs text-slate-500">
          Acompanhamento visual de limpeza, manutenção e tempo investido
        </p>
      </div>

      {/* Main Health Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">
              Status Geral da Casa
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-black text-slate-900 font-mono">
                {stats.homeHealthScore}%
              </span>
              <span className="text-sm font-bold text-slate-500">em dia</span>
            </div>
            <p className="text-xs text-slate-600 mt-2 max-w-sm">
              {stats.homeHealthScore >= 80
                ? '🌟 Incrível! Sua casa está super organizada e a maioria das rotinas está em dia.'
                : stats.homeHealthScore >= 50
                ? '⚖️ Quase lá! Algumas tarefas pedem atenção nos próximos dias.'
                : '🚨 Atenção! Há várias tarefas atrasadas acumuladas. Que tal sortear uma de 10 min agora?'}
            </p>
          </div>

          <div className="shrink-0 flex sm:flex-col gap-2">
            <button
              onClick={onGoToChoreDraw}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-2xl shadow-md shadow-indigo-200 transition-all active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Sortear Tarefa Rápida</span>
            </button>
          </div>
        </div>

        {/* Big Health Progress Bar */}
        <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden mt-5">
          <div
            className={`h-full transition-all duration-700 rounded-full ${
              stats.homeHealthScore >= 80
                ? 'bg-emerald-500'
                : stats.homeHealthScore >= 50
                ? 'bg-amber-500'
                : 'bg-rose-500'
            }`}
            style={{ width: `${Math.max(5, stats.homeHealthScore)}%` }}
          />
        </div>
      </div>

      {/* 3 Metric Mini Cards */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 text-center">
          <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-rose-600 mb-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Atrasadas</span>
          </div>
          <div className="text-2xl font-black text-rose-600 font-mono">
            {stats.overdueCount}
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 text-center">
          <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-emerald-600 mb-1">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Em Dia</span>
          </div>
          <div className="text-2xl font-black text-emerald-600 font-mono">
            {stats.upToDateCount}
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 text-center">
          <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-indigo-600 mb-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Minutos</span>
          </div>
          <div className="text-2xl font-black text-indigo-600 font-mono">
            {stats.totalMinutesSaved}
          </div>
        </div>
      </div>

      {/* Room Health Breakdown */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 space-y-4">
        <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">
          Estado por Cômodo
        </h2>
        <div className="space-y-3">
          {roomBreakdowns.map((item) => (
            <div
              key={item.room}
              onClick={() => onSelectRoomFilter(item.room)}
              className="p-3 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:bg-slate-50/50 transition-all cursor-pointer flex items-center justify-between gap-3 group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.meta.bgLight} ${item.meta.colorText}`}
                >
                  <RoomIcon room={item.room} className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-xs text-slate-800 flex items-center gap-2">
                    <span className="truncate">{item.meta.name}</span>
                    {item.overdue > 0 && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-rose-100 text-rose-700">
                        {item.overdue} atrasada{item.overdue > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {item.total} tarefa{item.total > 1 ? 's' : ''} na rotina
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <span className="text-xs font-black text-slate-800 font-mono">
                    {item.percent}%
                  </span>
                  <div className="w-16 bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1">
                    <div
                      className={`h-full rounded-full ${
                        item.percent >= 80
                          ? 'bg-emerald-500'
                          : item.percent >= 50
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                      style={{ width: `${item.percent}%` }}
                    />
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 transition-colors" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent History / Log Timeline */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">
            Histórico Recente de Conclusões
          </h2>
          <span className="text-xs text-slate-400 font-medium">
            {logs.length} realizações
          </span>
        </div>

        {logs.length > 0 ? (
          <div className="space-y-2.5">
            {logs.slice(0, 10).map((log) => {
              const rMeta = ROOMS[log.room] || ROOMS.geral;
              return (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`p-2 rounded-xl shrink-0 ${rMeta.bgLight} ${rMeta.colorText}`}>
                      <RoomIcon room={log.room} className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-800 truncate">
                        {log.taskTitle}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2">
                        <span>{formatTimeRelative(log.completedAt)}</span>
                        <span>•</span>
                        <span className="text-indigo-600 font-semibold">{log.minutesSpent} min</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => undoCompleteTask(log.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0"
                    title="Desfazer conclusão"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6 text-xs text-slate-400">
            Nenhuma atividade concluída recentemente. Conclua sua primeira tarefa para ver o histórico!
          </div>
        )}
      </div>
    </div>
  );
};
