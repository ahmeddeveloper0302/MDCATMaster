import React, { useState, useEffect } from 'react';
import { Subject, MCQ, ExamPaper, Difficulty, AppMode, UserAnswer, ExamAnalysis, UserProfile, StreakUpdate, GamificationUpdate, RevisionPlan, StudyNotification } from './types';
import { generateMCQs, getSuggestedTopics, generateFullExam, analyzeExamResults } from './services/gemini';
import { updateStreakAI } from './services/streakService';
import { updateGamificationAI } from './services/gamificationService';
import { generateRevisionPlanAI } from './services/revisionService';
import { generateStudyNotificationsAI } from './services/notificationService';
import { MCQCard } from './components/MCQCard';
import { FeedbackModal } from './components/FeedbackModal';
import { AnalysisView } from './components/AnalysisView';
import { StreakModal } from './components/StreakModal';
import { GamificationModal } from './components/GamificationModal';
import { RevisionPlanView } from './components/RevisionPlanView';
import { NotificationCenter } from './components/NotificationCenter';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from './firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs, orderBy, Timestamp, deleteDoc } from 'firebase/firestore';
import { Toaster, toast } from 'sonner';
import { 
  BookOpen, 
  Sparkles, 
  Loader2, 
  ChevronRight, 
  GraduationCap, 
  History,
  AlertTriangle,
  RefreshCw,
  Save,
  LogOut,
  LogIn,
  User as UserIcon,
  Trash2,
  Calendar,
  Lightbulb,
  BarChart,
  Share2,
  Download,
  Copy,
  Check,
  Globe,
  Lock,
  MessageSquare,
  Clock,
  Timer,
  Settings2,
  Flame,
  Star,
  Trophy,
  Sun,
  Moon
} from 'lucide-react';

const DIFFICULTIES: Difficulty[] = ["Easy", "Medium", "Hard", "Very Hard"];

const SUBJECT_DEFAULTS: Record<Subject, number> = {
  [Subject.BIOLOGY]: 68,
  [Subject.CHEMISTRY]: 54,
  [Subject.PHYSICS]: 54,
  [Subject.ENGLISH]: 18,
  [Subject.LOGICAL_REASONING]: 6
};

export default function App() {
  const [mode, setMode] = useState<AppMode>("Topic Practice");
  const [subject, setSubject] = useState<Subject>(Subject.BIOLOGY);
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>("Hard");
  const [questionCount, setQuestionCount] = useState(10);
  const [mcqs, setMcqs] = useState<MCQ[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [savedPapers, setSavedPapers] = useState<ExamPaper[]>([]);
  const [showSaved, setShowSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [suggestedTopics, setSuggestedTopics] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [sharedPaper, setSharedPaper] = useState<ExamPaper | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackMcqId, setFeedbackMcqId] = useState<string | undefined>(undefined);
  
  // Analysis state
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [analysis, setAnalysis] = useState<ExamAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [streakUpdate, setStreakUpdate] = useState<StreakUpdate | null>(null);
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [gamificationUpdate, setGamificationUpdate] = useState<GamificationUpdate | null>(null);
  const [showGamificationModal, setShowGamificationModal] = useState(false);
  const [revisionPlan, setRevisionPlan] = useState<RevisionPlan | null>(null);
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [mistakeCounts, setMistakeCounts] = useState<Record<string, number>>({});
  const [notifications, setNotifications] = useState<StudyNotification[]>([]);
  
  // Timer state
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [timerActive, setTimerActive] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerActive && timeLeft !== null && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => (prev !== null ? prev - 1 : null));
      }, 1000);
    } else if (timeLeft === 0) {
      setTimerActive(false);
      toast.error("Time is up! Please review your answers.");
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (mode === "Full Exam") {
      setQuestionCount(SUBJECT_DEFAULTS[subject]);
    } else {
      setQuestionCount(10);
    }
  }, [subject, mode]);

  const fetchSharedPaper = async (userId: string, paperId: string) => {
    setLoading(true);
    setUserAnswers([]);
    setAnalysis(null);
    try {
      const docRef = doc(db, `users/${userId}/papers`, paperId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        const paper = {
          ...data,
          createdAt: data.createdAt.toDate().toISOString()
        } as ExamPaper;
        setSharedPaper(paper);
        setMcqs(paper.mcqs);
        setSubject(paper.subject);
        setTopic(paper.topic);
      } else {
        setError("Shared paper not found or it's no longer public.");
      }
    } catch (err) {
      console.error("Error fetching shared paper:", err);
      setError("Could not load shared paper. It might be private or the link is invalid.");
      handleFirestoreError(err, OperationType.GET, `users/${userId}/papers/${paperId}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await fetchUserProfile(currentUser);
        fetchSavedPapers(currentUser.uid);
      } else {
        setSavedPapers([]);
        setUserProfile(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchUserProfile = async (firebaseUser: FirebaseUser) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      let profile: UserProfile;
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        profile = {
          ...data,
          createdAt: data.createdAt.toDate().toISOString(),
          lastLoginDate: data.lastLoginDate.toDate().toISOString(),
          lastQuizCompletedDate: data.lastQuizCompletedDate?.toDate().toISOString(),
          totalAttempted: data.totalAttempted || 0,
          totalCorrect: data.totalCorrect || 0,
          masteredTopics: data.masteredTopics || [],
          level: data.level || 1,
          xp: data.xp || 0,
          earnedBadges: data.earnedBadges || [],
        } as UserProfile;
      } else {
        const now = new Date().toISOString();
        profile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || '',
          photoURL: firebaseUser.photoURL || '',
          createdAt: now,
          streakDays: 0,
          lastLoginDate: now,
          totalPoints: 0,
          totalAttempted: 0,
          totalCorrect: 0,
          masteredTopics: [],
          level: 1,
          xp: 0,
          earnedBadges: [],
        };
        await setDoc(doc(db, 'users', firebaseUser.uid), {
          ...profile,
          createdAt: Timestamp.fromDate(new Date(profile.createdAt)),
          lastLoginDate: Timestamp.fromDate(new Date(profile.lastLoginDate)),
        });
      }
      setUserProfile(profile);
      await handleStreakCheck(profile);
    } catch (err) {
      console.error("Error fetching user profile:", err);
    }
  };

  const handleStreakCheck = async (profile: UserProfile, quizCompletedToday: boolean = false) => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const lastLogin = profile.lastLoginDate.split('T')[0];
    const lastQuiz = profile.lastQuizCompletedDate?.split('T')[0];
    
    const isNewDay = today !== lastLogin;
    const isNewQuizToday = quizCompletedToday && today !== lastQuiz;

    if (isNewDay || isNewQuizToday) {
      try {
        const update = await updateStreakAI(
          profile.lastLoginDate,
          profile.streakDays,
          quizCompletedToday || (today === lastQuiz)
        );
        
        const updatedProfile = {
          ...profile,
          streakDays: update.current_streak_days,
          totalPoints: profile.totalPoints + update.reward_points_earned,
          lastLoginDate: now.toISOString(),
          lastQuizCompletedDate: quizCompletedToday ? now.toISOString() : profile.lastQuizCompletedDate,
        };
        
        await setDoc(doc(db, 'users', profile.uid), {
          ...updatedProfile,
          lastLoginDate: Timestamp.now(),
          createdAt: Timestamp.fromDate(new Date(profile.createdAt)),
          lastQuizCompletedDate: updatedProfile.lastQuizCompletedDate ? Timestamp.fromDate(new Date(updatedProfile.lastQuizCompletedDate)) : null,
        }, { merge: true });
        
        setUserProfile(updatedProfile);
        
        if (update.reward_points_earned > 0 || update.streak_broken) {
          setStreakUpdate(update);
          setShowStreakModal(true);
        }
      } catch (err) {
        console.error("Streak check error:", err);
      }
    }
  };

  useEffect(() => {
    const fetchSuggestions = async () => {
      setLoadingSuggestions(true);
      try {
        const suggestions = await getSuggestedTopics(subject);
        setSuggestedTopics(suggestions);
        setError(null); // Clear error if successful
      } catch (err: any) {
        console.error("Error fetching suggestions:", err);
        setError(err.message || "Failed to fetch suggested topics");
      } finally {
        setLoadingSuggestions(false);
      }
    };
    fetchSuggestions();
  }, [subject]);

  const fetchSavedPapers = async (userId: string) => {
    try {
      const q = query(
        collection(db, `users/${userId}/papers`)
      );
      const querySnapshot = await getDocs(q);
      const papers: ExamPaper[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        papers.push({
          ...data,
          createdAt: data.createdAt.toDate().toISOString()
        } as ExamPaper);
      });
      setSavedPapers(papers);
    } catch (err) {
      console.error("Error fetching papers:", err);
      handleFirestoreError(err, OperationType.LIST, `users/${userId}/papers`);
    }
  };

  useEffect(() => {
    if (userProfile) {
      const fetchNotifications = async () => {
        const generated = await generateStudyNotificationsAI(userProfile, analysis || undefined);
        setNotifications(generated);
      };
      fetchNotifications();
    }
  }, [userProfile, analysis]);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error("Login error:", err);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setMcqs([]);
      setShowSaved(false);
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "Topic Practice" && !topic.trim()) return;

    setLoading(true);
    setError(null);
    setShowSaved(false);
    setTimerActive(false);
    setTimeLeft(null);
    setUserAnswers([]);
    setAnalysis(null);

    try {
      let results: MCQ[];
      if (mode === "Topic Practice") {
        results = await generateMCQs(subject, topic, difficulty);
      } else {
        results = await generateFullExam(subject, difficulty, questionCount);
        // Set timer: 1 minute per question for Bio/Chem/Phys, 0.5 min for English/Logic
        const minutesPerQuestion = (subject === Subject.ENGLISH || subject === Subject.LOGICAL_REASONING) ? 0.5 : 1;
        const totalSeconds = Math.floor(questionCount * minutesPerQuestion * 60);
        setTimeLeft(totalSeconds);
        setTimerActive(true);
      }
      setMcqs(results);
    } catch (err: any) {
      setError(err.message || 'Failed to generate MCQs. Please check your API key or try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePaper = async () => {
    if (!user || mcqs.length === 0) return;

    setSaving(true);
    try {
      const paperId = crypto.randomUUID();
      const paperData = {
        id: paperId,
        userId: user.uid,
        subject: sharedPaper ? sharedPaper.subject : subject,
        topic: sharedPaper ? sharedPaper.topic : topic,
        mcqs,
        createdAt: Timestamp.now(),
        isPublic: false
      };

      await setDoc(doc(db, `users/${user.uid}/papers`, paperId), paperData);
      await fetchSavedPapers(user.uid);
      toast.success("Paper saved to your collection!");
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user?.uid}/papers`);
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublic = async (paper: ExamPaper) => {
    if (!user) return;
    try {
      const newIsPublic = !paper.isPublic;
      await setDoc(doc(db, `users/${user.uid}/papers`, paper.id), {
        ...paper,
        createdAt: Timestamp.fromDate(new Date(paper.createdAt)),
        isPublic: newIsPublic
      });
      setSavedPapers(prev => prev.map(p => p.id === paper.id ? { ...p, isPublic: newIsPublic } : p));
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}/papers/${paper.id}`);
    }
  };

  const handleCopyShareLink = (paper: ExamPaper) => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?share=${user?.uid}/${paper.id}`;
    navigator.clipboard.writeText(shareUrl);
    setCopied(paper.id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleExportPaper = (paper: ExamPaper | { subject: Subject, topic: string, mcqs: MCQ[] }) => {
    let content = `MDCAT MASTER - PRACTICE PAPER\n`;
    content += `Subject: ${paper.subject}\n`;
    content += `Topic: ${paper.topic}\n`;
    content += `Generated on: ${new Date().toLocaleDateString()}\n\n`;
    content += `--------------------------------------------------\n\n`;

    paper.mcqs.forEach((mcq, idx) => {
      content += `Q${idx + 1}: ${mcq.question}\n`;
      content += `A) ${mcq.options.A}\n`;
      content += `B) ${mcq.options.B}\n`;
      content += `C) ${mcq.options.C}\n`;
      content += `D) ${mcq.options.D}\n\n`;
      content += `Correct Answer: ${mcq.answer}\n`;
      content += `Explanation: ${mcq.explanation}\n`;
      content += `Reference: ${mcq.pastPaperReference}\n\n`;
      content += `--------------------------------------------------\n\n`;
    });

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MDCAT_${paper.subject}_${paper.topic.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDeletePaper = async (paperId: string) => {
    if (!user) return;
    if (!confirm("Are you sure you want to delete this paper?")) return;

    try {
      await deleteDoc(doc(db, `users/${user.uid}/papers`, paperId));
      setSavedPapers(prev => prev.filter(p => p.id !== paperId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/papers/${paperId}`);
    }
  };

  const loadPaper = (paper: ExamPaper) => {
    setSubject(paper.subject);
    setTopic(paper.topic);
    setMcqs(paper.mcqs);
    setShowSaved(false);
    setUserAnswers([]);
    setAnalysis(null);
  };

  const handleAnswer = (mcqId: string, answer: "A" | "B" | "C" | "D", timeSpent: number) => {
    const mcq = mcqs.find(m => m.id === mcqId);
    if (!mcq) return;

    const newUserAnswer: UserAnswer = {
      mcqId,
      userAnswer: answer,
      correctAnswer: mcq.answer,
      subject: sharedPaper ? sharedPaper.subject : subject,
      topic: sharedPaper ? sharedPaper.topic : (mode === "Full Exam" ? "Full Exam" : topic),
      timeSpent
    };

    setUserAnswers(prev => {
      const filtered = prev.filter(a => a.mcqId !== mcqId);
      return [...filtered, newUserAnswer];
    });

    if (answer !== mcq.answer) {
      setMistakeCounts(prev => ({
        ...prev,
        [mcqId]: (prev[mcqId] || 0) + 1
      }));
    }
  };

  const handleAnalyze = async () => {
    if (userAnswers.length === 0) return;
    
    setAnalyzing(true);
    setError(null);
    try {
      const result = await analyzeExamResults(userAnswers);
      setAnalysis(result);
      setTimerActive(false);
      
      if (userProfile) {
        await handleStreakCheck(userProfile, true);
        await handleGamificationCheck(userProfile, userAnswers);
      }
    } catch (err: any) {
      console.error("Analysis error:", err);
      setError(err.message || "Failed to analyze results. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleGamificationCheck = async (profile: UserProfile, answers: UserAnswer[]) => {
    const correctCount = answers.filter(a => a.userAnswer === a.correctAnswer).length;
    const attemptedCount = answers.length;
    
    const newTotalAttempted = profile.totalAttempted + attemptedCount;
    const newTotalCorrect = profile.totalCorrect + correctCount;
    
    // Simple topic mastery logic: if accuracy on a topic is > 80% and at least 5 questions
    const topicsInQuiz = Array.from(new Set(answers.map(a => a.topic)));
    const newMasteredTopics = [...profile.masteredTopics];
    
    topicsInQuiz.forEach(t => {
      const topicAnswers = answers.filter(a => a.topic === t);
      const topicCorrect = topicAnswers.filter(a => a.userAnswer === a.correctAnswer).length;
      if (topicAnswers.length >= 5 && (topicCorrect / topicAnswers.length) >= 0.8) {
        if (!newMasteredTopics.includes(t)) {
          newMasteredTopics.push(t);
        }
      }
    });

    try {
      const update = await updateGamificationAI(
        newTotalAttempted,
        newTotalCorrect,
        profile.streakDays,
        newMasteredTopics
      );

      const updatedProfile = {
        ...profile,
        totalAttempted: newTotalAttempted,
        totalCorrect: newTotalCorrect,
        masteredTopics: newMasteredTopics,
        level: update.level,
        xp: update.XP,
        earnedBadges: Array.from(new Set([...profile.earnedBadges, ...update.earned_badges])),
      };

      await setDoc(doc(db, 'users', profile.uid), {
        ...updatedProfile,
        lastLoginDate: Timestamp.fromDate(new Date(profile.lastLoginDate)),
        createdAt: Timestamp.fromDate(new Date(profile.createdAt)),
        lastQuizCompletedDate: profile.lastQuizCompletedDate ? Timestamp.fromDate(new Date(profile.lastQuizCompletedDate)) : null,
      }, { merge: true });

      setUserProfile(updatedProfile);

      // Show modal if level increased or new badges earned
      const newBadges = update.earned_badges.filter(b => !profile.earnedBadges.includes(b));
      if (update.level > profile.level || newBadges.length > 0) {
        setGamificationUpdate({
          ...update,
          earned_badges: newBadges.length > 0 ? newBadges : [update.earned_badges[update.earned_badges.length - 1]]
        });
        setShowGamificationModal(true);
      }
    } catch (err) {
      console.error("Gamification check error:", err);
    }
  };

  const handleReportIssue = (mcqId: string) => {
    setFeedbackMcqId(mcqId);
    setFeedbackOpen(true);
  };

  const handleGeneralFeedback = () => {
    setFeedbackMcqId(undefined);
    setFeedbackOpen(true);
  };

  const handleGenerateRevisionPlan = async () => {
    if (userAnswers.length === 0) return;
    
    const incorrectAnswers = userAnswers.filter(a => a.userAnswer !== a.correctAnswer);
    if (incorrectAnswers.length === 0) {
      toast.info("Great job! You have no incorrect answers to revise from this session.");
      return;
    }

    setGeneratingPlan(true);
    try {
      const incorrectData = incorrectAnswers.map(ans => ({
        mcq: mcqs.find(m => m.id === ans.mcqId)!,
        mistakeCount: mistakeCounts[ans.mcqId] || 1
      }));
      
      const plan = await generateRevisionPlanAI(incorrectData);
      setRevisionPlan(plan);
    } catch (err) {
      console.error("Error generating revision plan:", err);
      setError("Failed to generate revision plan. Please try again.");
    } finally {
      setGeneratingPlan(false);
    }
  };

  const handleExportQuiz = (format: 'txt' | 'json') => {
    if (mcqs.length === 0) return;

    let content = '';
    let fileName = `MDCAT_${subject}_${topic || 'Quiz'}_${new Date().toISOString().split('T')[0]}`;

    if (format === 'json') {
      content = JSON.stringify({
        subject,
        topic,
        generatedAt: new Date().toISOString(),
        mcqs: mcqs.map(m => ({
          question: m.question,
          options: m.options,
          answer: m.answer,
          explanation: m.explanation,
          pastPaperReference: m.pastPaperReference,
          topic: m.topic
        }))
      }, null, 2);
      fileName += '.json';
    } else {
      content = `MDCAT REVISION QUIZ\n`;
      content += `Subject: ${subject}\n`;
      content += `Topic: ${topic || 'General'}\n`;
      content += `Generated At: ${new Date().toLocaleString()}\n`;
      content += `------------------------------------------\n\n`;

      mcqs.forEach((m, i) => {
        content += `Q${i + 1}: ${m.question}\n`;
        content += `A) ${m.options.A}\n`;
        content += `B) ${m.options.B}\n`;
        content += `C) ${m.options.C}\n`;
        content += `D) ${m.options.D}\n\n`;
        content += `Correct Answer: ${m.answer}\n`;
        content += `Explanation: ${m.explanation}\n`;
        content += `Reference: ${m.pastPaperReference}\n`;
        content += `------------------------------------------\n\n`;
      });
      fileName += '.txt';
    }

    const blob = new Blob([content], { type: format === 'json' ? 'application/json' : 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (error && error.includes("Gemini API Key is missing")) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 ${isDarkMode ? 'bg-slate-950 text-slate-50' : 'bg-slate-50 text-slate-900'}`}>
        <div className="max-w-md w-full bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 text-center">
          <div className="bg-amber-100 dark:bg-amber-900/30 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-10 h-10 text-amber-600 dark:text-amber-400" />
          </div>
          <h2 className="text-2xl font-bold mb-4">API Setup Required</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
            To use the AI features of MDCAT Master, you need to add your Gemini API key to the platform settings.
          </p>
          
          <div className="space-y-4 text-left mb-8">
            <div className="flex items-start space-x-3">
              <div className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 font-bold text-xs">1</div>
              <p className="text-sm">Go to <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline font-semibold">Google AI Studio</a> and copy your API key.</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 font-bold text-xs">2</div>
              <p className="text-sm">Open the <strong>Secrets</strong> or <strong>Settings</strong> panel in this AI Studio window.</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 font-bold text-xs">3</div>
              <p className="text-sm">Add a secret named <strong>GEMINI_API_KEY</strong> and paste your key.</p>
            </div>
          </div>
          
          <button 
            onClick={() => window.location.reload()}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center space-x-2"
          >
            <RefreshCw className="w-5 h-5" />
            <span>I've added the key, Refresh</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark bg-slate-950 text-slate-50' : 'bg-slate-50 text-slate-900'} font-sans transition-colors duration-300`}>
      <FeedbackModal 
        isOpen={feedbackOpen} 
        onClose={() => setFeedbackOpen(false)} 
        mcqId={feedbackMcqId} 
      />

      {showStreakModal && streakUpdate && (
        <StreakModal 
          update={streakUpdate} 
          onClose={() => setShowStreakModal(false)} 
        />
      )}

      {showGamificationModal && gamificationUpdate && (
        <GamificationModal
          update={gamificationUpdate}
          onClose={() => setShowGamificationModal(false)}
        />
      )}
      
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10 transition-colors">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-indigo-600 p-1.5 rounded-lg">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              MDCAT<span className="text-indigo-600">Master</span>
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            {sharedPaper && (
              <button 
                onClick={() => {
                  setSharedPaper(null);
                  setMcqs([]);
                  window.history.replaceState({}, '', window.location.pathname);
                }}
                className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 flex items-center"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                New Paper
              </button>
            )}
            {user ? (
              <div className="flex items-center space-x-4">
                <button 
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-xl transition-all"
                >
                  {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
                <div className="hidden md:flex items-center space-x-2">
                  <div className="flex items-center space-x-1.5 bg-orange-50 dark:bg-orange-900/20 px-3 py-1.5 rounded-full border border-orange-100 dark:border-orange-800">
                    <Flame className="w-4 h-4 text-orange-500 fill-current" />
                    <span className="text-sm font-bold text-orange-700 dark:text-orange-400">{userProfile?.streakDays || 0}</span>
                  </div>
                  <div className="flex items-center space-x-1.5 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-full border border-blue-100 dark:border-blue-800">
                    <Star className="w-4 h-4 text-blue-500 fill-current" />
                    <span className="text-sm font-bold text-blue-700 dark:text-blue-400">{userProfile?.totalPoints || 0}</span>
                  </div>
                  <div className="flex items-center space-x-1.5 bg-purple-50 dark:bg-purple-900/20 px-3 py-1.5 rounded-full border border-purple-100 dark:border-purple-800">
                    <Trophy className="w-4 h-4 text-purple-500 fill-current" />
                    <span className="text-sm font-bold text-purple-700 dark:text-purple-400">Lvl {userProfile?.level || 1}</span>
                  </div>
                </div>
                <button 
                  onClick={() => setShowSaved(!showSaved)}
                  className="text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center"
                >
                  <History className="w-4 h-4 mr-1" />
                  {showSaved ? "Back to Generator" : "Saved Papers"}
                </button>
                {mcqs.length > 0 && !showSaved && !analysis && !revisionPlan && (
                  <div className="flex items-center space-x-2 border-l border-slate-200 dark:border-slate-800 pl-4 ml-4">
                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Export</span>
                    <button 
                      onClick={() => handleExportQuiz('txt')}
                      className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-lg transition-all"
                      title="Download as TXT"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleExportQuiz('json')}
                      className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-lg transition-all"
                      title="Download as JSON"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block"></div>
                <div className="flex items-center space-x-2">
                  <NotificationCenter 
                    notifications={notifications} 
                    onClear={() => setNotifications([])} 
                  />
                  <img src={user.photoURL || ''} alt="" className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700" />
                  <button onClick={handleLogout} className="text-slate-400 hover:text-rose-600 transition-colors">
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <button 
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-xl transition-all"
                >
                  {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
                <button 
                  onClick={handleLogin}
                  className="flex items-center space-x-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Login with Google</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {analysis ? (
          <AnalysisView 
            analysis={analysis} 
            onClose={() => setAnalysis(null)} 
            onGenerateRevisionPlan={handleGenerateRevisionPlan}
            isGeneratingPlan={generatingPlan}
            onExport={handleExportQuiz}
          />
        ) : revisionPlan ? (
          <RevisionPlanView 
            plan={revisionPlan} 
            mcqs={mcqs} 
            onClose={() => setRevisionPlan(null)} 
          />
        ) : showSaved ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-extrabold text-slate-900">Your Saved Papers</h2>
              <button onClick={() => setShowSaved(false)} className="text-indigo-600 font-bold hover:underline">
                Back to Generator
              </button>
            </div>

            {savedPapers.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                <History className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-400">No saved papers found</h3>
                <p className="text-slate-400 text-sm">Generate and save your first MDCAT paper to see it here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {savedPapers.map((paper) => (
                  <div key={paper.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center space-x-2">
                        <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-full uppercase tracking-wider">
                          {paper.subject}
                        </span>
                        {paper.isPublic ? (
                          <span className="flex items-center text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
                            <Globe className="w-3 h-3 mr-1" /> Public
                          </span>
                        ) : (
                          <span className="flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            <Lock className="w-3 h-3 mr-1" /> Private
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => handleExportPaper(paper)}
                          title="Export as Text"
                          className="text-slate-300 hover:text-indigo-600 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeletePaper(paper.id)}
                          title="Delete Paper"
                          className="text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">{paper.topic}</h3>
                    <div className="flex items-center text-slate-400 text-xs mb-6">
                      <Calendar className="w-3 h-3 mr-1" />
                      {new Date(paper.createdAt).toLocaleDateString()}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => loadPaper(paper)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl text-sm transition-all"
                      >
                        Review
                      </button>
                      <button 
                        onClick={() => paper.isPublic ? handleCopyShareLink(paper) : handleTogglePublic(paper)}
                        className={`flex items-center justify-center font-bold py-2.5 rounded-xl text-sm transition-all border-2 ${
                          paper.isPublic 
                            ? 'bg-white border-indigo-100 text-indigo-600 hover:bg-indigo-50' 
                            : 'bg-white border-slate-100 text-slate-600 hover:border-indigo-200 hover:text-indigo-600'
                        }`}
                      >
                        {copied === paper.id ? (
                          <><Check className="w-4 h-4 mr-1.5" /> Copied</>
                        ) : paper.isPublic ? (
                          <><Copy className="w-4 h-4 mr-1.5" /> Link</>
                        ) : (
                          <><Share2 className="w-4 h-4 mr-1.5" /> Share</>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Hero / Intro */}
            {!sharedPaper && (
              <div className="mb-12 text-center">
                <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">
                  Expert MDCAT Paper Setter
                </h2>
                <p className="text-slate-600 max-w-2xl mx-auto text-lg">
                  Generate high-quality, conceptual MCQs based on real MDCAT patterns. 
                  Perfect for UHS, SZABMU, and PMDC exam preparation.
                </p>
              </div>
            )}

            {/* Configuration Form */}
            {!sharedPaper && (
              <div className="bg-white rounded-3xl shadow-xl shadow-indigo-100/50 border border-indigo-50 p-6 sm:p-8 mb-12">
                {/* Mode Selector */}
                <div className="flex p-1 bg-slate-100 rounded-2xl mb-8 w-fit mx-auto">
                  {(["Topic Practice", "Full Exam"] as AppMode[]).map((m) => (
                    <button
                      key={m}
                      onClick={() => {
                        setMode(m);
                        setMcqs([]);
                        setTimerActive(false);
                        setTimeLeft(null);
                      }}
                      className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                        mode === m 
                          ? 'bg-white text-indigo-600 shadow-sm' 
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>

                <form onSubmit={handleGenerate} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center">
                        <BookOpen className="w-4 h-4 mr-2" /> Subject
                      </label>
                      <select
                        value={subject}
                        onChange={(e) => setSubject(e.target.value as Subject)}
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 focus:border-indigo-500 focus:ring-0 transition-all outline-none font-medium"
                      >
                        {Object.values(Subject).map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>

                    {mode === "Topic Practice" ? (
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center">
                          <Sparkles className="w-4 h-4 mr-2" /> Topic
                        </label>
                        <input
                          type="text"
                          value={topic}
                          onChange={(e) => setTopic(e.target.value)}
                          placeholder="e.g. Genetics, Thermodynamics..."
                          className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 focus:border-indigo-500 focus:ring-0 transition-all outline-none font-medium"
                          required
                        />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center">
                          <Settings2 className="w-4 h-4 mr-2" /> Question Count
                        </label>
                        <div className="flex items-center space-x-4">
                          <input
                            type="number"
                            value={questionCount}
                            onChange={(e) => setQuestionCount(parseInt(e.target.value) || 1)}
                            min="1"
                            max="100"
                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 focus:border-indigo-500 focus:ring-0 transition-all outline-none font-medium"
                          />
                          <span className="text-xs font-bold text-slate-400 whitespace-nowrap">
                            (Std: {SUBJECT_DEFAULTS[subject]})
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center">
                        <BarChart className="w-4 h-4 mr-2" /> Difficulty: <span className="ml-2 text-indigo-600">{difficulty}</span>
                      </label>
                    </div>
                    <div className="relative h-2 bg-slate-100 rounded-full">
                      <input
                        type="range"
                        min="0"
                        max="3"
                        step="1"
                        value={DIFFICULTIES.indexOf(difficulty)}
                        onChange={(e) => setDifficulty(DIFFICULTIES[parseInt(e.target.value)])}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <div 
                        className="absolute inset-y-0 left-0 bg-indigo-600 rounded-full transition-all duration-300"
                        style={{ width: `${(DIFFICULTIES.indexOf(difficulty) / 3) * 100}%` }}
                      ></div>
                      <div className="absolute inset-0 flex justify-between px-1">
                        {DIFFICULTIES.map((d, i) => (
                          <div key={d} className={`w-1 h-1 rounded-full mt-0.5 ${i <= DIFFICULTIES.indexOf(difficulty) ? 'bg-white' : 'bg-slate-300'}`}></div>
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                      {DIFFICULTIES.map((d) => (
                        <span key={d} className={difficulty === d ? 'text-indigo-600' : ''}>{d}</span>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-indigo-200 flex items-center justify-center transition-all active:scale-95"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Generating {difficulty} {mode}...
                      </>
                    ) : (
                      <>
                        {mode === "Topic Practice" ? "Generate 10 MCQs" : `Generate ${questionCount} MCQ Exam`}
                        <ChevronRight className="w-5 h-5 ml-2" />
                      </>
                    )}
                  </button>
                </form>

                {/* Suggested Topics */}
                {mode === "Topic Practice" && (
                  <div className="mt-8 pt-8 border-t border-slate-100">
                    <div className="flex items-center text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                      <Lightbulb className="w-3 h-3 mr-1.5 text-amber-500" />
                      Suggested High-Yield Topics
                      {loadingSuggestions && <Loader2 className="w-3 h-3 ml-2 animate-spin" />}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {suggestedTopics.map((t, idx) => (
                        <button
                          key={idx}
                          onClick={() => setTopic(t)}
                          className="px-3 py-1.5 bg-slate-50 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-200 rounded-lg text-xs font-medium text-slate-600 hover:text-indigo-600 transition-all"
                        >
                          {t}
                        </button>
                      ))}
                      {!loadingSuggestions && suggestedTopics.length === 0 && (
                        <p className="text-xs text-slate-400 italic">No suggestions available for this subject.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Shared Paper Banner */}
            {sharedPaper && (
              <div className="bg-indigo-600 text-white p-6 rounded-3xl mb-12 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg shadow-indigo-200">
                <div className="flex items-center">
                  <div className="bg-white/20 p-3 rounded-2xl mr-4">
                    <Share2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Shared Practice Paper</h2>
                    <p className="text-indigo-100 text-sm">You are viewing a paper shared with you.</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setSharedPaper(null);
                    setMcqs([]);
                    window.history.replaceState({}, '', window.location.pathname);
                  }}
                  className="bg-white text-indigo-600 px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-indigo-50 transition-all"
                >
                  Create Your Own
                </button>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="bg-rose-50 border-2 border-rose-100 text-rose-800 p-4 rounded-2xl flex items-start mb-8">
                <AlertTriangle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-bold">Generation Error</p>
                  <p className="text-sm opacity-90">{error}</p>
                </div>
              </div>
            )}

            {/* MCQs List */}
            {mcqs.length > 0 && (
              <div className="space-y-8 animate-in fade-in duration-700">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <h3 className="text-2xl font-bold text-slate-800 flex items-center flex-wrap gap-2">
                    {mode === "Full Exam" ? "Full Length Exam" : "Generated MCQs"}
                    <span className="text-sm font-normal text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                      {subject}{mode === "Topic Practice" ? `: ${topic}` : ''} ({difficulty})
                    </span>
                  </h3>
                  
                  <div className="flex items-center space-x-3">
                    {timeLeft !== null && (
                      <div className={`flex items-center px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all ${
                        timeLeft < 300 ? 'bg-rose-50 border-rose-200 text-rose-600 animate-pulse' : 'bg-indigo-50 border-indigo-100 text-indigo-600'
                      }`}>
                        <Timer className="w-4 h-4 mr-2" />
                        {formatTime(timeLeft)}
                      </div>
                    )}
                    <button 
                      onClick={() => handleExportPaper({ subject, topic: mode === "Full Exam" ? "Full Exam" : topic, mcqs })}
                      className="flex items-center px-4 py-2 bg-white border-2 border-slate-100 hover:border-indigo-200 text-slate-600 hover:text-indigo-600 rounded-xl text-sm font-bold transition-all shadow-sm"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </button>
                    {user ? (
                      <button 
                        onClick={handleSavePaper}
                        disabled={saving}
                        className="flex items-center px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white rounded-xl text-sm font-bold transition-all shadow-sm"
                      >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                        {sharedPaper ? "Save to My Papers" : "Save Paper"}
                      </button>
                    ) : (
                      <p className="text-xs text-slate-400 max-w-[150px] text-right">
                        Login to save this paper.
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-2">
                  {mcqs.map((mcq, index) => (
                    <MCQCard 
                      key={mcq.id} 
                      mcq={mcq} 
                      index={index} 
                      onReportIssue={handleReportIssue}
                      onAnswer={handleAnswer}
                    />
                  ))}
                </div>

                {mcqs.length > 0 && userAnswers.length > 0 && (
                  <div className="mt-12 flex justify-center">
                    <button
                      onClick={handleAnalyze}
                      disabled={analyzing}
                      className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold py-4 px-12 rounded-2xl shadow-xl shadow-indigo-200 flex items-center transition-all active:scale-95"
                    >
                      {analyzing ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          AI is Analyzing Your Performance...
                        </>
                      ) : (
                        <>
                          Finish & Analyze Results
                          <ChevronRight className="w-5 h-5 ml-2" />
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Empty State */}
            {!loading && mcqs.length === 0 && !error && (
              <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                <div className="bg-slate-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-8 h-8 text-slate-300" />
                </div>
                <h3 className="text-lg font-bold text-slate-400">No MCQs generated yet</h3>
                <p className="text-slate-400 text-sm">Select a subject and enter a topic to begin.</p>
              </div>
            )}
          </>
        )}
      </main>

      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-12 mt-20">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <div className="flex flex-col items-center space-y-4">
            <button 
              onClick={handleGeneralFeedback}
              className="flex items-center text-indigo-600 font-bold hover:text-indigo-700 transition-colors"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Send Feedback or Suggestion
            </button>
            <p className="text-slate-500 text-sm">
              &copy; {new Date().getFullYear()} MDCAT Master. Built for Pakistani Medical Aspirants.
            </p>
          </div>
        </div>
      </footer>
      <Toaster position="top-center" richColors />
    </div>
  );
}
