import React, { useState, useMemo } from 'react';
import { 
  ShoppingBag, 
  Gift, 
  Plus, 
  Check, 
  Search, 
  Sparkles, 
  Trash2, 
  Edit3, 
  ExternalLink, 
  CheckCircle2, 
  RotateCcw,
  Clock,
  Layers,
  ShoppingCart,
  PackageCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useTaskContext } from '../context/TaskContext';
import { GroceryCategory, GroceryItem, GroceryStatus, WishlistItem, WishlistTerm } from '../types';
import { GROCERY_CATEGORIES } from './GroceryModal';
import { WISHLIST_TERMS } from './WishlistModal';
import { ROOMS } from '../utils/taskCalculations';
import { RoomIcon } from './RoomIcon';

interface ShoppingViewProps {
  onOpenAddGrocery: () => void;
  onEditGrocery: (item: GroceryItem) => void;
  onOpenAddWishlist: () => void;
  onEditWishlist: (item: WishlistItem) => void;
}

export const ShoppingView: React.FC<ShoppingViewProps> = ({
  onOpenAddGrocery,
  onEditGrocery,
  onOpenAddWishlist,
  onEditWishlist,
}) => {
  const { 
    groceryItems, 
    wishlistItems, 
    setGroceryItemStatus, 
    cycleGroceryStatus, 
    deleteGroceryItem, 
    clearPurchasedGrocery,
    toggleWishlistPurchased, 
    deleteWishlistItem,
    stats 
  } = useTaskContext();

  const [activeSubTab, setActiveSubTab] = useState<'grocery' | 'wishlist'>('grocery');

  // Supermarket filters
  const [grocerySearch, setGrocerySearch] = useState('');
  const [groceryFilter, setGroceryFilter] = useState<'all' | 'need_to_buy' | 'already_have' | 'in_cart'>('need_to_buy');
  const [groceryCategory, setGroceryCategory] = useState<GroceryCategory | 'all'>('all');

  // Wishlist filters
  const [wishlistSearch, setWishlistSearch] = useState('');
  const [wishlistTermFilter, setWishlistTermFilter] = useState<WishlistTerm | 'all' | 'purchased'>('all');

  // Format BRL Currency
  const formatBRL = (val?: number) => {
    if (val === undefined || isNaN(val)) return 'R$ 0,00';
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // Filtered grocery items
  const filteredGrocery = useMemo(() => {
    return groceryItems.filter((item) => {
      if (grocerySearch.trim()) {
        const query = grocerySearch.toLowerCase();
        const matchName = item.name.toLowerCase().includes(query);
        const matchNotes = item.notes?.toLowerCase().includes(query);
        if (!matchName && !matchNotes) return false;
      }

      if (groceryFilter === 'need_to_buy' && item.status !== 'need_to_buy' && item.status !== 'in_cart') {
        return false;
      }
      if (groceryFilter === 'in_cart' && item.status !== 'in_cart') {
        return false;
      }
      if (groceryFilter === 'already_have' && item.status !== 'already_have') {
        return false;
      }

      if (groceryCategory !== 'all' && item.category !== groceryCategory) {
        return false;
      }

      return true;
    });
  }, [groceryItems, grocerySearch, groceryFilter, groceryCategory]);

  // Filtered wishlist items
  const filteredWishlist = useMemo(() => {
    return wishlistItems.filter((item) => {
      if (wishlistSearch.trim()) {
        const query = wishlistSearch.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(query);
        const matchNotes = item.notes?.toLowerCase().includes(query);
        if (!matchTitle && !matchNotes) return false;
      }

      if (wishlistTermFilter === 'purchased') {
        return item.isPurchased;
      }

      if (wishlistTermFilter !== 'all') {
        return item.term === wishlistTermFilter && !item.isPurchased;
      }

      // 'all' excludes purchased from top view or puts them at bottom
      return true;
    }).sort((a, b) => {
      // Unpurchased first, then short -> medium -> long
      if (a.isPurchased !== b.isPurchased) return a.isPurchased ? 1 : -1;
      const termWeights = { curto: 1, medio: 2, longo: 3 };
      return (termWeights[a.term] || 2) - (termWeights[b.term] || 2);
    });
  }, [wishlistItems, wishlistSearch, wishlistTermFilter]);

  const inCartCount = groceryItems.filter((i) => i.status === 'in_cart').length;

  return (
    <div className="space-y-4 pb-8">
      {/* Top Main Section Switcher */}
      <div className="bg-slate-200/80 p-1 rounded-2xl flex items-center gap-1">
        <button
          onClick={() => setActiveSubTab('grocery')}
          className={`flex-1 py-2.5 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'grocery'
              ? 'bg-white text-indigo-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ShoppingCart className="w-4 h-4 text-indigo-600" />
          <span>Supermercado & Despensa</span>
          {stats.groceryNeededCount > 0 && (
            <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
              {stats.groceryNeededCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('wishlist')}
          className={`flex-1 py-2.5 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'wishlist'
              ? 'bg-white text-purple-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Gift className="w-4 h-4 text-purple-600" />
          <span>Desejos da Casa</span>
          <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
            {wishlistItems.filter((w) => !w.isPurchased).length}
          </span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* SUBTAB 1: SUPERMERCADO & DESPENSA                        */}
      {/* ======================================================== */}
      {activeSubTab === 'grocery' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Header & Quick Action */}
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Lista de Supermercado
              </h1>
              <p className="text-xs text-slate-500">
                Saiba o que comprar na próxima ida ao mercado e o que já tem em casa
              </p>
            </div>

            <button
              onClick={onOpenAddGrocery}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs rounded-2xl shadow-md shadow-indigo-200 transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Novo Item</span>
            </button>
          </div>

          {/* Quick Summary Banner */}
          <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Total Estimado
                </span>
                <span className="text-xl font-black text-slate-900 font-mono">
                  {formatBRL(stats.groceryCartTotal)}
                </span>
              </div>
              <div className="h-8 w-px bg-slate-200" />
              <div className="text-xs">
                <span className="font-bold text-amber-600">{stats.groceryNeededCount}</span> a comprar •{' '}
                <span className="font-bold text-emerald-600">{stats.groceryHaveCount}</span> em estoque
              </div>
            </div>

            {inCartCount > 0 && (
              <button
                onClick={clearPurchasedGrocery}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <PackageCheck className="w-4 h-4" />
                <span>Guardar {inCartCount} do Carrinho</span>
              </button>
            )}
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={grocerySearch}
              onChange={(e) => setGrocerySearch(e.target.value)}
              placeholder="Buscar mantimento, produto de limpeza..."
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-white rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium placeholder-slate-400"
            />
          </div>

          {/* Filter Status Tabs: O Que Comprar vs Já Tenho */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {[
              { key: 'need_to_buy', label: '🛒 A Comprar', count: stats.groceryNeededCount + inCartCount },
              { key: 'already_have', label: '✅ Já Tem em Casa', count: stats.groceryHaveCount },
              { key: 'all', label: 'Todos os Itens', count: groceryItems.length },
            ].map((tab) => {
              const isSelected = groceryFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setGroceryFilter(tab.key as typeof groceryFilter)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`px-1.5 py-0.2 rounded-md text-[10px] ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Category Filter Pills */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => setGroceryCategory('all')}
              className={`px-2.5 py-1 text-xs rounded-lg font-semibold shrink-0 transition-all cursor-pointer ${
                groceryCategory === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Todas Categorias
            </button>
            {(Object.keys(GROCERY_CATEGORIES) as GroceryCategory[]).map((cat) => {
              const isSel = groceryCategory === cat;
              const info = GROCERY_CATEGORIES[cat];
              return (
                <button
                  key={cat}
                  onClick={() => setGroceryCategory(cat)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg font-semibold shrink-0 transition-all cursor-pointer ${
                    isSel
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>{info.icon}</span>
                  <span>{info.label.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>

          {/* Grocery Items List */}
          {filteredGrocery.length > 0 ? (
            <div className="space-y-2 pt-1">
              {filteredGrocery.map((item) => {
                const catInfo = GROCERY_CATEGORIES[item.category] || GROCERY_CATEGORIES.outros;
                const isNeedToBuy = item.status === 'need_to_buy';
                const isInCart = item.status === 'in_cart';
                const isAlreadyHave = item.status === 'already_have';

                return (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-2xl border transition-all duration-150 flex items-center justify-between gap-3 ${
                      isInCart
                        ? 'bg-indigo-50/60 border-indigo-200'
                        : isAlreadyHave
                        ? 'bg-emerald-50/40 border-emerald-200'
                        : 'bg-white border-slate-200/80 hover:border-slate-300'
                    }`}
                  >
                    {/* Left: Quick Status Switcher Button */}
                    <button
                      onClick={() => cycleGroceryStatus(item.id)}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all cursor-pointer active:scale-90 ${
                        isInCart
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : isAlreadyHave
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                      }`}
                      title="Clique para alternar: Falta comprar → No carrinho → Já tenho"
                    >
                      {isInCart ? (
                        <ShoppingCart className="w-4 h-4" />
                      ) : isAlreadyHave ? (
                        <Check className="w-4 h-4 stroke-[3]" />
                      ) : (
                        <span className="text-xs font-black">Falta</span>
                      )}
                    </button>

                    {/* Middle: Name, Category, Notes */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${catInfo.bg} ${catInfo.text}`}>
                          {catInfo.icon} {catInfo.label.split('&')[0]}
                        </span>
                        {item.estimatedPrice ? (
                          <span className="text-xs font-bold text-slate-700">
                            {formatBRL(item.estimatedPrice * item.quantity)}
                          </span>
                        ) : null}
                      </div>

                      <div className={`font-bold text-sm text-slate-900 mt-0.5 truncate ${isAlreadyHave ? 'line-through text-slate-400' : ''}`}>
                        {item.name}
                      </div>

                      <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                        <span className="font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded">
                          {item.quantity} {item.unit}
                        </span>
                        {item.notes && <span className="truncate italic">"{item.notes}"</span>}
                      </div>
                    </div>

                    {/* Right: Quick Status Pill & Action menu */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* One click direct status buttons */}
                      {isNeedToBuy && (
                        <button
                          onClick={() => setGroceryItemStatus(item.id, 'in_cart')}
                          className="px-2 py-1 text-[11px] font-bold text-indigo-700 bg-indigo-100 hover:bg-indigo-200 rounded-lg transition-colors cursor-pointer"
                        >
                          + Carrinho
                        </button>
                      )}

                      <button
                        onClick={() => onEditGrocery(item)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => deleteGroceryItem(item.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-3 my-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-slate-800 text-base">
                Nenhum item encontrado
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Adicione produtos que você costuma comprar ou use a busca para encontrar o item.
              </p>
              <button
                onClick={onOpenAddGrocery}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                Adicionar Produto
              </button>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* SUBTAB 2: LISTA DE DESEJOS DA CASA (PRIORIDADES)         */}
      {/* ======================================================== */}
      {activeSubTab === 'wishlist' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Header & Quick Action */}
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Lista de Desejos da Casa
              </h1>
              <p className="text-xs text-slate-500">
                Planejamento de compras e melhorias com prioridade de gasto (curto, médio e longo prazo)
              </p>
            </div>

            <button
              onClick={onOpenAddWishlist}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-bold text-xs rounded-2xl shadow-md shadow-purple-200 transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Novo Desejo</span>
            </button>
          </div>

          {/* 3 Priority Term Summary Cards */}
          <div className="grid grid-cols-3 gap-2.5">
            {/* Curto Prazo */}
            <div 
              onClick={() => setWishlistTermFilter('curto')}
              className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                wishlistTermFilter === 'curto' ? 'border-rose-500 bg-rose-50 ring-2 ring-rose-500/20' : 'bg-white border-slate-200 hover:border-rose-200'
              }`}
            >
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-rose-700">
                Curto Prazo
              </div>
              <div className="text-sm font-black text-slate-900 font-mono mt-0.5">
                {formatBRL(stats.wishlistTotalCurto)}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                Urgente / Imediato
              </div>
            </div>

            {/* Médio Prazo */}
            <div 
              onClick={() => setWishlistTermFilter('medio')}
              className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                wishlistTermFilter === 'medio' ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-500/20' : 'bg-white border-slate-200 hover:border-amber-200'
              }`}
            >
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700">
                Médio Prazo
              </div>
              <div className="text-sm font-black text-slate-900 font-mono mt-0.5">
                {formatBRL(stats.wishlistTotalMedio)}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                Próximos 1 a 3 meses
              </div>
            </div>

            {/* Longo Prazo */}
            <div 
              onClick={() => setWishlistTermFilter('longo')}
              className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                wishlistTermFilter === 'longo' ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-500/20' : 'bg-white border-slate-200 hover:border-indigo-200'
              }`}
            >
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700">
                Longo Prazo
              </div>
              <div className="text-sm font-black text-slate-900 font-mono mt-0.5">
                {formatBRL(stats.wishlistTotalLongo)}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                Planejamento futuro
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={wishlistSearch}
              onChange={(e) => setWishlistSearch(e.target.value)}
              placeholder="Buscar item da casa, eletrônico, móvel..."
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-white rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium placeholder-slate-400"
            />
          </div>

          {/* Term Filter Tabs */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {[
              { key: 'all', label: 'Todos' },
              { key: 'curto', label: '🔥 Curto Prazo' },
              { key: 'medio', label: '⏳ Médio Prazo' },
              { key: 'longo', label: '🎯 Longo Prazo' },
              { key: 'purchased', label: '🎉 Comprados' },
            ].map((tab) => {
              const isSelected = wishlistTermFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setWishlistTermFilter(tab.key as typeof wishlistTermFilter)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-purple-900 text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Wishlist Items Grid */}
          {filteredWishlist.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {filteredWishlist.map((item) => {
                const termInfo = WISHLIST_TERMS[item.term] || WISHLIST_TERMS.medio;
                const roomInfo = item.room ? ROOMS[item.room] : ROOMS.geral;

                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-3xl border transition-all duration-200 bg-white ${
                      item.isPurchased
                        ? 'border-emerald-200 bg-emerald-50/20 opacity-80'
                        : 'border-slate-200/80 hover:border-slate-300 shadow-xs'
                    }`}
                  >
                    {/* Top Row: Term Badge & Room & Actions */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border ${termInfo.badge}`}>
                          {item.term === 'curto' ? 'Curto Prazo' : item.term === 'medio' ? 'Médio Prazo' : 'Longo Prazo'}
                        </span>
                        {item.room && (
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${roomInfo.bgLight} ${roomInfo.colorText}`}>
                            <RoomIcon room={item.room} className="w-3 h-3" />
                            {roomInfo.name}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onEditWishlist(item)}
                          className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteWishlistItem(item.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className={`font-bold text-slate-900 text-base leading-snug mb-1 ${item.isPurchased ? 'line-through text-slate-500' : ''}`}>
                      {item.title}
                    </h3>

                    {/* Notes & Link */}
                    {item.notes && (
                      <p className="text-xs text-slate-500 mb-3 line-clamp-2 leading-relaxed">
                        {item.notes}
                      </p>
                    )}

                    {/* Price & Link & Purchase Button */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 mt-2">
                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold block">Valor Previsto</span>
                        <span className="text-base font-black text-purple-700 font-mono">
                          {formatBRL(item.estimatedCost)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {item.link && (
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                            title="Abrir link do produto"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}

                        <button
                          onClick={() => {
                            toggleWishlistPurchased(item.id);
                            if (!item.isPurchased) {
                              confetti({
                                particleCount: 70,
                                spread: 60,
                                origin: { y: 0.6 },
                              });
                            }
                          }}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer active:scale-95 ${
                            item.isPurchased
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-purple-100 hover:bg-purple-200 text-purple-800'
                          }`}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{item.isPurchased ? 'Comprado! 🎉' : 'Marcar Comprado'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-3 my-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
                <Gift className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-slate-800 text-base">
                Nenhum desejo nessa categoria
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Cadastre itens que a casa precisa para planejar seu orçamento entre curto, médio e longo prazo.
              </p>
              <button
                onClick={onOpenAddWishlist}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-colors cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                Cadastrar Desejo
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
