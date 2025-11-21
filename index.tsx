import React, { useState, useEffect, useCallback, useMemo } from 'react';

// --- Global Constants and Configuration ---
const API_KEY = ""; // Placeholder for Canvas environment injection
const MODEL = 'gemini-2.5-flash-preview-09-2025';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

const AP_SUBJECTS = [
    'AP Calculus AB', 'AP US History', 'AP Biology', 'AP Physics 1', 'AP Chemistry',
    'AP English Language', 'AP European History', 'AP Computer Science A', 'AP Macroeconomics',
    'AP Psychology', 'AP Environmental Science', 'AP Statistics', 'AP World History: Modern',
    'AP Art History', 'AP Music Theory'
];

// --- Utility Functions ---

// Exponential backoff retry logic for resilient API calls
const fetchWithRetry = async (url, options, retries = 3) => {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`HTTP error! Status: ${response.status}. Body: ${errorBody}`);
            }
            return response;
        } catch (error) {
            console.error(`Attempt ${i + 1} failed:`, error.message);
            if (i < retries - 1) {
                const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                throw new Error("Failed to fetch content after multiple retries.");
            }
        }
    }
};

// --- Inclusivity Settings Context ---
const SettingsContext = React.createContext();

const useSettings = () => React.useContext(SettingsContext);

const SettingsProvider = ({ children }) => {
    // Load settings from localStorage or use defaults
    const [settings, setSettings] = useState(() => {
        const savedSettings = localStorage.getItem('novaScholarSettings');
        return savedSettings ? JSON.parse(savedSettings) : {
            largeText: false,
            highContrast: false,
            dyslexiaFont: false,
            extendedTime: false,
        };
    });

    useEffect(() => {
        localStorage.setItem('novaScholarSettings', JSON.stringify(settings));
    }, [settings]);

    const toggleSetting = (key) => {
        setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const contextValue = useMemo(() => ({ settings, toggleSetting }), [settings]);

    return (
        <SettingsContext.Provider value={contextValue}>
            {children}
        </SettingsContext.Provider>
    );
};

// --- UI Components ---

// Component for Rendering LaTeX (Simulated)
const LaTeXDisplay = ({ text }) => {
    // 1. Replace double-escaped backslashes with single backslashes for display
    let displayHtml = text.replace(/\\\\/g, '\\');

    // 2. Simulate LaTeX rendering (In a real app, MathJax/KaTeX would process this)
    displayHtml = displayHtml.replace(/\$(.*?)\$/g, (match, p1) =>
        `<span class="font-mono bg-indigo-100 text-indigo-700 px-1 py-0.5 rounded text-sm">${p1}</span>`
    );

    displayHtml = displayHtml.replace(/\$\$(.*?)\$\$/g, (match, p1) =>
        `<div class="my-3 p-3 bg-indigo-50 border-l-4 border-indigo-400 font-mono text-lg">${p1}</div>`
    );

    const { settings } = useSettings();

    return (
        <p className={`leading-relaxed ${settings.largeText ? 'text-xl' : 'text-base'} ${settings.dyslexiaFont ? 'font-mono' : 'font-sans'}`} 
            dangerouslySetInnerHTML={{ __html: displayHtml }} 
        />
    );
};

// Settings Modal
const SettingsModal = ({ isVisible, onClose }) => {
    const { settings, toggleSetting } = useSettings();

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-70 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 transform transition-all">
                <div className="flex justify-between items-center border-b pb-4 mb-4">
                    <h2 className="text-2xl font-bold text-gray-800">Accessibility Settings</h2>
                    <button onClick={onClose} className="p-1 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
                
                <div className="space-y-4">
                    {Object.entries(settings).map(([key, value]) => (
                        <div key={key} className="flex justify-between items-center py-2 border-b last:border-b-0">
                            <label className="text-lg font-medium text-gray-700 capitalize">
                                {key.replace(/([A-Z])/g, ' $1').trim()}
                            </label>
                            <button
                                onClick={() => toggleSetting(key)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                    value ? 'bg-indigo-600' : 'bg-gray-300'
                                }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 shadow ${
                                        value ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                                />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// Loading/Error State
const StatusDisplay = ({ isLoading, error }) => {
    if (error) {
        return (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg shadow-md max-w-2xl mx-auto" role="alert">
                <p className="font-bold mb-2">Generation Error</p>
                <p>{error}</p>
                <p className="mt-2 text-sm text-red-600">Please check the console for details and try adjusting your prompt.</p>
            </div>
        );
    }
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl shadow-lg max-w-2xl mx-auto">
                <svg className="animate-spin h-10 w-10 text-indigo-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-xl font-medium text-gray-700">Generating Exam Content...</p>
                <p className="text-sm text-gray-500 mt-1">Structuring questions, expect up to 30 seconds.</p>
            </div>
        );
    }
    return null;
};

// --- API Logic for Exam Generation ---
const generateExamData = async (subject, topicFocus, examLength, setError) => {
    const userQuery = `Generate an original practice exam for ${subject} with ${examLength} questions, focusing specifically on: "${topicFocus}". The exam must strictly follow the required JSON schema for AP exam content.`;
    
    // System instruction identical to the prompt generated previously
    const systemInstruction = `Act as an AP Exam question writer specializing in ${subject}. Your task is to generate a full, original practice exam focused on ${topicFocus}, matching the ${examLength} requirement. You MUST only return a single JSON object. No introductory or concluding text is allowed. CRITICAL RULE: Escape ALL LaTeX backslashes twice (e.g., use '\\\\int' for '\int') within the JSON string values. Ensure the difficulty level aligns with the official AP exam.`;

    const responseSchema = {
        type: "OBJECT",
        properties: {
            "exam_title": { "type": "STRING" },
            "subject": { "type": "STRING" },
            "date_generated": { "type": "STRING" },
            "questions": {
                "type": "ARRAY",
                "items": {
                    "type": "OBJECT",
                    "properties": {
                        "id": { "type": "NUMBER" },
                        "type": { "type": "STRING", "enum": ["MCQ", "FRQ", "SAQ", "DBQ", "LEQ"] },
                        "time_estimate_minutes": { "type": "NUMBER" },
                        "question_text": { "type": "STRING" },
                        "image_url": { "type": "STRING", "nullable": true },
                        "options": { "type": "ARRAY", "items": { "type": "STRING" } },
                        "correct_answer": { "type": "STRING" },
                        "explanation": { "type": "STRING" }
                    }
                }
            }
        }
    };

    const payload = {
        contents: [{ parts: [{ text: userQuery }] }],
        systemInstruction: { parts: [{ text: systemInstruction }] },
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: responseSchema,
        }
    };

    try {
        const response = await fetchWithRetry(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        const jsonText = result.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!jsonText) {
            setError(result.error || "API did not return structured content.");
            return null;
        }

        const parsedExam = JSON.parse(jsonText);
        return parsedExam;

    } catch (error) {
        setError(`LLM Generation Failed: ${error.message}`);
        return null;
    }
};


// --- View Components ---

// 1. Home View
const HomeView = ({ setCurrentView }) => (
    <div className="flex flex-col items-center justify-center p-6 sm:p-12 bg-white rounded-3xl shadow-2xl max-w-2xl mx-auto my-10">
        <h2 className="text-4xl font-extrabold text-indigo-800 mb-4 text-center">
            Welcome to NovaScholar
        </h2>
        <p className="text-xl text-gray-600 mb-8 text-center max-w-md">
            Your personalized, AI-powered prep tool for AP exams. Generate practice tests tailored to any subject and topic.
        </p>

        <div className="space-y-4 w-full max-w-sm">
            <button
                onClick={() => setCurrentView('exam_setup')}
                className="w-full py-3 px-6 bg-indigo-600 text-white font-semibold rounded-lg shadow-lg hover:bg-indigo-700 transition duration-300 transform hover:scale-[1.02]"
            >
                Start New Exam
            </button>
            <button
                onClick={() => setCurrentView('chat')}
                className="w-full py-3 px-6 bg-green-500 text-white font-semibold rounded-lg shadow-lg hover:bg-green-600 transition duration-300 transform hover:scale-[1.02]"
            >
                AI Tutor Chat (Simulated)
            </button>
            <button
                onClick={() => setCurrentView('exam_history')}
                className="w-full py-3 px-6 bg-gray-200 text-gray-800 font-semibold rounded-lg shadow-lg hover:bg-gray-300 transition duration-300 transform hover:scale-[1.02]"
            >
                Review Exam History (Simulated)
            </button>
        </div>
    </div>
);

// 2. Exam Setup View
const ExamSetupView = ({ setCurrentView, setExam, setLoading, setError }) => {
    const [subject, setSubject] = useState(AP_SUBJECTS[0]);
    const [topicFocus, setTopicFocus] = useState('');
    const [length, setLength] = useState('10 Questions (Diagnostic)');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!topicFocus.trim()) {
            setError("Please enter a specific topic focus.");
            return;
        }
        setError(null);
        setLoading(true);

        const examLengthText = length.split('(')[0].trim();

        const data = await generateExamData(subject, topicFocus, examLengthText, setError);
        
        setLoading(false);

        if (data) {
            setExam({ 
                ...data, 
                config: { subject, topicFocus, length, mode: 'timed' }, // Default mode
                answers: Array(data.questions.length).fill(null) 
            });
            setCurrentView('exam_taking');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="p-6 sm:p-10 bg-white rounded-2xl shadow-xl max-w-xl mx-auto my-10 space-y-6">
            <h2 className="text-3xl font-bold text-gray-800 border-b pb-3 mb-4">Set Up Your Practice Exam</h2>

            <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">AP Subject</label>
                <select
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="mt-1 block w-full py-3 px-4 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                >
                    {AP_SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>

            <div>
                <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-1">Topic Focus (Required)</label>
                <input
                    id="topic"
                    type="text"
                    value={topicFocus}
                    onChange={(e) => setTopicFocus(e.target.value)}
                    placeholder="E.g., Integration, Cold War Policy, Cell Structure"
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:ring-indigo-500 focus:border-indigo-500"
                />
            </div>

            <div>
                <label htmlFor="length" className="block text-sm font-medium text-gray-700 mb-1">Exam Length</label>
                <select
                    id="length"
                    value={length}
                    onChange={(e) => setLength(e.target.value)}
                    className="mt-1 block w-full py-3 px-4 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                >
                    <option>5 Questions (Quick Check)</option>
                    <option>10 Questions (Diagnostic)</option>
                    <option>25 Questions (Full Section)</option>
                </select>
            </div>

            <button
                type="submit"
                className="w-full py-3 px-4 rounded-lg shadow-md text-lg font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition duration-300"
            >
                Generate & Start Exam
            </button>
            <button
                type="button"
                onClick={() => setCurrentView('home')}
                className="w-full py-3 px-4 rounded-lg text-gray-600 hover:bg-gray-100 transition duration-300"
            >
                Back to Home
            </button>
        </form>
    );
};

// 3. Exam Taking View (Simplified)
const ExamTakingView = ({ exam, setExam, setCurrentView }) => {
    const { questions, config } = exam;
    const [currentQIndex, setCurrentQIndex] = useState(0);
    const { settings } = useSettings();
    
    // Timer calculation (simulated)
    const totalTimeBase = questions.reduce((sum, q) => sum + q.time_estimate_minutes, 0);
    const totalTime = settings.extendedTime ? Math.round(totalTimeBase * 1.5) : totalTimeBase;
    const [timeLeft, setTimeLeft] = useState(totalTime * 60);

    useEffect(() => {
        if (config.mode === 'timed' && timeLeft > 0) {
            const timer = setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
            return () => clearInterval(timer);
        } else if (timeLeft === 0) {
             // Use a modal-like message box instead of alert()
             alert("Time's up! Submitting exam automatically.");
             handleSubmit();
        }
    }, [timeLeft, config.mode]);
    
    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        const parts = [m, s].map(n => n.toString().padStart(2, '0'));
        return h > 0 ? `${h}:${parts.join(':')}` : parts.join(':');
    };

    const handleAnswer = (answer) => {
        const newAnswers = [...exam.answers];
        newAnswers[currentQIndex] = answer;
        setExam(prev => ({ ...prev, answers: newAnswers }));
    };
    
    const handleSubmit = () => {
        // In a real app, this would call a grading API
        console.log("Submitting exam for grading:", exam);
        // Simulate grading result structure
        const results = {
            ap_score: Math.floor(Math.random() * 3) + 3, // Simulate score 3-5
            raw_score: `${Math.floor(questions.length * 0.7)}/${questions.length}`,
            feedback: "Excellent work on the integration section, but try to review differential equations more.",
        };

        setExam(prev => ({ ...prev, results, status: 'completed' }));
        setCurrentView('exam_results');
    };
    
    const currentQuestion = questions[currentQIndex];

    return (
        <div className="max-w-4xl mx-auto my-10 p-4 sm:p-8 bg-white rounded-2xl shadow-xl">
            
            <div className="flex justify-between items-center mb-6 pb-4 border-b">
                <h3 className="text-xl font-bold text-indigo-700">Q. {currentQIndex + 1} / {questions.length}</h3>
                {config.mode === 'timed' && (
                    <div className="text-2xl font-mono px-3 py-1 rounded-lg bg-red-100 text-red-600 shadow-inner">
                        <span className="text-base font-semibold text-gray-700 mr-2">Time Left:</span> {formatTime(timeLeft)}
                    </div>
                )}
            </div>

            <div className="question-content mb-6">
                <LaTeXDisplay text={currentQuestion.question_text} />
            </div>
            
            {/* Answer Options/Input */}
            <div className="space-y-3">
                {currentQuestion.type === 'MCQ' && currentQuestion.options.map((option, i) => {
                    const isSelected = exam.answers[currentQIndex] === option;
                    return (
                        <button
                            key={i}
                            onClick={() => handleAnswer(option)}
                            className={`w-full text-left p-4 rounded-lg border transition duration-150 ${
                                isSelected 
                                    ? 'bg-indigo-500 text-white border-indigo-700 shadow-md' 
                                    : 'bg-white hover:bg-gray-100 border-gray-300'
                            }`}
                        >
                            <span className="font-semibold mr-2">{String.fromCharCode(65 + i)}.</span>
                            <LaTeXDisplay text={option} />
                        </button>
                    );
                })}
                {/* Placeholder for FRQ/SAQ input */}
                {(currentQuestion.type === 'FRQ' || currentQuestion.type === 'SAQ') && (
                    <textarea 
                        rows="6" 
                        placeholder="Type your free response answer here..." 
                        value={exam.answers[currentQIndex] || ''}
                        onChange={(e) => handleAnswer(e.target.value)}
                        className="w-full p-4 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    />
                )}
            </div>

            {/* Navigation */}
            <div className="mt-8 pt-6 border-t flex justify-between gap-3 flex-wrap">
                <button
                    onClick={() => setCurrentQIndex(prev => Math.max(0, prev - 1))}
                    disabled={currentQIndex === 0}
                    className="flex-1 py-3 px-6 bg-gray-300 text-gray-800 font-semibold rounded-lg shadow-md hover:bg-gray-400 disabled:opacity-50 transition"
                >
                    &larr; Previous
                </button>
                {currentQIndex < questions.length - 1 ? (
                    <button
                        onClick={() => setCurrentQIndex(prev => prev + 1)}
                        className="flex-1 py-3 px-6 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition"
                    >
                        Next &rarr;
                    </button>
                ) : (
                    <button
                        onClick={handleSubmit}
                        className="flex-1 py-3 px-6 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition"
                    >
                        Submit Exam
                    </button>
                )}
            </div>
        </div>
    );
};

// 4. Exam Results View
const ExamResultsView = ({ exam, setCurrentView }) => {
    const { results, config } = exam;
    const scoreClass = results.ap_score >= 4 ? 'text-green-600 bg-green-100' : 'text-yellow-700 bg-yellow-100';

    return (
        <div className="max-w-4xl mx-auto my-10 p-6 sm:p-10 bg-white rounded-2xl shadow-xl">
            <h2 className="text-4xl font-extrabold text-indigo-800 mb-6 border-b pb-3">Exam Results</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 text-center">
                <div className={`p-5 rounded-xl border-2 ${scoreClass}`}>
                    <p className="text-lg font-medium text-gray-700">AP Score Estimate</p>
                    <p className="text-6xl font-black mt-1">{results.ap_score}</p>
                </div>
                <div className="p-5 bg-gray-50 rounded-xl border border-gray-200">
                    <p className="text-lg font-medium text-gray-700">Raw Score</p>
                    <p className="text-4xl font-bold mt-1 text-indigo-600">{results.raw_score}</p>
                </div>
                <div className="p-5 bg-gray-50 rounded-xl border border-gray-200">
                    <p className="text-lg font-medium text-gray-700">Subject/Topic</p>
                    <p className="text-xl font-bold mt-1 text-gray-800">{config.subject}</p>
                    <p className="text-sm text-gray-500">{config.topicFocus}</p>
                </div>
            </div>

            <div className="bg-indigo-50 p-6 rounded-lg mb-8 border border-indigo-200">
                <h3 className="text-xl font-bold text-indigo-800 mb-2">Personalized Feedback</h3>
                <p className="text-gray-700">{results.feedback}</p>
            </div>

            <div className="flex justify-center gap-4 flex-wrap">
                <button
                    onClick={() => setCurrentView('exam_review')}
                    className="py-3 px-6 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition"
                >
                    Detailed Review
                </button>
                <button
                    onClick={() => setCurrentView('exam_setup')}
                    className="py-3 px-6 bg-gray-200 text-gray-800 font-semibold rounded-lg shadow-md hover:bg-gray-300 transition"
                >
                    Take New Exam
                </button>
            </div>
        </div>
    );
};

// 5. Placeholder Views (Chat, History, Review)
const PlaceholderView = ({ title, setCurrentView, backView = 'home' }) => (
    <div className="max-w-xl mx-auto my-10 p-10 bg-white rounded-2xl shadow-xl text-center">
        <h2 className="text-3xl font-bold text-indigo-800 mb-4">{title}</h2>
        <p className="text-lg text-gray-600 mb-8">This feature is fully integrated into the architecture but is currently a placeholder to demonstrate the navigation structure.</p>
        <button
            onClick={() => setCurrentView(backView)}
            className="py-3 px-6 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition"
        >
            Go Back
        </button>
    </div>
);


// --- Main Application Component ---
const App = () => {
    const [currentView, setCurrentView] = useState('home');
    const [exam, setExam] = useState(null); // Holds the generated exam data, answers, and results
    const [isLoading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    
    const { settings } = useSettings();

    const rootClasses = settings.highContrast 
        ? 'bg-gray-900 text-white min-h-screen transition-colors duration-300' 
        : 'bg-gray-100 text-gray-800 min-h-screen transition-colors duration-300';

    const renderView = () => {
        if (isLoading || error) {
            return <StatusDisplay isLoading={isLoading} error={error} />;
        }

        switch (currentView) {
            case 'home':
                return <HomeView setCurrentView={setCurrentView} />;
            case 'exam_setup':
                return <ExamSetupView setCurrentView={setCurrentView} setExam={setExam} setLoading={setLoading} setError={setError} />;
            case 'exam_taking':
                return <ExamTakingView exam={exam} setExam={setExam} setCurrentView={setCurrentView} />;
            case 'exam_results':
                return <ExamResultsView exam={exam} setCurrentView={setCurrentView} />;
            case 'exam_review':
                return <PlaceholderView title="Exam Review Mode" setCurrentView={setCurrentView} backView="exam_results" />;
            case 'chat':
                return <PlaceholderView title="AI Tutor Chat" setCurrentView={setCurrentView} />;
            case 'exam_history':
                return <PlaceholderView title="Exam History" setCurrentView={setCurrentView} />;
            default:
                return <HomeView setCurrentView={setCurrentView} />;
        }
    };

    return (
        <div className={rootClasses}>
            
            {/* Navigation Bar */}
            <header className="sticky top-0 z-10 p-4 sm:p-6 shadow-md bg-white border-b border-gray-200">
                <div className="max-w-6xl mx-auto flex justify-between items-center">
                    <h1 
                        onClick={() => { setCurrentView('home'); setExam(null); }}
                        className="text-2xl sm:text-3xl font-extrabold text-indigo-700 cursor-pointer tracking-tight transition hover:text-indigo-900"
                    >
                        NovaScholar
                    </h1>
                    <button 
                        onClick={() => setIsSettingsOpen(true)}
                        className="p-2 rounded-full text-gray-600 hover:bg-gray-100 transition duration-150"
                        aria-label="Open accessibility settings"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.526.323.88 1.033.88 1.033z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                    </button>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="p-4 sm:p-8 max-w-6xl mx-auto">
                {renderView()}
            </main>

            <SettingsModal isVisible={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
        </div>
    );
};

// Final render wrapper to include settings context
const RootComponent = () => (
    <SettingsProvider>
        <App />
    </SettingsProvider>
);

export default RootComponent;

