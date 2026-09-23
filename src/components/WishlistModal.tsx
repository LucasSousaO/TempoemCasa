import React, { useState, useEffect } from 'react';
import { X, Gift, Check, Clock, AlertCircle } from 'lucide-react';
import { WishlistItem, WishlistTerm, RoomCategory } from '../types';
import { ROOMS } from '../utils/taskCalculations';
import { RoomIcon } from './RoomIcon';

interface WishlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Omit<WishlistItem, 'id' | 'createdAt' | 'isPurchased' | 'purchasedAt'>) => void;
  initialItem?: WishlistItem | null;
}

export const WISHLIST_TERMS: Record<WishlistTerm, { label: string; sub: string; badge: string; border: string }> = {
  curto: {
    label: 'Curto Prazo (Urgente)',
    sub: 'Próximos dias ou semanas',
    badge: 'bg-rose-50 text-rose-700 border-rose-200',
    border: 'border-rose-500 bg-rose-50/50',
  },
  medio: {
    label: 'Médio Prazo',
    sub: 'Próximos 1 a 3 meses',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    border: 'border-amber-500 bg-amber-50/50',
  },
  longo: {
    label: 'Longo Prazo (Planejamento)',
    sub: '6 meses a 1 ano+',
    badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    border: 'border-indigo-500 bg-indigo-50/50',
  },
};

export const WishlistModal: React.FC<WishlistModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialItem,
}) => {
  const [title, setTitle] = useState('');
  const [estimatedCost, setEstimatedCost] = useState('');
  const [term, setTerm] = useState<WishlistTerm>('medio');
  const [room, setRoom] = useState<RoomCategory>('geral');
  const [link, setLink] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialItem) {
      setTitle(initialItem.title);
      setEstimatedCost(initialItem.estimatedCost ? String(initialItem.estimatedCost) : '');
      setTerm(initialItem.term);
      setRoom(initialItem.room || 'geral');
      setLink(initialItem.link || '');
      setNotes(initialItem.notes || '');
    } else {
      setTitle('');
      setEstimatedCost('');
      setTerm('curto');
      setRoom('geral');
      setLink('');
      setNotes('');
    }
    setError(null);
  }, [initialItem, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Por favor, informe o item desejado.');
      return;
    }

    const costNum = estimatedCost ? parseFloat(estimatedCost.replace(',', '.')) : 0;

    onSave({
      title: title.trim(),
      estimatedCost: isNaN(costNum) ? 0 : costNum,
      term,
      room,
      link: link.trim() || undefined,
      notes: notes.trim() || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
              <Gift className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-slate-900">
              {initialItem ? 'Editar Desejo da Casa' : 'Novo Item na Lista de Desejos'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto px-6 py-5 space-y-4 flex-1 text-sm">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium">
              {error}
            </div>
          )}

          {/* Nome do Item */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Item que precisa ser comprado *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Robô aspirador, Jogo de panelas, Sofá novo..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium text-slate-800"
            />
          </div>

          {/* Prioridade do Gasto (Curto, Médio, Longo Prazo) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-purple-600" />
              Prioridade do Gasto
            </label>
            <div className="space-y-2">
              {(Object.keys(WISHLIST_TERMS) as WishlistTerm[]).map((tKey) => {
                const isSelected = term === tKey;
                const info = WISHLIST_TERMS[tKey];
                return (
                  <button
                    key={tKey}
                    type="button"
                    onClick={() => setTerm(tKey)}
                    className={`w-full p-3 rounded-2xl border text-left transition-all flex items-center justify-between ${
                      isSelected
                        ? `${info.border} font-bold ring-2 ring-purple-500/20`
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900">{info.label}</div>
                      <div className="text-[11px] text-slate-500">{info.sub}</div>
                    </div>
                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Valor Estimado */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Valor Estimado (R$)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                R$
              </span>
              <input
                type="text"
                value={estimatedCost}
                onChange={(e) => setEstimatedCost(e.target.value)}
                placeholder="Ex: 350,00"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 font-bold text-slate-900 text-sm"
              />
            </div>
          </div>

          {/* Cômodo Relacionado */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Cômodo / Destino
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {(Object.keys(ROOMS) as RoomCategory[]).map((rKey) => {
                const isSelected = room === rKey;
                return (
                  <button
                    key={rKey}
                    type="button"
                    onClick={() => setRoom(rKey)}
                    className={`flex items-center gap-1.5 p-2 rounded-xl border text-xs font-medium transition-all ${
                      isSelected
                        ? 'border-purple-600 bg-purple-50 text-purple-900 font-bold'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <RoomIcon room={rKey} className="w-3.5 h-3.5 text-purple-600" />
                    <span className="truncate">{ROOMS[rKey].name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Link da Loja / Referência */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Link de Referência / Loja (Opcional)
            </label>
            <input
              type="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs text-slate-800"
            />
          </div>

          {/* Motivo ou Detalhes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Observações / Dimensões / Modelo (Opcional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Medida máxima 2,10m, cor cinza ou bege..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs text-slate-800"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md shadow-purple-200 transition-all cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>{initialItem ? 'Salvar Desejo' : 'Adicionar à Lista'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
