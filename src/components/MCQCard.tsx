import React, { useState } from 'react';
import { MCQ } from '../types';
import { CheckCircle2, XCircle, Info, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface MCQCardProps {
  mcq: MCQ;
  index: number;
  onReportIssue?: (mcqId: string) => void;
  onAnswer?: (mcqId: string, answer: "A" | "B" | "C" | "D", timeSpent: number) => void;
}

export const MCQCard: React.FC<MCQCardProps> = ({ mcq, index, onReportIssue, onAnswer }) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [startTime] = useState<number>(Date.now());

  const handleOptionClick = (option: string) => {
    if (selectedOption) return; // Prevent changing answer
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    setSelectedOption(option);
    setShowExplanation(true);
    onAnswer?.(mcq.id, option as "A" | "B" | "C" | "D", timeSpent);
  };

  const isCorrect = selectedOption === mcq.answer;

  return (
    <div className="bg-cream dark:bg-accent rounded-2xl border border-secondary/20 shadow-sm overflow-hidden transition-all hover:shadow-md mb-6">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
            {index + 1}
          </span>
          <div className="flex items-center space-x-2">
            {mcq.isRepeatedConcept && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 dark:bg-primary/20 text-primary">
                <AlertCircle className="w-3 h-3 mr-1" />
                Frequently Repeated
              </span>
            )}
            <button 
              onClick={() => onReportIssue?.(mcq.id)}
              className="p-1.5 text-secondary/30 hover:text-rose-500 transition-colors"
              title="Report an issue with this question"
            >
              <AlertCircle className="w-4 h-4" />
            </button>
          </div>
        </div>

        <h3 className="text-lg font-semibold text-accent dark:text-cream mb-6 leading-relaxed">
          {mcq.question}
        </h3>

        <div className="grid grid-cols-1 gap-3">
          {Object.entries(mcq.options).map(([key, value]) => {
            const isSelected = selectedOption === key;
            const isAnswer = key === mcq.answer;
            
            let optionStyles = "relative flex items-center p-4 rounded-xl border-2 transition-all cursor-pointer text-left";
            
            if (!selectedOption) {
              optionStyles = cn(optionStyles, "border-secondary/10 dark:border-secondary/5 hover:border-primary/50 hover:bg-primary/5 text-accent dark:text-cream/80");
            } else {
              if (isAnswer) {
                optionStyles = cn(optionStyles, "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-900 dark:text-emerald-400");
              } else if (isSelected && !isAnswer) {
                optionStyles = cn(optionStyles, "border-rose-500 bg-rose-50 dark:bg-rose-900/20 text-rose-900 dark:text-rose-400");
              } else {
                optionStyles = cn(optionStyles, "border-secondary/10 dark:border-secondary/5 opacity-50 text-secondary/60");
              }
            }

            return (
              <button
                key={key}
                disabled={!!selectedOption}
                onClick={() => handleOptionClick(key)}
                className={optionStyles}
              >
                <span className={cn(
                  "flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg font-bold mr-4 text-sm",
                  !selectedOption ? "bg-secondary/10 text-secondary/60" : 
                  isAnswer ? "bg-emerald-500 text-white" :
                  isSelected ? "bg-rose-500 text-white" : "bg-secondary/10 text-secondary/40"
                )}>
                  {key}
                </span>
                <span className="flex-grow font-medium">{value}</span>
                {selectedOption && isAnswer && <CheckCircle2 className="w-5 h-5 text-emerald-600 ml-2" />}
                {selectedOption && isSelected && !isAnswer && <XCircle className="w-5 h-5 text-rose-600 ml-2" />}
              </button>
            );
          })}
        </div>

        {selectedOption && (
          <div className="mt-6 pt-6 border-t border-secondary/10">
            <button
              onClick={() => setShowExplanation(!showExplanation)}
              className="flex items-center text-sm font-semibold text-primary hover:text-secondary transition-colors"
            >
              <Info className="w-4 h-4 mr-2" />
              {showExplanation ? "Hide Explanation" : "Show Explanation"}
              {showExplanation ? <ChevronUp className="ml-1 w-4 h-4" /> : <ChevronDown className="ml-1 w-4 h-4" />}
            </button>

            {showExplanation && (
              <div className="mt-4 p-4 bg-secondary/5 dark:bg-accent/30 rounded-xl animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-secondary/40">Explanation</span>
                  <p className="mt-1 text-secondary/80 text-sm leading-relaxed">
                    {mcq.explanation}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-secondary/40">Reference</span>
                  <p className="mt-1 text-primary font-medium text-xs italic">
                    {mcq.pastPaperReference}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
