import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Sparkles, 
  Filter, 
  SlidersHorizontal,
  RefreshCw,
  Flame,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { DomesticTask, RoomCategory } from '../types';
import { useTaskContext } from '../context/TaskContext';
import { ROOMS, computeTaskStatus } from '../utils/taskCalculations';
import { TaskCard } from './TaskCard';
import { RoomIcon } from './RoomIcon';

interface TaskListProps {
  onAddTask: () => void;
  onEditTask: (task: DomesticTask) => void;
  onQuickStart: (task: DomesticTask) => void;
}

type FilterTab = 'all' | 'overdue' | 'due_soon' | 'up_to_date' | 'favorite';

export const TaskList: React.FC<TaskListProps> = ({
  onAddTask,
  onEditTask,
  onQuickStart,
}) => {
  const { tasks, resetToDefaults } = useTaskContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [selectedRoom, setSelectedRoom] = useState<RoomCategory | 'all'>('all');
  const [sortBy, setSortBy] = useState<'urgency' | 'time_asc' | 'time_desc' | 'name'>('urgency');

  const counts = useMemo(() => {
    let overdue = 0;
    let dueSoon = 0;
    let upToDate = 0;
    let favorite = 0;

    tasks.forEach((t) => {
      const { status } = computeTaskStatus(t);
      if (status === 'overdue') overdue++;
      else if (status === 'due_soon') dueSoon++;
      else if (status === 'up_to_date') upToDate++;
      if (t.isFavorite) favorite++;
    });

    return { all: tasks.length, overdue, dueSoon, upToDate, favorite };
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks
      .filter((t) => {
        // Search
        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();
          const matchTitle = t.title.toLowerCase().includes(term);
          const matchDesc = t.description?.toLowerCase().includes(term);
          if (!matchTitle && !matchDesc) return false;
        }

        // Room
        if (selectedRoom !== 'all' && t.room !== selectedRoom) {
          return false;
        }

        // Status Tab
        if (activeTab === 'favorite' && !t.isFavorite) return false;
        if (activeTab !== 'all' && activeTab !== 'favorite') {
          const { status } = computeTaskStatus(t);
          if (status !== activeTab) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'urgency') {
          const statusA = computeTaskStatus(a);
          const statusB = computeTaskStatus(b);
          // overdue > due_soon > up_to_date > as_needed
          const order: Record<string, number> = {
            overdue: 4,
            due_soon: 3,
            up_to_date: 2,
            as_needed: 1,
          };
          const weightDiff = (order[statusB.status] || 0) - (order[statusA.status] || 0);
          if (weightDiff !== 0) return weightDiff;
          return (statusB.daysDiff || 0) - (statusA.daysDiff || 0);
        }
        if (sortBy === 'time_asc') {
          return a.estimatedMinutes - b.estimatedMinutes;
        }
        if (sortBy === 'time_desc') {
          return b.estimatedMinutes - a.estimatedMinutes;
        }
        if (sortBy === 'name') {
          return a.title.localeCompare(b.title);
        }
        return 0;
      });
  }, [tasks, searchTerm, selectedRoom, activeTab, sortBy]);

  return (
    <div className="space-y-4 pb-8">
      {/* Top Header & Add Button */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Minhas Atividades
          </h1>
          <p className="text-xs text-slate-500">
            {tasks.length} atividades cadastradas na rotina
          </p>
        </div>

        <button
          onClick={onAddTask}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs rounded-2xl shadow-md shadow-indigo-200 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Nova Atividade</span>
        </button>
      </div>

      {/* Search & Sort Bar */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome ou cômodo..."
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-white rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium placeholder-slate-400"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
            >
              Limpar
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-2xl px-2.5 py-1 shrink-0">
          <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 mr-1" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="text-xs font-semibold text-slate-700 bg-transparent focus:outline-none cursor-pointer pr-1"
          >
            <option value="urgency">Prioridade (Urgentes)</option>
            <option value="time_asc">Menor Tempo</option>
            <option value="time_desc">Maior Tempo</option>
            <option value="name">Alfabética</option>
          </select>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {[
          { key: 'all', label: 'Todas', count: counts.all },
          { key: 'overdue', label: 'Atrasadas', count: counts.overdue, badge: 'bg-rose-500 text-white' },
          { key: 'due_soon', label: 'Vencendo', count: counts.dueSoon, badge: 'bg-amber-500 text-white' },
          { key: 'up_to_date', label: 'Em Dia', count: counts.upToDate, badge: 'bg-emerald-500 text-white' },
          { key: 'favorite', label: 'Favoritas', count: counts.favorite },
        ].map((tab) => {
          const isSelected = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as FilterTab)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                isSelected
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-md text-[10px] ${
                  isSelected
                    ? 'bg-white/20 text-white'
                    : tab.badge || 'bg-slate-100 text-slate-600'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Room Horizontal Pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        <button
          onClick={() => setSelectedRoom('all')}
          className={`px-2.5 py-1 text-xs rounded-lg font-semibold shrink-0 transition-all cursor-pointer ${
            selectedRoom === 'all'
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Todos os cômodos
        </button>
        {(Object.keys(ROOMS) as RoomCategory[]).map((rKey) => {
          const isSel = selectedRoom === rKey;
          return (
            <button
              key={rKey}
              onClick={() => setSelectedRoom(rKey)}
              className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg font-semibold shrink-0 transition-all cursor-pointer ${
                isSel
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <RoomIcon room={rKey} className="w-3 h-3" />
              <span>{ROOMS[rKey].name}</span>
            </button>
          );
        })}
      </div>

      {/* Tasks List */}
      {filteredTasks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          {filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={onEditTask}
              onQuickStart={onQuickStart}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-3 my-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="font-extrabold text-slate-800 text-base">
            Nenhuma atividade encontrada
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchTerm || selectedRoom !== 'all' || activeTab !== 'all'
              ? 'Tente ajustar os filtros ou o termo de busca para visualizar suas tarefas.'
              : 'Você ainda não cadastrou tarefas. Comece adicionando suas atividades domésticas ou carregue nossa lista padrão com 15+ tarefas prontas!'}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            {tasks.length === 0 ? (
              <button
                onClick={resetToDefaults}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Carregar Tarefas Sugeridas
              </button>
            ) : (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setActiveTab('all');
                  setSelectedRoom('all');
                }}
                className="px-3.5 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Limpar Todos os Filtros
              </button>
            )}

            <button
              onClick={onAddTask}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Adicionar Nova Atividade
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
