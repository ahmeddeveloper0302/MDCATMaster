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
          className="flex items-center text-secondary/50 hover:text-primary font-bold transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Analysis
        </button>
        <div className="flex items-center gap-2 bg-secondary/10 px-4 py-2 rounded-2xl border border-secondary/10">
          <Calendar className="w-5 h-5 text-primary" />
          <span className="font-bold text-accent dark:text-cream">Personalized Revision Plan</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Summary & Topics */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-cream dark:bg-accent p-6 rounded-3xl border border-secondary/20 shadow-sm">
            <h3 className="text-lg font-bold text-accent dark:text-cream mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              Plan Overview
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-secondary/50">Total Questions</span>
                <span className="font-bold text-accent dark:text-cream">{plan.revision_plan.length}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-secondary/50">Duration</span>
                <span className="font-bold text-accent dark:text-cream">{days.length} Days</span>
              </div>
              <div className="pt-4 border-t border-secondary/10">
                <p className="text-xs text-secondary/40 uppercase tracking-widest font-bold mb-3">Priority Topics</p>
                <div className="flex flex-wrap gap-2">
                  {Array.from(new Set(plan.revision_plan.map(p => p.topic))).map((topic, i) => (
                    <span key={i} className="bg-secondary/10 text-secondary/60 px-3 py-1 rounded-full text-xs font-bold">
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-primary p-6 rounded-3xl text-white shadow-lg shadow-primary/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-white/20 p-2 rounded-xl">
                <AlertCircle className="w-5 h-5" />
              </div>
              <h4 className="font-bold">Study Tip</h4>
            </div>
            <p className="text-cream/80 text-sm leading-relaxed">
              Focus on understanding the *why* behind your mistakes. Review the explanations carefully and cross-reference with your textbooks for these specific topics.
            </p>
          </div>
        </div>

        {/* Right: Daily Schedule */}
        <div className="lg:col-span-2 space-y-8">
          {days.map((day, dayIdx) => (
            <div key={day} className="relative">
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-primary text-white w-10 h-10 rounded-full flex items-center justify-center font-black shadow-lg shadow-primary/20">
                  {dayIdx + 1}
                </div>
                <h3 className="text-xl font-black text-accent dark:text-cream uppercase tracking-tight">{day}</h3>
              </div>
              
              <div className="space-y-4 ml-5 pl-9 border-l-2 border-secondary/10">
                {groupedPlan[day].map((item, itemIdx) => {
                  const mcq = mcqs.find(m => m.id === item.question_id);
                  return (
                    <motion.div
                      key={itemIdx}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: itemIdx * 0.1 }}
                      className="bg-cream dark:bg-accent p-6 rounded-2xl border border-secondary/20 shadow-sm hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <span className="bg-rose-500/10 text-rose-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                          {item.topic}
                        </span>
                        <CheckCircle2 className="w-5 h-5 text-secondary/20" />
                      </div>
                      <p className="text-accent dark:text-cream font-bold mb-3 line-clamp-2">
                        {mcq?.question || "Question not found"}
                      </p>
                      <div className="bg-secondary/5 dark:bg-accent/30 p-4 rounded-xl border border-secondary/10">
                        <p className="text-xs text-secondary/60 leading-relaxed italic">
                          <span className="font-bold text-primary not-italic mr-1">Review Focus:</span>
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
