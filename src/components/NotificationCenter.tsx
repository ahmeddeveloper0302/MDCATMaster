import React, { useState } from 'react';
import { StudyNotification } from '../types';
import { Bell, Flame, BookOpen, Sparkles, X, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface NotificationCenterProps {
  notifications: StudyNotification[];
  onClear: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ notifications, onClear }) => {
  const [isOpen, setIsOpen] = useState(false);

  const getIcon = (type: string) => {
    switch (type) {
      case 'streak_reminder': return <Flame className="w-4 h-4 text-orange-500" />;
      case 'streak_motivation': return <Sparkles className="w-4 h-4 text-amber-500" />;
      case 'topic_focus': return <BookOpen className="w-4 h-4 text-indigo-500" />;
      default: return <Bell className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-xl transition-all"
      >
        <Bell className="w-6 h-6" />
        {notifications.length > 0 && (
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white dark:border-slate-900">
            {notifications.length}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-20" 
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 z-30 overflow-hidden"
            >
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Bell className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  Study Notifications
                </h3>
                <button 
                  onClick={onClear}
                  className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                >
                  Clear All
                </button>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="bg-slate-50 dark:bg-slate-800 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <Bell className="w-6 h-6 text-slate-300 dark:text-slate-600" />
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">No new notifications</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">You're all caught up!</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-50 dark:divide-slate-800">
                    {notifications.map((n, i) => (
                      <div key={i} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group cursor-pointer">
                        <div className="flex gap-3">
                          <div className="mt-1 shrink-0">
                            {getIcon(n.notification_type)}
                          </div>
                          <div className="flex-1">
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                              {n.title}
                            </h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
                              {n.message}
                            </p>
                            <div className="flex items-center gap-1 mt-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                              <Clock className="w-3 h-3" />
                              {new Date(n.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {notifications.length > 0 && (
                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 border-t border-indigo-100 dark:border-indigo-800 text-center">
                  <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                    Stay consistent, stay ahead
                  </p>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
