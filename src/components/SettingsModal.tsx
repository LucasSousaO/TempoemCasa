import React, { useRef } from 'react';
import { 
  X, 
  Volume2, 
  VolumeX, 
  Download, 
  Upload, 
  RotateCcw, 
  Trash2, 
  Info, 
  Sparkles,
  Smartphone,
  Monitor
} from 'lucide-react';
import { useTaskContext } from '../context/TaskContext';
import { sounds } from '../utils/soundEffects';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { 
    tasks, 
    logs, 
    groceryItems,
    wishlistItems,
    preferences, 
    updatePreferences, 
    resetToDefaults, 
    clearAllData, 
    importData 
  } = useTaskContext();

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleExport = () => {
    const data = {
      exportDate: new Date().toISOString(),
      version: '2.0',
      appName: 'A dona da casa',
      tasks,
      logs,
      groceryItems,
      wishlistItems,
    };
    const jsonStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonStr);
    downloadAnchor.setAttribute('download', `a_dona_da_casa_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    sounds.playSelect();
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (importData(parsed)) {
          sounds.playSuccess();
          alert('Dados importados com sucesso!');
          onClose();
        } else {
          alert('Formato de arquivo inválido.');
        }
      } catch {
        alert('Erro ao ler o arquivo JSON.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-lg font-bold text-slate-900">
            Ajustes & Preferências
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto text-sm">
          {/* Audio */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                {preferences.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </div>
              <div>
                <div className="font-bold text-slate-800 text-xs">Efeitos Sonoros</div>
                <div className="text-[11px] text-slate-500">Sons de roleta, clique e vitória</div>
              </div>
            </div>
            <button
              onClick={() => updatePreferences({ soundEnabled: !preferences.soundEnabled })}
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                preferences.soundEnabled ? 'bg-indigo-600' : 'bg-slate-300'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform absolute top-0.5 ${
                  preferences.soundEnabled ? 'left-6.5' : 'left-0.5'
                }`}
              />
            </button>
          </div>

          {/* View Mode (Mobile Frame vs Responsive) */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                {preferences.viewMode === 'mobile' ? <Smartphone className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
              </div>
              <div>
                <div className="font-bold text-slate-800 text-xs">Visualização App Mobile</div>
                <div className="text-[11px] text-slate-500">
                  {preferences.viewMode === 'mobile' ? 'Formato de celular (iOS/Android)' : 'Expandido tela cheia'}
                </div>
              </div>
            </div>
            <button
              onClick={() =>
                updatePreferences({
                  viewMode: preferences.viewMode === 'mobile' ? 'responsive' : 'mobile',
                })
              }
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                preferences.viewMode === 'mobile' ? 'bg-indigo-600' : 'bg-slate-300'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform absolute top-0.5 ${
                  preferences.viewMode === 'mobile' ? 'left-6.5' : 'left-0.5'
                }`}
              />
            </button>
          </div>

          {/* Backup / Export / Import */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">
              Dados & Backup
            </span>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleExport}
                className="flex items-center justify-center gap-2 p-3 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 font-bold text-xs text-slate-700 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4 text-indigo-600" />
                <span>Exportar Backup</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-2 p-3 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 font-bold text-xs text-slate-700 transition-colors cursor-pointer"
              >
                <Upload className="w-4 h-4 text-indigo-600" />
                <span>Importar JSON</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileImport}
                className="hidden"
              />
            </div>
          </div>

          {/* Reset Actions */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">
              Ações de Restaurar
            </span>

            <button
              onClick={() => {
                if (window.confirm('Deseja restaurar as tarefas domésticas padrão recomendadas?')) {
                  resetToDefaults();
                  onClose();
                }
              }}
              className="w-full flex items-center justify-between p-3 rounded-2xl border border-indigo-100 bg-indigo-50/50 hover:bg-indigo-50 text-indigo-800 text-xs font-bold transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-indigo-600" />
                <span>Restaurar Tarefas Padrão</span>
              </div>
              <span className="text-[10px] bg-indigo-200/60 px-2 py-0.5 rounded-full">18 tarefas</span>
            </button>

            <button
              onClick={() => {
                if (window.confirm('Tem certeza de que deseja apagar todas as tarefas e histórico?')) {
                  clearAllData();
                  onClose();
                }
              }}
              className="w-full flex items-center gap-2 p-3 rounded-2xl border border-rose-100 bg-rose-50/50 hover:bg-rose-50 text-rose-700 text-xs font-bold transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4 text-rose-500" />
              <span>Limpar Todos os Dados</span>
            </button>
          </div>

          {/* How It Works Info */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs text-slate-600 space-y-1.5">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              Como vencer a procrastinação doméstica?
            </div>
            <p className="text-[11px] leading-relaxed">
              Em vez de encarar uma faxina pesada inteira, tire blocos de <strong>10 a 20 minutos</strong>. O app escolhe a tarefa ideal para o momento, você executa com cronômetro focado e mantém o lar sempre agradável e saudável!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
