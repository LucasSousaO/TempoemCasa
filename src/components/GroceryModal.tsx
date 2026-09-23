import React, { useState, useEffect } from 'react';
import { X, ShoppingBag, Check } from 'lucide-react';
import { GroceryCategory, GroceryItem, GroceryStatus } from '../types';

interface GroceryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Omit<GroceryItem, 'id' | 'updatedAt'>) => void;
  initialItem?: GroceryItem | null;
}

export const GROCERY_CATEGORIES: Record<GroceryCategory, { label: string; icon: string; bg: string; text: string }> = {
  limpeza: { label: 'Limpeza & Lavanderia', icon: '🧼', bg: 'bg-cyan-50', text: 'text-cyan-700' },
  mercearia: { label: 'Mercearia & Grãos', icon: '🥫', bg: 'bg-amber-50', text: 'text-amber-700' },
  hortifruti: { label: 'Hortifrúti', icon: '🍎', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  laticinios: { label: 'Laticínios & Ovos', icon: '🧀', bg: 'bg-yellow-50', text: 'text-yellow-700' },
  carnes: { label: 'Carnes & Peixes', icon: '🥩', bg: 'bg-rose-50', text: 'text-rose-700' },
  higiene: { label: 'Higiene Pessoal', icon: '🧴', bg: 'bg-blue-50', text: 'text-blue-700' },
  bebidas: { label: 'Bebidas', icon: '🧃', bg: 'bg-purple-50', text: 'text-purple-700' },
  padaria: { label: 'Padaria & Pães', icon: '🍞', bg: 'bg-orange-50', text: 'text-orange-700' },
  outros: { label: 'Outros Itens', icon: '📦', bg: 'bg-slate-50', text: 'text-slate-700' },
};

export const GroceryModal: React.FC<GroceryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialItem,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<GroceryCategory>('limpeza');
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState<GroceryItem['unit']>('un');
  const [estimatedPrice, setEstimatedPrice] = useState<string>('');
  const [status, setStatus] = useState<GroceryStatus>('need_to_buy');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialItem) {
      setName(initialItem.name);
      setCategory(initialItem.category);
      setQuantity(initialItem.quantity);
      setUnit(initialItem.unit);
      setEstimatedPrice(initialItem.estimatedPrice ? String(initialItem.estimatedPrice) : '');
      setStatus(initialItem.status);
      setNotes(initialItem.notes || '');
    } else {
      setName('');
      setCategory('limpeza');
      setQuantity(1);
      setUnit('un');
      setEstimatedPrice('');
      setStatus('need_to_buy');
      setNotes('');
    }
    setError(null);
  }, [initialItem, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Por favor, informe o nome do item.');
      return;
    }

    const priceNum = estimatedPrice ? parseFloat(estimatedPrice.replace(',', '.')) : undefined;

    onSave({
      name: name.trim(),
      category,
      quantity: Math.max(0.1, quantity),
      unit,
      estimatedPrice: priceNum && !isNaN(priceNum) ? priceNum : undefined,
      status,
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
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-slate-900">
              {initialItem ? 'Editar Item da Compra' : 'Adicionar ao Supermercado'}
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
              Nome do Item *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Detergente neutro, Arroz 5kg, Papel toalha..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
            />
          </div>

          {/* Categoria */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Categoria
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as GroceryCategory)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-800 bg-white"
            >
              {(Object.keys(GROCERY_CATEGORIES) as GroceryCategory[]).map((cat) => (
                <option key={cat} value={cat}>
                  {GROCERY_CATEGORIES[cat].icon} {GROCERY_CATEGORIES[cat].label}
                </option>
              ))}
            </select>
          </div>

          {/* Quantidade & Unidade */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Quantidade
              </label>
              <input
                type="number"
                step="any"
                min="0.1"
                value={quantity}
                onChange={(e) => setQuantity(parseFloat(e.target.value) || 1)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Unidade
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as GroceryItem['unit'])}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-800 bg-white"
              >
                <option value="un">un (unidade)</option>
                <option value="pct">pct (pacote)</option>
                <option value="kg">kg (quilos)</option>
                <option value="g">g (gramas)</option>
                <option value="l">l (litros)</option>
                <option value="cx">cx (caixa)</option>
                <option value="fardo">fardo</option>
              </select>
            </div>
          </div>

          {/* Preço Estimado */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Preço Estimado Unitário (R$ - Opcional)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                R$
              </span>
              <input
                type="text"
                value={estimatedPrice}
                onChange={(e) => setEstimatedPrice(e.target.value)}
                placeholder="0,00"
                className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800 text-xs"
              />
            </div>
          </div>

          {/* Status Inicial: Precisa Comprar vs Já Tenho */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Situação do Item
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setStatus('need_to_buy')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  status === 'need_to_buy'
                    ? 'border-amber-500 bg-amber-50 text-amber-950 font-bold ring-2 ring-amber-500/20'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="text-xs font-bold flex items-center gap-1.5 text-amber-700">
                  <span>🛒</span> Precisa Comprar
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">Entra na lista de compras</div>
              </button>

              <button
                type="button"
                onClick={() => setStatus('already_have')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  status === 'already_have'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold ring-2 ring-emerald-500/20'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="text-xs font-bold flex items-center gap-1.5 text-emerald-700">
                  <span>✅</span> Já Tem em Casa
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">Em estoque na despensa</div>
              </button>
            </div>
          </div>

          {/* Observações / Marca */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Observação / Marca Preferida (Opcional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Marca Y, comprar do tamanho grande..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs text-slate-800"
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
            className="flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-200 transition-all cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>{initialItem ? 'Salvar Item' : 'Adicionar Item'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
