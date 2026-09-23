import React, { useState } from 'react';
import { 
  Users, 
  X, 
  Copy, 
  Check, 
  LogOut, 
  LogIn, 
  Share2, 
  ShieldCheck, 
  Home, 
  Sparkles, 
  Plus, 
  Crown,
  Zap,
  ArrowRight
} from 'lucide-react';
import { useTaskContext } from '../context/TaskContext';
import { getLevelInfo } from '../utils/gamification';

interface FamilySyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FamilySyncModal: React.FC<FamilySyncModalProps> = ({ isOpen, onClose }) => {
  const { 
    currentUser, 
    userProfile, 
    household, 
    householdMembers, 
    loginWithGoogle, 
    logout, 
    createHousehold, 
    joinHousehold,
    isCloudSyncing 
  } = useTaskContext();

  const [inputCode, setInputCode] = useState('');
  const [newHouseName, setNewHouseName] = useState('');
  const [isCreatingHouse, setIsCreatingHouse] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const currentPoints = userProfile?.points || 0;
  const levelInfo = getLevelInfo(currentPoints);

  const handleCopyCode = () => {
    if (!household?.inviteCode) return;
    navigator.clipboard.writeText(household.inviteCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleShareInvite = () => {
    if (!household?.inviteCode) return;
    const shareText = `Venha participar da nossa gestão doméstica no app "A Dona de Casa"! Use o código de família: ${household.inviteCode}`;
    if (navigator.share) {
      navigator.share({
        title: 'Convite para o Lar - A Dona de Casa',
        text: shareText,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareText);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleJoinHousehold = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) return;

    setIsLoading(true);
    setStatusMsg(null);
    const res = await joinHousehold(inputCode);
    setIsLoading(false);

    if (res.success) {
      setStatusMsg({ type: 'success', text: res.message });
      setInputCode('');
    } else {
      setStatusMsg({ type: 'error', text: res.message });
    }
  };

  const handleCreateHousehold = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHouseName.trim()) return;

    setIsLoading(true);
    setStatusMsg(null);
    try {
      const code = await createHousehold(newHouseName);
      setIsLoading(false);
      setIsCreatingHouse(false);
      setNewHouseName('');
      setStatusMsg({ type: 'success', text: `Novo lar criado com sucesso! Código: ${code}` });
    } catch (err) {
      setIsLoading(false);
      setStatusMsg({ type: 'error', text: 'Não foi possível criar o lar.' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Família & Sincronização</h2>
              <p className="text-[11px] text-slate-400">
                {currentUser ? 'Conectado à nuvem' : 'Modo local (sem login)'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto px-6 py-5 space-y-5 flex-1 text-sm">
          {statusMsg && (
            <div className={`p-3 rounded-2xl text-xs font-semibold flex items-center gap-2 ${
              statusMsg.type === 'success' 
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}>
              <span>{statusMsg.type === 'success' ? '✅' : '⚠️'}</span>
              <span>{statusMsg.text}</span>
            </div>
          )}

          {/* User Profile Card */}
          {currentUser ? (
            <div className="p-4 rounded-3xl bg-linear-to-br from-indigo-50/70 via-purple-50/50 to-pink-50/40 border border-purple-100 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || ''}
                    className="w-12 h-12 rounded-2xl object-cover border-2 border-white shadow-xs shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-bold text-base shadow-xs shrink-0">
                    {currentUser.displayName ? currentUser.displayName[0].toUpperCase() : 'U'}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="font-black text-slate-900 truncate">
                    {currentUser.displayName || 'Membro da Família'}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">{currentUser.email}</div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                      {levelInfo.currentLevel.badgeIcon} {levelInfo.currentLevel.title}
                    </span>
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full font-mono flex items-center gap-1">
                      <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                      {currentPoints} XP
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={logout}
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-white rounded-xl transition-all"
                title="Sair da conta"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="p-5 rounded-3xl bg-linear-to-br from-indigo-500 via-purple-600 to-pink-500 text-white text-center space-y-3 shadow-lg shadow-purple-200">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center mx-auto text-amber-300">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="font-black text-base leading-snug">
                Conecte seu Lar e Compartilhe Tarefas
              </h3>
              <p className="text-xs text-purple-100 leading-relaxed">
                Faça login para salvar suas tarefas na nuvem, compartilhar com seu cônjuge/familiares e disputar o ranking de dedicação em tempo real!
              </p>
              <button
                onClick={loginWithGoogle}
                className="w-full py-3 px-4 bg-white text-slate-900 font-extrabold text-xs rounded-2xl shadow-md hover:bg-slate-50 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogIn className="w-4 h-4 text-indigo-600" />
                <span>Entrar com Conta Google</span>
              </button>
            </div>
          )}

          {/* Household Info & Invite Code */}
          {currentUser && household && (
            <div className="p-4 rounded-3xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Home className="w-4 h-4 text-purple-600" />
                  <span className="font-extrabold text-xs text-slate-800 uppercase tracking-wider">
                    {household.name}
                  </span>
                </div>
                {isCloudSyncing && (
                  <span className="text-[10px] text-indigo-600 font-semibold flex items-center gap-1 animate-pulse">
                    <span>Sincronizando...</span>
                  </span>
                )}
              </div>

              {/* Invite Code Box */}
              <div className="p-3 bg-white rounded-2xl border border-slate-200 flex items-center justify-between gap-2">
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Código da Família</div>
                  <div className="text-lg font-black text-purple-700 tracking-wider font-mono">
                    {household.inviteCode}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={handleCopyCode}
                    className="flex items-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode ? 'Copiado!' : 'Copiar'}</span>
                  </button>

                  <button
                    onClick={handleShareInvite}
                    className="p-2 bg-purple-100 hover:bg-purple-200 text-purple-800 rounded-xl transition-all cursor-pointer"
                    title="Compartilhar convite"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 leading-normal">
                Envie esse código para quem mora com você. Ao entrar com o código, ambos verão e atualizarão as mesmas tarefas e lista de compras!
              </p>

              {/* Members in household */}
              <div className="pt-2 border-t border-slate-200/60">
                <div className="text-xs font-bold text-slate-700 mb-2 flex items-center justify-between">
                  <span>Membros Conectados ({householdMembers.length || 1})</span>
                </div>
                <div className="space-y-2">
                  {(householdMembers.length > 0
                    ? householdMembers
                    : [
                        {
                          uid: currentUser.uid,
                          displayName: currentUser.displayName || 'Você',
                          photoURL: currentUser.photoURL || undefined,
                          role: 'owner' as const,
                          points: currentPoints,
                          level: levelInfo.currentLevel.level,
                          completedTasksCount: userProfile?.completedTasksCount || 0,
                          totalMinutesSpent: userProfile?.totalMinutesSpent || 0,
                          joinedAt: new Date().toISOString(),
                        },
                      ]
                  ).map((m) => (
                    <div
                      key={m.uid}
                      className="p-2.5 rounded-2xl bg-white border border-slate-100 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {m.photoURL ? (
                          <img src={m.photoURL} alt="" className="w-8 h-8 rounded-xl object-cover shrink-0" />
                        ) : (
                          <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs shrink-0">
                            {m.displayName ? m.displayName[0].toUpperCase() : 'M'}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="font-bold text-xs text-slate-900 truncate flex items-center gap-1">
                            <span>{m.displayName}</span>
                            {m.role === 'owner' && <Crown className="w-3 h-3 text-amber-500" />}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Nível {m.level || 1} • {m.completedTasksCount || 0} tarefas
                          </div>
                        </div>
                      </div>

                      <span className="font-mono text-xs font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg shrink-0">
                        {m.points || 0} XP
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Join Household Section */}
          {currentUser && (
            <div className="p-4 rounded-3xl bg-slate-50 border border-slate-200 space-y-3">
              <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                Entrar em Outro Lar
              </h4>
              <form onSubmit={handleJoinHousehold} className="flex gap-2">
                <input
                  type="text"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                  placeholder="Ex: CASA-7A9B"
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold text-xs text-slate-900 uppercase focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                />
                <button
                  type="submit"
                  disabled={isLoading || !inputCode.trim()}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1 shrink-0"
                >
                  <span>Entrar</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          )}

          {/* Create Household Section */}
          {currentUser && (
            <div>
              {!isCreatingHouse ? (
                <button
                  onClick={() => setIsCreatingHouse(true)}
                  className="w-full py-2.5 px-3 border border-dashed border-slate-300 hover:border-purple-400 text-slate-600 hover:text-purple-700 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Criar Outro Lar Separado</span>
                </button>
              ) : (
                <form onSubmit={handleCreateHousehold} className="p-4 rounded-3xl bg-slate-50 border border-slate-200 space-y-2">
                  <label className="text-xs font-bold text-slate-700">Nome do Novo Lar</label>
                  <input
                    type="text"
                    required
                    value={newHouseName}
                    onChange={(e) => setNewHouseName(e.target.value)}
                    placeholder="Ex: Casa de Praia, Nosso Lar..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsCreatingHouse(false)}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-500"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="px-4 py-1.5 bg-purple-600 text-white text-xs font-bold rounded-xl shadow-xs"
                    >
                      Criar Lar
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
