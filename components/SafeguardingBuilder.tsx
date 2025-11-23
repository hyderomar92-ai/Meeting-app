
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { SafeguardingCase, MeetingLog, UserProfile } from '../types';
import { generateSafeguardingReport } from '../services/geminiService';
import { Shield, AlertTriangle, FileText, Save, Loader2, Search, User, ChevronRight, ClipboardList, Gavel, Clock, Plus, Calendar, ArrowLeft, Filter, CheckCircle2, AlertCircle, Activity, Trash2, Tag, BarChart3, Paperclip, CheckSquare, Square, Sparkles, BrainCircuit, X } from 'lucide-react';
import { STUDENTS } from '../data/students';

interface SafeguardingBuilderProps {
  cases: SafeguardingCase[];
  logs: MeetingLog[];
  onSave: (caseFile: SafeguardingCase) => void;
  onDelete: (id: string) => void;
  onCancel: () => void;
  currentUser: UserProfile;
}

const SafeguardingBuilder: React.FC<SafeguardingBuilderProps> = ({ cases, logs, onSave, onDelete, onCancel, currentUser }) => {
  const [mode, setMode] = useState<'LIST' | 'BUILD'>('LIST');
  const [selectedCase, setSelectedCase] = useState<SafeguardingCase | null>(null);
  const [caseSearchTerm, setCaseSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [authorFilter, setAuthorFilter] = useState<string>('All');
  const [caseToDelete, setCaseToDelete] = useState<string | null>(null);

  // Form State
  const [studentName, setStudentName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [incidentType, setIncidentType] = useState('Behavioral');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'Open' | 'Investigating' | 'Closed'>('Open');
  
  // Evidence State
  const [selectedLogIds, setSelectedLogIds] = useState<string[]>([]);
  const [evidenceFilterType, setEvidenceFilterType] = useState<'ALL' | 'CONCERNS'>('ALL');
  
  // Suggestions State
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // AI State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCase, setGeneratedCase] = useState<SafeguardingCase['generatedReport'] | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

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
    // Base score from Risk Level (Max 60)
    const riskWeights: Record<string, number> = {
      'Critical': 60,
      'High': 40,
      'Medium': 20,
      'Low': 10
    };
    
    // Additive score from Sentiment (Max 40)
    const sentimentWeights: Record<string, number> = {
      'Critical': 40,
      'Serious': 30,
      'Cautionary': 15,
      'Routine': 0
    };

    const base = riskWeights[risk] || 0;
    const added = sentimentWeights[sentiment] || 0;
    
    // Cap at 100 just in case
    return Math.min(base + added, 100);
  };

  const riskScore = generatedCase ? calculateRiskScore(generatedCase.riskLevel, generatedCase.sentiment) : 0;

  const handleGenerate = async () => {
    if (!studentName || !description) return;
    
    setIsGenerating(true);
    try {
      // Find the actual log objects based on IDs
      const evidenceLogs = logs.filter(l => selectedLogIds.includes(l.id));
      const report = await generateSafeguardingReport(studentName, description, evidenceLogs);
      setGeneratedCase(report);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFinalSave = () => {
    if (!generatedCase) return;

    const newCase: SafeguardingCase = {
      id: crypto.randomUUID(),
      studentName,
      date,
      incidentType,
      rawDescription: description,
      generatedReport: generatedCase,
      status: status,
      relatedLogIds: selectedLogIds,
      createdBy: currentUser.name
    };
    
    onSave(newCase);
    setMode('LIST'); 
    // Reset form
    setStudentName('');
    setDescription('');
    setSelectedLogIds([]);
    setGeneratedCase(null);
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
                      <button 
                        onClick={() => setCaseToDelete(null)}
                        className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={() => {
                          onDelete(caseToDelete);
                          setCaseToDelete(null);
                        }}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors shadow-md"
                      >
                        Delete Case
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center space-x-3 mb-2">
                        <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                            <Shield size={28} />
                        </div>
                        <h1 className="text-3xl font-bold text-slate-800">Safeguarding Logs</h1>
                    </div>
                    <p className="text-slate-500">Manage and track safeguarding incidents and reports.</p>
                </div>
                <button 
                    onClick={() => setMode('BUILD')}
                    className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-md font-medium"
                >
                    <Plus size={18} className="mr-2" />
                    New Case File
                </button>
              </header>

              {/* Stats Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between shadow-sm">
                      <div>
                          <p className="text-sm text-slate-500 font-medium">Open Cases</p>
                          <p className="text-2xl font-bold text-slate-800">{openCases}</p>
                      </div>
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                          <FileText size={20} />
                      </div>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between shadow-sm">
                      <div>
                          <p className="text-sm text-slate-500 font-medium">Under Investigation</p>
                          <p className="text-2xl font-bold text-slate-800">{investigatingCases}</p>
                      </div>
                       <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                          <Search size={20} />
                      </div>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between shadow-sm">
                      <div>
                          <p className="text-sm text-slate-500 font-medium">High/Critical Risk</p>
                          <p className="text-2xl font-bold text-red-600">{highRiskCases}</p>
                      </div>
                       <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                          <AlertTriangle size={20} />
                      </div>
                  </div>
              </div>

              {/* Search and Filter */}
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                    <input 
                        type="text" 
                        placeholder="Search by student or keywords..." 
                        value={caseSearchTerm}
                        onChange={(e) => setCaseSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-red-500 outline-none transition-all"
                    />
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4">
                    {/* Incident Type Filter */}
                    <div className="relative w-full sm:w-40">
                         <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                         <select 
                           value={typeFilter}
                           onChange={(e) => setTypeFilter(e.target.value)}
                           className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-red-500 outline-none appearance-none bg-white cursor-pointer text-slate-600 text-sm"
                         >
                           <option value="All">All Types</option>
                           {uniqueIncidentTypes.map(type => (
                               <option key={type} value={type}>{type}</option>
                           ))}
                         </select>
                         <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none">
                            <Filter size={14} />
                        </div>
                    </div>

                    {/* Status Filter */}
                    <div className="relative w-full sm:w-40">
                         <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                         <select 
                           value={statusFilter}
                           onChange={(e) => setStatusFilter(e.target.value)}
                           className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-red-500 outline-none appearance-none bg-white cursor-pointer text-slate-600 text-sm"
                         >
                           <option value="All">All Statuses</option>
                           <option value="Open">Open</option>
                           <option value="Investigating">Investigating</option>
                           <option value="Closed">Closed</option>
                         </select>
                    </div>

                    {/* Author Filter */}
                    <div className="relative w-full sm:w-40">
                         <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                         <select 
                           value={authorFilter}
                           onChange={(e) => setAuthorFilter(e.target.value)}
                           className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-red-500 outline-none appearance-none bg-white cursor-pointer text-slate-600 text-sm"
                         >
                           <option value="All">All Authors</option>
                           {uniqueAuthors.map(a => (
                               <option key={a} value={a}>{a}</option>
                           ))}
                         </select>
                    </div>
                </div>
              </div>
              
              {filteredCases.length === 0 ? (
                  <div className="text-center py-16 bg-white rounded-xl border border-slate-200 border-dashed">
                    <div className="mx-auto w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                        <Shield size={32} className="text-slate-300" />
                    </div>
                    <p className="text-slate-500 font-medium">No matching safeguarding cases found.</p>
                    {cases.length === 0 && (
                        <button 
                            onClick={() => setMode('BUILD')}
                            className="mt-4 text-red-600 hover:text-red-700 font-medium"
                        >
                            Create your first case
                        </button>
                    )}
                  </div>
              ) : (
                  <div className="grid grid-cols-1 gap-4">
                      {filteredCases.map(c => (
                          <div 
                            key={c.id} 
                            className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-red-200 hover:shadow-md transition-all cursor-pointer group relative" 
                            onClick={() => setSelectedCase(c)}
                          >
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
                                    {c.status === 'Open' && <AlertCircle size={12} className="mr-1.5" />}
                                    {c.status === 'Investigating' && <Search size={12} className="mr-1.5" />}
                                    {c.status === 'Closed' && <CheckCircle2 size={12} className="mr-1.5" />}
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
                                          <span className="flex items-center"><Calendar size={12} className="mr-1" /> {new Date(c.date).toLocaleDateString()}</span>
                                          <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                          <span className="font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded">{c.incidentType}</span>
                                          {c.relatedLogIds && c.relatedLogIds.length > 0 && (
                                              <span className="flex items-center text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                                                  <Paperclip size={10} className="mr-1" />
                                                  {c.relatedLogIds.length} Evidence Attached
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
                                    {c.createdBy && (
                                      <div className="text-slate-400 flex items-center">
                                        <User size={12} className="mr-1" /> Filed by {c.createdBy}
                                      </div>
                                    )}
                                  </div>
                                  
                                  <div className="flex items-center space-x-3">
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setCaseToDelete(c.id);
                                      }}
                                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                      title="Delete Case"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                    <span className="text-blue-600 font-medium group-hover:underline flex items-center">
                                        View Full Case <ChevronRight size={12} className="ml-1" />
                                    </span>
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
                          <h2 className="text-xl font-bold text-slate-800">{selectedCase.studentName}</h2>
                          <p className="text-xs text-slate-500">Case ID: {selectedCase.id.slice(0,8)} • {new Date(selectedCase.date).toLocaleDateString()}</p>
                      </div>
                  </div>
                  <div className="flex items-center space-x-3">
                       {selectedCase.createdBy && (
                          <span className="text-xs text-slate-500 mr-2 flex items-center">
                            <User size={12} className="mr-1"/> {selectedCase.createdBy}
                          </span>
                       )}
                       {selectedCase.generatedReport.sentiment && (
                           <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                                selectedCase.generatedReport.sentiment === 'Critical' ? 'bg-red-100 text-red-700 border-red-200' :
                                selectedCase.generatedReport.sentiment === 'Serious' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                                'bg-blue-50 text-blue-700 border-blue-200'
                            }`}>
                                {selectedCase.generatedReport.sentiment}
                            </span>
                       )}
                       <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                            selectedCase.status === 'Open' ? 'bg-red-50 text-red-700 border-red-200' :
                            selectedCase.status === 'Investigating' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                            'bg-green-50 text-green-700 border-green-200'
                          }`}>
                            {selectedCase.status}
                        </span>
                  </div>
              </div>
              
              <div className="p-8 space-y-8 overflow-y-auto">
                  {/* ... Detail Content from previous implementation (unchanged logic, just context update) ... */}
                  <div className="grid grid-cols-2 gap-6 text-sm border-b border-slate-100 pb-6">
                      <div>
                          <p className="text-slate-400 mb-1 uppercase text-xs font-bold">Incident Date</p>
                          <p className="font-medium text-slate-800 text-lg">{selectedCase.date}</p>
                      </div>
                      <div>
                          <p className="text-slate-400 mb-1 uppercase text-xs font-bold">Category</p>
                          <p className="font-medium text-lg text-slate-800">{selectedCase.incidentType}</p>
                      </div>
                  </div>
                  
                  {/* Risk Score Visualization */}
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                      <div className="flex justify-between items-end mb-3">
                          <div className="flex items-center text-slate-700">
                              <BarChart3 size={20} className="mr-2 text-blue-600" />
                              <h3 className="font-bold">Calculated Risk Score</h3>
                          </div>
                          <span className={`text-2xl font-black ${
                            score >= 80 ? 'text-red-600' : score >= 50 ? 'text-orange-500' : 'text-blue-600'
                          }`}>
                            {score}/100
                          </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-1000 ${
                            score >= 80 ? 'bg-red-600' : score >= 50 ? 'bg-orange-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${score}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-slate-400 mt-2 font-medium">
                         <span>Low Risk</span>
                         <span>Medium Risk</span>
                         <span>High Risk</span>
                         <span>Critical</span>
                      </div>
                  </div>

                  <div>
                      <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-3 flex items-center">
                          <FileText size={16} className="mr-2 text-blue-600" /> DSL Executive Summary
                      </h3>
                      <div className="bg-blue-50 p-5 rounded-xl border border-blue-100 text-slate-700 leading-relaxed">
                        {selectedCase.generatedReport.dslSummary}
                      </div>
                  </div>
                  
                   <div>
                      <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-3 flex items-center">
                          <FileText size={16} className="mr-2 text-slate-400" /> Raw Incident Report
                      </h3>
                      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-slate-600 text-sm italic">
                        "{selectedCase.rawDescription}"
                      </div>
                  </div>

                  {/* Evidence Analysis (New Feature) */}
                  {selectedCase.generatedReport.evidenceAnalysis && (
                    <div className="bg-indigo-50 p-5 rounded-xl border border-indigo-100 shadow-sm">
                        <h3 className="text-sm font-bold text-indigo-800 uppercase tracking-wide mb-3 flex items-center">
                          <BrainCircuit size={16} className="mr-2" /> AI Pattern Recognition
                        </h3>
                        <p className="text-sm text-indigo-900 leading-relaxed">
                          {selectedCase.generatedReport.evidenceAnalysis}
                        </p>
                    </div>
                  )}
                  
                  {/* Evidence Section */}
                  {(selectedCase.generatedReport.keyEvidence?.length > 0 || (selectedCase.relatedLogIds && selectedCase.relatedLogIds.length > 0)) && (
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-4 flex items-center">
                            <Paperclip size={16} className="mr-2 text-slate-500" /> Evidentiary Basis
                        </h3>
                        
                        {/* Extracted Key Evidence */}
                        {selectedCase.generatedReport.keyEvidence?.length > 0 && (
                          <div className="mb-4">
                             <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Key Findings & Patterns</h4>
                             <ul className="space-y-2">
                                {selectedCase.generatedReport.keyEvidence.map((ev, i) => (
                                    <li key={i} className="flex items-start text-sm text-slate-700 bg-slate-50 p-2 rounded">
                                        <span className="mr-2 text-blue-500 mt-0.5">•</span> 
                                        {ev}
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
                                                <span className={`px-2 py-0.5 rounded text-[10px] ${log.sentiment === 'Concerned' ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-500'}`}>
                                                    {log.sentiment}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                  )}

                  <div>
                      <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-3 flex items-center">
                          <Clock size={16} className="mr-2 text-slate-400" /> Timeline of Events
                      </h3>
                      <ul className="space-y-0 border-l-2 border-slate-200 pl-6 ml-2">
                          {selectedCase.generatedReport.chronology.map((event, i) => (
                              <li key={i} className="relative pb-6 last:pb-0">
                                  <span className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-white border-2 border-slate-400"></span>
                                  <p className="text-sm text-slate-700">{event}</p>
                              </li>
                          ))}
                      </ul>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-amber-50 p-5 rounded-xl border border-amber-100">
                          <h4 className="font-bold text-amber-800 text-sm mb-3 flex items-center">
                              <AlertTriangle size={16} className="mr-2" /> Witness Questions
                          </h4>
                          <ul className="space-y-2">
                              {selectedCase.generatedReport.witnessQuestions.map((q, i) => (
                                <li key={i} className="flex items-start text-sm text-amber-900">
                                    <span className="mr-2">•</span>
                                    {q}
                                </li>
                              ))}
                          </ul>
                      </div>
                      <div className="bg-emerald-50 p-5 rounded-xl border border-emerald-100">
                          <h4 className="font-bold text-emerald-800 text-sm mb-3 flex items-center">
                              <ClipboardList size={16} className="mr-2" /> Action Plan
                          </h4>
                           <ul className="space-y-2">
                              {selectedCase.generatedReport.nextSteps.map((s, i) => (
                                <li key={i} className="flex items-start text-sm text-emerald-900">
                                    <span className="mr-2 font-bold">{i+1}.</span>
                                    {s}
                                </li>
                              ))}
                          </ul>
                      </div>
                  </div>

                  <div>
                      <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-3 flex items-center">
                          <Shield size={16} className="mr-2 text-slate-400" /> Policies Applied
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedCase.generatedReport.policiesApplied.map((policy, i) => (
                          <span key={i} className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 text-sm rounded-lg shadow-sm font-medium">
                            {policy}
                          </span>
                        ))}
                      </div>
                  </div>
              </div>
          </div>
      );
  }

  // BUILD MODE: Create new case
  return (
    <div className="animate-fade-in max-w-6xl mx-auto">
      <header className="mb-8 flex items-center justify-between">
        <div className="flex items-center space-x-3 mb-2">
           <button onClick={() => setMode('LIST')} className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors flex items-center">
             <ChevronRight className="rotate-180" size={20} />
           </button>
           <h1 className="text-2xl font-bold text-slate-800">New Safeguarding Case</h1>
        </div>
        <div className="text-sm text-slate-500">
            Filing as: <span className="font-semibold text-slate-800">{currentUser.name}</span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* INPUT COLUMN */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
              <FileText size={20} className="mr-2 text-blue-600" />
              Incident Details
            </h2>
            
            <div className="space-y-4">
              {/* Student Search */}
              <div className="relative" ref={wrapperRef}>
                <label className="block text-sm font-medium text-slate-700 mb-1">Student Involved</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    value={studentName}
                    onChange={(e) => {
                      setStudentName(e.target.value);
                      setShowSuggestions(true);
                      // Clear evidence if student changes
                      if (studentName !== e.target.value) setSelectedLogIds([]);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                    placeholder="Search student name..."
                  />
                </div>
                {showSuggestions && studentName && filteredStudents.length > 0 && (
                  <div className="absolute z-20 w-full bg-white border border-slate-200 rounded-lg shadow-lg mt-1 overflow-hidden">
                    {filteredStudents.map((student) => (
                      <button
                        key={student.id}
                        onClick={() => {
                          setStudentName(student.name);
                          setShowSuggestions(false);
                          setSelectedLogIds([]); // Reset logs when student changes
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center"
                      >
                        <span className="font-medium text-slate-700">{student.name}</span>
                        <span className="ml-auto text-xs text-slate-400">{student.studentClass}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Evidence Locker Enhanced */}
              {studentName && (
                 <div className="border border-slate-200 rounded-xl bg-slate-50 overflow-hidden">
                    <div className="px-4 py-3 bg-slate-100 border-b border-slate-200 flex justify-between items-center">
                       <h3 className="text-xs font-bold text-slate-600 uppercase flex items-center tracking-wide">
                          <Paperclip size={14} className="mr-1.5" />
                          Evidence Locker
                       </h3>
                       <div className="flex bg-white rounded-lg p-0.5 border border-slate-200">
                          <button 
                            onClick={() => setEvidenceFilterType('ALL')}
                            className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${evidenceFilterType === 'ALL' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
                          >
                            All History
                          </button>
                          <button 
                            onClick={() => setEvidenceFilterType('CONCERNS')}
                            className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${evidenceFilterType === 'CONCERNS' ? 'bg-red-500 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
                          >
                            Concerns Only
                          </button>
                       </div>
                    </div>
                    
                    <div className="max-h-60 overflow-y-auto custom-scrollbar p-2 space-y-2">
                        {candidateLogs.length === 0 ? (
                           <div className="text-center py-8 text-slate-400">
                              <p className="text-xs italic">No logs found matching filter.</p>
                           </div>
                        ) : (
                          candidateLogs.map(log => {
                            const isSelected = selectedLogIds.includes(log.id);
                            return (
                              <div 
                                  key={log.id} 
                                  onClick={() => handleToggleLogEvidence(log.id)}
                                  className={`relative group p-3 rounded-lg cursor-pointer border-2 transition-all ${
                                      isSelected
                                      ? 'bg-white border-blue-500 shadow-md z-10' 
                                      : 'bg-white border-transparent hover:border-slate-300 hover:shadow-sm'
                                  }`}
                              >
                                  <div className="flex justify-between items-start mb-2">
                                      <div className="flex items-center space-x-2">
                                          <div className={`transition-colors ${isSelected ? 'text-blue-600' : 'text-slate-300 group-hover:text-slate-400'}`}>
                                              {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                                          </div>
                                          <div>
                                              <p className="text-xs font-bold text-slate-700">{new Date(log.date).toLocaleDateString()}</p>
                                              <p className="text-[10px] text-slate-400 font-medium uppercase">{log.type}</p>
                                          </div>
                                      </div>
                                      <div className="flex flex-col items-end">
                                        {log.sentiment && log.sentiment !== 'Neutral' && (
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border mb-1 ${
                                                log.sentiment === 'Concerned' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-600 border-green-100'
                                            }`}>
                                                {log.sentiment}
                                            </span>
                                        )}
                                      </div>
                                  </div>
                                  <p className="text-xs text-slate-600 line-clamp-2 pl-7 border-l-2 border-slate-100 ml-1">{log.notes}</p>
                                  {log.createdBy && (
                                     <div className="mt-2 pl-7 flex items-center text-[10px] text-slate-400">
                                        <User size={10} className="mr-1" /> {log.createdBy}
                                     </div>
                                  )}
                              </div>
                            );
                          })
                        )}
                    </div>
                    {selectedLogIds.length > 0 && (
                        <div className="bg-blue-50 px-4 py-2 border-t border-blue-100 flex justify-between items-center">
                            <span className="text-xs font-bold text-blue-700">{selectedLogIds.length} Evidence Log(s) Selected</span>
                            <button 
                              onClick={() => setSelectedLogIds([])}
                              className="text-[10px] text-blue-500 hover:text-blue-800 underline"
                            >
                              Clear Selection
                            </button>
                        </div>
                    )}
                 </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Date of Incident</label>
                  <input 
                    type="date" 
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-red-500 outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                  <select 
                    value={incidentType}
                    onChange={(e) => setIncidentType(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-red-500 outline-none bg-white"
                  >
                    <option>Behavioral</option>
                    <option>Bullying</option>
                    <option>Physical Altercation</option>
                    <option>Safeguarding Concern</option>
                    <option>Online Safety</option>
                    <option>Attendance/Truancy</option>
                  </select>
                </div>
              </div>
              
              {/* Case Status Dropdown */}
              <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Initial Case Status</label>
                  <select 
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-red-500 outline-none bg-white"
                  >
                    <option value="Open">Open</option>
                    <option value="Investigating">Investigating</option>
                    <option value="Closed">Closed</option>
                  </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Raw Incident Description</label>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what happened. The AI will cross-reference this with your selected evidence logs to build a case."
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-red-500 outline-none min-h-[200px] text-sm resize-none"
                />
              </div>

              <button 
                onClick={handleGenerate}
                disabled={isGenerating || !studentName || !description}
                className="w-full py-3 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-900 transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-slate-200"
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={20} className="animate-spin mr-2" />
                    Analyzing Evidence & Generating...
                  </>
                ) : (
                  <>
                    <Shield size={20} className="mr-2" />
                    Generate Case File
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* PREVIEW COLUMN */}
        <div className="space-y-6">
          {generatedCase ? (
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden flex flex-col h-full animate-slide-up">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <Gavel size={20} className="text-slate-600" />
                  <h3 className="font-bold text-slate-800">Official Case Preview</h3>
                </div>
                <div className="flex gap-2">
                  {generatedCase.sentiment && (
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border flex items-center ${
                          generatedCase.sentiment === 'Critical' ? 'bg-red-100 text-red-700 border-red-200' :
                          generatedCase.sentiment === 'Serious' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                          'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        <Activity size={12} className="mr-1.5" />
                        {generatedCase.sentiment}
                      </span>
                  )}
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                    generatedCase.riskLevel === 'Critical' ? 'bg-red-50 text-red-700 border-red-200' :
                    generatedCase.riskLevel === 'High' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                    'bg-yellow-50 text-yellow-700 border-yellow-200'
                  }`}>
                    {generatedCase.riskLevel} Risk
                  </span>
                </div>
              </div>
              
              <div className="p-6 space-y-6 flex-1 overflow-y-auto max-h-[700px]">
                
                {/* RISK SCORE SECTION */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-end mb-3">
                        <div className="flex items-center text-slate-700">
                            <BarChart3 size={20} className="mr-2 text-blue-600" />
                            <h4 className="font-bold text-sm">Safeguarding Risk Score</h4>
                        </div>
                        <span className={`text-2xl font-black ${
                          riskScore >= 80 ? 'text-red-600' : riskScore >= 50 ? 'text-orange-500' : 'text-blue-600'
                        }`}>
                          {riskScore}/100
                        </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${
                          riskScore >= 80 ? 'bg-red-600' : riskScore >= 50 ? 'bg-orange-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${riskScore}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 mt-2 font-medium uppercase tracking-wide">
                        <span>Monitor</span>
                        <span>Intervention</span>
                        <span>Critical</span>
                    </div>
                </div>

                {/* DSL Summary */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <h4 className="text-xs font-bold text-blue-600 uppercase mb-2 tracking-wide">DSL Executive Summary</h4>
                  <p className="text-sm text-slate-700 leading-relaxed">{generatedCase.dslSummary}</p>
                </div>
                
                {/* Evidence Analysis (New Feature) */}
                {generatedCase.evidenceAnalysis && (
                  <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                      <h4 className="text-xs font-bold text-indigo-700 uppercase mb-2 tracking-wide flex items-center">
                        <BrainCircuit size={14} className="mr-1.5" /> AI Pattern Recognition
                      </h4>
                      <p className="text-sm text-indigo-900 leading-relaxed">
                        {generatedCase.evidenceAnalysis}
                      </p>
                  </div>
                )}

                {/* Evidence Section - Preview */}
                {generatedCase.keyEvidence && generatedCase.keyEvidence.length > 0 && (
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                      <h4 className="text-xs font-bold text-slate-600 uppercase mb-2 tracking-wide flex items-center">
                          <Paperclip size={14} className="mr-1.5" /> Established Evidence
                      </h4>
                      <ul className="space-y-2">
                        {generatedCase.keyEvidence.map((evidence, i) => (
                           <li key={i} className="flex items-start text-sm text-slate-700 bg-white p-2 border border-slate-100 rounded">
                               <span className="mr-2 text-blue-500 mt-0.5 font-bold">•</span>
                               {evidence}
                           </li>
                        ))}
                      </ul>
                      {selectedLogIds.length > 0 && (
                          <div className="mt-2 text-right">
                              <span className="text-[10px] text-slate-400 bg-slate-200 px-2 py-0.5 rounded-full">
                                  Includes {selectedLogIds.length} attached log(s)
                              </span>
                          </div>
                      )}
                  </div>
                )}

                {/* Chronology */}
                <div>
                  <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center">
                    <Clock size={16} className="mr-2 text-slate-400" /> Chronology of Events
                  </h4>
                  <ul className="space-y-0 border-l-2 border-slate-200 pl-4 ml-1.5">
                    {generatedCase.chronology.map((event, i) => (
                      <li key={i} className="text-sm text-slate-600 relative pb-4 last:pb-0">
                        <span className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-white border-2 border-slate-400"></span>
                        {event}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Policies */}
                <div>
                  <h4 className="text-sm font-bold text-slate-800 mb-2 flex items-center">
                    <Shield size={16} className="mr-2 text-slate-400" /> Policies & Frameworks Applied
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {generatedCase.policiesApplied.map((policy, i) => (
                      <span key={i} className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded border border-slate-200 font-medium">
                        {policy}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Action Plan */}
                <div className="grid grid-cols-1 gap-4">
                  <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
                    <h4 className="text-xs font-bold text-amber-600 uppercase mb-2 flex items-center">
                      <AlertTriangle size={14} className="mr-1.5" />
                      Investigative Questions (Witnesses)
                    </h4>
                    <ul className="space-y-1.5">
                      {generatedCase.witnessQuestions.map((q, i) => (
                        <li key={i} className="text-sm text-slate-700 flex items-start">
                           <span className="mr-2 text-amber-400">•</span> {q}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100">
                    <h4 className="text-xs font-bold text-emerald-600 uppercase mb-2 flex items-center">
                       <ClipboardList size={14} className="mr-1.5" />
                       Action Plan & Next Steps
                    </h4>
                    <ul className="space-y-2">
                      {generatedCase.nextSteps.map((step, i) => (
                        <li key={i} className="text-sm text-slate-700 flex items-start">
                           <div className="min-w-[16px] h-4 flex items-center justify-center mt-0.5 mr-2 bg-white border border-emerald-200 rounded text-[10px] text-emerald-600 font-bold">{i+1}</div>
                           {step}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end space-x-3">
                <button onClick={onCancel} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-white hover:shadow-sm rounded-lg transition-all">
                  Discard
                </button>
                <button onClick={handleFinalSave} className="px-6 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-black shadow-md hover:shadow-lg transition-all flex items-center">
                  <Save size={16} className="mr-2" />
                  Save to Case File
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center bg-slate-50 rounded-xl border border-slate-200 border-dashed min-h-[500px] text-slate-400 p-8">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm">
                <Shield size={40} className="text-slate-200" />
              </div>
              <h3 className="text-lg font-semibold text-slate-600 mb-2">Ready to Build</h3>
              <p className="text-sm text-center max-w-xs leading-relaxed">
                Enter incident details and attach evidence from the student's history. Our AI agents will structure this into a compliant safeguarding report.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SafeguardingBuilder;
