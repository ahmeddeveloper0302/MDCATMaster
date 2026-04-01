import React from 'react';
import { GamificationUpdate } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Award, TrendingUp, X, ChevronRight, Sparkles } from 'lucide-react';

interface GamificationModalProps {
  update: GamificationUpdate;
  onClose: () => void;
}

export const GamificationModal: React.FC<GamificationModalProps> = ({ update, onClose }) => {
  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl max-w-lg w-full overflow-hidden relative border border-white/20 dark:border-slate-800"
        >
          {/* Decorative background elements */}
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-indigo-600 to-purple-600 opacity-10" />
          
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors z-10"
          >
            <X className="w-6 h-6 text-gray-400 dark:text-slate-500" />
          </button>

          <div className="p-10">
            <div className="flex flex-col items-center text-center mb-8">
              <motion.div
                initial={{ rotate: -10, scale: 0.8 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: "spring", damping: 12 }}
                className="bg-indigo-600 p-6 rounded-3xl shadow-xl shadow-indigo-200 dark:shadow-none mb-6"
              >
                <Award className="w-16 h-16 text-white" />
              </motion.div>
              
              <h2 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight mb-2">
                Level Up!
              </h2>
              <p className="text-indigo-600 dark:text-indigo-400 font-bold text-lg uppercase tracking-widest">
                Level {update.level} Achieved
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700">
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">Total XP</span>
                <span className="text-3xl font-black text-slate-900 dark:text-white">{update.XP}</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700">
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">Badges</span>
                <span className="text-3xl font-black text-slate-900 dark:text-white">{update.earned_badges.length}</span>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-sm font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-yellow-500" />
                Newly Earned Badges
              </h3>
              <div className="flex flex-wrap gap-2">
                {update.earned_badges.map((badge, idx) => (
                  <motion.span
                    key={idx}
                    initial={{ x: -10, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.1 * idx }}
                    className="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 px-4 py-2 rounded-xl font-bold text-sm border border-indigo-100 dark:border-indigo-800"
                  >
                    {badge}
                  </motion.span>
                ))}
              </div>
            </div>

            <div className="bg-indigo-900 rounded-3xl p-6 mb-8 text-white relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2 opacity-80">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-widest">Next Goal</span>
                </div>
                <p className="font-bold text-lg leading-tight">
                  {update.next_badge}
                </p>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
            </div>

            <p className="text-gray-500 dark:text-slate-400 text-center italic mb-8 font-medium">
              "{update.message}"
            </p>

            <button
              onClick={onClose}
              className="w-full bg-indigo-600 text-white py-5 rounded-[1.5rem] font-black text-xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 dark:shadow-none flex items-center justify-center gap-2 group"
            >
              Continue Journey
              <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
