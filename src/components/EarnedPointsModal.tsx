import React, { useEffect } from 'react';
import { Sparkles, Trophy, X, Zap, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useTaskContext } from '../context/TaskContext';
import { getLevelInfo } from '../utils/gamification';

export const EarnedPointsModal: React.FC = () => {
  const { earnedPointsPopup, closeEarnedPointsPopup, userProfile } = useTaskContext();

  useEffect(() => {
    if (earnedPointsPopup) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.5 },
      });
    }
  }, [earnedPointsPopup]);

  if (!earnedPointsPopup) return null;

  const currentPoints = userProfile?.points || 0;
  const levelData = getLevelInfo(currentPoints);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 text-center relative overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow decoration */}
        <div className="absolute -top-16 -left-16 w-36 h-36 bg-amber-300/30 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-36 h-36 bg-purple-400/30 rounded-full blur-2xl pointer-events-none" />

        <button
          onClick={closeEarnedPointsPopup}
          className="absolute top-4 right-4 w-8 h-8 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon & Heading */}
        <div className="w-16 h-16 rounded-3xl bg-linear-to-tr from-amber-400 to-amber-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-amber-200 mb-3 animate-bounce">
          <Trophy className="w-8 h-8" />
        </div>

        <h3 className="text-xl font-black text-slate-900 tracking-tight">
          Missão Cumprida!
        </h3>
        <p className="text-xs text-slate-500 font-medium mt-0.5 line-clamp-1">
          {earnedPointsPopup.taskTitle}
        </p>

        {/* XP Badge */}
        <div className="my-4 inline-flex items-center gap-2 px-5 py-2 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900">
          <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
          <span className="text-2xl font-black tracking-tight font-mono">
            +{earnedPointsPopup.points} XP
          </span>
        </div>

        {/* Points breakdown */}
        <div className="bg-slate-50 rounded-2xl p-3 text-left space-y-1.5 mb-4 text-xs">
          {earnedPointsPopup.breakdown.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between text-slate-600">
              <span className="font-medium truncate">{item.label}</span>
              <span className="font-bold text-amber-600 font-mono">+{item.points} XP</span>
            </div>
          ))}
        </div>

        {/* Level Progress */}
        <div className="bg-purple-50/60 border border-purple-100 rounded-2xl p-3 text-left mb-4">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-bold text-purple-900 flex items-center gap-1">
              <span>{levelData.currentLevel.badgeIcon}</span>
              <span>{levelData.currentLevel.title}</span>
            </span>
            <span className="font-mono text-purple-700 font-extrabold text-[11px]">
              {currentPoints} XP
            </span>
          </div>

          <div className="w-full h-2 bg-purple-200/50 rounded-full overflow-hidden">
            <div 
              className="h-full bg-linear-to-r from-purple-500 to-indigo-600 rounded-full transition-all duration-500"
              style={{ width: `${levelData.progressPercent}%` }}
            />
          </div>

          {levelData.nextLevel && (
            <div className="text-[10px] text-purple-600 mt-1 flex justify-between font-medium">
              <span>Nível {levelData.currentLevel.level}</span>
              <span>Faltam {levelData.nextLevel.minPoints - currentPoints} XP para {levelData.nextLevel.title}</span>
            </div>
          )}
        </div>

        <button
          onClick={closeEarnedPointsPopup}
          className="w-full py-3 bg-linear-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-md shadow-indigo-200 hover:opacity-95 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <span>Continuar Mandando Bem!</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
