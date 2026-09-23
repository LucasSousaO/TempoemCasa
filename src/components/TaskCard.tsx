import React, { useState } from 'react';
import { Clock, Repeat, Check, Edit3, Trash2, Heart, AlertCircle } from 'lucide-react';
import { DomesticTask } from '../types';
import { computeTaskStatus, formatTimeRelative, ROOMS, getFrequencyLabel, EFFORT_LABELS } from '../utils/taskCalculations';
import { RoomIcon } from './RoomIcon';
import { useTaskContext } from '../context/TaskContext';

interface TaskCardProps {
  task: DomesticTask;
  onEdit: (task: DomesticTask) => void;
  onQuickStart?: (task: DomesticTask) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onEdit, onQuickStart }) => {
  const { completeTask, deleteTask, toggleFavorite } = useTaskContext();
  const [justCompleted, setJustCompleted] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const statusInfo = computeTaskStatus(task);
  const roomMeta = ROOMS[task.room] || ROOMS.geral;
  const effortInfo = EFFORT_LABELS[task.effort] || EFFORT_LABELS.moderado;

  const handleQuickCheck = (e: React.MouseEvent) => {
    e.stopPropagation();
    setJustCompleted(true);
    completeTask(task.id);
    setTimeout(() => {
      setJustCompleted(false);
    }, 1200);
  };

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border transition-all duration-200 bg-white ${
        statusInfo.status === 'overdue'
          ? 'border-rose-200 shadow-sm hover:border-rose-300'
          : statusInfo.status === 'due_soon'
          ? 'border-amber-200 shadow-sm hover:border-amber-300'
          : 'border-slate-200/80 shadow-xs hover:border-slate-300'
      } hover:shadow-md p-4`}
    >
      {/* Top row: Room & Status & Favorite */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${roomMeta.bgLight} ${roomMeta.colorText}`}
          >
            <RoomIcon room={task.room} className="w-3.5 h-3.5" />
            {roomMeta.name}
          </span>

          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${statusInfo.badgeClass}`}
          >
            {statusInfo.status === 'overdue' && <AlertCircle className="w-3 h-3 text-rose-500" />}
            {statusInfo.label}
          </span>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(task.id);
          }}
          className="text-slate-300 hover:text-rose-500 transition-colors p-1"
          title={task.isFavorite ? 'Remover dos favoritos' : 'Favoritar'}
        >
          <Heart
            className={`w-4 h-4 transition-transform active:scale-125 ${
              task.isFavorite ? 'fill-rose-500 text-rose-500' : ''
            }`}
          />
        </button>
      </div>

      {/* Main Title & Description */}
      <div className="mb-3">
        <h3 className="font-bold text-slate-800 text-base leading-snug line-clamp-2">
          {task.title}
        </h3>
        {task.description && (
          <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
            {task.description}
          </p>
        )}
      </div>

      {/* Badges / Meta Info */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 mb-3.5 pt-1 border-t border-slate-100">
        <div className="flex items-center gap-1 font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
          <Clock className="w-3.5 h-3.5" />
          <span>{task.estimatedMinutes} min</span>
        </div>

        <div className="flex items-center gap-1 text-slate-500">
          <Repeat className="w-3.5 h-3.5 text-slate-400" />
          <span>{getFrequencyLabel(task.frequencyType, task.intervalDays)}</span>
        </div>

        <span className={`text-[11px] px-1.5 py-0.5 rounded border ${effortInfo.color}`}>
          {effortInfo.label}
        </span>
      </div>

      {/* Footer Info & Actions */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
        <span className="text-[11px] text-slate-400">
          Última: <strong className="text-slate-600 font-medium">{formatTimeRelative(task.lastCompletedAt)}</strong>
        </span>

        <div className="flex items-center gap-1">
          {onQuickStart && (
            <button
              onClick={() => onQuickStart(task)}
              className="px-2.5 py-1 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
            >
              Iniciar
            </button>
          )}

          <button
            onClick={() => onEdit(task)}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            title="Editar tarefa"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>

          {showConfirmDelete ? (
            <div className="flex items-center gap-1 bg-rose-50 p-1 rounded-lg">
              <button
                onClick={() => deleteTask(task.id)}
                className="px-2 py-0.5 text-[11px] font-bold text-white bg-rose-600 rounded hover:bg-rose-700"
              >
                Excluir
              </button>
              <button
                onClick={() => setShowConfirmDelete(false)}
                className="px-1 text-[11px] text-slate-500 hover:text-slate-700"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowConfirmDelete(true)}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              title="Excluir tarefa"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={handleQuickCheck}
            disabled={justCompleted}
            className={`ml-1 flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl font-semibold text-xs transition-all shadow-xs active:scale-95 cursor-pointer ${
              justCompleted
                ? 'bg-emerald-600 text-white shadow-emerald-200'
                : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-100'
            }`}
          >
            <Check className={`w-3.5 h-3.5 ${justCompleted ? 'scale-125 stroke-[3]' : ''}`} />
            <span>{justCompleted ? 'Feito! 🎉' : 'Feito'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
