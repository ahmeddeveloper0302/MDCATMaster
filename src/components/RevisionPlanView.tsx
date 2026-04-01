import React from 'react';
import { RevisionPlan, MCQ } from '../types';
import { motion } from 'motion/react';
import { Calendar, BookOpen, CheckCircle2, AlertCircle, ChevronRight, ArrowLeft } from 'lucide-react';

interface RevisionPlanViewProps {
  plan: RevisionPlan;
  mcqs: MCQ[];
  onClose: () => void;
}

export const RevisionPlanView: React.FC<RevisionPlanViewProps> = ({ plan, mcqs, onClose }) => {
  // Group by day
  const groupedPlan = plan.revision_plan.reduce((acc, item) => {
    if (!acc[item.review_day]) acc[item.review_day] = [];
    acc[item.review_day].push(item);
    return acc;
  }, {} as Record<string, typeof plan.revision_plan>);

  const days = Object.keys(groupedPlan).sort();

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-8">
        <button 
          onClick={onClose}
          className="flex items-center text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-bold transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Analysis
        </button>
        <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/20 px-4 py-2 rounded-2xl border border-indigo-100 dark:border-indigo-800">
          <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <span className="font-bold text-indigo-900 dark:text-indigo-300">Personalized Revision Plan</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Summary & Topics */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Plan Overview
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 dark:text-slate-400">Total Questions</span>
                <span className="font-bold text-slate-900 dark:text-white">{plan.revision_plan.length}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 dark:text-slate-400">Duration</span>
                <span className="font-bold text-slate-900 dark:text-white">{days.length} Days</span>
              </div>
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold mb-3">Priority Topics</p>
                <div className="flex flex-wrap gap-2">
                  {Array.from(new Set(plan.revision_plan.map(p => p.topic))).map((topic, i) => (
                    <span key={i} className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-3 py-1 rounded-full text-xs font-bold">
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-indigo-600 p-6 rounded-3xl text-white shadow-lg shadow-indigo-100 dark:shadow-none">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-white/20 p-2 rounded-xl">
                <AlertCircle className="w-5 h-5" />
              </div>
              <h4 className="font-bold">Study Tip</h4>
            </div>
            <p className="text-indigo-100 text-sm leading-relaxed">
              Focus on understanding the *why* behind your mistakes. Review the explanations carefully and cross-reference with your textbooks for these specific topics.
            </p>
          </div>
        </div>

        {/* Right: Daily Schedule */}
        <div className="lg:col-span-2 space-y-8">
          {days.map((day, dayIdx) => (
            <div key={day} className="relative">
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-indigo-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-black shadow-lg shadow-indigo-100 dark:shadow-none">
                  {dayIdx + 1}
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{day}</h3>
              </div>
              
              <div className="space-y-4 ml-5 pl-9 border-l-2 border-slate-200 dark:border-slate-800">
                {groupedPlan[day].map((item, itemIdx) => {
                  const mcq = mcqs.find(m => m.id === item.question_id);
                  return (
                    <motion.div
                      key={itemIdx}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: itemIdx * 0.1 }}
                      className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <span className="bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                          {item.topic}
                        </span>
                        <CheckCircle2 className="w-5 h-5 text-slate-200 dark:text-slate-700" />
                      </div>
                      <p className="text-slate-900 dark:text-white font-bold mb-3 line-clamp-2">
                        {mcq?.question || "Question not found"}
                      </p>
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed italic">
                          <span className="font-bold text-indigo-600 dark:text-indigo-400 not-italic mr-1">Review Focus:</span>
                          {item.explanation}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
