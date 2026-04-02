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
          className="bg-cream dark:bg-accent rounded-3xl shadow-2xl max-w-md w-full overflow-hidden relative border border-secondary/20"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-secondary/10 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-secondary/40" />
          </button>

          <div className="p-8 text-center">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="bg-primary/10 dark:bg-primary/20 p-6 rounded-full"
                >
                  <Flame className="w-16 h-16 text-primary" fill="currentColor" />
                </motion.div>
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="absolute -bottom-2 -right-2 bg-primary p-2 rounded-full border-4 border-cream dark:border-accent"
                >
                  <Trophy className="w-6 h-6 text-white" />
                </motion.div>
              </div>
            </div>

            <h2 className="text-3xl font-bold text-accent dark:text-cream mb-2">
              {update.streak_broken ? "Streak Reset!" : "Streak Continued!"}
            </h2>
            
            <div className="flex items-center justify-center gap-2 mb-6">
              <span className="text-5xl font-black text-primary tracking-tighter">
                {update.current_streak_days}
              </span>
              <span className="text-xl font-semibold text-secondary/50 uppercase tracking-widest">
                Days
              </span>
            </div>

            <div className="bg-secondary/10 dark:bg-secondary/20 rounded-2xl p-4 mb-6 flex items-center justify-between border border-secondary/20 dark:border-secondary/40">
              <div className="flex items-center gap-3">
                <div className="bg-secondary p-2 rounded-lg">
                  <Star className="w-5 h-5 text-white fill-current" />
                </div>
                <span className="font-bold text-secondary dark:text-cream/80">Reward Points</span>
              </div>
              <span className="text-2xl font-black text-secondary dark:text-cream/60">
                +{update.reward_points_earned}
              </span>
            </div>

            <p className="text-secondary/60 text-lg leading-relaxed mb-8 italic font-serif">
              "{update.message}"
            </p>

            <button
              onClick={onClose}
              className="w-full bg-accent dark:bg-primary text-white py-4 rounded-2xl font-bold text-lg hover:bg-secondary transition-colors shadow-lg shadow-secondary/20"
            >
              Keep Studying
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
