import React, { useState, useEffect } from 'react';
import { X, Clock, Repeat, Check, Sparkles } from 'lucide-react';
import { DomesticTask, EffortLevel, FrequencyType, RoomCategory } from '../types';
import { ROOMS } from '../utils/taskCalculations';
import { RoomIcon } from './RoomIcon';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Omit<DomesticTask, 'id' | 'createdAt' | 'completedCount'>) => void;
  initialTask?: DomesticTask | null;
}

const MINUTE_PRESETS = [5, 10, 15, 20, 30, 45, 60];

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialTask,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [room, setRoom] = useState<RoomCategory>('cozinha');
  const [estimatedMinutes, setEstimatedMinutes] = useState(15);
  const [effort, setEffort] = useState<EffortLevel>('leve');
  const [frequencyType, setFrequencyType] = useState<FrequencyType>('days_interval');
  const [intervalDays, setIntervalDays] = useState(3);
  const [errors, setErrors] = useState<string | null>(null);

  useEffect(() => {
    if (initialTask) {
      setTitle(initialTask.title);
      setDescription(initialTask.description || '');
      setRoom(initialTask.room);
      setEstimatedMinutes(initialTask.estimatedMinutes);
      setEffort(initialTask.effort);
      setFrequencyType(initialTask.frequencyType);
      setIntervalDays(initialTask.intervalDays || 3);
    } else {
      setTitle('');
      setDescription('');
      setRoom('cozinha');
      setEstimatedMinutes(15);
      setEffort('leve');
      setFrequencyType('days_interval');
      setIntervalDays(3);
    }
    setErrors(null);
  }, [initialTask, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrors('Por favor, informe o nome da atividade.');
      return;
    }
    if (estimatedMinutes <= 0) {
      setErrors('O tempo estimado deve ser maior que 0 minutos.');
      return;
    }

    onSave({
      title: title.trim(),
      description: description.trim() || undefined,
      room,
      estimatedMinutes,
      effort,
      frequencyType,
      intervalDays: frequencyType === 'days_interval' ? Math.max(1, intervalDays) : undefined,
      lastCompletedAt: initialTask ? initialTask.lastCompletedAt : null,
      isFavorite: initialTask ? initialTask.isFavorite : false,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              {initialTask ? 'Editar Atividade' : 'Nova Atividade Doméstica'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto px-6 py-5 space-y-5 flex-1 text-sm">
          {errors && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium">
              {errors}
            </div>
          )}

          {/* Nome da Tarefa */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Nome da Tarefa *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Lavar louça da pia, Passar pano no chão..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-800 placeholder-slate-400 font-medium"
            />
          </div>

          {/* Descrição / Dica */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Instruções ou Dica (Opcional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Usar desinfetante floral, tirar lixeira..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-800 placeholder-slate-400 text-xs"
            />
          </div>

          {/* Cômodo / Categoria */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Cômodo / Área da Casa
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(Object.keys(ROOMS) as RoomCategory[]).map((key) => {
                const r = ROOMS[key];
                const isSelected = room === key;
                return (
                  <button
                    type="button"
                    key={key}
                    onClick={() => setRoom(key)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-bold ring-2 ring-indigo-500/20'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <RoomIcon
                      room={key}
                      className={`w-4 h-4 shrink-0 ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`}
                    />
                    <span className="text-xs truncate">{r.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tempo Médio de Execução */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider">
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                Tempo Médio de Execução
              </label>
              <span className="text-base font-extrabold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-lg">
                {estimatedMinutes} minutos
              </span>
            </div>

            {/* Presets */}
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {MINUTE_PRESETS.map((m) => (
                <button
                  type="button"
                  key={m}
                  onClick={() => setEstimatedMinutes(m)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    estimatedMinutes === m
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {m}m
                </button>
              ))}
            </div>

            {/* Range Slider */}
            <input
              type="range"
              min="5"
              max="90"
              step="5"
              value={estimatedMinutes}
              onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
            />
          </div>

          {/* Rotina / Frequência de Repetição */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              <Repeat className="w-3.5 h-3.5 text-indigo-600" />
              Rotina de Repetição
            </label>
            <div className="grid grid-cols-2 gap-2 mb-2.5">
              {[
                { type: 'daily', label: 'Diária', desc: 'Todo dia' },
                { type: 'days_interval', label: 'A cada X dias', desc: `A cada ${intervalDays} dias` },
                { type: 'weekly', label: 'Semanal', desc: 'A cada 7 dias' },
                { type: 'biweekly', label: 'Quinzenal', desc: 'A cada 15 dias' },
                { type: 'monthly', label: 'Mensal', desc: 'A cada 30 dias' },
                { type: 'as_needed', label: 'Sob demanda', desc: 'Quando necessário' },
              ].map((opt) => {
                const isSelected = frequencyType === opt.type;
                return (
                  <button
                    type="button"
                    key={opt.type}
                    onClick={() => setFrequencyType(opt.type as FrequencyType)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-bold ring-2 ring-indigo-500/20'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-xs font-bold">{opt.label}</div>
                    <div className="text-[11px] text-slate-500">{opt.desc}</div>
                  </button>
                );
              })}
            </div>

            {frequencyType === 'days_interval' && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                <span className="text-xs font-medium text-slate-700">Repetir a cada quantos dias?</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={intervalDays}
                    onChange={(e) => setIntervalDays(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-16 px-2.5 py-1 text-center font-bold text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="text-xs text-slate-500 font-semibold">dias</span>
                </div>
              </div>
            )}
          </div>

          {/* Nível de Esforço */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Nível de Esforço
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: 'leve', label: 'Leve / Rápido', color: 'emerald' },
                { key: 'moderado', label: 'Moderado', color: 'amber' },
                { key: 'pesado', label: 'Pesado / Faxina', color: 'purple' },
              ].map((item) => {
                const isSelected = effort === item.key;
                return (
                  <button
                    type="button"
                    key={item.key}
                    onClick={() => setEffort(item.key as EffortLevel)}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-900 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        </form>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/50 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-200 transition-all cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>{initialTask ? 'Salvar Alterações' : 'Cadastrar Atividade'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
