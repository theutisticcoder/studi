import React, { useState, useEffect, createContext, useContext } from 'react';
import { BookOpen, Settings, Clock, Home, History, MessageSquare, CheckCircle, XCircle, ChevronRight, Loader } from 'lucide-react';

// Settings Context
const SettingsContext = createContext();

const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('novascholar_settings');
    return saved ? JSON.parse(saved) : {
      largeText: false,
      highContrast: false,
      dyslexiaFont: false,
      extendedTime: false
    };
  });

  useEffect(() => {
    localStorage.setItem('novascholar_settings', JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (newSettings) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

const useSettings = () => useContext(SettingsContext);

// LaTeX Display Component
const LaTeXDisplay = ({ content }) => {
  const processedContent = content
    .replace(/\\\(/g, '$')
    .replace(/\\\)/g, '$')
    .replace(/\\\[/g, '$$')
    .replace(/\\\]/g, '$$')
    .replace(/\\frac{([^}]+)}{([^}]+)}/g, '($1)/($2)')
    .replace(/\\sqrt{([^}]+)}/g, '√($1)')
    .replace(/\\text{([^}]+)}/g, '$1')
    .replace(/\^{([^}]+)}/g, '^($1)')
    .replace(/_{([^}]+)}/g, '_($1)');

  return <span className="whitespace-pre-wrap">{processedContent}</span>;
};

// Fetch with Retry
const fetchWithRetry = async (url, options, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
};

// Message Box Component
const MessageBox = ({ message, onClose, type = 'info' }) => {
  const colors = {
    info: 'bg-blue-50 border-blue-200 text-blue-900',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-900',
    error: 'bg-red-50 border-red-200 text-red-900',
    success: 'bg-green-50 border-green-200 text-green-900'
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`${colors[type]} border-2 rounded-lg p-6 max-w-md w-full shadow-xl`}>
        <p className="mb-4">{message}</p>
        <button
          onClick={onClose}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
        >
          OK
        </button>
      </div>
    </div>
  );
};

// Settings Modal
const SettingsModal = ({ isOpen, onClose }) => {
  const { settings, updateSettings } = useSettings();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Accessibility Settings</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <XCircle size={24} />
          </button>
        </div>
        
        <div className="space-y-4">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-gray-700">Large Text</span>
            <input
              type="checkbox"
              checked={settings.largeText}
              onChange={(e) => updateSettings({ largeText: e.target.checked })}
              className="w-5 h-5"
            />
          </label>
          
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-gray-700">High Contrast</span>
            <input
              type="checkbox"
              checked={settings.highContrast}
              onChange={(e) => updateSettings({ highContrast: e.target.checked })}
              className="w-5 h-5"
            />
          </label>
          
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-gray-700">Dyslexia-Friendly Font</span>
            <input
              type="checkbox"
              checked={settings.dyslexiaFont}
              onChange={(e) => updateSettings({ dyslexiaFont: e.target.checked })}
              className="w-5 h-5"
            />
          </label>
          
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-gray-700">Extended Time (1.5x)</span>
            <input
              type="checkbox"
              checked={settings.extendedTime}
              onChange={(e) => updateSettings({ extendedTime: e.target.checked })}
              className="w-5 h-5"
            />
          </label>
        </div>
        
        <button
          onClick={onClose}
          className="w-full mt-6 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
        >
          Save Settings
        </button>
      </div>
    </div>
  );
};

// Header Component
const Header = ({ onHome, onSettings }) => {
  return (
    <header className="sticky top-0 bg-blue-600 text-white shadow-lg z-40">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <BookOpen size={32} />
          <h1 className="text-2xl font-bold">NovaScholar</h1>
        </div>
        <div className="flex items-center space-x-4">
          <button onClick={onHome} className="hover:bg-blue-700 p-2 rounded transition" aria-label="Home">
            <Home size={24} />
          </button>
          <button onClick={onSettings} className="hover:bg-blue-700 p-2 rounded transition" aria-label="Settings">
            <Settings size={24} />
          </button>
        </div>
      </div>
    </header>
  );
};

// Home View
const HomeView = ({ onNavigate }) => {
  const { settings } = useSettings();
  const textSize = settings.largeText ? 'text-xl' : 'text-base';

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h2 className={`${textSize} text-3xl font-bold text-gray-900 mb-4`}>Welcome to NovaScholar</h2>
        <p className={`${textSize} text-gray-600 mb-8`}>Your comprehensive AP exam preparation platform</p>
        
        <div className="grid md:grid-cols-2 gap-6">
          <button
            onClick={() => onNavigate('exam_setup')}
            className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition border-2 border-blue-200 hover:border-blue-400"
          >
            <BookOpen className="text-blue-600 mb-4" size={48} />
            <h3 className={`${textSize} text-xl font-bold text-gray-900 mb-2`}>Start Practice Exam</h3>
            <p className={`${textSize} text-gray-600`}>Generate customized practice exams for any AP subject</p>
          </button>
          
          <button
            onClick={() => onNavigate('exam_history')}
            className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition border-2 border-purple-200 hover:border-purple-400"
          >
            <History className="text-purple-600 mb-4" size={48} />
            <h3 className={`${textSize} text-xl font-bold text-gray-900 mb-2`}>Exam History</h3>
            <p className={`${textSize} text-gray-600`}>Review past exams and track your progress</p>
          </button>
          
          <button
            onClick={() => onNavigate('chat')}
            className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition border-2 border-green-200 hover:border-green-400"
          >
            <MessageSquare className="text-green-600 mb-4" size={48} />
            <h3 className={`${textSize} text-xl font-bold text-gray-900 mb-2`}>AI Tutor Chat</h3>
            <p className={`${textSize} text-gray-600`}>Get instant help from your AI study assistant</p>
          </button>
          
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-lg shadow-lg border-2 border-gray-200">
            <CheckCircle className="text-green-600 mb-4" size={48} />
            <h3 className={`${textSize} text-xl font-bold text-gray-900 mb-2`}>Study Stats</h3>
            <p className={`${textSize} text-gray-600 mb-4`}>Track your progress across subjects</p>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className={`${textSize} text-gray-700`}>Exams Taken:</span>
                <span className={`${textSize} font-bold text-gray-900`}>0</span>
              </div>
              <div className="flex justify-between">
                <span className={`${textSize} text-gray-700`}>Avg Score:</span>
                <span className={`${textSize} font-bold text-gray-900`}>--</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// AP Exam Structures
const AP_EXAM_STRUCTURES = {
  // History & Social Sciences
  'AP World History': {
    sections: [
      { type: 'MCQ', count: 55, label: 'Multiple Choice Questions' },
      { type: 'SAQ', count: 3, label: 'Short Answer Questions' },
      { type: 'DBQ', count: 1, label: 'Document-Based Question' },
      { type: 'LEQ', count: 1, label: 'Long Essay Question' }
    ],
    timeLimit: 195
  },
  'AP US History': {
    sections: [
      { type: 'MCQ', count: 55, label: 'Multiple Choice Questions' },
      { type: 'SAQ', count: 3, label: 'Short Answer Questions' },
      { type: 'DBQ', count: 1, label: 'Document-Based Question' },
      { type: 'LEQ', count: 1, label: 'Long Essay Question' }
    ],
    timeLimit: 195
  },
  'AP European History': {
    sections: [
      { type: 'MCQ', count: 55, label: 'Multiple Choice Questions' },
      { type: 'SAQ', count: 3, label: 'Short Answer Questions' },
      { type: 'DBQ', count: 1, label: 'Document-Based Question' },
      { type: 'LEQ', count: 1, label: 'Long Essay Question' }
    ],
    timeLimit: 195
  },
  'AP US Government and Politics': {
    sections: [
      { type: 'MCQ', count: 55, label: 'Multiple Choice Questions' },
      { type: 'FRQ', count: 4, label: 'Free Response Questions (Concept Application, SCOTUS Comparison, Argument Essay)' }
    ],
    timeLimit: 180
  },
  'AP Comparative Government and Politics': {
    sections: [
      { type: 'MCQ', count: 55, label: 'Multiple Choice Questions' },
      { type: 'FRQ', count: 4, label: 'Free Response Questions (Concept Application, Comparison, Data Analysis)' }
    ],
    timeLimit: 150
  },
  'AP Human Geography': {
    sections: [
      { type: 'MCQ', count: 60, label: 'Multiple Choice Questions' },
      { type: 'FRQ', count: 3, label: 'Free Response Questions' }
    ],
    timeLimit: 135
  },
  'AP Psychology': {
    sections: [
      { type: 'MCQ', count: 100, label: 'Multiple Choice Questions' },
      { type: 'FRQ', count: 2, label: 'Free Response Questions' }
    ],
    timeLimit: 120
  },
  'AP Macroeconomics': {
    sections: [
      { type: 'MCQ', count: 60, label: 'Multiple Choice Questions' },
      { type: 'FRQ', count: 3, label: 'Free Response Questions (1 long, 2 short)' }
    ],
    timeLimit: 130
  },
  'AP Microeconomics': {
    sections: [
      { type: 'MCQ', count: 60, label: 'Multiple Choice Questions' },
      { type: 'FRQ', count: 3, label: 'Free Response Questions (1 long, 2 short)' }
    ],
    timeLimit: 130
  },
  
  // Math & Computer Science
  'AP Calculus AB': {
    sections: [
      { type: 'MCQ', count: 45, label: 'Multiple Choice Questions' },
      { type: 'FRQ', count: 6, label: 'Free Response Questions' }
    ],
    timeLimit: 195
  },
  'AP Calculus BC': {
    sections: [
      { type: 'MCQ', count: 45, label: 'Multiple Choice Questions' },
      { type: 'FRQ', count: 6, label: 'Free Response Questions' }
    ],
    timeLimit: 195
  },
  'AP Statistics': {
    sections: [
      { type: 'MCQ', count: 40, label: 'Multiple Choice Questions' },
      { type: 'FRQ', count: 6, label: 'Free Response Questions (5 short, 1 investigative task)' }
    ],
    timeLimit: 180
  },
  'AP Precalculus': {
    sections: [
      { type: 'MCQ', count: 40, label: 'Multiple Choice Questions' },
      { type: 'FRQ', count: 4, label: 'Free Response Questions' }
    ],
    timeLimit: 180
  },
  'AP Computer Science A': {
    sections: [
      { type: 'MCQ', count: 40, label: 'Multiple Choice Questions' },
      { type: 'FRQ', count: 4, label: 'Free Response Questions (Methods, Classes, Arrays, 2D Arrays)' }
    ],
    timeLimit: 180
  },
  'AP Computer Science Principles': {
    sections: [
      { type: 'MCQ', count: 70, label: 'Multiple Choice Questions' }
    ],
    timeLimit: 120
  },
  
  // Sciences
  'AP Biology': {
    sections: [
      { type: 'MCQ', count: 60, label: 'Multiple Choice Questions' },
      { type: 'FRQ', count: 6, label: 'Free Response Questions (2 long, 4 short)' }
    ],
    timeLimit: 180
  },
  'AP Chemistry': {
    sections: [
      { type: 'MCQ', count: 60, label: 'Multiple Choice Questions' },
      { type: 'FRQ', count: 7, label: 'Free Response Questions (3 long, 4 short)' }
    ],
    timeLimit: 195
  },
  'AP Physics 1': {
    sections: [
      { type: 'MCQ', count: 50, label: 'Multiple Choice Questions' },
      { type: 'FRQ', count: 5, label: 'Free Response Questions' }
    ],
    timeLimit: 180
  },
  'AP Physics 2': {
    sections: [
      { type: 'MCQ', count: 50, label: 'Multiple Choice Questions' },
      { type: 'FRQ', count: 4, label: 'Free Response Questions' }
    ],
    timeLimit: 180
  },
  'AP Physics C: Mechanics': {
    sections: [
      { type: 'MCQ', count: 35, label: 'Multiple Choice Questions' },
      { type: 'FRQ', count: 3, label: 'Free Response Questions' }
    ],
    timeLimit: 90
  },
  'AP Physics C: Electricity and Magnetism': {
    sections: [
      { type: 'MCQ', count: 35, label: 'Multiple Choice Questions' },
      { type: 'FRQ', count: 3, label: 'Free Response Questions' }
    ],
    timeLimit: 90
  },
  'AP Environmental Science': {
    sections: [
      { type: 'MCQ', count: 80, label: 'Multiple Choice Questions' },
      { type: 'FRQ', count: 3, label: 'Free Response Questions (Design Investigation, Analyze Environmental Problem, Analyze Environmental Problem with Calculations)' }
    ],
    timeLimit: 160
  },
  
  // English & Languages
  'AP English Language and Composition': {
    sections: [
      { type: 'MCQ', count: 45, label: 'Multiple Choice Questions' },
      { type: 'FRQ', count: 3, label: 'Free Response Questions (Synthesis, Rhetorical Analysis, Argument)' }
    ],
    timeLimit: 195
  },
  'AP English Literature and Composition': {
    sections: [
      { type: 'MCQ', count: 55, label: 'Multiple Choice Questions' },
      { type: 'FRQ', count: 3, label: 'Free Response Questions (Poetry Analysis, Prose Analysis, Literary Argument)' }
    ],
    timeLimit: 180
  },
  'AP Spanish Language and Culture': {
    sections: [
      { type: 'MCQ', count: 65, label: 'Multiple Choice Questions (Reading/Listening)' },
      { type: 'FRQ', count: 4, label: 'Free Response Questions (Email Reply, Argumentative Essay, Conversation, Cultural Comparison)' }
    ],
    timeLimit: 180
  },
  'AP Spanish Literature and Culture': {
    sections: [
      { type: 'MCQ', count: 65, label: 'Multiple Choice Questions' },
      { type: 'FRQ', count: 4, label: 'Free Response Questions (Text Explanation, Text/Art Comparison, Analysis, Text-based Essay)' }
    ],
    timeLimit: 180
  },
  'AP French Language and Culture': {
    sections: [
      { type: 'MCQ', count: 65, label: 'Multiple Choice Questions (Reading/Listening)' },
      { type: 'FRQ', count: 4, label: 'Free Response Questions (Email Reply, Argumentative Essay, Conversation, Cultural Comparison)' }
    ],
    timeLimit: 180
  },
  'AP German Language and Culture': {
    sections: [
      { type: 'MCQ', count: 65, label: 'Multiple Choice Questions (Reading/Listening)' },
      { type: 'FRQ', count: 4, label: 'Free Response Questions (Email Reply, Argumentative Essay, Conversation, Cultural Comparison)' }
    ],
    timeLimit: 180
  },
  'AP Italian Language and Culture': {
    sections: [
      { type: 'MCQ', count: 65, label: 'Multiple Choice Questions (Reading/Listening)' },
      { type: 'FRQ', count: 4, label: 'Free Response Questions (Email Reply, Argumentative Essay, Conversation, Cultural Comparison)' }
    ],
    timeLimit: 180
  },
  'AP Chinese Language and Culture': {
    sections: [
      { type: 'MCQ', count: 70, label: 'Multiple Choice Questions (Reading/Listening)' },
      { type: 'FRQ', count: 4, label: 'Free Response Questions (Story Narration, Email Response, Conversation, Cultural Presentation)' }
    ],
    timeLimit: 150
  },
  'AP Japanese Language and Culture': {
    sections: [
      { type: 'MCQ', count: 70, label: 'Multiple Choice Questions (Reading/Listening)' },
      { type: 'FRQ', count: 4, label: 'Free Response Questions (Story Narration, Email Response, Conversation, Cultural Presentation)' }
    ],
    timeLimit: 150
  },
  'AP Latin': {
    sections: [
      { type: 'MCQ', count: 50, label: 'Multiple Choice Questions' },
      { type: 'FRQ', count: 5, label: 'Free Response Questions (Translation, Short Essays, Analytical Essay)' }
    ],
    timeLimit: 180
  },
  
  // Arts
  'AP Art History': {
    sections: [
      { type: 'MCQ', count: 80, label: 'Multiple Choice Questions' },
      { type: 'FRQ', count: 6, label: 'Free Response Questions (Long Essay, Visual Analysis, Attribution)' }
    ],
    timeLimit: 180
  },
  'AP Music Theory': {
    sections: [
      { type: 'MCQ', count: 75, label: 'Multiple Choice Questions' },
      { type: 'FRQ', count: 7, label: 'Free Response Questions (Part-Writing, Harmonic Analysis, Sight-Singing, Melodic Dictation)' }
    ],
    timeLimit: 160
  }
};

// Exam Setup View
const ExamSetupView = ({ onNavigate, onStartExam }) => {
  const { settings } = useSettings();
  const [subject, setSubject] = useState('');
  const [customSubject, setCustomSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [examType, setExamType] = useState('full');
  const [difficulty, setDifficulty] = useState('medium');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const textSize = settings.largeText ? 'text-xl' : 'text-base';

  const isStandardAP = AP_EXAM_STRUCTURES[subject];
  const examStructure = isStandardAP || null;

  const generateExam = async () => {
    const finalSubject = subject === 'custom' ? customSubject : subject;
    
    if (!finalSubject.trim()) {
      setError('Please select or enter a subject');
      return;
    }

    setLoading(true);
    setError(null);

    const systemInstruction = `You are an expert AP exam question generator. Generate high-quality practice questions that exactly match official AP exam standards and format. Include detailed explanations for all answers. Use proper LaTeX syntax for mathematical expressions (wrap inline math in \\( \\) and display math in \\[ \\)). For history exams, DBQs should include 7 documents with source information. SAQs should have parts A, B, and C. LEQs should provide a clear historical prompt.`;

    let prompt;
    let questionTypes = [];

    if (isStandardAP && examType === 'full') {
      // Generate full AP exam with proper structure
      examStructure.sections.forEach(section => {
        for (let i = 0; i < section.count; i++) {
          questionTypes.push(section.type);
        }
      });
      
      const structureDesc = examStructure.sections
        .map(s => `${s.count} ${s.label}`)
        .join(', ');
      
      prompt = `Generate a complete AP ${finalSubject} practice exam with the official structure: ${structureDesc}. ${topic ? `Focus on: ${topic}.` : ''} Difficulty: ${difficulty}.

For MCQs: Provide 4 options (A-D) with one correct answer.
For SAQs: Provide 3 parts (A, B, C) with specific prompts for each.
For DBQs: Include 7 historical documents with source citations, then pose a question requiring document analysis and outside knowledge.
For LEQs: Provide a clear historical prompt requiring a thesis-driven essay.
For FRQs: Provide detailed questions appropriate to the subject (show-your-work problems for STEM, analytical questions for humanities).`;

    } else {
      // Custom or practice section
      const count = examType === 'practice' ? 10 : 20;
      prompt = `Generate ${count} ${difficulty} difficulty AP ${finalSubject} practice questions${topic ? ` on the topic of ${topic}` : ''}. Include a mix of multiple choice (MCQ) and free response questions (FRQ). For MCQs, provide 4 options labeled A-D.`;
      
      for (let i = 0; i < count; i++) {
        questionTypes.push(i < count * 0.7 ? 'MCQ' : 'FRQ');
      }
    }

    const requestBody = {
      contents: [{ parts: [{ text: prompt }] }],
      systemInstruction: { parts: [{ text: systemInstruction }] },
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            exam_title: { type: "string" },
            subject: { type: "string" },
            time_limit: { type: "integer" },
            questions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  type: { type: "string", enum: ["MCQ", "FRQ", "SAQ", "DBQ", "LEQ"] },
                  question_text: { type: "string" },
                  options: {
                    type: "array",
                    items: { type: "string" }
                  },
                  correct_answer: { type: "string" },
                  explanation: { type: "string" },
                  parts: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        label: { type: "string" },
                        prompt: { type: "string" }
                      }
                    }
                  },
                  documents: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        doc_number: { type: "integer" },
                        source: { type: "string" },
                        content: { type: "string" }
                      }
                    }
                  }
                },
                required: ["type", "question_text", "explanation"]
              }
            }
          },
          required: ["exam_title", "subject", "questions"]
        }
      }
    };

    try {
      const apiKey = 'AIzaSyDlEcjo49PQD9ixsXjKS1DsFHXr-n5I1ck';
      const data = await fetchWithRetry(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        }
      );

      const jsonText = data.candidates[0].content.parts[0].text;
      const examData = JSON.parse(jsonText);
      
      // Add time limit based on exam structure
      if (isStandardAP && examType === 'full') {
        examData.time_limit = examStructure.timeLimit;
      } else {
        examData.time_limit = examData.questions.length * 2; // 2 minutes per question for practice
      }
      
      onStartExam(examData);
    } catch (err) {
      setError(`Failed to generate exam: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const apSubjects = Object.keys(AP_EXAM_STRUCTURES);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <h2 className={`${textSize} text-2xl font-bold text-gray-900 mb-6`}>Create Practice Exam</h2>
        
        {error && (
          <div className="bg-red-50 border-2 border-red-200 text-red-900 p-4 rounded mb-4">
            {error}
          </div>
        )}
        
        <div className="space-y-6">
          <div>
            <label className={`${textSize} block text-gray-700 font-semibold mb-2`}>AP Subject *</label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className={`${textSize} w-full p-3 border-2 border-gray-300 rounded focus:border-blue-500 focus:outline-none`}
            >
              <option value="">-- Select AP Subject --</option>
              {apSubjects.map(subj => (
                <option key={subj} value={subj}>{subj}</option>
              ))}
              <option value="custom">Custom Subject...</option>
            </select>
          </div>
          
          {subject === 'custom' && (
            <div>
              <label className={`${textSize} block text-gray-700 font-semibold mb-2`}>Custom Subject Name *</label>
              <input
                type="text"
                value={customSubject}
                onChange={(e) => setCustomSubject(e.target.value)}
                placeholder="e.g., AP Human Geography"
                className={`${textSize} w-full p-3 border-2 border-gray-300 rounded focus:border-blue-500 focus:outline-none`}
              />
            </div>
          )}
          
          {isStandardAP && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded p-4">
              <h3 className={`${textSize} font-semibold text-gray-900 mb-2`}>Official AP Exam Structure:</h3>
              <ul className={`${textSize} space-y-1 text-gray-700`}>
                {examStructure.sections.map((section, idx) => (
                  <li key={idx}>• {section.count} {section.label}</li>
                ))}
                <li className="mt-2 font-semibold">⏱️ Time: {examStructure.timeLimit} minutes</li>
              </ul>
            </div>
          )}
          
          <div>
            <label className={`${textSize} block text-gray-700 font-semibold mb-2`}>Exam Type</label>
            <select
              value={examType}
              onChange={(e) => setExamType(e.target.value)}
              className={`${textSize} w-full p-3 border-2 border-gray-300 rounded focus:border-blue-500 focus:outline-none`}
            >
              {isStandardAP && <option value="full">Full AP Exam (Official Structure)</option>}
              <option value="practice">Practice Section (10 questions)</option>
              <option value="extended">Extended Practice (20 questions)</option>
            </select>
          </div>
          
          <div>
            <label className={`${textSize} block text-gray-700 font-semibold mb-2`}>Topic (Optional)</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Derivatives, Photosynthesis, Cold War"
              className={`${textSize} w-full p-3 border-2 border-gray-300 rounded focus:border-blue-500 focus:outline-none`}
            />
          </div>
          
          <div>
            <label className={`${textSize} block text-gray-700 font-semibold mb-2`}>Difficulty</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className={`${textSize} w-full p-3 border-2 border-gray-300 rounded focus:border-blue-500 focus:outline-none`}
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium (AP Standard)</option>
              <option value="hard">Hard</option>
              <option value="mixed">Mixed</option>
            </select>
          </div>
          
          <div className="flex space-x-4">
            <button
              onClick={() => onNavigate('home')}
              className={`${textSize} flex-1 bg-gray-500 text-white py-3 px-6 rounded hover:bg-gray-600 transition font-semibold`}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={generateExam}
              disabled={loading}
              className={`${textSize} flex-1 bg-blue-600 text-white py-3 px-6 rounded hover:bg-blue-700 transition font-semibold flex items-center justify-center`}
            >
              {loading ? (
                <>
                  <Loader className="animate-spin mr-2" size={20} />
                  Generating...
                </>
              ) : (
                'Generate Exam'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Exam Taking View
const ExamTakingView = ({ examData, onSubmit, onNavigate }) => {
  const { settings } = useSettings();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(() => {
    const baseTime = (examData.time_limit || examData.questions.length * 2) * 60;
    return settings.extendedTime ? Math.floor(baseTime * 1.5) : baseTime;
  });
  const [showTimeout, setShowTimeout] = useState(false);

  const textSize = settings.largeText ? 'text-xl' : 'text-base';

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setShowTimeout(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswer = (answer) => {
    setAnswers(prev => ({ ...prev, [currentQuestion]: answer }));
  };

  const handleSubmit = () => {
    onSubmit(answers);
  };

  const question = examData.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / examData.questions.length) * 100;

  return (
    <div className="container mx-auto px-4 py-8">
      {showTimeout && (
        <MessageBox
          message="Time's up! Your exam will be submitted automatically."
          type="warning"
          onClose={() => {
            setShowTimeout(false);
            handleSubmit();
          }}
        />
      )}
      
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className={`${textSize} text-xl font-bold text-gray-900`}>{examData.exam_title}</h2>
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-gray-700">
                <Clock className="mr-2" size={20} />
                <span className={`${textSize} font-semibold ${timeLeft < 300 ? 'text-red-600' : ''}`}>
                  {formatTime(timeLeft)}
                </span>
              </div>
            </div>
          </div>
          
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Question {currentQuestion + 1} of {examData.questions.length}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="mb-6">
            <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold mb-4">
              {question.type}
            </span>
            <div className={`${textSize} text-gray-900 mb-6`}>
              <LaTeXDisplay content={question.question_text} />
            </div>
          </div>
          
          {/* DBQ with Documents */}
          {question.type === 'DBQ' && question.documents && (
            <div className="mb-6">
              <h3 className={`${textSize} font-bold text-gray-900 mb-4`}>Historical Documents:</h3>
              <div className="space-y-4 mb-6 max-h-96 overflow-y-auto border-2 border-gray-300 rounded p-4">
                {question.documents.map((doc, idx) => (
                  <div key={idx} className="bg-gray-50 p-4 rounded border border-gray-300">
                    <p className="font-semibold text-sm text-gray-700 mb-2">
                      Document {doc.doc_number}: {doc.source}
                    </p>
                    <p className={`${textSize} text-gray-900`}>
                      <LaTeXDisplay content={doc.content} />
                    </p>
                  </div>
                ))}
              </div>
              <textarea
                value={answers[currentQuestion] || ''}
                onChange={(e) => handleAnswer(e.target.value)}
                placeholder="Write your document-based essay here..."
                className={`${textSize} w-full p-4 border-2 border-gray-300 rounded focus:border-blue-500 focus:outline-none min-h-[300px]`}
              />
            </div>
          )}
          
          {/* SAQ with Parts */}
          {question.type === 'SAQ' && question.parts && (
            <div className="mb-6 space-y-4">
              {question.parts.map((part, idx) => (
                <div key={idx}>
                  <h4 className={`${textSize} font-semibold text-gray-900 mb-2`}>
                    {part.label}. {part.prompt}
                  </h4>
                  <textarea
                    value={(answers[currentQuestion] || {})[part.label] || ''}
                    onChange={(e) => {
                      const currentAnswer = answers[currentQuestion] || {};
                      handleAnswer({ ...currentAnswer, [part.label]: e.target.value });
                    }}
                    placeholder={`Answer for part ${part.label}...`}
                    className={`${textSize} w-full p-4 border-2 border-gray-300 rounded focus:border-blue-500 focus:outline-none min-h-[120px]`}
                  />
                </div>
              ))}
            </div>
          )}
          
          {/* MCQ Options */}
          {question.type === 'MCQ' && question.options && (
            <div className="space-y-3 mb-6">
              {question.options.map((option, idx) => {
                const label = String.fromCharCode(65 + idx);
                const isSelected = answers[currentQuestion] === label;
                return (
                  <button
                    key={idx}
                    onClick={() => handleAnswer(label)}
                    className={`${textSize} w-full text-left p-4 border-2 rounded transition ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-blue-300'
                    }`}
                  >
                    <span className="font-semibold mr-3">{label}.</span>
                    <LaTeXDisplay content={option} />
                  </button>
                );
              })}
            </div>
          )}
          
          {/* FRQ and LEQ */}
          {(question.type === 'FRQ' || question.type === 'LEQ') && !question.parts && (
            <div className="mb-6">
              <textarea
                value={answers[currentQuestion] || ''}
                onChange={(e) => handleAnswer(e.target.value)}
                placeholder="Type your answer here..."
                className={`${textSize} w-full p-4 border-2 border-gray-300 rounded focus:border-blue-500 focus:outline-none min-h-[250px]`}
              />
            </div>
          )}
          
          <div className="flex justify-between">
            <button
              onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
              disabled={currentQuestion === 0}
              className={`${textSize} px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              Previous
            </button>
            
            {currentQuestion < examData.questions.length - 1 ? (
              <button
                onClick={() => setCurrentQuestion(prev => prev + 1)}
                className={`${textSize} px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition flex items-center`}
              >
                Next
                <ChevronRight className="ml-2" size={20} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className={`${textSize} px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition font-semibold`}
              >
                Submit Exam
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Exam Results View
const ExamResultsView = ({ examData, answers, onNavigate, onReview }) => {
  const { settings } = useSettings();
  const textSize = settings.largeText ? 'text-xl' : 'text-base';

  const calculateScore = () => {
    let correct = 0;
    examData.questions.forEach((q, idx) => {
      if (q.type === 'MCQ' && answers[idx] === q.correct_answer) {
        correct++;
      }
    });
    return {
      correct,
      total: examData.questions.filter(q => q.type === 'MCQ').length,
      percentage: examData.questions.filter(q => q.type === 'MCQ').length > 0 
        ? Math.round((correct / examData.questions.filter(q => q.type === 'MCQ').length) * 100)
        : 0
    };
  };

  const score = calculateScore();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center mb-6">
          <div className="mb-6">
            <CheckCircle className="mx-auto text-green-600 mb-4" size={64} />
            <h2 className={`${textSize} text-3xl font-bold text-gray-900 mb-2`}>Exam Complete!</h2>
            <p className={`${textSize} text-gray-600`}>{examData.exam_title}</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-blue-50 p-6 rounded-lg">
              <div className="text-4xl font-bold text-blue-600 mb-2">{score.percentage}%</div>
              <div className={`${textSize} text-gray-700`}>Overall Score</div>
            </div>
            <div className="bg-green-50 p-6 rounded-lg">
              <div className="text-4xl font-bold text-green-600 mb-2">{score.correct}</div>
              <div className={`${textSize} text-gray-700`}>Correct</div>
            </div>
            <div className="bg-purple-50 p-6 rounded-lg">
              <div className="text-4xl font-bold text-purple-600 mb-2">{score.total}</div>
              <div className={`${textSize} text-gray-700`}>Total MCQs</div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={onReview}
              className={`${textSize} bg-blue-600 text-white py-3 px-8 rounded hover:bg-blue-700 transition font-semibold`}
            >
              Review Answers
            </button>
            <button
              onClick={() => onNavigate('home')}
              className={`${textSize} bg-gray-500 text-white py-3 px-8 rounded hover:bg-gray-600 transition font-semibold`}
            >
              Back to Home
            </button>
          </div>
        </div>
        
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
          <h3 className={`${textSize} text-xl font-bold text-gray-900 mb-4`}>Study Recommendations</h3>
          <ul className={`${textSize} space-y-2 text-gray-700`}>
            <li>• Review incorrect answers to understand your mistakes</li>
            <li>• Focus on topics where you struggled the most</li>
            <li>• Practice similar questions to reinforce concepts</li>
            <li>• Take another practice exam to track improvement</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

// Exam Review View
const ExamReviewView = ({ examData, answers, onNavigate }) => {
  const { settings } = useSettings();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const textSize = settings.largeText ? 'text-xl' : 'text-base';

  const question = examData.questions[currentQuestion];
  const userAnswer = answers[currentQuestion];
  const isCorrect = question.type === 'MCQ' && userAnswer === question.correct_answer;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className={`${textSize} text-xl font-bold text-gray-900`}>Review: {examData.exam_title}</h2>
            <button
              onClick={() => onNavigate('exam_results')}
              className={`${textSize} text-blue-600 hover:text-blue-800 font-semibold`}
            >
              Back to Results
            </button>
          </div>
          
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Question {currentQuestion + 1} of {examData.questions.length}</span>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                {question.type}
              </span>
              {question.type === 'MCQ' && (
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {isCorrect ? 'Correct' : 'Incorrect'}
                </span>
              )}
            </div>
            <div className={`${textSize} text-gray-900 mb-6`}>
              <LaTeXDisplay content={question.question_text} />
            </div>
          </div>
          
          {question.type === 'MCQ' && question.options && (
            <div className="space-y-3 mb-6">
              {question.options.map((option, idx) => {
                const label = String.fromCharCode(65 + idx);
                const isUserAnswer = userAnswer === label;
                const isCorrectAnswer = label === question.correct_answer;
                return (
                  <div
                    key={idx}
                    className={`${textSize} w-full text-left p-4 border-2 rounded ${
                      isCorrectAnswer
                        ? 'border-green-500 bg-green-50'
                        : isUserAnswer
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-300'
                    }`}
                  >
                    <div className="flex items-start">
                      <span className="font-semibold mr-3">{label}.</span>
                      <div className="flex-1">
                        <LaTeXDisplay content={option} />
                      </div>
                      {isCorrectAnswer && (
                        <CheckCircle className="text-green-600 ml-2" size={20} />
                      )}
                      {isUserAnswer && !isCorrectAnswer && (
                        <XCircle className="text-red-600 ml-2" size={20} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          {question.type === 'FRQ' && (
            <div className="mb-6">
              <h4 className={`${textSize} font-semibold text-gray-900 mb-2`}>Your Answer:</h4>
              <div className="bg-gray-50 p-4 rounded border-2 border-gray-300 mb-4">
                <p className={`${textSize} text-gray-900 whitespace-pre-wrap`}>{userAnswer || '(No answer provided)'}</p>
              </div>
              <h4 className={`${textSize} font-semibold text-gray-900 mb-2`}>Model Answer:</h4>
              <div className="bg-green-50 p-4 rounded border-2 border-green-300">
                <LaTeXDisplay content={question.correct_answer} />
              </div>
            </div>
          )}
          
          <div className="bg-blue-50 border-2 border-blue-200 rounded p-4">
            <h4 className={`${textSize} font-semibold text-gray-900 mb-2`}>Explanation:</h4>
            <div className={`${textSize} text-gray-700`}>
              <LaTeXDisplay content={question.explanation} />
            </div>
          </div>
        </div>
        
        <div className="flex justify-between">
          <button
            onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
            disabled={currentQuestion === 0}
            className={`${textSize} px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            Previous
          </button>
          
          <button
            onClick={() => setCurrentQuestion(prev => Math.min(examData.questions.length - 1, prev + 1))}
            disabled={currentQuestion === examData.questions.length - 1}
            className={`${textSize} px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center`}
          >
            Next
            <ChevronRight className="ml-2" size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

// Chat View (Placeholder)
const ChatView = ({ onNavigate }) => {
  const { settings } = useSettings();
  const textSize = settings.largeText ? 'text-xl' : 'text-base';

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <MessageSquare className="mx-auto text-blue-600 mb-4" size={64} />
          <h2 className={`${textSize} text-2xl font-bold text-gray-900 mb-4`}>AI Tutor Chat</h2>
          <p className={`${textSize} text-gray-600 mb-6`}>
            Get instant help with your studies. Ask questions, clarify concepts, and receive personalized explanations.
          </p>
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-6">
            <p className={`${textSize} text-gray-700`}>
              This feature is coming soon! The AI Tutor will provide real-time assistance with:
            </p>
            <ul className={`${textSize} text-left mt-4 space-y-2 text-gray-700`}>
              <li>• Step-by-step problem solving</li>
              <li>• Concept explanations</li>
              <li>• Study strategies and tips</li>
              <li>• Exam preparation guidance</li>
            </ul>
          </div>
          <button
            onClick={() => onNavigate('home')}
            className={`${textSize} bg-blue-600 text-white py-3 px-8 rounded hover:bg-blue-700 transition font-semibold`}
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

// Exam History View (Placeholder)
const ExamHistoryView = ({ onNavigate }) => {
  const { settings } = useSettings();
  const textSize = settings.largeText ? 'text-xl' : 'text-base';

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className={`${textSize} text-2xl font-bold text-gray-900`}>Exam History</h2>
            <button
              onClick={() => onNavigate('home')}
              className={`${textSize} text-blue-600 hover:text-blue-800 font-semibold`}
            >
              Back to Home
            </button>
          </div>
          
          <div className="text-center py-12">
            <History className="mx-auto text-gray-400 mb-4" size={64} />
            <p className={`${textSize} text-gray-600 mb-6`}>
              No exams taken yet. Start your first practice exam to see your history here!
            </p>
            <button
              onClick={() => onNavigate('exam_setup')}
              className={`${textSize} bg-blue-600 text-white py-3 px-8 rounded hover:bg-blue-700 transition font-semibold`}
            >
              Start Practice Exam
            </button>
          </div>
          
          <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-6 mt-8">
            <h3 className={`${textSize} text-xl font-bold text-gray-900 mb-4`}>Coming Soon</h3>
            <p className={`${textSize} text-gray-700 mb-4`}>Your exam history will include:</p>
            <ul className={`${textSize} space-y-2 text-gray-700`}>
              <li>• Detailed performance analytics</li>
              <li>• Score trends over time</li>
              <li>• Subject-specific insights</li>
              <li>• Ability to retake past exams</li>
              <li>• Progress tracking across topics</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main App Component
const NovaScholar = () => {
  const { settings } = useSettings();
  const [currentView, setCurrentView] = useState('home');
  const [examData, setExamData] = useState(null);
  const [answers, setAnswers] = useState({});
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleStartExam = (data) => {
    setExamData(data);
    setAnswers({});
    setCurrentView('exam_taking');
  };

  const handleSubmitExam = (examAnswers) => {
    setAnswers(examAnswers);
    setCurrentView('exam_results');
  };

  const handleReview = () => {
    setCurrentView('exam_review');
  };

  const rootClasses = `min-h-screen ${settings.highContrast ? 'bg-black text-white' : 'bg-gray-50'} ${settings.dyslexiaFont ? 'font-mono' : ''}`;

  return (
    <div className={rootClasses}>
      <Header 
        onHome={() => setCurrentView('home')} 
        onSettings={() => setSettingsOpen(true)} 
      />
      
      <SettingsModal 
        isOpen={settingsOpen} 
        onClose={() => setSettingsOpen(false)} 
      />
      
      {currentView === 'home' && <HomeView onNavigate={setCurrentView} />}
      {currentView === 'exam_setup' && <ExamSetupView onNavigate={setCurrentView} onStartExam={handleStartExam} />}
      {currentView === 'exam_taking' && <ExamTakingView examData={examData} onSubmit={handleSubmitExam} onNavigate={setCurrentView} />}
      {currentView === 'exam_results' && <ExamResultsView examData={examData} answers={answers} onNavigate={setCurrentView} onReview={handleReview} />}
      {currentView === 'exam_review' && <ExamReviewView examData={examData} answers={answers} onNavigate={setCurrentView} />}
      {currentView === 'chat' && <ChatView onNavigate={setCurrentView} />}
      {currentView === 'exam_history' && <ExamHistoryView onNavigate={setCurrentView} />}
    </div>
  );
};

// Root Component with Settings Provider
const App = () => {
  return (
    <SettingsProvider>
      <NovaScholar />
    </SettingsProvider>
  );
};

export default App;