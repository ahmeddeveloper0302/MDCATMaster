import React from 'react';
import { StreakUpdate } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Flame, X, Star } from 'lucide-react';

interface StreakModalProps {
  update: StreakUpdate;
  onClose: () => void;
}

export const StreakModal: React.FC<StreakModalProps> = ({ update, onClose }) => {
  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden relative border border-slate-200 dark:border-slate-800"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-400 dark:text-slate-500" />
          </button>

          <div className="p-8 text-center">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="bg-orange-100 dark:bg-orange-900/20 p-6 rounded-full"
                >
                  <Flame className="w-16 h-16 text-orange-500" fill="currentColor" />
                </motion.div>
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="absolute -bottom-2 -right-2 bg-yellow-400 p-2 rounded-full border-4 border-white dark:border-slate-900"
                >
                  <Trophy className="w-6 h-6 text-white" />
                </motion.div>
              </div>
            </div>

            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {update.streak_broken ? "Streak Reset!" : "Streak Continued!"}
            </h2>
            
            <div className="flex items-center justify-center gap-2 mb-6">
              <span className="text-5xl font-black text-orange-500 tracking-tighter">
                {update.current_streak_days}
              </span>
              <span className="text-xl font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-widest">
                Days
              </span>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-4 mb-6 flex items-center justify-between border border-blue-100 dark:border-blue-800">
              <div className="flex items-center gap-3">
                <div className="bg-blue-500 p-2 rounded-lg">
                  <Star className="w-5 h-5 text-white fill-current" />
                </div>
                <span className="font-bold text-blue-900 dark:text-blue-300">Reward Points</span>
              </div>
              <span className="text-2xl font-black text-blue-600 dark:text-blue-400">
                +{update.reward_points_earned}
              </span>
            </div>

            <p className="text-gray-600 dark:text-slate-400 text-lg leading-relaxed mb-8 italic font-serif">
              "{update.message}"
            </p>

            <button
              onClick={onClose}
              className="w-full bg-gray-900 dark:bg-indigo-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-gray-800 dark:hover:bg-indigo-700 transition-colors shadow-lg shadow-gray-200 dark:shadow-none"
            >
              Keep Studying
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
