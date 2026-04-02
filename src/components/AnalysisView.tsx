import React from 'react';
import { ExamAnalysis } from '../types';
import { 
  BarChart3, 
  TrendingDown, 
  Clock, 
  Lightbulb, 
  CheckCircle2, 
  AlertCircle,
  ChevronRight,
  Loader2,
  Calendar,
  Download,
  Share2
} from 'lucide-react';

interface AnalysisViewProps {
  analysis: ExamAnalysis;
  onClose: () => void;
  onGenerateRevisionPlan: () => void;
  isGeneratingPlan?: boolean;
  onExport: (format: 'txt' | 'json') => void;
}

export const AnalysisView: React.FC<AnalysisViewProps> = ({ 
  analysis, 
  onClose, 
  onGenerateRevisionPlan,
  isGeneratingPlan = false,
  onExport
}) => {
  return (
    <div className="bg-cream dark:bg-accent rounded-3xl shadow-xl border border-secondary/10 overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="bg-primary p-8 text-white">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 p-2 rounded-xl">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold">Exam Performance Analysis</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center bg-white/10 rounded-xl p-1 border border-white/10">
              <button 
                onClick={() => onExport('txt')}
                className="p-2 hover:bg-white/20 rounded-lg transition-all"
                title="Export as TXT"
              >
                <Download className="w-4 h-4" />
              </button>
              <button 
                onClick={() => onExport('json')}
                className="p-2 hover:bg-white/20 rounded-lg transition-all"
                title="Export as JSON"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
            <button 
              onClick={onGenerateRevisionPlan}
              disabled={isGeneratingPlan}
              className="bg-white/20 hover:bg-white/30 text-white font-bold py-2 px-4 rounded-xl backdrop-blur-sm transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isGeneratingPlan ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Calendar className="w-4 h-4" />
              )}
              Generate Revision Plan
            </button>
            <button 
              onClick={onClose}
              className="text-cream/80 hover:text-white font-bold text-sm"
            >
              Close Analysis
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(analysis.accuracy).map(([subject, score]) => (
            <div key={subject} className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
              <p className="text-cream/80 text-xs font-bold uppercase tracking-wider mb-1">{subject}</p>
              <p className="text-3xl font-black">{score}%</p>
              <div className="mt-2 h-1.5 bg-white/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white transition-all duration-1000" 
                  style={{ width: `${score}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Weak Topics */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2 text-rose-600 dark:text-rose-400">
            <TrendingDown className="w-5 h-5" />
            <h3 className="font-bold uppercase tracking-wider text-sm">Focus Areas (Weak Topics)</h3>
          </div>
          <div className="space-y-3">
            {analysis.weak_topics.map((topic, i) => (
              <div key={i} className="flex items-center p-4 bg-rose-500/10 rounded-2xl border border-rose-500/20">
                <div className="w-8 h-8 rounded-full bg-rose-500 text-white flex items-center justify-center font-bold text-sm mr-4 shrink-0">
                  {i + 1}
                </div>
                <span className="font-bold text-rose-900 dark:text-rose-300">{topic}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Suggestions */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2 text-primary">
            <Lightbulb className="w-5 h-5" />
            <h3 className="font-bold uppercase tracking-wider text-sm">Improvement Plan</h3>
          </div>
          <div className="space-y-3">
            {analysis.suggestions.map((suggestion, i) => (
              <div key={i} className="flex items-start p-4 bg-primary/10 rounded-2xl border border-primary/20">
                <CheckCircle2 className="w-5 h-5 text-primary mr-3 mt-0.5 shrink-0" />
                <span className="text-secondary dark:text-cream/80 text-sm font-medium leading-relaxed">{suggestion}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Time Analysis */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center space-x-2 text-primary">
            <Clock className="w-5 h-5" />
            <h3 className="font-bold uppercase tracking-wider text-sm">Time Management</h3>
          </div>
          <div className="bg-secondary/5 dark:bg-accent/30 rounded-2xl p-6 border border-secondary/10">
            <div className="flex flex-wrap gap-4">
              {Object.entries(analysis.time_per_question).map(([q, time]) => {
                const isSlow = time > 90;
                return (
                  <div key={q} className="flex flex-col items-center">
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm mb-1 border-2",
                      isSlow ? "bg-rose-500/10 border-rose-500/20 text-rose-600" : "bg-cream dark:bg-accent border-secondary/10 text-secondary"
                    )}>
                      {time}s
                    </div>
                    <span className="text-[10px] font-bold text-secondary/40 uppercase">{q}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-6 flex items-center p-3 bg-cream dark:bg-accent rounded-xl border border-secondary/10 text-xs text-secondary/60">
              <AlertCircle className="w-4 h-4 mr-2 text-rose-500 dark:text-rose-400" />
              Questions in <span className="text-rose-600 dark:text-rose-400 font-bold mx-1">red</span> took longer than the recommended MDCAT pace.
            </div>
          </div>
        </div>
      </div>

      <div className="p-8 bg-secondary/5 dark:bg-accent border-t border-secondary/10 flex justify-center">
        <button 
          onClick={onClose}
          className="bg-primary hover:bg-secondary text-white font-bold py-3 px-8 rounded-2xl shadow-lg shadow-primary/20 transition-all flex items-center"
        >
          Back to Exam Review
          <ChevronRight className="w-5 h-5 ml-2" />
        </button>
      </div>
    </div>
  );
};

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
