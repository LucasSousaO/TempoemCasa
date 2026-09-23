import React, { useState, useEffect } from 'react';
import { X, Play, Pause, CheckCircle2, Plus, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { DomesticTask } from '../types';
import { ROOMS } from '../utils/taskCalculations';
import { RoomIcon } from './RoomIcon';
import { sounds } from '../utils/soundEffects';

interface ActiveTimerModalProps {
  task: DomesticTask;
  onClose: () => void;
  onComplete: (taskId: string, actualMinutes: number) => void;
}

export const ActiveTimerModal: React.FC<ActiveTimerModalProps> = ({
  task,
  onClose,
  onComplete,
}) => {
  const initialSeconds = task.estimatedMinutes * 60;
  const [totalSeconds, setTotalSeconds] = useState(initialSeconds);
  const [remainingSeconds, setRemainingSeconds] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(true);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const roomMeta = ROOMS[task.room] || ROOMS.geral;

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning && remainingSeconds > 0) {
      interval = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            sounds.playTimerEnd();
            return 0;
          }
          return prev - 1;
        });
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, remainingSeconds]);

  const toggleTimer = () => {
    setIsRunning(!isRunning);
    sounds.playTick();
  };

  const handleAddFiveMinutes = () => {
    setTotalSeconds((prev) => prev + 300);
    setRemainingSeconds((prev) => prev + 300);
    sounds.playSelect();
  };

  const handleFinish = () => {
    const minutesSpent = Math.max(1, Math.round(elapsedSeconds / 60));
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
    onComplete(task.id, minutesSpent);
    onClose();
  };

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  
  const progressRatio = Math.max(0, Math.min(1, 1 - remainingSeconds / totalSeconds));
  const circleCircumference = 2 * Math.PI * 110;
  const strokeDashoffset = circleCircumference * (1 - progressRatio);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 sm:p-8 flex flex-col items-center relative overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Room Header */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-3 bg-indigo-50 text-indigo-700">
          <RoomIcon room={task.room} className="w-3.5 h-3.5" />
          <span>{roomMeta.name}</span>
        </div>

        {/* Title */}
        <h2 className="text-xl font-extrabold text-slate-800 text-center mb-1 leading-snug">
          {task.title}
        </h2>
        {task.description && (
          <p className="text-xs text-slate-500 text-center max-w-xs mb-6">
            {task.description}
          </p>
        )}

        {/* Circular Progress & Clock */}
        <div className="relative w-64 h-64 flex items-center justify-center my-4">
          <svg className="w-full h-full transform -rotate-90">
            {/* Background circle */}
            <circle
              cx="128"
              cy="128"
              r="110"
              stroke="#f1f5f9"
              strokeWidth="12"
              fill="transparent"
            />
            {/* Progress track */}
            <circle
              cx="128"
              cy="128"
              r="110"
              stroke="#6366f1"
              strokeWidth="12"
              strokeDasharray={circleCircumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-1000 ease-linear"
            />
          </svg>

          {/* Time digits in center */}
          <div className="absolute flex flex-col items-center">
            <span className="text-4xl font-black tracking-tight text-slate-900 font-mono">
              {formattedTime}
            </span>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-1">
              {remainingSeconds === 0 ? 'Tempo esgotado!' : isRunning ? 'Foco total' : 'Pausado'}
            </span>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center gap-3 w-full justify-center mt-2 mb-6">
          <button
            onClick={handleAddFiveMinutes}
            className="flex items-center gap-1 px-3 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            title="Adicionar 5 minutos"
          >
            <Plus className="w-3.5 h-3.5" />
            +5 min
          </button>

          <button
            onClick={toggleTimer}
            className="w-14 h-14 flex items-center justify-center rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white shadow-lg shadow-indigo-300 transition-all cursor-pointer"
          >
            {isRunning ? <Pause className="w-6 h-6 fill-white" /> : <Play className="w-6 h-6 fill-white ml-0.5" />}
          </button>

          <button
            onClick={handleFinish}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-200 transition-all cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            Concluir
          </button>
        </div>

        {/* Motivational pill */}
        <div className="flex items-center gap-1.5 text-xs text-indigo-700 bg-indigo-50/70 border border-indigo-100 px-3.5 py-1.5 rounded-full">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          <span>Mantenha o foco até o alarme tocar!</span>
        </div>
      </div>
    </div>
  );
};
