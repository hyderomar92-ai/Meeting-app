
import React, { useState, useRef, useEffect } from 'react';
import { MeetingType, MeetingLog, ActionItem, UserProfile } from '../types';
import { enhanceMeetingNotes } from '../services/geminiService';
import { Sparkles, Save, X, Plus, Trash2, Loader2, User, AlertCircle, Mic, MicOff, FileText, Quote } from 'lucide-react';
import { STUDENTS } from '../data/students';

interface MeetingFormProps {
  onSubmit: (log: MeetingLog) => void;
  onCancel: () => void;
  initialAttendees?: string[];
  currentUser: UserProfile;
}

const TEMPLATES: Record<string, string> = {
  [MeetingType.BEHAVIORAL]: `Context: \n\nBehavior Observed: \n\nAntecedent (Trigger): \n\nConsequence/Action Taken: \n\nParent Notified: (Yes/No)`,
  [MeetingType.ACADEMIC]: `Current Grades/Levels: \n\nSpecific Areas of Struggle: \n\nInterventions Tried: \n\nPlan Moving Forward: `,
  [MeetingType.PARENT_TEACHER]: `Parent Concerns: \n\nTeacher Feedback: \n\nAgreed Actions at Home: \n\nAgreed Actions at School: `,
  [MeetingType.IEP]: `Current IEP Goals Review: \n\nProgress Data: \n\nProposed Adjustments: \n\nServices Required: `,
  'General': `Topic: \n\nKey Points Discussed: \n\nNext Steps: `
};

const MeetingForm: React.FC<MeetingFormProps> = ({ onSubmit, onCancel, initialAttendees = [], currentUser }) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(new Date().toTimeString().slice(0, 5));
  const [attendees, setAttendees] = useState<string[]>(initialAttendees);
  const [attendeeInput, setAttendeeInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [type, setType] = useState<MeetingType>(MeetingType.ACADEMIC);
  const [rawNotes, setRawNotes] = useState('');
  const [summary, setSummary] = useState('');
  const [actionItems, setActionItems] = useState<string[]>([]); 
  const [sentiment, setSentiment] = useState<'Positive' | 'Neutral' | 'Concerned'>('Neutral');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhanceError, setEnhanceError] = useState(false);
  
  // Voice Dictation State
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;

        recognitionRef.current.onresult = (event: any) => {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }
            
            if (finalTranscript) {
                 setRawNotes(prev => {
                     // Add space if needed
                     const prefix = prev && !prev.endsWith(' ') && !prev.endsWith('\n') ? ' ' : '';
                     return prev + prefix + finalTranscript;
                 });
            }
        };

        recognitionRef.current.onerror = (event: any) => {
            console.error('Speech recognition error', event.error);
            setIsListening(false);
            if (event.error === 'not-allowed') {
                alert("Microphone access was denied. Please allow microphone access in your browser settings to use voice dictation.");
            }
        };
        
        recognitionRef.current.onend = () => {
             // If we didn't manually stop it (isListening is true), restart it? 
             // For now, let's just let it stop to save battery/resources
             setIsListening(false);
        };
    }
  }, []);

  const toggleListening = () => {
      if (!recognitionRef.current) {
          alert("Voice dictation is not supported in this browser.");
          return;
      }

      if (isListening) {
          recognitionRef.current.stop();
          setIsListening(false);
      } else {
          try {
              recognitionRef.current.start();
              setIsListening(true);
          } catch (error) {
              console.error("Failed to start recognition:", error);
          }
      }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const filteredStudents = STUDENTS.filter(s => 
    s.name.toLowerCase().includes(attendeeInput.toLowerCase()) && 
    !attendees.includes(s.name)
  ).slice(0, 5);

  const handleAddAttendee = (name: string) => {
    if (name.trim() && !attendees.includes(name.trim())) {
      setAttendees([...attendees, name.trim()]);
      setAttendeeInput('');
      setShowSuggestions(false);
    }
  };

  const handleRemoveAttendee = (index: number) => {
    setAttendees(attendees.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredStudents.length === 1) {
          handleAddAttendee(filteredStudents[0].name);
      } else {
          handleAddAttendee(attendeeInput);
      }
    }
  };

  const applyTemplate = () => {
      const template = TEMPLATES[type] || TEMPLATES['General'];
      if (rawNotes && !window.confirm("This will append the template to your existing notes. Continue?")) {
          return;
      }
      setRawNotes(prev => prev ? `${prev}\n\n---\n${template}` : template);
  };

  const handleEnhance = async () => {
    if (!rawNotes.trim()) return;
    setIsEnhancing(true);
    setEnhanceError(false);
    try {
      const result = await enhanceMeetingNotes(rawNotes);
      
      if (result.actionItems.length === 1 && result.actionItems[0].includes("Could not")) {
         setEnhanceError(true);
      }

      setSummary(result.summary);
      
      const mergedItems = new Set([...actionItems.filter(i => i.trim() !== ''), ...result.actionItems]);
      setActionItems(Array.from(mergedItems));
      
      setSentiment(result.sentiment);
    } catch (e) {
      setEnhanceError(true);
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const finalActionItems: ActionItem[] = actionItems
      .filter(i => i.trim() !== '')
      .map(item => ({
        id: crypto.randomUUID(),
        task: item,
        status: 'Pending'
      }));

    const newLog: MeetingLog = {
      id: crypto.randomUUID(),
      date,
      time,
      attendees,
      type,
      notes: summary || rawNotes,
      actionItems: finalActionItems,
      sentiment,
      createdBy: currentUser.name
    };
    onSubmit(newLog);
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:p-8 animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Log New Meeting</h2>
          <p className="text-sm text-slate-500">Recorded by {currentUser.name}</p>
        </div>
        <button onClick={onCancel} className="text-slate-400 hover:text-slate-600">
          <X size={24} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Top Row: Date, Time, Type */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
            <input 
              type="date" 
              required
              value={date} 
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Time</label>
            <input 
              type="time" 
              required
              value={time} 
              onChange={(e) => setTime(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Meeting Type</label>
            <select 
              value={type}
              onChange={(e) => setType(e.target.value as MeetingType)}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white"
            >
              {Object.values(MeetingType).map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Attendees */}
        <div ref={wrapperRef} className="relative">
          <label className="block text-sm font-medium text-slate-700 mb-1">Attendees (Students/Parents)</label>
          <div className="flex space-x-2 mb-2">
            <input 
              type="text" 
              value={attendeeInput}
              onChange={(e) => {
                  setAttendeeInput(e.target.value);
                  setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onKeyDown={handleKeyDown}
              placeholder="Type name and press Enter..."
              className="flex-1 px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            />
            <button 
              type="button"
              onClick={() => handleAddAttendee(attendeeInput)}
              className="bg-slate-100 text-slate-600 px-4 rounded-lg hover:bg-slate-200 transition-colors"
            >
              <Plus size={20} />
            </button>
          </div>
          
          {showSuggestions && attendeeInput && filteredStudents.length > 0 && (
              <div className="absolute z-10 w-full bg-white border border-slate-200 rounded-lg shadow-lg mt-1 overflow-hidden max-h-60 overflow-y-auto">
                  {filteredStudents.map((student) => (
                      <div 
                          key={student.id}
                          onClick={() => handleAddAttendee(student.name)}
                          className="px-4 py-2 hover:bg-blue-50 cursor-pointer flex items-center text-slate-700"
                      >
                          <User size={14} className="mr-2 text-slate-400" />
                          {student.name} <span className="ml-2 text-xs text-slate-400">({student.id})</span>
                      </div>
                  ))}
              </div>
          )}

          <div className="flex flex-wrap gap-2 mt-3">
            {attendees.map((att, idx) => (
              <span key={idx} className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm border border-blue-100">
                {att}
                <button type="button" onClick={() => handleRemoveAttendee(idx)} className="ml-2 text-blue-400 hover:text-blue-600">
                  <X size={14} />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Notes Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: Raw Notes */}
          <div className="flex flex-col h-full">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-slate-700">Rough Notes</label>
              
              <div className="flex space-x-2">
                 <button 
                  type="button" 
                  onClick={applyTemplate}
                  className="text-xs flex items-center space-x-1 px-2 py-1 bg-slate-100 text-slate-600 rounded hover:bg-slate-200 transition-colors"
                  title="Insert a template structure based on meeting type"
                >
                  <FileText size={12} />
                  <span>Template</span>
                </button>
                <button 
                  type="button" 
                  onClick={handleEnhance}
                  disabled={isEnhancing || !rawNotes}
                  className={`text-xs flex items-center space-x-1 px-2 py-1 rounded transition-colors ${
                    isEnhancing || !rawNotes 
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                      : 'bg-violet-100 text-violet-700 hover:bg-violet-200'
                  }`}
                >
                  {isEnhancing ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                  <span>AI Enhance</span>
                </button>
              </div>
            </div>
            
            <div className="relative flex-1">
                <textarea 
                  value={rawNotes}
                  onChange={(e) => setRawNotes(e.target.value)}
                  placeholder="Tap the microphone to dictate, or select 'Template' to load a structure. Jot down rough points..."
                  className="w-full h-full px-4 py-3 pb-12 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none font-mono text-sm leading-relaxed min-h-[250px]"
                />
                
                {/* Dictation Button inside Textarea */}
                <div className="absolute bottom-3 right-3">
                   <button 
                      type="button"
                      onClick={toggleListening}
                      className={`p-2 rounded-full transition-all shadow-md ${
                          isListening 
                          ? 'bg-red-500 text-white animate-pulse ring-4 ring-red-200' 
                          : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-200'
                      }`}
                      title={isListening ? "Stop Dictation" : "Start Dictation"}
                   >
                       {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                   </button>
                </div>
            </div>
          </div>

          {/* Right: Processed Output */}
          <div className="flex flex-col space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Formatted Summary
                {sentiment && sentiment !== 'Neutral' && (
                   <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                     sentiment === 'Positive' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                   }`}>
                     {sentiment}
                   </span>
                )}
              </label>
              <textarea 
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="AI generated summary will appear here after enhancement..."
                className="w-full px-4 py-3 rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all min-h-[120px] text-sm"
              />
            </div>
            
            <div className="flex-1 flex flex-col">
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-slate-700">Action Items (AI Suggested)</label>
                <button 
                  type="button" 
                  onClick={() => setActionItems([...actionItems, ''])}
                  className="text-xs text-blue-600 hover:text-blue-700"
                >
                  + Add Item
                </button>
              </div>
              <div className="flex-1 bg-slate-50 rounded-lg border border-slate-300 p-3 space-y-2 overflow-y-auto max-h-[150px]">
                {actionItems.map((item, idx) => (
                  <div key={idx} className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded text-blue-600 focus:ring-blue-500" disabled />
                    <input 
                      type="text" 
                      value={item}
                      onChange={(e) => {
                        const newItems = [...actionItems];
                        newItems[idx] = e.target.value;
                        setActionItems(newItems);
                      }}
                      className="flex-1 bg-transparent border-b border-transparent focus:border-blue-300 outline-none text-sm"
                    />
                    <button type="button" onClick={() => {
                       setActionItems(actionItems.filter((_, i) => i !== idx));
                    }} className="text-slate-400 hover:text-red-500">
                      <X size={14} />
                    </button>
                  </div>
                ))}
                {actionItems.length === 0 && !enhanceError && <p className="text-xs text-slate-400 text-center mt-4">No action items yet. Use AI Enhance to generate.</p>}
                {enhanceError && (
                  <div className="flex flex-col items-center justify-center text-center mt-2">
                     <p className="text-xs text-red-500 flex items-center"><AlertCircle size={12} className="mr-1"/> AI Service Unavailable</p>
                     <p className="text-[10px] text-slate-400">Please enter action items manually.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4 pt-4 border-t border-slate-200">
           <button 
              type="button" 
              onClick={onCancel}
              className="px-6 py-2 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={attendees.length === 0}
              className="flex items-center space-x-2 px-6 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={18} />
              <span>Save Log</span>
            </button>
        </div>
      </form>
    </div>
  );
};

export default MeetingForm;
