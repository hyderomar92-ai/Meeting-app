
import * as React from 'react';
import { useState, useRef, useEffect, useMemo } from 'react';
import { SafeguardingCase, MeetingLog, UserProfile } from '../types';
import { generateSafeguardingReport } from '../services/geminiService';
import { Shield, AlertTriangle, FileText, Save, Loader2, Search, User, ChevronRight, ClipboardList, Gavel, Clock, Plus, Calendar, ArrowLeft, Filter, CheckCircle2, Activity, Trash2, Tag, BarChart3, Paperclip, CheckSquare, Square, Sparkles, BrainCircuit, Lock, Eye, EyeOff, Copy, ChevronDown, Edit3, History, Circle, ExternalLink } from 'lucide-react';
import { STUDENTS } from '../data/students';

interface SafeguardingBuilderProps {
  cases: SafeguardingCase[];
  logs: MeetingLog[];
  onSave: (caseFile: SafeguardingCase) => void;
  onUpdate: (caseFile: SafeguardingCase) => void;
  onDelete: (id: string) => void;
  onCancel: () => void;
  onNavigateToStudent: (studentName: string) => void;
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

const SafeguardingBuilder: React.FC<SafeguardingBuilderProps> = ({ cases, logs, onSave, onUpdate, onDelete, onCancel, onNavigateToStudent, currentUser, initialSearchTerm = '', initialData }) => {
  // RBAC: Teachers forced to BUILD mode, cannot see LIST
  const isTeacher = currentUser.role === 'Teacher';
  
  const [mode, setMode] = useState<'LIST' | 'BUILD'>(isTeacher ? 'BUILD' : 'LIST');
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
    // Create report structure even if AI wasn't used (manual entry fallback)
    const reportData = generatedCase || {
        dslSummary: description.substring(0, 100) + "...",
        chronology: [new Date().toISOString() + ": Incident recorded manually"],
        keyEvidence: [],
        policiesApplied: ["Standard Reporting"],
        witnessQuestions: [],
        nextSteps: ["Review by DSL"],
        riskLevel: 'Low',
        sentiment: 'Routine'
    };
    
    const existingCase = editingId ? cases.find(c => c.id === editingId) : null;
    
    const newCase: SafeguardingCase = {
      id: editingId || crypto.randomUUID(),
      studentName,
      date,
      incidentType,
      rawDescription: description,
      generatedReport: reportData as any,
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

    // Reset form
    setStudentName('');
    setDescription('');
    setSelectedLogIds([]);
    setGeneratedCase(null);
    setIsConfidential(false);
    setEditingId(null);

    if (!isTeacher) {
        setMode('LIST'); 
    } else {
        alert("Safeguarding Report Submitted Successfully.");
        onCancel();
    }
  };

  const handleInternalCancel = () => {
      // If we came from escalation (initialData) or are a teacher, we exit the module entirely.
      // If we are an admin just cancelling a form, we go back to the list.
      if (initialData || isTeacher) {
          onCancel();
      } else {
          setMode('LIST');
          setEditingId(null);
          setGeneratedCase(null);
          setStudentName('');
          setDescription('');
      }
  };
  
  // Interactive Update Handlers (Detail View)
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
      setSelectedCase({ ...c, resolutionNotes: notes });
  };

  const saveResolutionNotes = (c: SafeguardingCase) => {
      setNoteSaveStatus('SAVING');
      const updated = { ...c, updatedAt: new Date().toISOString() };
      onUpdate(updated);
      setTimeout(() => setNoteSaveStatus('SAVED'), 500);
      setTimeout(() => setNoteSaveStatus('IDLE'), 2500);
  };

  // LIST MODE
  if (mode === 'LIST' && !selectedCase && !isTeacher) {
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
                                  <div 
                                    className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-lg group-hover:bg-red-50 group-hover:text-red-600 transition-colors z-10"
                                    onClick={(e) => { e.stopPropagation(); onNavigateToStudent(c.studentName); }}
                                    title="View Student Profile"
                                  >
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

  // DETAIL MODE
  if (selectedCase && !isTeacher) {
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
                          <button 
                            onClick={() => onNavigateToStudent(selectedCase.studentName)}
                            className="text-xl font-bold text-slate-800 flex items-center hover:text-indigo-600 transition-colors group"
                            title="View Student Profile"
                          >
                            {selectedCase.studentName}
                            <ExternalLink size={16} className="ml-2 opacity-50 group-hover:opacity-100" />
                            {selectedCase.isConfidential && (
                                <span title="Confidential" className="ml-2 text-red-500 flex items-center">
                                    <Lock size={16} />
                                </span>
                            )}
                          </button>
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
              
              <div className="p-8 space-y-8 overflow-y-auto h-[calc(100vh-200px)] custom-scrollbar">
                  {/* 1. Incident Overview */}
                  <section>
                      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wide mb-3 border-b border-slate-100 pb-2">Incident Overview</h3>
                      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                          <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{selectedCase.rawDescription}</p>
                      </div>
                  </section>

                  {/* 2. AI Analysis */}
                  <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wide mb-3 border-b border-slate-100 pb-2">AI Risk Analysis</h3>
                          <div className="space-y-4">
                              <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg">
                                  <span className="text-sm text-slate-600">Risk Level</span>
                                  <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${selectedCase.generatedReport.riskLevel === 'Critical' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>{selectedCase.generatedReport.riskLevel}</span>
                              </div>
                              <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg">
                                  <span className="text-sm text-slate-600">Sentiment</span>
                                  <span className="text-xs font-bold text-slate-700">{selectedCase.generatedReport.sentiment}</span>
                              </div>
                              {selectedCase.generatedReport.evidenceAnalysis && (
                                  <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-800">
                                      <p className="font-bold mb-1 flex items-center"><BrainCircuit size={14} className="mr-1"/> Pattern Detected</p>
                                      {selectedCase.generatedReport.evidenceAnalysis}
                                  </div>
                              )}
                          </div>
                      </div>
                      <div>
                          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wide mb-3 border-b border-slate-100 pb-2">Witness Questions</h3>
                          <ul className="space-y-2">
                              {selectedCase.generatedReport.witnessQuestions.map((q, i) => (
                                  <li key={i} className="flex items-start text-sm text-slate-600 bg-white p-2 rounded border border-slate-100">
                                      <span className="text-indigo-500 font-bold mr-2">Q{i+1}:</span> {q}
                                  </li>
                              ))}
                          </ul>
                      </div>
                  </section>

                  {/* 3. Action Plan & Status */}
                  <section>
                      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wide mb-3 border-b border-slate-100 pb-2">Action Plan & Resolution</h3>
                      <div className="space-y-2 mb-6">
                          {selectedCase.generatedReport.nextSteps.map((step, i) => {
                              const isCompleted = (selectedCase.completedSteps || []).includes(step);
                              return (
                                  <div key={i} onClick={() => toggleActionStep(selectedCase, step)} className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${isCompleted ? 'bg-green-50 border-green-200' : 'bg-white border-slate-200 hover:border-indigo-300'}`}>
                                      {isCompleted ? <CheckCircle2 className="text-green-600 mr-3" size={20} /> : <Circle className="text-slate-300 mr-3" size={20} />}
                                      <span className={`text-sm ${isCompleted ? 'text-green-800 font-medium' : 'text-slate-700'}`}>{step}</span>
                                  </div>
                              )
                          })}
                      </div>
                      
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Resolution Notes</label>
                          <div className="relative">
                              <textarea 
                                  value={selectedCase.resolutionNotes || ''}
                                  onChange={(e) => handleResolutionNotesChange(selectedCase, e.target.value)}
                                  onBlur={() => saveResolutionNotes(selectedCase)}
                                  className="w-full p-4 border border-slate-300 rounded-lg h-32 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                  placeholder="Enter details on how this case was resolved..."
                              />
                              {noteSaveStatus === 'SAVING' && <span className="absolute bottom-2 right-2 text-xs text-slate-400 italic">Saving...</span>}
                              {noteSaveStatus === 'SAVED' && <span className="absolute bottom-2 right-2 text-xs text-green-600 font-bold flex items-center"><CheckCircle2 size={10} className="mr-1"/> Saved</span>}
                          </div>
                      </div>
                  </section>

                  {/* 4. Access Log Audit (Mock) */}
                  <section>
                      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wide mb-3 border-b border-slate-100 pb-2">Access Audit Log</h3>
                      <div className="bg-slate-900 rounded-lg p-4 font-mono text-xs text-slate-300 space-y-2">
                          {accessLogs.map((log, i) => (
                              <div key={i} className="flex justify-between border-b border-slate-800 last:border-0 pb-1 last:pb-0">
                                  <span>[{new Date(log.date).toLocaleString()}] {log.user}</span>
                                  <span className="text-indigo-400">{log.action}</span>
                              </div>
                          ))}
                      </div>
                  </section>
              </div>
          </div>
      );
  }

  // BUILD MODE (Form)
  return (
      <div className="animate-fade-in max-w-3xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
              <div>
                  <h2 className="text-2xl font-bold text-slate-800">{editingId ? 'Update Case File' : 'New Safeguarding Report'}</h2>
                  <p className="text-slate-500 text-sm">All entries are securely logged and auditable.</p>
              </div>
              <button onClick={handleInternalCancel} className="text-slate-500 hover:text-slate-800 font-medium">Cancel</button>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 space-y-6">
              {/* Student & Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="relative" ref={wrapperRef}>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Student Name</label>
                      <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                          <input 
                              type="text" 
                              value={studentName}
                              onChange={(e) => { setStudentName(e.target.value); setShowSuggestions(true); }}
                              onFocus={() => setShowSuggestions(true)}
                              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-red-500 transition-all"
                              placeholder="Search student..."
                          />
                      </div>
                      {showSuggestions && studentName && filteredStudents.length > 0 && (
                          <div className="absolute z-10 w-full bg-white border border-slate-200 rounded-lg shadow-xl mt-1 overflow-hidden">
                              {filteredStudents.map(s => (
                                  <div key={s.id} onClick={() => { setStudentName(s.name); setShowSuggestions(false); }} className="px-4 py-3 hover:bg-slate-50 cursor-pointer text-sm text-slate-700 border-b border-slate-50 last:border-0">
                                      {s.name} <span className="text-slate-400 text-xs ml-2">({s.id})</span>
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>
                  <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Date of Incident</label>
                      <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-red-500 transition-all" />
                  </div>
              </div>

              {/* Type & Confidentiality */}
              <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-1">
                      <label className="block text-sm font-bold text-slate-700 mb-1">Incident Type</label>
                      <select value={incidentType} onChange={(e) => setIncidentType(e.target.value)} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-red-500 bg-white">
                          {uniqueIncidentTypes.map(t => <option key={t} value={t}>{t}</option>)}
                          <option value="Other">Other</option>
                      </select>
                  </div>
                  <div className="flex items-end pb-2">
                      <label className="flex items-center cursor-pointer space-x-3 p-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors select-none">
                          <input type="checkbox" checked={isConfidential} onChange={(e) => setIsConfidential(e.target.checked)} className="w-5 h-5 text-red-600 rounded focus:ring-red-500" />
                          <span className="flex items-center text-sm font-bold text-slate-700">
                              <Lock size={16} className="mr-2 text-slate-400" /> Confidential Case
                          </span>
                      </label>
                  </div>
              </div>

              {/* Description */}
              <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Detailed Description</label>
                  <textarea 
                      value={description} 
                      onChange={(e) => setDescription(e.target.value)} 
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-red-500 h-40 resize-none text-sm leading-relaxed" 
                      placeholder="Describe the incident objectively. Include what was seen, heard, and actions taken immediately."
                  />
              </div>

              {/* AI Actions */}
              <div className="flex items-center justify-between pt-2">
                  <button 
                      onClick={handleGenerate}
                      disabled={isGenerating || !description || !studentName}
                      className={`flex items-center text-sm font-bold transition-colors ${
                          isGenerating || !description || !studentName 
                          ? 'text-slate-300 cursor-not-allowed' 
                          : 'text-indigo-600 hover:text-indigo-700'
                      }`}
                  >
                      {isGenerating ? <Loader2 size={16} className="animate-spin mr-2" /> : <Sparkles size={16} className="mr-2" />}
                      {isGenerating ? 'AI Analyzing...' : 'Generate Report with AI'}
                  </button>
                  {generationError && <span className="text-xs text-red-500 font-medium">{generationError}</span>}
              </div>

              {/* Generated Preview & Save */}
              {generatedCase && (
                  <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200 animate-fade-in">
                      <h3 className="text-sm font-bold text-slate-700 mb-2 flex items-center">
                          <CheckCircle2 size={16} className="text-green-500 mr-2" /> AI Summary Preview
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed mb-4 p-3 bg-white rounded border border-slate-100">
                          {generatedCase.dslSummary}
                      </p>
                      <div className="flex justify-end gap-3">
                          <button onClick={() => setGeneratedCase(null)} className="px-4 py-2 text-slate-500 text-sm font-medium hover:text-slate-700">Discard</button>
                          <button onClick={handleFinalSave} className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold shadow-md hover:bg-indigo-700 transition-colors">
                              {editingId ? 'Update Case' : 'File Report'}
                          </button>
                      </div>
                  </div>
              )}
              
              {!generatedCase && (
                   <div className="flex justify-end pt-4 border-t border-slate-100">
                       <button 
                          onClick={handleFinalSave}
                          disabled={!studentName || !description}
                          className="px-6 py-2 bg-slate-900 text-white rounded-lg font-bold shadow-md hover:bg-black transition-colors disabled:opacity-50"
                        >
                           Save Draft (Manual)
                       </button>
                   </div>
              )}
          </div>
      </div>
  );
};

export default SafeguardingBuilder;
