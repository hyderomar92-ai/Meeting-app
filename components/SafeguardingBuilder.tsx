import React, { useState, useRef, useEffect, useMemo } from 'react';
import { SafeguardingCase, MeetingLog, UserProfile } from '../types';
import { generateSafeguardingReport } from '../services/geminiService';
import { Shield, AlertTriangle, FileText, Save, Loader2, Search, User, ChevronRight, ClipboardList, Gavel, Clock, Plus, Calendar, ArrowLeft, Filter, CheckCircle2, AlertCircle, Activity, Trash2, Tag, BarChart3, Paperclip, CheckSquare, Square, Sparkles, BrainCircuit, X, Lock, Eye, EyeOff, Copy, ChevronDown, Edit3, History } from 'lucide-react';
import { STUDENTS } from '../data/students';

interface SafeguardingBuilderProps {
  cases: SafeguardingCase[];
  logs: MeetingLog[];
  onSave: (caseFile: SafeguardingCase) => void;
  onUpdate: (caseFile: SafeguardingCase) => void;
  onDelete: (id: string) => void;
  onCancel: () => void;
  currentUser: UserProfile;
  initialSearchTerm?: string;
  initialData?: { studentName: string; description: string; date: string } | null;
}

// Mock Audit Data Generator
const generateMockAccessLogs = (caseId: string, creator: string) => {
    return [
        { date: new Date().toISOString(), user: creator, action: 'Created Case' },
        { date: new Date(Date.now() - 86400000).toISOString(), user: 'System Admin', action: 'Viewed' },
        { date: new Date(Date.now() - 172800000).toISOString(), user: 'Sarah Connor', action: 'Updated Status' },
    ];
};

const SafeguardingBuilder: React.FC<SafeguardingBuilderProps> = ({ cases, logs, onSave, onUpdate, onDelete, onCancel, currentUser, initialSearchTerm = '', initialData }) => {
  const [mode, setMode] = useState<'LIST' | 'BUILD'>('LIST');
  const [selectedCase, setSelectedCase] = useState<SafeguardingCase | null>(null);
  const [caseSearchTerm, setCaseSearchTerm] = useState(initialSearchTerm);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [authorFilter, setAuthorFilter] = useState<string>('All');
  const [caseToDelete, setCaseToDelete] = useState<string | null>(null);
  
  // Edit Mode State
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [studentName, setStudentName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [incidentType, setIncidentType] = useState('Behavioral');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'Open' | 'Investigating' | 'Closed'>('Open');
  const [isConfidential, setIsConfidential] = useState(false);
  
  // Evidence State
  const [selectedLogIds, setSelectedLogIds] = useState<string[]>([]);
  const [evidenceFilterType, setEvidenceFilterType] = useState<'ALL' | 'CONCERNS'>('ALL');
  
  // Suggestions State
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // AI State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generatedCase, setGeneratedCase] = useState<SafeguardingCase['generatedReport'] | null>(null);

  // View State (Redaction)
  const [isRedacted, setIsRedacted] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  
  // Save Feedback State
  const [noteSaveStatus, setNoteSaveStatus] = useState<'IDLE' | 'SAVING' | 'SAVED'>('IDLE');

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  // Handle Escalation Data
  useEffect(() => {
    if (initialData) {
        setMode('BUILD');
        setStudentName(initialData.studentName);
        setDescription(initialData.description);
        setDate(initialData.date);
    }
  }, [initialData]);

  // Auto-populate student name if entering build mode with an initial search term
  useEffect(() => {
      if (mode === 'BUILD' && initialSearchTerm && !studentName && !editingId && !initialData) {
          setStudentName(initialSearchTerm);
      }
  }, [mode, initialSearchTerm, editingId, initialData]);

  // Extract unique incident types for the filter dropdown
  const uniqueIncidentTypes = useMemo(() => {
    const types = new Set(cases.map(c => c.incidentType));
    return Array.from(types).sort();
  }, [cases]);

  const uniqueAuthors = useMemo(() => {
    const authors = new Set(cases.map(c => c.createdBy).filter(Boolean));
    return Array.from(authors).sort() as string[];
  }, [cases]);

  const filteredStudents = STUDENTS.filter(s => 
    s.name.toLowerCase().includes(studentName.toLowerCase())
  ).slice(0, 5);

  // Get logs for the selected student to use as evidence
  const candidateLogs = useMemo(() => {
    if (!studentName) return [];
    let studentLogs = logs.filter(l => l.attendees.includes(studentName)).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    if (evidenceFilterType === 'CONCERNS') {
      studentLogs = studentLogs.filter(l => l.sentiment === 'Concerned');
    }
    return studentLogs;
  }, [studentName, logs, evidenceFilterType]);

  const handleToggleLogEvidence = (logId: string) => {
    setSelectedLogIds(prev => 
      prev.includes(logId) ? prev.filter(id => id !== logId) : [...prev, logId]
    );
  };

  // Filter saved cases based on search term, status, and incident type
  const filteredCases = cases.filter(c => {
    const matchesSearch = 
      c.studentName.toLowerCase().includes(caseSearchTerm.toLowerCase()) ||
      c.generatedReport.dslSummary.toLowerCase().includes(caseSearchTerm.toLowerCase());
      
    const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
    const matchesType = typeFilter === 'All' || c.incidentType === typeFilter;
    const matchesAuthor = authorFilter === 'All' || c.createdBy === authorFilter;
    
    return matchesSearch && matchesStatus && matchesType && matchesAuthor;
  });

  // Calculate Stats
  const openCases = cases.filter(c => c.status === 'Open').length;
  const investigatingCases = cases.filter(c => c.status === 'Investigating').length;
  const highRiskCases = cases.filter(c => ['High', 'Critical'].includes(c.generatedReport.riskLevel)).length;

  // Helper to calculate numerical score
  const calculateRiskScore = (risk: string, sentiment: string) => {
    const riskWeights: Record<string, number> = { 'Critical': 60, 'High': 40, 'Medium': 20, 'Low': 10 };
    const sentimentWeights: Record<string, number> = { 'Critical': 40, 'Serious': 30, 'Cautionary': 15, 'Routine': 0 };
    return Math.min((riskWeights[risk] || 0) + (sentimentWeights[sentiment] || 0), 100);
  };

  // Redaction helper function
  const redactText = (text: string, subjectName: string) => {
    if (!isRedacted) return text;
    
    let redacted = text;
    // Iterate through student list and replace names other than the subject
    STUDENTS.forEach(s => {
       if (s.name !== subjectName && s.name.length > 4) { // Avoid accidental short matches
          const regex = new RegExp(s.name, 'gi');
          if (regex.test(redacted)) {
             redacted = redacted.replace(regex, '[REDACTED STUDENT]');
          }
          // Also try partial name match (first name last name) for privacy
          const firstName = s.name.split(' ')[0];
          if(firstName && firstName !== subjectName.split(' ')[0] && firstName.length > 3) {
             const firstRegex = new RegExp(`\\b${firstName}\\b`, 'gi');
              // Only redact first name if it's not part of the subject's name
             if (firstRegex.test(redacted)) {
                 redacted = redacted.replace(firstRegex, '[STUDENT]');
             }
          }
       }
    });
    return redacted;
  };

  const handleCopyToClipboard = (caseData: SafeguardingCase) => {
      const text = `
      CONFIDENTIAL SAFEGUARDING REPORT
      Student: ${caseData.studentName}
      Date: ${caseData.date}
      Incident: ${caseData.incidentType}
      Risk Level: ${caseData.generatedReport.riskLevel}
      Status: ${caseData.status}

      DSL SUMMARY:
      ${redactText(caseData.generatedReport.dslSummary, caseData.studentName)}

      CHRONOLOGY:
      ${caseData.generatedReport.chronology.map(c => `- ${redactText(c, caseData.studentName)}`).join('\n')}
      
      NEXT STEPS:
      ${caseData.generatedReport.nextSteps.map(s => `- ${redactText(s, caseData.studentName)}`).join('\n')}
      
      RESOLUTION NOTES:
      ${caseData.resolutionNotes || 'N/A'}
      `;

      navigator.clipboard.writeText(text).then(() => {
          setCopySuccess(true);
          setTimeout(() => setCopySuccess(false), 2000);
      });
  };

  const handleGenerate = async () => {
    if (!studentName || !description) return;
    setIsGenerating(true);
    setGenerationError(null);
    try {
      const evidenceLogs = logs.filter(l => selectedLogIds.includes(l.id));
      const report = await generateSafeguardingReport(studentName, description, evidenceLogs);
      setGeneratedCase(report);
    } catch (e) {
      setGenerationError("Failed to generate report using AI. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEditClick = (c: SafeguardingCase) => {
    setStudentName(c.studentName);
    setDate(c.date);
    setIncidentType(c.incidentType);
    setDescription(c.rawDescription);
    setStatus(c.status);
    setIsConfidential(c.isConfidential || false);
    setSelectedLogIds(c.relatedLogIds || []);
    setGeneratedCase(c.generatedReport);
    setEditingId(c.id);
    setMode('BUILD');
  };

  const handleFinalSave = () => {
    if (!generatedCase) return;
    
    // Preserve resolution notes if editing
    const existingCase = editingId ? cases.find(c => c.id === editingId) : null;
    
    const newCase: SafeguardingCase = {
      id: editingId || crypto.randomUUID(),
      studentName,
      date,
      incidentType,
      rawDescription: description,
      generatedReport: generatedCase,
      status: status,
      relatedLogIds: selectedLogIds,
      createdBy: existingCase?.createdBy || currentUser.name,
      isConfidential: isConfidential,
      resolutionNotes: existingCase?.resolutionNotes || '',
      completedSteps: existingCase?.completedSteps || [],
      updatedAt: new Date().toISOString()
    };
    
    if (editingId) {
        onUpdate(newCase);
    } else {
        onSave(newCase);
    }

    setMode('LIST'); 
    setStudentName('');
    setDescription('');
    setSelectedLogIds([]);
    setGeneratedCase(null);
    setIsConfidential(false);
    setEditingId(null);
  };
  
  // Interactive Update Handlers (Detail View)
  const updateCaseStatus = (c: SafeguardingCase, newStatus: SafeguardingCase['status']) => {
      const updated = { ...c, status: newStatus, updatedAt: new Date().toISOString() };
      setSelectedCase(updated);
      onUpdate(updated);
  };

  const toggleActionStep = (c: SafeguardingCase, step: string) => {
      const currentCompleted = c.completedSteps || [];
      const newCompleted = currentCompleted.includes(step) 
          ? currentCompleted.filter(s => s !== step)
          : [...currentCompleted, step];
      
      const updated = { ...c, completedSteps: newCompleted, updatedAt: new Date().toISOString() };
      setSelectedCase(updated);
      onUpdate(updated);
  };

  const handleResolutionNotesChange = (c: SafeguardingCase, notes: string) => {
      // Just update local state for interactivity, persist on blur
      setSelectedCase({ ...c, resolutionNotes: notes });
  };

  const saveResolutionNotes = (c: SafeguardingCase) => {
      setNoteSaveStatus('SAVING');
      const updated = { ...c, updatedAt: new Date().toISOString() };
      onUpdate(updated);
      setTimeout(() => setNoteSaveStatus('SAVED'), 500);
      setTimeout(() => setNoteSaveStatus('IDLE'), 2500);
  };

  // LIST MODE: Review existing cases
  if (mode === 'LIST' && !selectedCase) {
      return (
          <div className="animate-fade-in space-y-6 relative">
               {/* Delete Confirmation Modal */}
               {caseToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                  <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-200">
                    <div className="flex items-center space-x-3 text-red-600 mb-4">
                      <div className="p-2 bg-red-100 rounded-full">
                        <AlertTriangle size={24} />
                      </div>
                      <h3 className="text-lg font-bold">Delete Safeguarding Case?</h3>
                    </div>
                    <p className="text-slate-600 mb-6">
                      Are you sure you want to permanently delete this case file? This action cannot be undone.
                    </p>
                    <div className="flex justify-end space-x-3">
                      <button onClick={() => setCaseToDelete(null)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors">
                        Cancel
                      </button>
                      <button onClick={() => { onDelete(caseToDelete); setCaseToDelete(null); }} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors shadow-md">
                        Delete Case
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center space-x-3 mb-2">
                        <div className="p-2 bg-red-100 text-red-600 rounded-lg"><Shield size={28} /></div>
                        <h1 className="text-3xl font-bold text-slate-800">Safeguarding Logs</h1>
                    </div>
                    <p className="text-slate-500">Manage and track safeguarding incidents and reports.</p>
                </div>
                <button onClick={() => { setEditingId(null); setMode('BUILD'); setGeneratedCase(null); setStudentName(''); setDescription(''); }} className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-md font-medium">
                    <Plus size={18} className="mr-2" /> New Case File
                </button>
              </header>

              {/* Stats Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between shadow-sm">
                      <div><p className="text-sm text-slate-500 font-medium">Open Cases</p><p className="text-2xl font-bold text-slate-800">{openCases}</p></div>
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><FileText size={20} /></div>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between shadow-sm">
                      <div><p className="text-sm text-slate-500 font-medium">Under Investigation</p><p className="text-2xl font-bold text-slate-800">{investigatingCases}</p></div>
                       <div className="p-2 bg-amber-50 text-amber-600 rounded-lg"><Search size={20} /></div>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between shadow-sm">
                      <div><p className="text-sm text-slate-500 font-medium">High/Critical Risk</p><p className="text-2xl font-bold text-red-600">{highRiskCases}</p></div>
                       <div className="p-2 bg-red-50 text-red-600 rounded-lg"><AlertTriangle size={20} /></div>
                  </div>
              </div>

              {/* Search and Filter */}
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                    <input type="text" placeholder="Search by student or keywords..." value={caseSearchTerm} onChange={(e) => setCaseSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-red-500 outline-none transition-all" />
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative w-full sm:w-40">
                         <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                         <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-red-500 outline-none appearance-none bg-white cursor-pointer text-slate-600 text-sm">
                           <option value="All">All Types</option>
                           {uniqueIncidentTypes.map(type => (<option key={type} value={type}>{type}</option>))}
                         </select>
                    </div>
                    <div className="relative w-full sm:w-40">
                         <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                         <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-red-500 outline-none appearance-none bg-white cursor-pointer text-slate-600 text-sm">
                           <option value="All">All Statuses</option>
                           <option value="Open">Open</option>
                           <option value="Investigating">Investigating</option>
                           <option value="Closed">Closed</option>
                         </select>
                    </div>
                     <div className="relative w-full sm:w-40">
                         <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                         <select value={authorFilter} onChange={(e) => setAuthorFilter(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-red-500 outline-none appearance-none bg-white cursor-pointer text-slate-600 text-sm">
                           <option value="All">All Authors</option>
                           {uniqueAuthors.map(a => (<option key={a} value={a}>{a}</option>))}
                         </select>
                    </div>
                </div>
              </div>
              
              {filteredCases.length === 0 ? (
                  <div className="text-center py-16 bg-white rounded-xl border border-slate-200 border-dashed">
                    <div className="mx-auto w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4"><Shield size={32} className="text-slate-300" /></div>
                    <p className="text-slate-500 font-medium">No matching safeguarding cases found.</p>
                    {cases.length === 0 && (
                        <button onClick={() => setMode('BUILD')} className="mt-4 text-red-600 hover:text-red-700 font-medium">Create your first case</button>
                    )}
                  </div>
              ) : (
                  <div className="grid grid-cols-1 gap-4">
                      {filteredCases.map(c => (
                          <div key={c.id} className={`bg-white p-5 rounded-xl border shadow-sm transition-all cursor-pointer group relative ${c.isConfidential ? 'border-red-100 bg-red-50/30' : 'border-slate-200 hover:border-red-200 hover:shadow-md'}`} onClick={() => setSelectedCase(c)}>
                              {c.isConfidential && (
                                <div className="absolute top-0 right-0 p-2">
                                   <div className="flex items-center space-x-1 px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold uppercase tracking-wide rounded-bl-lg rounded-tr-lg">
                                      <Lock size={10} /> <span>Confidential</span>
                                   </div>
                                </div>
                              )}
                              <div className="absolute top-5 right-5 flex gap-2">
                                  {c.generatedReport.sentiment && (
                                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border flex items-center ${
                                          c.generatedReport.sentiment === 'Critical' ? 'bg-red-100 text-red-700 border-red-200' :
                                          c.generatedReport.sentiment === 'Serious' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                                          'bg-blue-50 text-blue-700 border-blue-200'
                                      }`}>
                                          <Activity size={12} className="mr-1.5" />
                                          {c.generatedReport.sentiment}
                                      </span>
                                  )}
                                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border flex items-center ${
                                    c.status === 'Open' ? 'bg-red-50 text-red-700 border-red-200' :
                                    c.status === 'Investigating' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                    'bg-green-50 text-green-700 border-green-200'
                                  }`}>
                                    {c.status}
                                  </span>
                              </div>
                              <div className="flex items-center space-x-4 mb-4">
                                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-lg group-hover:bg-red-50 group-hover:text-red-600 transition-colors">
                                      {c.studentName.charAt(0)}
                                  </div>
                                  <div>
                                      <h3 className="text-lg font-bold text-slate-800 group-hover:text-red-700 transition-colors">{c.studentName}</h3>
                                      <div className="flex items-center text-xs text-slate-500 space-x-3 mt-1">
                                          <span className="flex items-center"><Calendar size={12} className="mr-1" /> {new Date(c.date).toLocaleDateString()}</span >
                                          <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                          <span className="font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded">{c.incidentType}</span>
                                          {c.relatedLogIds && c.relatedLogIds.length > 0 && (
                                              <span className="flex items-center text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                                                  <Paperclip size={10} className="mr-1" />{c.relatedLogIds.length} Evidence Attached
                                              </span>
                                          )}
                                      </div>
                                  </div>
                              </div>
                              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mb-4">
                                  <p className="text-sm text-slate-600 line-clamp-2">{c.generatedReport.dslSummary}</p>
                              </div>
                              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                                  <div className="flex items-center space-x-4">
                                    <div className="flex items-center text-slate-500">
                                        <span className={`w-2.5 h-2.5 rounded-full mr-2 ${
                                            c.generatedReport.riskLevel === 'Critical' ? 'bg-red-500' : 
                                            c.generatedReport.riskLevel === 'High' ? 'bg-orange-500' : 
                                            c.generatedReport.riskLevel === 'Medium' ? 'bg-yellow-400' : 'bg-green-400'
                                        }`}></span>
                                        <span className="font-medium">Risk Level: {c.generatedReport.riskLevel}</span>
                                    </div>
                                    {c.createdBy && (<div className="text-slate-400 flex items-center"><User size={12} className="mr-1" /> Filed by {c.createdBy}</div>)}
                                  </div>
                                  <div className="flex items-center space-x-3">
                                    <button onClick={(e) => { e.stopPropagation(); setCaseToDelete(c.id); }} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Delete Case"><Trash2 size={16} /></button>
                                    <span className="text-blue-600 font-medium group-hover:underline flex items-center">View Full Case <ChevronRight size={12} className="ml-1" /></span>
                                  </div>
                              </div>
                          </div>
                      ))}
                  </div>
              )}
          </div>
      );
  }

  // DETAIL MODE: Review a specific case
  if (selectedCase) {
      const score = calculateRiskScore(selectedCase.generatedReport.riskLevel, selectedCase.generatedReport.sentiment);
      const completionPercentage = selectedCase.generatedReport.nextSteps.length > 0 
          ? Math.round(((selectedCase.completedSteps?.length || 0) / selectedCase.generatedReport.nextSteps.length) * 100)
          : 0;
      
      // Mock Access logs for the UI
      const accessLogs = generateMockAccessLogs(selectedCase.id, selectedCase.createdBy || 'Admin');

      return (
          <div className="animate-fade-in max-w-5xl mx-auto bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center sticky top-0 z-10">
                  <div className="flex items-center space-x-4">
                      <button onClick={() => setSelectedCase(null)} className="p-1.5 hover:bg-white rounded-lg text-slate-500 hover:text-slate-800 transition-colors flex items-center">
                          <ArrowLeft size={20} className="mr-2" />
                          <span className="text-sm font-medium">Back to List</span>
                      </button>
                      <div className="h-6 w-px bg-slate-300 mx-2"></div>
                      <div>
                          <h2 className="text-xl font-bold text-slate-800 flex items-center">
                            {selectedCase.studentName}
                            {selectedCase.isConfidential && (
                                <span title="Confidential" className="ml-2 text-red-500 flex items-center">
                                    <Lock size={16} />
                                </span>
                            )}
                          </h2>
                          <p className="text-xs text-slate-500">Case ID: {selectedCase.id.slice(0,8)} • {new Date(selectedCase.date).toLocaleDateString()}</p>
                      </div>
                  </div>
                  <div className="flex items-center space-x-3">
                       <button
                         onClick={() => handleEditClick(selectedCase)}
                         className="flex items-center space-x-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 hover:border-blue-300 transition-colors"
                       >
                         <Edit3 size={14} />
                         <span>Edit Details</span>
                       </button>
                       <div className="h-6 w-px bg-slate-300 mx-2"></div>
                      <button 
                         onClick={() => handleCopyToClipboard(selectedCase)}
                         className="flex items-center space-x-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                      >
                         {copySuccess ? <CheckCircle2 size={14} className="text-green-600"/> : <Copy size={14} />}
                         <span>{copySuccess ? 'Copied!' : 'Copy to Clipboard'}</span>
                      </button>
                       <button
                         onClick={() => setIsRedacted(!isRedacted)}
                         className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${isRedacted ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}`}
                       >
                         {isRedacted ? <EyeOff size={14} /> : <Eye size={14} />}
                         <span>{isRedacted ? 'Redaction On' : 'Redact PII'}</span>
                       </button>
                  </div>
              </div>
              
              <div className="p-8 space-y-8 overflow-y-auto">
                  {/* Status Bar */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
                      <div className="flex items-center space-x-4 w-full md:w-auto">
                          <span className="text-sm font-bold text-slate-500 uppercase tracking-wide">Case Status:</span>
                          <div className="flex bg-slate-100 p-1 rounded-lg">
                              {['Open', 'Investigating', 'Closed'].map((s) => (
                                  <button 
                                      key={s}
                                      onClick={() => updateCaseStatus(selectedCase, s as any)}
                                      className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${selectedCase.status === s 
                                          ? (s === 'Open' ? 'bg-red-500 text-white shadow' : s === 'Investigating' ? 'bg-orange-500 text-white shadow' : 'bg-green-600 text-white shadow') 
                                          : 'text-slate-500 hover:text-slate-800'
                                      }`}
                                  >
                                      {s}
                                  </button>
                              ))}
                          </div>
                      </div>
                      
                      <div className="flex items-center space-x-4 w-full md:w-auto">
                           <div className="text-right">
                               <p className="text-[10px] font-bold text-slate-400 uppercase">Resolution Progress</p>
                               <div className="flex items-center justify-end space-x-2">
                                   <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                                       <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${completionPercentage}%` }}></div>
                                   </div>
                                   <span className="text-xs font-bold text-slate-700">{completionPercentage}%</span>
                               </div>
                           </div>
                      </div>
                  </div>

                  {/* ... Detail Content ... */}
                  <div className="grid grid-cols-2 gap-6 text-sm border-b border-slate-100 pb-6">
                      <div><p className="text-slate-400 mb-1 uppercase text-xs font-bold">Incident Date</p><p className="font-medium text-slate-800 text-lg">{selectedCase.date}</p></div>
                      <div><p className="text-slate-400 mb-1 uppercase text-xs font-bold">Category</p><p className="font-medium text-lg text-slate-800">{selectedCase.incidentType}</p></div>
                  </div>
                  
                  {/* Risk Score */}
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                      <div className="flex justify-between items-end mb-3">
                          <div className="flex items-center text-slate-700">
                              <BarChart3 size={20} className="mr-2 text-blue-600" />
                              <h3 className="font-bold">Calculated Risk Score</h3>
                          </div>
                          <span className={`text-2xl font-black ${score >= 80 ? 'text-red-600' : score >= 50 ? 'text-orange-500' : 'text-blue-600'}`}>{score}/100</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-1000 ${score >= 80 ? 'bg-red-600' : score >= 50 ? 'bg-orange-500' : 'bg-blue-500'}`} style={{ width: `${score}%` }}></div>
                      </div>
                      <div className="flex justify-between text-xs text-slate-400 mt-2 font-medium"><span>Low Risk</span><span>Medium Risk</span><span>High Risk</span><span>Critical</span></div>
                  </div>

                  <div>
                      <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-3 flex items-center">
                          <FileText size={16} className="mr-2 text-blue-600" /> DSL Executive Summary
                      </h3>
                      <div className="bg-blue-50 p-5 rounded-xl border border-blue-100 text-slate-700 leading-relaxed">
                        {redactText(selectedCase.generatedReport.dslSummary, selectedCase.studentName)}
                      </div>
                  </div>
                  
                   <div>
                      <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-3 flex items-center">
                          <FileText size={16} className="mr-2 text-slate-400" /> Raw Incident Report
                      </h3>
                      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-slate-600 text-sm italic">
                        "{redactText(selectedCase.rawDescription, selectedCase.studentName)}"
                      </div>
                  </div>

                  {/* Evidence Analysis */}
                  {selectedCase.generatedReport.evidenceAnalysis && (
                    <div className="bg-indigo-50 p-5 rounded-xl border border-indigo-100 shadow-sm">
                        <h3 className="text-sm font-bold text-indigo-800 uppercase tracking-wide mb-3 flex items-center">
                          <BrainCircuit size={16} className="mr-2" /> AI Pattern Recognition
                        </h3>
                        <p className="text-sm text-indigo-900 leading-relaxed">
                          {redactText(selectedCase.generatedReport.evidenceAnalysis, selectedCase.studentName)}
                        </p>
                    </div>
                  )}
                  
                  {/* Evidence Section */}
                  {(selectedCase.generatedReport.keyEvidence?.length > 0 || (selectedCase.relatedLogIds && selectedCase.relatedLogIds.length > 0)) && (
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-4 flex items-center"><Paperclip size={16} className="mr-2 text-slate-500" /> Evidentiary Basis</h3>
                        {selectedCase.generatedReport.keyEvidence?.length > 0 && (
                          <div className="mb-4">
                             <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Key Findings & Patterns</h4>
                             <ul className="space-y-2">
                                {selectedCase.generatedReport.keyEvidence.map((ev, i) => (
                                    <li key={i} className="flex items-start text-sm text-slate-700 bg-slate-50 p-2 rounded">
                                        <span className="mr-2 text-blue-500 mt-0.5">•</span> {redactText(ev, selectedCase.studentName)}
                                    </li>
                                ))}
                             </ul>
                          </div>
                        )}
                        {/* Linked Logs */}
                        {selectedCase.relatedLogIds && selectedCase.relatedLogIds.length > 0 && (
                            <div>
                                <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Corroborating Interaction Logs ({selectedCase.relatedLogIds.length})</h4>
                                <div className="space-y-2">
                                    {logs.filter(l => selectedCase.relatedLogIds?.includes(l.id)).map(log => (
                                        <div key={log.id} className="text-xs p-3 border border-slate-100 rounded-lg flex justify-between items-center bg-white hover:bg-slate-50">
                                            <div>
                                                <span className="font-bold text-slate-700">{new Date(log.date).toLocaleDateString()}</span>
                                                <span className="mx-2 text-slate-300">|</span>
                                                <span className="text-slate-600">{log.type}</span>
                                            </div>
                                            <div className="flex items-center">
                                                {log.createdBy && <span className="text-[10px] text-slate-400 mr-2">by {log.createdBy}</span>}
                                                <span className={`px-2 py-0.5 rounded text-[10px] ${log.sentiment === 'Concerned' ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-500'}`}>{log.sentiment}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                  )}

                  <div>
                      <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-3 flex items-center"><Clock size={16} className="mr-2 text-slate-400" /> Timeline of Events</h3>
                      <ul className="space-y-0 border-l-2 border-slate-200 pl-6 ml-2">
                          {selectedCase.generatedReport.chronology.map((event, i) => (
                              <li key={i} className="relative pb-6 last:pb-0">
                                  <span className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-white border-2 border-slate-400"></span>
                                  <p className="text-sm text-slate-700">{redactText(event, selectedCase.studentName)}</p>
                              </li>
                          ))}
                      </ul>
                  </div>
                  
                  {/* Action Plan Checklist */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-amber-50 p-5 rounded-xl border border-amber-100">
                          <h4 className="font-bold text-amber-800 text-sm mb-3 flex items-center"><AlertTriangle size={16} className="mr-2" /> Witness Questions</h4>
                          <ul className="space-y-2">
                              {selectedCase.generatedReport.witnessQuestions.map((q, i) => (<li key={i} className="flex items-start text-sm text-amber-900"><span className="mr-2">•</span>{redactText(q, selectedCase.studentName)}</li>))}
                          </ul>
                      </div>
                      
                      <div className="bg-emerald-50 p-5 rounded-xl border border-emerald-100">
                          <h4 className="font-bold text-emerald-800 text-sm mb-3 flex items-center"><ClipboardList size={16} className="mr-2" /> Action Plan Checklist</h4>
                           <ul className="space-y-2">
                              {selectedCase.generatedReport.nextSteps.map((step, i) => {
                                  const isCompleted = selectedCase.completedSteps?.includes(step);
                                  return (
                                    <li 
                                        key={i} 
                                        className={`flex items-start text-sm p-2 rounded cursor-pointer transition-colors ${isCompleted ? 'bg-emerald-100/50 text-emerald-800/60 line-through' : 'bg-white hover:bg-emerald-100 text-emerald-900 shadow-sm'}`}
                                        onClick={() => toggleActionStep(selectedCase, step)}
                                    >
                                        <div className={`mt-0.5 mr-2 w-4 h-4 rounded border flex items-center justify-center ${isCompleted ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-emerald-300'}`}>
                                            {isCompleted && <CheckCircle2 size={12} />}
                                        </div>
                                        <span>{redactText(step, selectedCase.studentName)}</span>
                                    </li>
                                  );
                              })}
                          </ul>
                      </div>
                  </div>
                  
                  {/* Resolution Notes */}
                  <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                       <div className="flex justify-between items-center mb-3">
                           <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center">
                               <CheckSquare size={16} className="mr-2 text-slate-500" /> Resolution / Updates
                           </h3>
                       </div>
                       <textarea 
                           className="w-full min-h-[100px] p-4 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm leading-relaxed bg-white mb-3"
                           placeholder="Add resolution notes, outcome summaries, or ongoing updates here..."
                           value={selectedCase.resolutionNotes || ''}
                           onChange={(e) => handleResolutionNotesChange(selectedCase, e.target.value)}
                       />
                       <div className="flex justify-between items-center">
                            <div className="text-[10px] text-slate-400">
                                {selectedCase.updatedAt ? `Last updated: ${new Date(selectedCase.updatedAt).toLocaleString()}` : ''}
                            </div>
                            <button 
                                onClick={() => saveResolutionNotes(selectedCase)}
                                disabled={noteSaveStatus === 'SAVING'}
                                className={`flex items-center px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                                    noteSaveStatus === 'SAVED' 
                                    ? 'bg-green-600 text-white' 
                                    : 'bg-slate-800 text-white hover:bg-slate-900'
                                }`}
                            >
                                {noteSaveStatus === 'SAVING' ? <Loader2 size={14} className="mr-2 animate-spin"/> : 
                                 noteSaveStatus === 'SAVED' ? <CheckCircle2 size={14} className="mr-2"/> : 
                                 <Save size={14} className="mr-2"/>}
                                {noteSaveStatus === 'SAVING' ? 'Saving...' : 
                                 noteSaveStatus === 'SAVED' ? 'Update Saved' : 'Submit Update'}
                            </button>
                       </div>
                  </div>

                  <div>
                      <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-3 flex items-center"><Shield size={16} className="mr-2 text-slate-400" /> Policies Applied</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedCase.generatedReport.policiesApplied.map((policy, i) => (<span key={i} className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 text-sm rounded-lg shadow-sm font-medium">{policy}</span>))}
                      </div>
                  </div>

                  {/* Access Audit Log (Visual only for this demo) */}
                  <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                      <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-3 flex items-center"><History size={16} className="mr-2 text-slate-400" /> Access Audit Log</h3>
                      <div className="overflow-x-auto">
                          <table className="w-full text-xs text-left">
                              <thead>
                                  <tr className="text-slate-400 border-b border-slate-100">
                                      <th className="pb-2 font-semibold">Timestamp</th>
                                      <th className="pb-2 font-semibold">User</th>
                                      <th className="pb-2 font-semibold">Action</th>
                                  </tr>
                              </thead>
                              <tbody className="text-slate-600">
                                  {accessLogs.map((log, i) => (
                                      <tr key={i} className="border-b border-slate-50 last:border-0">
                                          <td className="py-2 text-slate-400">{new Date(log.date).toLocaleString()}</td>
                                          <td className="py-2 font-medium">{log.user}</td>
                                          <td className="py-2">{log.action}</td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                      </div>
                  </div>
              </div>
          </div>
      );
  }

  // BUILD MODE
  return (
    <div className="animate-fade-in max-w-6xl mx-auto">
      <header className="mb-8 flex items-center justify-between">
        <div className="flex items-center space-x-3 mb-2">
           <button onClick={() => { setMode('LIST'); setEditingId(null); setGeneratedCase(null); setStudentName(''); setDescription(''); }} className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors flex items-center"><ChevronRight className="rotate-180" size={20} /></button>
           <h1 className="text-2xl font-bold text-slate-800">{editingId ? 'Edit Safeguarding Case' : 'New Safeguarding Case'}</h1>
        </div>
        <div className="text-sm text-slate-500">Filing as: <span className="font-semibold text-slate-800">{currentUser.name}</span></div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* INPUT COLUMN */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center"><FileText size={20} className="mr-2 text-blue-600" /> Incident Details</h2>
            <div className="space-y-4">
              <div className="relative" ref={wrapperRef}>
                <label className="block text-sm font-medium text-slate-700 mb-1">Student Involved</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                  <input type="text" value={studentName} onChange={(e) => { setStudentName(e.target.value); setShowSuggestions(true); if (studentName !== e.target.value) setSelectedLogIds([]); }} onFocus={() => setShowSuggestions(true)} className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none" placeholder="Search student name..." />
                </div>
                {showSuggestions && studentName && filteredStudents.length > 0 && (
                  <div className="absolute z-20 w-full bg-white border border-slate-200 rounded-lg shadow-lg mt-1 overflow-hidden">
                    {filteredStudents.map((student) => (
                      <button key={student.id} onClick={() => { setStudentName(student.name); setShowSuggestions(false); setSelectedLogIds([]); }} className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center"><span className="font-medium text-slate-700">{student.name}</span><span className="ml-auto text-xs text-slate-400">{student.studentClass}</span></button>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Evidence Locker */}
              {studentName && (
                 <div className="border border-slate-200 rounded-xl bg-slate-50 overflow-hidden">
                    <div className="px-4 py-3 bg-slate-100 border-b border-slate-200 flex justify-between items-center">
                       <h3 className="text-xs font-bold text-slate-600 uppercase flex items-center tracking-wide"><Paperclip size={14} className="mr-1.5" /> Evidence Locker</h3>
                       <div className="flex bg-white rounded-lg p-0.5 border border-slate-200">
                          <button onClick={() => setEvidenceFilterType('ALL')} className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${evidenceFilterType === 'ALL' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>All History</button>
                          <button onClick={() => setEvidenceFilterType('CONCERNS')} className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${evidenceFilterType === 'CONCERNS' ? 'bg-red-50 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>Concerns Only</button>
                       </div>
                    </div>
                    
                    <div className="max-h-60 overflow-y-auto custom-scrollbar p-2 space-y-2">
                        {candidateLogs.length === 0 ? (<div className="text-center py-8 text-slate-400"><p className="text-xs italic">No logs found matching filter.</p></div>) : (
                          candidateLogs.map(log => {
                            const isSelected = selectedLogIds.includes(log.id);
                            return (
                              <div key={log.id} onClick={() => handleToggleLogEvidence(log.id)} className={`relative group p-3 rounded-lg cursor-pointer border-2 transition-all ${isSelected ? 'bg-white border-blue-500 shadow-md z-10' : 'bg-white border-transparent hover:border-slate-300 hover:shadow-sm'}`}>
                                  <div className="flex justify-between items-start mb-2">
                                      <div className="flex items-center space-x-2">
                                          <div className={`transition-colors ${isSelected ? 'text-blue-600' : 'text-slate-300 group-hover:text-slate-400'}`}>{isSelected ? <CheckSquare size={18} /> : <Square size={18} />}</div>
                                          <div><p className="text-xs font-bold text-slate-700">{new Date(log.date).toLocaleDateString()}</p><p className="text-[10px] text-slate-400 font-medium uppercase">{log.type}</p></div>
                                      </div>
                                      <div className="flex flex-col items-end">
                                        {log.sentiment && log.sentiment !== 'Neutral' && (<span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border mb-1 ${log.sentiment === 'Concerned' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-600 border-green-100'}`}>{log.sentiment}</span>)}
                                      </div>
                                  </div>
                                  <p className="text-xs text-slate-600 line-clamp-2 pl-7 border-l-2 border-slate-100 ml-1">{log.notes}</p>
                                  {log.createdBy && (<div className="mt-2 pl-7 flex items-center text-[10px] text-slate-400"><User size={10} className="mr-1" /> {log.createdBy}</div>)}
                              </div>
                            );
                          })
                        )}
                    </div>
                    {selectedLogIds.length > 0 && (<div className="bg-blue-50 px-4 py-2 border-t border-blue-100 flex justify-between items-center"><span className="text-xs font-bold text-blue-700">{selectedLogIds.length} Evidence Log(s) Selected</span><button onClick={() => setSelectedLogIds([])} className="text-[10px] text-blue-500 hover:text-blue-700 underline">Clear Selection</button></div>)}
                 </div>
              )}
            </div>
          </div>

          {/* Incident Details Form */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
              <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center"><Gavel size={20} className="mr-2 text-amber-600" /> Classification</h2>
              
              <div className="grid grid-cols-2 gap-4">
                  <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Incident Date</label>
                      <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-red-500 outline-none" />
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                       <div className="relative">
                         <select value={incidentType} onChange={(e) => setIncidentType(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-red-500 outline-none appearance-none bg-white">
                           {uniqueIncidentTypes.length > 0 ? uniqueIncidentTypes.map(t => <option key={t} value={t}>{t}</option>) : <option>Behavioral</option>}
                           <option value="Bullying">Bullying</option>
                           <option value="Physical Abuse">Physical Abuse</option>
                           <option value="Sexual Harassment">Sexual Harassment</option>
                           <option value="Online Safety">Online Safety</option>
                           <option value="Substance Misuse">Substance Misuse</option>
                           <option value="Other">Other</option>
                         </select>
                         <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                       </div>
                  </div>
              </div>
              
              <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                   <div className="flex p-1 bg-slate-100 rounded-lg">
                       {['Open', 'Investigating', 'Closed'].map((s) => (
                           <button key={s} onClick={() => setStatus(s as any)} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${status === s ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>{s}</button>
                       ))}
                   </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                  <input type="checkbox" id="confidential" checked={isConfidential} onChange={(e) => setIsConfidential(e.target.checked)} className="rounded text-red-600 focus:ring-red-500 w-4 h-4" />
                  <label htmlFor="confidential" className="text-sm font-medium text-slate-700 flex items-center">
                      <Lock size={14} className="mr-1.5 text-slate-400" /> Mark as Confidential
                  </label>
              </div>
          </div>
        </div>

        {/* OUTPUT COLUMN */}
        <div className="space-y-6 flex flex-col h-full">
             <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex-1 flex flex-col">
                <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center"><FileText size={20} className="mr-2 text-indigo-600" /> Description & Report</h2>
                
                <div className="mb-4 flex-1 flex flex-col">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Incident Description</label>
                    <textarea 
                        value={description} 
                        onChange={(e) => setDescription(e.target.value)} 
                        placeholder="Describe the incident in detail. The AI will analyze this along with selected evidence logs to generate the formal report."
                        className="w-full flex-1 min-h-[150px] px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-red-500 outline-none resize-none text-sm leading-relaxed"
                    />
                </div>

                {generationError && (
                    <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center">
                        <AlertTriangle size={16} className="mr-2" />
                        {generationError}
                    </div>
                )}

                {!generatedCase ? (
                    <div className="bg-slate-50 rounded-xl border border-slate-200 border-dashed p-8 flex flex-col items-center justify-center text-center">
                        <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 text-indigo-500">
                            <Sparkles size={24} />
                        </div>
                        <h3 className="text-slate-800 font-bold mb-1">{editingId ? 'Regenerate Case File' : 'Generate AI Case File'}</h3>
                        <p className="text-xs text-slate-500 max-w-xs mb-6">Gemini will draft a formal DSL summary, chronology, and risk assessment based on your description and evidence.</p>
                        <button 
                            onClick={handleGenerate}
                            disabled={!studentName || !description || isGenerating}
                            className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        >
                            {isGenerating ? <Loader2 size={18} className="animate-spin mr-2" /> : <BrainCircuit size={18} className="mr-2" />}
                            {isGenerating ? 'Analyzing...' : 'Generate Report'}
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4 animate-fade-in">
                        <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="text-xs font-bold text-indigo-800 uppercase tracking-wide">AI Generated Summary</h3>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${generatedCase.riskLevel === 'High' || generatedCase.riskLevel === 'Critical' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>Risk: {generatedCase.riskLevel}</span>
                            </div>
                            <p className="text-sm text-indigo-900 leading-relaxed">{generatedCase.dslSummary}</p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                           <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                               <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Proposed Actions</p>
                               <p className="text-sm font-bold text-slate-700">{generatedCase.nextSteps.length} steps identified</p>
                           </div>
                           <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                               <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Policy Matches</p>
                               <p className="text-sm font-bold text-slate-700">{generatedCase.policiesApplied.length} policies</p>
                           </div>
                        </div>

                        <div className="flex space-x-3 pt-2">
                             <button onClick={() => setGeneratedCase(null)} className="flex-1 px-4 py-2 border border-slate-300 text-slate-600 rounded-lg font-medium hover:bg-slate-50">Edit Inputs</button>
                             <button onClick={handleFinalSave} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 shadow-lg shadow-green-200 flex items-center justify-center">
                                 <Save size={18} className="mr-2" /> {editingId ? 'Update Case' : 'Save Case File'}
                             </button>
                        </div>
                    </div>
                )}
             </div>
        </div>
      </div>
    </div>
  );
};

export default SafeguardingBuilder;