import React, { useState, useMemo } from 'react';
import { 
  Sparkles, 
  Dices, 
  Clock, 
  Play, 
  CheckCircle2, 
  RotateCw, 
  SlidersHorizontal,
  Flame,
  Award
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { DomesticTask, RoomCategory } from '../types';
import { useTaskContext } from '../context/TaskContext';
import { 
  ROOMS, 
  computeTaskStatus, 
  drawRandomTask, 
  getFrequencyLabel, 
  EFFORT_LABELS 
} from '../utils/taskCalculations';
import { RoomIcon } from './RoomIcon';
import { sounds } from '../utils/soundEffects';

interface RouletteViewProps {
  onStartTimer: (task: DomesticTask) => void;
  onOpenNewTaskModal: () => void;
}

const TIME_PRESETS = [5, 10, 15, 20, 30, 45, 60];

export const RouletteView: React.FC<RouletteViewProps> = ({
  onStartTimer,
  onOpenNewTaskModal,
}) => {
  const { tasks, completeTask, preferences, updatePreferences } = useTaskContext();

  const [availableMinutes, setAvailableMinutes] = useState<number>(20);
  const [selectedRoom, setSelectedRoom] = useState<RoomCategory | 'all'>('all');
  const [selectedEffort, setSelectedEffort] = useState<string | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Drawing state
  const [isSpinning, setIsSpinning] = useState(false);
  const [displayedTaskTitle, setDisplayedTaskTitle] = useState<string>('');
  const [drawnTask, setDrawnTask] = useState<DomesticTask | null>(null);
  const [hasDrawnOnce, setHasDrawnOnce] = useState(false);

  // Eligible tasks matching current filters
  const eligibleTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (t.estimatedMinutes > availableMinutes) return false;
      if (selectedRoom !== 'all' && t.room !== selectedRoom) return false;
      if (selectedEffort !== 'all' && t.effort !== selectedEffort) return false;
      return true;
    });
  }, [tasks, availableMinutes, selectedRoom, selectedEffort]);

  // Handle draw
  const handleDraw = () => {
    if (eligibleTasks.length === 0) return;

    setIsSpinning(true);
    setDrawnTask(null);

    // Pick final task ahead of time
    const finalChoice = drawRandomTask(tasks, {
      maxMinutes: availableMinutes,
      room: selectedRoom,
      effort: selectedEffort,
      prioritizeOverdue: preferences.prioritizeOverdueInDraw,
      excludeTaskId: drawnTask?.id,
    });

    if (!finalChoice) {
      setIsSpinning(false);
      return;
    }

    // Sound + animated cycling through items
    let count = 0;
    const maxIterations = Math.min(18, Math.max(8, eligibleTasks.length * 2));
    const intervalTime = 70;

    const interval = setInterval(() => {
      count++;
      const randomCandidate = eligibleTasks[Math.floor(Math.random() * eligibleTasks.length)];
      setDisplayedTaskTitle(randomCandidate.title);
      sounds.playTick();

      if (count >= maxIterations) {
        clearInterval(interval);
        setDrawnTask(finalChoice);
        setDisplayedTaskTitle(finalChoice.title);
        setIsSpinning(false);
        setHasDrawnOnce(true);
        sounds.playSuccess();
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
        });
      }
    }, intervalTime);
  };

  const handleDirectComplete = () => {
    if (!drawnTask) return;
    completeTask(drawnTask.id);
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  const drawnStatus = drawnTask ? computeTaskStatus(drawnTask) : null;
  const drawnRoom = drawnTask ? ROOMS[drawnTask.room] || ROOMS.geral : null;
  const drawnEffort = drawnTask ? EFFORT_LABELS[drawnTask.effort] : null;

  return (
    <div className="space-y-5 pb-6">
      {/* Top Banner / Question */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-indigo-600 via-indigo-700 to-purple-800 text-white p-5 sm:p-7 shadow-lg shadow-indigo-200">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-md text-indigo-100 mb-2.5">
            <Dices className="w-3.5 h-3.5 text-amber-300" />
            <span>Sorteador Inteligente</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Quanto tempo você tem disponível agora?
          </h1>
          <p className="text-xs sm:text-sm text-indigo-100/90 mt-1 max-w-md">
            Informe seus minutos livres e o app sorteará a tarefa ideal para você manter seu lar em ordem sem sobrecarga.
          </p>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-purple-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute right-12 top-4 w-24 h-24 bg-amber-400/20 rounded-full blur-xl pointer-events-none" />
      </div>

      {/* Time Selector Card */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-indigo-600" />
            Tempo Disponível
          </label>
          <div className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-100 px-3.5 py-1.5 rounded-2xl">
            <span className="text-2xl font-black text-indigo-600 font-mono">
              {availableMinutes}
            </span>
            <span className="text-xs font-bold text-indigo-600">minutos</span>
          </div>
        </div>

        {/* Quick Chips */}
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
          {TIME_PRESETS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setAvailableMinutes(m);
                sounds.playTick();
              }}
              className={`py-2 px-1 rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${
                availableMinutes === m
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 scale-102'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {m} min
            </button>
          ))}
        </div>

        {/* Range Slider */}
        <div className="space-y-1 pt-1">
          <input
            type="range"
            min="5"
            max="90"
            step="5"
            value={availableMinutes}
            onChange={(e) => setAvailableMinutes(Number(e.target.value))}
            className="w-full accent-indigo-600 cursor-pointer h-2.5 bg-slate-200 rounded-lg"
          />
          <div className="flex justify-between text-[11px] text-slate-400 font-medium px-1">
            <span>5 min (rápida)</span>
            <span>45 min</span>
            <span>90 min (faxina)</span>
          </div>
        </div>

        {/* Filter Toggle and Helper Info */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
          <div className="text-xs text-slate-500 font-medium">
            <strong className="text-indigo-600 font-bold">{eligibleTasks.length}</strong>{' '}
            {eligibleTasks.length === 1 ? 'tarefa cabe' : 'tarefas cabem'} nesse tempo
          </div>

          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-xl border transition-colors cursor-pointer ${
              showFilters || selectedRoom !== 'all' || selectedEffort !== 'all'
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filtros</span>
            {(selectedRoom !== 'all' || selectedEffort !== 'all') && (
              <span className="w-2 h-2 rounded-full bg-indigo-600" />
            )}
          </button>
        </div>

        {/* Expandable Filter Box */}
        {showFilters && (
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3.5 animate-in slide-in-from-top-2 duration-150">
            {/* Room filters */}
            <div>
              <span className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Filtrar por Cômodo
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedRoom('all')}
                  className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all ${
                    selectedRoom === 'all'
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Qualquer cômodo
                </button>
                {(Object.keys(ROOMS) as RoomCategory[]).map((rKey) => {
                  const isSel = selectedRoom === rKey;
                  return (
                    <button
                      key={rKey}
                      type="button"
                      onClick={() => setSelectedRoom(rKey)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg font-medium transition-all ${
                        isSel
                          ? 'bg-indigo-600 text-white font-bold'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <RoomIcon room={rKey} className="w-3 h-3" />
                      <span>{ROOMS[rKey].name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Effort filters */}
            <div>
              <span className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Nível de Esforço
              </span>
              <div className="flex gap-2">
                {[
                  { key: 'all', label: 'Todos' },
                  { key: 'leve', label: 'Leve' },
                  { key: 'moderado', label: 'Moderado' },
                  { key: 'pesado', label: 'Pesado' },
                ].map((eff) => (
                  <button
                    key={eff.key}
                    type="button"
                    onClick={() => setSelectedEffort(eff.key)}
                    className={`px-3 py-1 text-xs rounded-lg font-medium transition-all ${
                      selectedEffort === eff.key
                        ? 'bg-indigo-600 text-white font-bold'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {eff.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Prioritize overdue toggle */}
            <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-rose-500" />
                <span className="text-xs font-semibold text-slate-700">
                  Priorizar tarefas atrasadas ou pendentes
                </span>
              </div>
              <input
                type="checkbox"
                checked={preferences.prioritizeOverdueInDraw}
                onChange={(e) =>
                  updatePreferences({ prioritizeOverdueInDraw: e.target.checked })
                }
                className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* Big Draw Button */}
        <button
          type="button"
          onClick={handleDraw}
          disabled={isSpinning || eligibleTasks.length === 0}
          className={`w-full py-4 px-6 rounded-2xl font-black text-base uppercase tracking-wider shadow-lg transition-all flex items-center justify-center gap-2.5 cursor-pointer ${
            eligibleTasks.length === 0
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
              : isSpinning
              ? 'bg-indigo-400 text-white scale-98 animate-pulse'
              : 'bg-linear-to-r from-indigo-600 via-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-indigo-300 active:scale-97'
          }`}
        >
          <Dices className={`w-5 h-5 ${isSpinning ? 'animate-spin' : ''}`} />
          <span>
            {isSpinning
              ? 'Sorteando tarefa...'
              : hasDrawnOnce
              ? 'Sortear Outra Tarefa'
              : 'Sortear Tarefa Para Agora! 🪄'}
          </span>
        </button>
      </div>

      {/* Spinning Shuffle View */}
      {isSpinning && (
        <div className="bg-indigo-50 border-2 border-dashed border-indigo-300 rounded-3xl p-8 text-center animate-pulse">
          <div className="w-12 h-12 mx-auto mb-3 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-md animate-bounce">
            <Sparkles className="w-6 h-6" />
          </div>
          <span className="text-xs uppercase font-extrabold tracking-widest text-indigo-500">
            Girando a roleta doméstica...
          </span>
          <h3 className="text-xl font-black text-indigo-900 mt-2 min-h-12 flex items-center justify-center px-4">
            {displayedTaskTitle || 'Consultando afazeres...'}
          </h3>
        </div>
      )}

      {/* Result Card */}
      {!isSpinning && drawnTask && drawnRoom && drawnStatus && (
        <div className="relative overflow-hidden bg-white rounded-3xl border-2 border-indigo-500 shadow-xl shadow-indigo-100 p-6 animate-in zoom-in-95 duration-200">
          <div className="absolute top-0 right-0 left-0 h-2 bg-linear-to-r from-indigo-500 via-purple-500 to-pink-500" />

          {/* Header Tag */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-1.5">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${drawnRoom.bgLight} ${drawnRoom.colorText}`}>
                <RoomIcon room={drawnTask.room} className="w-3.5 h-3.5" />
                {drawnRoom.name}
              </span>

              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${drawnStatus.badgeClass}`}>
                {drawnStatus.label}
              </span>
            </div>

            <div className="flex items-center gap-1 text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-xl">
              <Award className="w-3.5 h-3.5 text-amber-500" />
              Sorteada!
            </div>
          </div>

          {/* Title & Description */}
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-2 leading-snug">
            {drawnTask.title}
          </h2>

          {drawnTask.description && (
            <p className="text-sm text-slate-600 mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
              💡 {drawnTask.description}
            </p>
          )}

          {/* Metadata Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-6 text-xs">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div className="text-[11px] text-slate-400 font-semibold mb-0.5">Tempo Estimado</div>
              <div className="text-sm font-extrabold text-indigo-700 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {drawnTask.estimatedMinutes} min
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div className="text-[11px] text-slate-400 font-semibold mb-0.5">Frequência</div>
              <div className="text-xs font-bold text-slate-700 truncate">
                {getFrequencyLabel(drawnTask.frequencyType, drawnTask.intervalDays)}
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 col-span-2 sm:col-span-1">
              <div className="text-[11px] text-slate-400 font-semibold mb-0.5">Esforço</div>
              <div className="text-xs font-bold text-slate-700">
                {drawnEffort?.label || 'Moderado'}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2.5">
            <button
              type="button"
              onClick={() => onStartTimer(drawnTask)}
              className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white rounded-2xl font-bold text-sm shadow-md shadow-indigo-200 flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Iniciar com Cronômetro de {drawnTask.estimatedMinutes} min</span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleDirectComplete}
                className="py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Marcar Concluída</span>
              </button>

              <button
                type="button"
                onClick={handleDraw}
                className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5 text-slate-500" />
                <span>Sortear Outra</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State when no tasks match */}
      {eligibleTasks.length === 0 && (
        <div className="p-6 bg-amber-50 border border-amber-200 rounded-3xl text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-200/60 text-amber-800 flex items-center justify-center mx-auto">
            <Clock className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-800 text-base">
            Nenhuma tarefa encontrada com até {availableMinutes} min
          </h3>
          <p className="text-xs text-slate-600 max-w-sm mx-auto">
            Você pode aumentar o tempo no controle acima ou cadastrar uma tarefa rápida para esse intervalo.
          </p>
          <div className="flex justify-center gap-2 pt-1">
            <button
              onClick={() => setAvailableMinutes(30)}
              className="px-3.5 py-1.5 text-xs font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 rounded-xl transition-colors cursor-pointer"
            >
              Mudar para 30 min
            </button>
            <button
              onClick={onOpenNewTaskModal}
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors cursor-pointer"
            >
              + Nova Atividade
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
