import React, { useState } from 'react';
import { X, MessageSquare, AlertCircle, Lightbulb, Send, Loader2 } from 'lucide-react';
import { FeedbackType } from '../types';
import { db, auth } from '../firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

import { toast } from 'sonner';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  mcqId?: string;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose, mcqId }) => {
  const [type, setType] = useState<FeedbackType>(mcqId ? 'issue' : 'suggestion');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setSubmitting(true);
    try {
      const feedbackId = crypto.randomUUID();
      const feedbackData = {
        id: feedbackId,
        userId: auth.currentUser?.uid || 'anonymous',
        userEmail: auth.currentUser?.email || 'anonymous',
        type,
        mcqId: mcqId || null,
        content,
        createdAt: Timestamp.now()
      };

      await addDoc(collection(db, 'feedback'), feedbackData);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setContent('');
        onClose();
      }, 2000);
    } catch (err) {
      console.error("Error submitting feedback:", err);
      toast.error("Failed to submit feedback. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-accent/50 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-cream dark:bg-accent rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-secondary/20">
        <div className="p-6 border-b border-secondary/10 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-primary/10 p-2 rounded-xl">
              <MessageSquare className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-accent dark:text-cream">
              {mcqId ? 'Report an Issue' : 'Send Feedback'}
            </h2>
          </div>
          <button onClick={onClose} className="text-secondary/40 hover:text-primary transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {success ? (
          <div className="p-12 text-center animate-in fade-in zoom-in-95 duration-500">
            <div className="bg-emerald-100 dark:bg-emerald-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Send className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold text-accent dark:text-cream mb-2">Thank You!</h3>
            <p className="text-secondary/60">Your feedback helps us improve MDCAT Master.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="space-y-3">
              <label className="text-xs font-bold text-secondary/40 uppercase tracking-widest">Feedback Type</label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setType('issue')}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all ${
                    type === 'issue' ? 'border-primary bg-secondary/10 text-primary' : 'border-secondary/10 text-secondary/40 hover:border-primary/30'
                  }`}
                >
                  <AlertCircle className="w-5 h-5 mb-1" />
                  <span className="text-[10px] font-bold uppercase">Issue</span>
                </button>
                <button
                  type="button"
                  onClick={() => setType('suggestion')}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all ${
                    type === 'suggestion' ? 'border-primary bg-secondary/10 text-primary' : 'border-secondary/10 text-secondary/40 hover:border-primary/30'
                  }`}
                >
                  <Lightbulb className="w-5 h-5 mb-1" />
                  <span className="text-[10px] font-bold uppercase">Idea</span>
                </button>
                <button
                  type="button"
                  onClick={() => setType('other')}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all ${
                    type === 'other' ? 'border-primary bg-secondary/10 text-primary' : 'border-secondary/10 text-secondary/40 hover:border-primary/30'
                  }`}
                >
                  <MessageSquare className="w-5 h-5 mb-1" />
                  <span className="text-[10px] font-bold uppercase">Other</span>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-secondary/40 uppercase tracking-widest">
                {type === 'issue' ? 'Describe the problem' : 'Your message'}
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={type === 'issue' ? 'e.g. The answer is wrong, or the explanation is unclear...' : 'Tell us how we can improve...'}
                className="w-full bg-secondary/5 dark:bg-accent/30 border-2 border-secondary/10 dark:border-secondary/5 rounded-2xl p-4 min-h-[120px] focus:border-primary focus:ring-0 transition-all outline-none text-accent dark:text-cream font-medium"
                required
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !content.trim()}
              className="w-full bg-primary hover:bg-secondary disabled:bg-primary/40 text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary/20 flex items-center justify-center transition-all active:scale-95"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  Submit Feedback
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
