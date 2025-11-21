import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, MessageSquare, CheckCircle, Settings, Clock, AlertCircle, ChevronRight, Menu, X, Award, Brain, Zap, Type, Eye, Moon, Sun, ArrowLeft, HelpCircle, BarChart2, PlayCircle, Save, Trash2, FileText, PenTool } from 'lucide-react';

// --- CONSTANTS & CONFIG ---

const AP_SUBJECTS = [
  "AP Art History", "AP Biology", "AP Calculus AB", "AP Calculus BC", 
  "AP Chemistry", "AP Chinese", "AP Computer Science A", "AP Computer Science Principles",
  "AP English Language", "AP English Literature", "AP Environmental Science", 
  "AP European History", "AP French", "AP German", "AP Gov & Politics: US", 
  "AP Gov & Politics: Comparative", "AP Human Geography", "AP Italian", 
  "AP Japanese", "AP Latin", "AP Macroeconomics", "AP Microeconomics", 
  "AP Music Theory", "AP Physics 1", "AP Physics 2", "AP Physics C: Mech", 
  "AP Physics C: E&M", "AP Psychology", "AP Research", "AP Seminar", 
  "AP Spanish Lang", "AP Spanish Lit", "AP Statistics", "AP Studio Art: 2D", 
  "AP Studio Art: 3D", "AP Studio Art: Drawing", "AP US History", "AP World History"
];

// Configuration for specific exam structures
const SUBJECT_CONFIG = {
  "AP Calculus AB": {
    desc: "Focuses on limits, derivatives, and integrals.",
    full: { mcq: 45, frq: 6, time: 195 }, // 3h 15m
    diagnostic: { mcq: 10, frq: 2, time: 45 }
  },
  "AP Calculus BC": {
    desc: "Covers AB topics plus sequences, series, and parametric equations.",
    full: { mcq: 45, frq: 6, time: 195 },
    diagnostic: { mcq: 10, frq: 2, time: 45 }
  },
  "AP Biology": {
    desc: "Study the core scientific principles of living organisms.",
    full: { mcq: 60, frq: 6, time: 90 }, 
    diagnostic: { mcq: 15, frq: 2, time: 30 }
  },
  "AP US History": {
    desc: "Analyze U.S. history from c. 1491 to the present.",
    type: "history",
    full: { mcq: 55, saq: 3, dbq: 1, leq: 1, time: 195 }, // 3h 15m
    diagnostic: { mcq: 10, saq: 1, dbq: 0, leq: 0, time: 40 }
  },
  "AP World History": {
    desc: "Explore key themes of world history from 1200 CE to the present.",
    type: "history",
    full: { mcq: 55, saq: 3, dbq: 1, leq: 1, time: 195 },
    diagnostic: { mcq: 10, saq: 1, dbq: 0, leq: 0, time: 40 }
  },
  "AP European History": {
    desc: "Study the cultural, economic, political, and social developments of Europe.",
    type: "history",
    full: { mcq: 55, saq: 3, dbq: 1, leq: 1, time: 195 },
    diagnostic: { mcq: 10, saq: 1, dbq: 0, leq: 0, time: 40 }
  },
  "AP English Language": {
    desc: "Cultivate the reading and writing skills that you need for college success.",
    full: { mcq: 45, frq: 3, time: 195 },
    diagnostic: { mcq: 10, frq: 1, time: 40 }
  },
  "AP Computer Science A": {
    desc: "Get familiar with the concepts and tools of computer science using Java.",
    full: { mcq: 40, frq: 4, time: 180 },
    diagnostic: { mcq: 10, frq: 1, time: 40 }
  },
  "DEFAULT": {
    desc: "Standardized AP curriculum practice.",
    full: { mcq: 50, frq: 4, time: 180 },
    diagnostic: { mcq: 10, frq: 1, time: 30 }
  }
};

const SYSTEM_PROMPT_TUTOR = `You are Nova, an expert AP tutor and study companion. 
- Explain concepts clearly and concisely.
- Use LaTeX formatting for ALL math equations, enclosing them in $...$ for inline and $$...$$ for block equations.
- Example: "The quadratic formula is $$x = {-b \\pm \\sqrt{b^2-4ac} \\over 2a}$$".
- Be encouraging and supportive.`;

const SYSTEM_PROMPT_GRADER = `You are an expert AP Exam grader. 
- Analyze the student's answers against the correct answers and rubrics.
- Return valid JSON only.
- JSON Structure: 
{ 
  "ap_score": 3, 
  "score_range": "3-4", 
  "raw_score": "15/20", 
  "feedback": "General feedback paragraph...", 
  "strengths": ["Topic A", "Topic B"], 
  "weaknesses": ["Topic C", "Topic D"], 
  "detailed_analysis": [ 
    { "question_id": 1, "status": "Correct", "note": "Explanation of why the answer is right/wrong..." } 
  ] 
}
- "ap_score" should be an integer 1-5 based on the difficulty and performance.`;

// --- HELPER FUNCTIONS ---

// MathJax Renderer Component
const LatexRenderer = ({ text }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    
    // Format text: preserve newlines as line breaks for HTML rendering
    const formattedText = text ? text.replace(/\n/g, '<br />') : '';
    containerRef.current.innerHTML = formattedText;

    // Trigger MathJax typesetting
    if (window.MathJax && window.MathJax.typesetPromise) {
      // Clear previous MathJax output before re-rendering
      window.MathJax.typesetClear([containerRef.current]);
      
      window.MathJax.typesetPromise([containerRef.current])
        .catch((err) => console.error('MathJax rendering error:', err));
    }
  }, [text]);

  return <div ref={containerRef} className="latex-content text-base leading-relaxed" />;
};

// Gemini API Caller
const callGemini = async (prompt, systemPrompt) => {
  const apiKey = "AIzaSyB9xg-rKXIrKFJSrj9Yxr4B-8_8-y_vyPE"; // Injected by environment

  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    systemInstruction: { parts: [{ text: systemPrompt }] }
  };

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-09-2025:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }
    );

    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated.";
  } catch (error) {
    console.error("Gemini API call failed:", error);
    throw error;
  }
};

// --- MAIN COMPONENT ---

export default function NovaScholar() {
  // View State: 'home', 'chat', 'exam_setup', 'exam_taking', 'exam_results', 'exam_history', 'exam_review'
  const [view, setView] = useState('home');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Chat State
  const [messages, setMessages] = useState([{ role: 'model', text: "Hi! I'm Nova. What subject are we crushing today?" }]);
  const [inputMessage, setInputMessage] = useState('');

  // Exam Configuration State
  const [examConfig, setExamConfig] = useState({
    mode: 'timed', // 'timed', 'untimed', 'practice'
    length: 'diagnostic' // 'diagnostic', 'full'
  });

  // Exam Data State
  const [examData, setExamData] = useState(null); // Active in-progress exam
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { questionId: answer }
  const [revealedAnswers, setRevealedAnswers] = useState({}); // For Practice Mode
  const [grading, setGrading] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);

  // History State
  const [completedExams, setCompletedExams] = useState([]); // List of graded exams
  const [reviewData, setReviewData] = useState(null); // Data for the exam being reviewed

  // Accommodations State
  const [accommodations, setAccommodations] = useState({
    largeText: false,
    highContrast: false,
    extendedTime: false,
    dyslexiaFont: false
  });
  const [showSettings, setShowSettings] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  // --- EFFECTS ---

  // Load MathJax
  useEffect(() => {
    // Configure MathJax before loading the script
    window.MathJax = {
      tex: {
        inlineMath: [['$', '$'], ['\\(', '\\)']],
        displayMath: [['$$', '$$'], ['\\[', '\\]']],
        processEscapes: true
      },
      svg: {
        fontCache: 'global'
      }
    };

    const script = document.createElement('script');
    script.src = "https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml.js";
    script.async = true;
    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  // Persist State: Load on Mount
  useEffect(() => {
    const savedState = localStorage.getItem('novaScholarState');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        setView(parsed.view || 'home');
        setSelectedSubject(parsed.selectedSubject || '');
        setMessages(parsed.messages || [{ role: 'model', text: "Hi! I'm Nova. What subject are we crushing today?" }]);
        setExamConfig(parsed.examConfig || { mode: 'timed', length: 'diagnostic' });
        setExamData(parsed.examData || null);
        setCurrentQuestionIndex(parsed.currentQuestionIndex || 0);
        setAnswers(parsed.answers || {});
        setRevealedAnswers(parsed.revealedAnswers || {});
        setGrading(parsed.grading || null);
        setTimeLeft(parsed.timeLeft || 0);
        setCompletedExams(parsed.completedExams || []); // Load completed exams
      } catch (e) {
        console.error("Failed to load saved state", e);
      }
    }
    setDataLoaded(true);
  }, []);

  // Persist State: Save on Change
  useEffect(() => {
    if (!dataLoaded) return;
    const stateToSave = {
      view, selectedSubject, messages, examConfig, examData, 
      currentQuestionIndex, answers, revealedAnswers, grading, timeLeft,
      completedExams // Save completed exams
    };
    localStorage.setItem('novaScholarState', JSON.stringify(stateToSave));
  }, [view, selectedSubject, messages, examConfig, examData, currentQuestionIndex, answers, revealedAnswers, grading, timeLeft, dataLoaded, completedExams]);


  // Timer Logic
  useEffect(() => {
    let timer;
    if (view === 'exam_taking' && examConfig.mode === 'timed' && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            submitExam(); // Auto-submit on time out
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [view, timeLeft, examConfig.mode]);

  // --- HANDLERS ---

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    
    const userMsg = { role: 'user', text: inputMessage };
    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);

    try {
      const responseText = await callGemini(inputMessage, SYSTEM_PROMPT_TUTOR);
      setMessages(prev => [...prev, { role: 'model', text: responseText }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'model', text: "Sorry, I encountered an error connecting to my brain. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const configureExam = (subject) => {
    setSelectedSubject(subject);
    setView('exam_config');
  };

  const clearProgress = (clearHistory = false) => {
    const message = clearHistory 
        ? "Are you sure you want to clear ALL saved progress, including your exam history? This cannot be undone."
        : "Are you sure you want to clear your current in-progress exam?";
        
    if (window.confirm(message)) {
      if (clearHistory) {
        localStorage.removeItem('novaScholarState');
        setCompletedExams([]);
      }
      
      // Reset relevant state for active exam
      setExamData(null);
      setAnswers({});
      setRevealedAnswers({});
      setGrading(null);
      setCurrentQuestionIndex(0);
      setView('home');
    }
  };

  const generateExam = async () => {
    setLoading(true);
    setError(null);
    
    // Get Configuration based on Subject
    const config = SUBJECT_CONFIG[selectedSubject] || SUBJECT_CONFIG["DEFAULT"];
    const typeConfig = examConfig.length === 'full' ? config.full : config.diagnostic;
    const isHistory = config.type === 'history';

    let requirementsPrompt = "";

    if (isHistory) {
        // History Exam Structure (MCQ, SAQ, DBQ, LEQ)
        requirementsPrompt = `
        - Include exactly ${typeConfig.mcq} Multiple Choice Questions (MCQ).
        - Include exactly ${typeConfig.saq} Short Answer Questions (SAQ). Type: "saq".
        ${typeConfig.dbq > 0 ? `- Include exactly ${typeConfig.dbq} Document Based Question (DBQ). Type: "dbq". **IMPORTANT**: For the DBQ, you MUST invent and include text content for 4-5 historical documents (Source A, Source B, etc.) within the 'text' field of the question.` : ''}
        ${typeConfig.leq > 0 ? `- Include exactly ${typeConfig.leq} Long Essay Question (LEQ). Type: "leq".` : ''}
        - Valid types: "mcq", "saq", "dbq", "leq".
        `;
    } else {
        // Standard Exam Structure (MCQ, FRQ)
        requirementsPrompt = `
        - Include exactly ${typeConfig.mcq} Multiple Choice Questions (MCQ).
        - Include exactly ${typeConfig.frq} Free Response Questions (FRQ).
        - Valid types: "mcq", "frq".
        `;
    }
    
    const promptText = `Create a ${examConfig.length} practice exam for ${selectedSubject}.
    - Structure: { "title": "Exam Title", "questions": [ { "id": 1, "type": "mcq", "text": "Question text...", "options": ["A", "B", "C", "D"], "correct": 0, "explanation": "Why A is correct" }, { "id": 2, "type": "frq", "text": "Free response prompt...", "grading_rubric": "Key points needed..." } ] }
    ${requirementsPrompt}
    - Ensure questions follow College Board AP difficulty.
    - Use LaTeX for ALL math.
    - CRITICAL: You are outputting a JSON string. You MUST escape all backslashes in LaTeX code. For example, write "\\\\frac" instead of "\\frac" and "\\\\sqrt" instead of "\\sqrt". 
    - Failure to double-escape backslashes will cause a syntax error.
    - Generate valid JSON only.`;

    const systemPrompt = `You are an AP Exam creator. Output raw JSON only. No markdown code blocks. Escape all LaTeX backslashes (e.g., \\\\frac).`;

    try {
      const rawJson = await callGemini(promptText, systemPrompt);
      const cleanJson = rawJson.replace(/```json/g, '').replace(/```/g, '').trim();
      
      const data = JSON.parse(cleanJson);
      
      setExamData(data);
      setAnswers({});
      setRevealedAnswers({});
      setCurrentQuestionIndex(0);
      
      // Timer Setup
      let totalSeconds = typeConfig.time * 60; // Convert mins to seconds
      if (accommodations.extendedTime) totalSeconds = Math.floor(totalSeconds * 1.5);
      
      setTimeLeft(totalSeconds);
      
      setView('exam_taking');
    } catch (err) {
      console.error(err);
      setError("Failed to generate exam data. The AI may have produced invalid JSON characters or timed out due to the size of the request. Please try 'Diagnostic' mode first.");
    } finally {
      setLoading(false);
    }
  };

  const submitExam = async () => {
    setLoading(true);
    try {
      const prompt = JSON.stringify({
        subject: selectedSubject,
        exam_config: examConfig,
        exam_questions: examData.questions,
        student_answers: answers
      });
      
      const rawJson = await callGemini(prompt, SYSTEM_PROMPT_GRADER + " CRITICAL: Escape all LaTeX backslashes in your JSON response (e.g. \\\\frac).");
      const cleanJson = rawJson.replace(/```json/g, '').replace(/```/g, '').trim();
      const result = JSON.parse(cleanJson);
      
      // 1. Save the completed exam to history
      const completedExam = {
          id: Date.now(),
          subject: selectedSubject,
          config: examConfig,
          data: examData,
          answers: answers,
          grading: result,
          completedAt: new Date().toISOString()
      };

      setCompletedExams(prev => [...prev, completedExam]);

      // 2. Set current grading state
      setGrading(result);

      // 3. Clear the active exam state (It's now in history)
      setExamData(null); 
      setAnswers({});
      setRevealedAnswers({});
      setCurrentQuestionIndex(0);

      // 4. Navigate
      setView('exam_results');

    } catch (err) {
      setError("Failed to grade exam. Please try submitting again.");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
        return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // --- UI HELPERS ---
  
  const getThemeClasses = () => {
    let classes = "min-h-screen transition-colors duration-300 ";
    if (accommodations.highContrast) {
      classes += "bg-black text-yellow-400 ";
    } else {
      classes += "bg-slate-50 text-slate-900 ";
    }
    if (accommodations.dyslexiaFont) {
      classes += "font-mono "; // Simulating open-dyslexic
    } else {
      classes += "font-sans ";
    }
    if (accommodations.largeText) {
      classes += "text-lg ";
    }
    return classes;
  };
  
  const getReviewData = () => {
      // Check if we are viewing a history exam
      if (view === 'exam_review' && reviewData) {
          return {
              subject: reviewData.subject,
              examData: reviewData.data,
              grading: reviewData.grading
          };
      }
      // Check if we just finished an exam
      if (view === 'exam_results' && grading) {
          // Note: When viewing exam_results, examData and selectedSubject are still valid 
          // right before they are cleared, but since we save to history first, 
          // we should rely on the last item in history for safety.
          const lastCompleted = completedExams[completedExams.length - 1];
          return {
              subject: lastCompleted?.subject || selectedSubject,
              examData: lastCompleted?.data || examData,
              grading: lastCompleted?.grading || grading
          };
      }
      return null;
  };

  // --- RENDER SECTIONS ---

  const renderHome = () => (
    <div className="max-w-4xl mx-auto p-6 space-y-12">
      <div className="text-center space-y-6 mt-10">
        <div className="inline-block p-3 bg-blue-100 rounded-full text-blue-600 mb-4">
          <Brain size={48} />
        </div>
        <h1 className="text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Nova<span className="text-blue-600">Scholar</span>
        </h1>
        <p className="text-xl text-slate-600 max-w-2xl mx-auto">
          Your AI companion for AP mastery. Adaptive tutoring, realistic simulations, and instant feedback.
        </p>
        
        <div className="flex flex-wrap justify-center gap-4 pt-4">
          <button 
            onClick={() => setView('chat')}
            className="flex items-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-full font-semibold hover:bg-slate-800 transition shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            <MessageSquare size={20} />
            Start Chatting
          </button>
          <button 
            onClick={() => setView('exam_setup')}
            className="flex items-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 transition shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            <CheckCircle size={20} />
            Take Mock Exam
          </button>
          <button 
            onClick={() => setView('exam_history')}
            disabled={completedExams.length === 0}
            className={`flex items-center gap-2 px-8 py-4 bg-purple-600 text-white rounded-full font-semibold transition shadow-lg transform hover:-translate-y-1 ${completedExams.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-purple-700 hover:shadow-xl'}`}
          >
            <BarChart2 size={20} />
            Review Past Exams ({completedExams.length})
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 pt-12">
        {[
          { icon: <Award className="text-amber-500" />, title: "Score Prediction", desc: "Get a projected AP score (1-5) based on your performance." },
          { icon: <Zap className="text-purple-500" />, title: "Practice Mode", desc: "Immediate feedback on every question to learn as you go." },
          { icon: <Eye className="text-emerald-500" />, title: "Inclusive Design", desc: "Dyslexia-friendly fonts, high contrast, and extended time options." }
        ].map((feat, i) => (
          <div key={i} className="p-6 bg-white rounded-2xl shadow-sm border border-slate-200">
            <div className="mb-4">{feat.icon}</div>
            <h3 className="font-bold text-lg mb-2">{feat.title}</h3>
            <p className="text-slate-600">{feat.desc}</p>
          </div>
        ))}
      </div>

      {/* Resume Prompt if data exists */}
      {examData && (
        <div className="mt-8 p-6 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-between">
          <div>
            <h4 className="font-bold text-indigo-900">Progress Saved</h4>
            <p className="text-indigo-700 text-sm">You have an exam in progress for {selectedSubject}.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => clearProgress(false)} className="px-4 py-2 text-indigo-600 font-medium hover:bg-indigo-100 rounded-lg transition">
              Clear Active Exam
            </button>
            <button onClick={() => setView('exam_taking')} className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition shadow-md">
              Resume
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const renderExamSetup = () => (
    <div className="max-w-2xl mx-auto p-6">
      <button onClick={() => setView('home')} className="mb-6 flex items-center text-slate-500 hover:text-slate-800">
        <ArrowLeft size={18} className="mr-2" /> Back to Home
      </button>
      
      <h2 className="text-3xl font-bold mb-6">Select Subject</h2>
      <div className="grid gap-3">
        {AP_SUBJECTS.map(subject => (
          <button
            key={subject}
            onClick={() => configureExam(subject)}
            className="text-left p-4 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition flex items-center justify-between group bg-white"
          >
            <span className="font-medium">{subject}</span>
            <ChevronRight className="text-slate-300 group-hover:text-blue-500" size={20} />
          </button>
        ))}
      </div>
    </div>
  );

  const renderExamConfig = () => {
    const config = SUBJECT_CONFIG[selectedSubject] || SUBJECT_CONFIG["DEFAULT"];
    const isHistory = config.type === 'history';

    const renderCount = (type) => {
        if (isHistory) {
            return `${type.mcq} MCQs + ${type.saq} SAQs` + (type.dbq ? ` + ${type.dbq} DBQ` : '') + (type.leq ? ` + ${type.leq} LEQ` : '');
        }
        return `${type.mcq} MCQs + ${type.frq} FRQs`;
    };

    return (
      <div className="max-w-2xl mx-auto p-6">
        <button onClick={() => setView('exam_setup')} className="mb-6 flex items-center text-slate-500 hover:text-slate-800">
          <ArrowLeft size={18} className="mr-2" /> Change Subject
        </button>

        <h2 className="text-3xl font-bold mb-2">{selectedSubject}</h2>
        <p className="text-slate-600 mb-6 italic">{config.desc}</p>

        <div className="space-y-8">
          {/* Mode Selection */}
          <div>
              <label className="block text-sm font-bold uppercase tracking-wide text-slate-500 mb-3">Exam Mode</label>
              <div className="grid md:grid-cols-3 gap-4">
                  <button 
                      onClick={() => setExamConfig(p => ({...p, mode: 'timed'}))}
                      className={`p-4 rounded-xl border-2 text-left transition ${examConfig.mode === 'timed' ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600' : 'border-slate-200 hover:border-blue-300'}`}
                  >
                      <Clock className="mb-3 text-blue-600" />
                      <div className="font-bold mb-1">Timed Mock</div>
                      <div className="text-xs text-slate-500">Strict timer. No hints. Graded at end.</div>
                  </button>
                  <button 
                      onClick={() => setExamConfig(p => ({...p, mode: 'untimed'}))}
                      className={`p-4 rounded-xl border-2 text-left transition ${examConfig.mode === 'untimed' ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600' : 'border-slate-200 hover:border-blue-300'}`}
                  >
                      <PlayCircle className="mb-3 text-green-600" />
                      <div className="font-bold mb-1">Untimed Exam</div>
                      <div className="text-xs text-slate-500">No timer. No hints. Graded at end.</div>
                  </button>
                  <button 
                      onClick={() => setExamConfig(p => ({...p, mode: 'practice'}))}
                      className={`p-4 rounded-xl border-2 text-left transition ${examConfig.mode === 'practice' ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600' : 'border-slate-200 hover:border-blue-300'}`}
                  >
                      <Zap className="mb-3 text-amber-600" />
                      <div className="font-bold mb-1">Practice Drill</div>
                      <div className="text-xs text-slate-500">No timer. Instant feedback per question.</div>
                  </button>
              </div>
          </div>

          {/* Length Selection with DYNAMIC labels */}
          <div>
              <label className="block text-sm font-bold uppercase tracking-wide text-slate-500 mb-3">Exam Length</label>
              <div className="grid md:grid-cols-2 gap-4">
                  <button 
                      onClick={() => setExamConfig(p => ({...p, length: 'diagnostic'}))}
                      className={`p-4 rounded-xl border-2 text-left transition ${examConfig.length === 'diagnostic' ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600' : 'border-slate-200 hover:border-blue-300'}`}
                  >
                      <div className="font-bold mb-1">Diagnostic (Short)</div>
                      <div className="text-xs text-slate-500">
                        {renderCount(config.diagnostic)} (~{config.diagnostic.time} min)
                      </div>
                  </button>
                  <button 
                      onClick={() => setExamConfig(p => ({...p, length: 'full'}))}
                      className={`p-4 rounded-xl border-2 text-left transition ${examConfig.length === 'full' ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600' : 'border-slate-200 hover:border-blue-300'}`}
                  >
                      <div className="font-bold mb-1">Simulated (Long)</div>
                      <div className="text-xs text-slate-500">
                         {renderCount(config.full)} (~{config.full.time} min)
                      </div>
                  </button>
              </div>
          </div>

          <div className="pt-4">
              <button 
                  onClick={generateExam}
                  disabled={loading}
                  className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
              >
                  {loading ? <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" /> : <PlayCircle />}
                  {loading ? (examConfig.length === 'full' ? 'Generating Full Exam (this takes ~30s)...' : 'Building Exam...') : 'Start Exam'}
              </button>
              {error && <p className="text-red-500 text-center mt-4">{error}</p>}
          </div>
        </div>
      </div>
    );
  };

  const renderExamTaking = () => {
    if (!examData) return null;
    const question = examData.questions[currentQuestionIndex];
    const isLast = currentQuestionIndex === examData.questions.length - 1;
    const isPractice = examConfig.mode === 'practice';
    const isRevealed = revealedAnswers[question.id];

    // Dynamic Type Labels
    const typeLabels = {
        mcq: 'Multiple Choice',
        frq: 'Free Response',
        saq: 'Short Answer',
        dbq: 'Document Based Question',
        leq: 'Long Essay Question'
    };

    // Icons for types
    const typeIcons = {
        mcq: CheckCircle,
        frq: PenTool,
        saq: PenTool,
        dbq: FileText,
        leq: BookOpen
    };

    const TypeIcon = typeIcons[question.type] || HelpCircle;

    return (
      <div className="max-w-5xl mx-auto p-4 md:p-6 h-[calc(100vh-80px)] flex flex-col">
        {/* Exam Header */}
        <div className="flex flex-wrap justify-between items-center mb-6 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-4">
             <h2 className="font-bold text-lg hidden md:block">{examData.title || selectedSubject}</h2>
             <span className="bg-slate-100 px-3 py-1 rounded-full text-xs font-bold uppercase text-slate-600 tracking-wide">{examConfig.mode} Mode</span>
             <button onClick={() => clearProgress(false)} className="text-slate-400 hover:text-red-500 flex items-center gap-1 text-xs font-bold uppercase ml-2">
                <Trash2 size={14} /> Quit
             </button>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="text-sm font-medium text-slate-500">
                Question {currentQuestionIndex + 1} / {examData.questions.length}
            </div>
            {examConfig.mode === 'timed' && (
                <div className={`flex items-center gap-2 font-mono text-xl font-bold ${timeLeft < 60 ? 'text-red-500 animate-pulse' : 'text-slate-700'}`}>
                    <Clock size={20} />
                    {formatTime(timeLeft)}
                </div>
            )}
          </div>
        </div>

        {/* Question Area */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row gap-6">
           {/* Left: Question Content */}
           <div className="flex-1 overflow-y-auto bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200">
                <span className={`inline-flex items-center gap-2 px-3 py-1 ${question.type === 'dbq' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'} text-xs font-bold rounded-full mb-4 uppercase`}>
                    <TypeIcon size={14}/> {typeLabels[question.type] || 'Question'}
                </span>
                <div className="text-lg leading-relaxed text-slate-800 mb-6">
                    <LatexRenderer text={question.text} />
                </div>

                {/* Practice Mode Explanation */}
                {isPractice && isRevealed && (
                    <div className="mt-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-xl animate-in fade-in slide-in-from-top-4">
                        <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2"><Brain size={16}/> AI Explanation</h4>
                        <div className="text-blue-800 text-sm">
                            <LatexRenderer text={question.explanation || question.grading_rubric || "No explanation provided."} />
                        </div>
                    </div>
                )}
           </div>

           {/* Right: Inputs */}
           <div className="w-full md:w-1/3 bg-slate-50 p-6 rounded-2xl border border-slate-200 flex flex-col overflow-y-auto">
                <h3 className="font-bold text-slate-700 mb-4">Your Answer</h3>
                
                {question.type === 'mcq' ? (
                  <div className="space-y-3">
                    {question.options.map((opt, idx) => {
                        const isSelected = answers[question.id] === idx;
                        let btnClass = "w-full text-left p-4 rounded-xl border-2 transition flex items-center gap-3 hover:border-slate-300 ";
                        
                        if (isPractice && isRevealed) {
                             if (idx === question.correct) btnClass = "w-full text-left p-4 rounded-xl border-2 transition flex items-center gap-3 bg-green-100 border-green-500 text-green-900";
                             else if (isSelected && idx !== question.correct) btnClass = "w-full text-left p-4 rounded-xl border-2 transition flex items-center gap-3 bg-red-50 border-red-300 opacity-70";
                             else btnClass = "w-full text-left p-4 rounded-xl border-2 transition flex items-center gap-3 border-slate-100 opacity-50";
                        } else {
                             if (isSelected) btnClass = "w-full text-left p-4 rounded-xl border-2 transition flex items-center gap-3 border-blue-500 bg-blue-50 text-blue-800";
                             else btnClass = "w-full text-left p-4 rounded-xl border-2 transition flex items-center gap-3 border-white bg-white shadow-sm";
                        }

                        return (
                            <button
                                key={idx}
                                onClick={() => !isRevealed && setAnswers(prev => ({...prev, [question.id]: idx}))}
                                disabled={isRevealed}
                                className={btnClass}
                            >
                                <span className={`w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-full font-bold text-xs ${
                                    isSelected ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
                                }`}>
                                {String.fromCharCode(65 + idx)}
                                </span>
                                <div className="text-sm"><LatexRenderer text={opt} /></div>
                            </button>
                        );
                    })}
                  </div>
                ) : (
                  <textarea 
                    className="w-full flex-1 min-h-[200px] p-4 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-0 resize-none font-mono text-sm mb-4"
                    placeholder="Type your response here..."
                    value={answers[question.id] || ''}
                    onChange={(e) => setAnswers(prev => ({...prev, [question.id]: e.target.value}))}
                    disabled={isRevealed}
                  />
                )}

                <div className="mt-auto pt-6 space-y-3">
                    {isPractice && !isRevealed && (
                        <button 
                            onClick={() => setRevealedAnswers(p => ({...p, [question.id]: true}))}
                            className="w-full py-3 bg-amber-100 text-amber-800 rounded-xl font-bold hover:bg-amber-200 transition flex items-center justify-center gap-2"
                        >
                            <Zap size={18} /> Check Answer
                        </button>
                    )}

                    <div className="flex gap-3">
                        <button 
                            onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                            disabled={currentQuestionIndex === 0}
                            className="flex-1 py-3 rounded-xl font-medium text-slate-600 hover:bg-slate-200 disabled:opacity-50"
                        >
                            Previous
                        </button>
                        
                        {isLast ? (
                            <button 
                            onClick={submitExam}
                            disabled={loading}
                            className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition shadow-lg flex items-center justify-center gap-2"
                            >
                            {loading ? 'Grading...' : 'Finish'} <CheckCircle size={18} />
                            </button>
                        ) : (
                            <button 
                            onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                            className="flex-1 py-3 bg-slate-800 text-white rounded-xl font-medium hover:bg-slate-700 transition shadow-lg"
                            >
                            Next
                            </button>
                        )}
                    </div>
                </div>
           </div>
        </div>
      </div>
    );
  };

  const renderResults = () => {
    const reportData = getReviewData();
    if (!reportData) return <div className="p-6">No exam data found to display.</div>;

    const { subject, examData: exam, grading: report } = reportData;
    
    return (
        <div className="max-w-4xl mx-auto p-6 pb-20">
          <div className="flex items-center justify-between mb-8">
            <div>
                <h2 className="text-3xl font-bold mb-1">Performance Report</h2>
                <p className="text-slate-500">Analysis for {subject}</p>
            </div>
            <button 
                onClick={() => setView(view === 'exam_review' ? 'exam_history' : 'home')} 
                className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition"
            >
              {view === 'exam_review' ? 'Back to History' : 'Back to Dashboard'}
            </button>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {/* Main Score Card */}
            <div className="md:col-span-2 bg-gradient-to-br from-slate-900 to-slate-800 text-white p-8 rounded-2xl shadow-xl relative overflow-hidden">
                <div className="relative z-10">
                    <h3 className="text-slate-300 font-bold uppercase tracking-wider text-sm mb-2">Predicted AP Score</h3>
                    <div className="flex items-baseline gap-4">
                        <span className="text-6xl font-extrabold text-white">{report?.ap_score || '?'}</span>
                        <span className="text-xl text-slate-400">/ 5</span>
                    </div>
                    <div className="mt-4 h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div 
                            className={`h-full ${report?.ap_score >= 3 ? 'bg-green-400' : 'bg-red-400'}`} 
                            style={{width: `${(report?.ap_score / 5) * 100}%`}}
                        ></div>
                    </div>
                    <p className="mt-4 text-slate-300 leading-relaxed">{report?.feedback}</p>
                </div>
                <Award className="absolute right-[-20px] bottom-[-20px] text-white opacity-5" size={200} />
            </div>

            {/* Stats Card */}
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100 flex flex-col justify-center">
                 <div className="mb-6">
                    <div className="text-sm text-slate-500 font-bold uppercase mb-1">Raw Score</div>
                    <div className="text-3xl font-bold text-slate-800">{report?.raw_score}</div>
                 </div>
                 <div className="space-y-3">
                    {report?.strengths?.length > 0 && (
                        <div>
                            <div className="flex items-center gap-2 text-green-600 font-bold text-sm mb-1"><CheckCircle size={14}/> Strengths</div>
                            <div className="flex flex-wrap gap-1">
                                {report.strengths.map((s,i) => <span key={i} className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded-md">{s}</span>)}
                            </div>
                        </div>
                    )}
                    {report?.weaknesses?.length > 0 && (
                        <div>
                            <div className="flex items-center gap-2 text-red-500 font-bold text-sm mb-1"><AlertCircle size={14}/> Focus Areas</div>
                            <div className="flex flex-wrap gap-1">
                                {report.weaknesses.map((s,i) => <span key={i} className="px-2 py-1 bg-red-50 text-red-700 text-xs rounded-md">{s}</span>)}
                            </div>
                        </div>
                    )}
                 </div>
            </div>
          </div>

          {/* Detailed Analysis */}
          <h3 className="font-bold text-xl mb-4 flex items-center gap-2"><BarChart2 className="text-blue-600"/> Question Analysis</h3>
          <div className="space-y-4">
            {report?.detailed_analysis?.map((item, idx) => {
                const originalQ = exam.questions.find(q => q.id === item.question_id);
                const isCorrect = item.status?.toLowerCase().includes('correct');
                
                return (
                  <div key={idx} className={`group bg-white rounded-xl border transition-all hover:shadow-md overflow-hidden ${isCorrect ? 'border-slate-200' : 'border-red-200'}`}>
                    <div className={`px-6 py-4 flex justify-between items-center cursor-pointer bg-slate-50 border-b ${isCorrect ? 'border-slate-100' : 'border-red-100 bg-red-50/30'}`}>
                        <div className="flex items-center gap-3">
                            <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {idx + 1}
                            </span>
                            <span className="font-bold text-slate-700">
                                {originalQ?.type === 'mcq' ? 'Multiple Choice' : originalQ?.type.toUpperCase()}
                            </span>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {item.status}
                        </span>
                    </div>
                    
                    <div className="p-6">
                        <div className="mb-4 text-slate-600 text-sm bg-slate-50 p-4 rounded-lg">
                            <strong className="block text-slate-400 text-xs uppercase mb-2">Question</strong>
                            <LatexRenderer text={originalQ?.text || "Question text"} />
                        </div>
                        <div>
                            <strong className="block text-slate-400 text-xs uppercase mb-2">AI Analysis</strong>
                            <div className="text-slate-800 leading-relaxed">
                                <LatexRenderer text={item.note} />
                            </div>
                        </div>
                    </div>
                  </div>
                );
            })}
          </div>
        </div>
    );
  };
  
  const renderExamHistory = () => (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <button onClick={() => setView('home')} className="flex items-center text-slate-500 hover:text-slate-800">
            <ArrowLeft size={18} className="mr-2" /> Back to Home
        </button>
        <button onClick={() => clearProgress(true)} className="px-4 py-2 text-red-600 font-medium hover:bg-red-50 rounded-lg transition flex items-center gap-2">
            <Trash2 size={16} /> Clear All History
        </button>
      </div>

      <h2 className="text-3xl font-bold mb-6 flex items-center gap-3"><BarChart2 className="text-purple-600" /> Exam History ({completedExams.length})</h2>

      {completedExams.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-xl shadow-sm border border-slate-200">
            <AlertCircle size={32} className="text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600">You haven't completed any graded exams yet. Start a new mock exam to build your history!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {completedExams.slice().reverse().map((exam) => (
            <div 
              key={exam.id} 
              className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm flex justify-between items-center transition hover:shadow-md cursor-pointer"
              onClick={() => {
                  setReviewData(exam);
                  setView('exam_review');
              }}
            >
              <div>
                <h3 className="font-bold text-lg text-slate-800 mb-1">{exam.subject} - {exam.data.title || 'Practice Exam'}</h3>
                <p className="text-sm text-slate-500">
                  {new Date(exam.completedAt).toLocaleDateString()} at {new Date(exam.completedAt).toLocaleTimeString()}
                </p>
                <div className="flex gap-2 mt-2 text-xs">
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">{exam.config.length}</span>
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full">{exam.config.mode}</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className={`text-3xl font-extrabold ${exam.grading?.ap_score >= 3 ? 'text-green-600' : 'text-red-500'}`}>
                    {exam.grading?.ap_score || '?'}
                </span>
                <ChevronRight className="text-slate-400" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderChat = () => (
    <div className="max-w-4xl mx-auto h-[calc(100vh-80px)] flex flex-col p-4">
      <div className="flex items-center justify-between mb-4 bg-white p-4 rounded-xl shadow-sm">
        <button onClick={() => setView('home')} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600">
          <ArrowLeft size={20} />
        </button>
        <h2 className="font-bold text-xl">AI Study Partner</h2>
        <div className="w-10"></div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-4 rounded-xl bg-white shadow-inner border border-slate-100">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-4 rounded-2xl ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-br-none' 
                : 'bg-slate-100 text-slate-800 rounded-bl-none border border-slate-200'
            }`}>
              <LatexRenderer text={msg.text} />
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-100 p-4 rounded-2xl rounded-bl-none animate-pulse text-slate-400">
              Thinking...
            </div>
          </div>
        )}
      </div>

      <div className="relative">
        <input 
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Ask about Calculus, History, or paste a problem..."
          className="w-full p-4 pr-14 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:ring-0 transition shadow-sm"
        />
        <button 
          onClick={handleSendMessage}
          disabled={loading}
          className="absolute right-3 top-3 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );

  return (
    <div className={getThemeClasses()}>
      {/* Nav */}
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex justify-between items-center">
        <div 
            className="flex items-center gap-2 font-bold text-xl cursor-pointer" 
            onClick={() => setView('home')}
        >
          <BookOpen className="text-blue-600" />
          <span className={accommodations.highContrast ? "text-yellow-400" : "text-slate-900"}>NovaScholar</span>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => setShowSettings(true)}
            className="p-2 rounded-full hover:bg-slate-100 transition"
            title="Accommodations"
          >
            <Settings size={24} className={accommodations.highContrast ? "text-yellow-400" : "text-slate-600"} />
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="min-h-[calc(100vh-73px)]">
        {view === 'home' && renderHome()}
        {view === 'chat' && renderChat()}
        {view === 'exam_setup' && renderExamSetup()}
        {view === 'exam_config' && renderExamConfig()}
        {view === 'exam_taking' && renderExamTaking()}
        {(view === 'exam_results' || view === 'exam_review') && renderResults()}
        {view === 'exam_history' && renderExamHistory()}
      </main>

      {showSettings && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Settings className="text-blue-600" /> Accommodations
              </h3>
              <button onClick={() => setShowSettings(false)}><X className="text-slate-400 hover:text-slate-600" /></button>
            </div>
            <div className="p-6 space-y-6">
                {/* Settings Toggles (Large Text, High Contrast, Extended Time, Dyslexia Font) */}
                {[
                    { id: 'largeText', icon: Type, label: 'Larger Text' },
                    { id: 'highContrast', icon: Sun, label: 'High Contrast Mode' },
                    { id: 'extendedTime', icon: Clock, label: 'Extended Time (50%)' },
                    { id: 'dyslexiaFont', icon: Eye, label: 'Dyslexia Friendly Font' }
                ].map(setting => (
                    <div key={setting.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <setting.icon size={20} className="text-slate-500" />
                            <span>{setting.label}</span>
                        </div>
                        <button 
                            onClick={() => setAccommodations(p => ({...p, [setting.id]: !p[setting.id]}))}
                            className={`w-12 h-6 rounded-full transition-colors relative ${accommodations[setting.id] ? 'bg-blue-600' : 'bg-slate-300'}`}
                        >
                            <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${accommodations[setting.id] ? 'left-7' : 'left-1'}`} />
                        </button>
                    </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
