
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { MeetingLog, SafeguardingCase, GeneratedReport, MeetingType } from '../types';
import { generateComprehensiveReport } from '../services/geminiService';
import { STUDENTS } from '../data/students';
import { FileText, Download, Printer, Loader2, Calendar, User, BookOpen, CheckCircle2, TrendingUp, AlertTriangle, Shield, Mail, Send, X } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ReportsViewProps {
  logs: MeetingLog[];
  safeguardingCases: SafeguardingCase[];
}

const ReportsView: React.FC<ReportsViewProps> = ({ logs, safeguardingCases }) => {
  const [reportType, setReportType] = useState<'STUDENT' | 'CLASS'>('STUDENT');
  const [studentName, setStudentName] = useState('');
  const [startDate, setStartDate] = useState(
    new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Filtering States
  const [filterType, setFilterType] = useState<string>('All');
  const [filterSentiment, setFilterSentiment] = useState<string>('All');
  const [includeSafeguarding, setIncludeSafeguarding] = useState(true);

  // Audience Selection
  const [reportAudience, setReportAudience] = useState<'PARENTS' | 'SLT' | 'DSL' | 'TEACHER' | 'EXTERNAL'>('PARENTS');

  // Student Organization Filters
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedClass, setSelectedClass] = useState('');

  const [isGenerating, setIsGenerating] = useState(false);
  const [report, setReport] = useState<GeneratedReport | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Store the data used for the report for export
  const [reportDataLogs, setReportDataLogs] = useState<MeetingLog[]>([]);

  // Email State
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  // Derived Options for Dropdowns
  const { classes, years } = useMemo(() => {
    const uniqueClasses = new Set(STUDENTS.map(s => s.studentClass).filter(Boolean));
    const uniqueYears = new Set(STUDENTS.map(s => s.studentClass ? s.studentClass.substring(0, 2) : '').filter(Boolean));
    
    return {
      classes: Array.from(uniqueClasses).sort(),
      years: Array.from(uniqueYears).sort()
    };
  }, []);

  const filteredStudents = useMemo(() => {
    return STUDENTS.filter(s => {
      const nameMatch = s.name.toLowerCase().includes(studentName.toLowerCase());
      const yearMatch = selectedYear ? s.studentClass?.startsWith(selectedYear) : true;
      const classMatch = selectedClass ? s.studentClass === selectedClass : true;
      return nameMatch && yearMatch && classMatch;
    }).slice(0, 5);
  }, [studentName, selectedYear, selectedClass]);

  const handleGenerate = async () => {
    if (reportType === 'STUDENT' && !studentName) return;

    setIsGenerating(true);
    setReport(null); 
    setGenerationError(null);

    try {
      const studentProfile = reportType === 'STUDENT' ? STUDENTS.find(s => s.name === studentName) : undefined;

      // Identify students in the selected class (if report type is CLASS)
      const studentsInClass = reportType === 'CLASS' && selectedClass 
        ? STUDENTS.filter(s => s.studentClass === selectedClass).map(s => s.name)
        : [];

      const filteredLogs = logs.filter(l => {
        const inDate = l.date >= startDate && l.date <= endDate;
        const typeMatch = filterType === 'All' || l.type === filterType;
        const sentimentMatch = filterSentiment === 'All' || l.sentiment === filterSentiment;
        
        if (reportType === 'STUDENT') {
          return inDate && l.attendees.includes(studentName) && typeMatch && sentimentMatch;
        } else if (reportType === 'CLASS') {
          if (selectedClass) {
             // If a specific class is selected, filter logs where at least one attendee is in that class
             return inDate && typeMatch && sentimentMatch && l.attendees.some(a => studentsInClass.includes(a));
          }
          return inDate && typeMatch && sentimentMatch;
        }
        return false;
      });

      setReportDataLogs(filteredLogs);

      const filteredSafeguarding = includeSafeguarding ? safeguardingCases.filter(s => {
        const inDate = s.date >= startDate && s.date <= endDate;
        if (reportType === 'STUDENT') {
          return inDate && s.studentName === studentName;
        } else if (reportType === 'CLASS' && selectedClass) {
             return inDate && studentsInClass.includes(s.studentName);
        }
        return inDate;
      }) : [];

      const reportTargetName = reportType === 'STUDENT' ? studentName : (selectedClass ? `Class ${selectedClass}` : "All Classes");

      const result = await generateComprehensiveReport(
        reportType,
        filteredLogs,
        filteredSafeguarding,
        reportTargetName,
        startDate,
        endDate,
        studentProfile,
        reportAudience // Pass the selected audience
      );

      setReport({
        ...result,
        studentName: reportType === 'STUDENT' ? studentName : undefined
      });
    } catch (e) {
      console.error(e);
      setGenerationError("Failed to generate report using AI. Please try again later.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportData = () => {
    if (reportDataLogs.length === 0) return;

    const exportData = reportDataLogs.map(log => ({
        Date: log.date,
        Time: log.time,
        Attendees: log.attendees.join(', '),
        Type: log.type,
        Sentiment: log.sentiment || 'N/A',
        Notes: log.notes,
        ActionItems: log.actionItems ? log.actionItems.map(a => `${a.task} (${a.status})`).join('; ') : ''
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "MeetingLogs");
    
    // Auto-width for columns
    const wscols = Object.keys(exportData[0] || {}).map(k => ({ wch: 20 }));
    ws['!cols'] = wscols;

    XLSX.writeFile(wb, `Sentinel_Report_Data_${startDate}_${endDate}.xlsx`);
  };

  // Helper to generate text version of the report for email
  const generatePlainTextReport = (r: GeneratedReport) => {
    return `${r.title.toUpperCase()}
Period: ${r.period}
${r.studentName ? `Student: ${r.studentName}` : ''}

EXECUTIVE SUMMARY
${r.executiveSummary}

KEY STRENGTHS
${r.keyStrengths.map(s => `• ${s}`).join('\n')}

AREAS FOR GROWTH
${r.areasForGrowth.map(s => `• ${s}`).join('\n')}

ACTION PLAN
${r.actionPlan.map((s, i) => `${i+1}. ${s}`).join('\n')}

Engagement Trend: ${r.attendanceTrend}

--
Generated by Sentinel`;
  };

  const handleOpenEmail = () => {
    if (!report) return;
    
    // Auto-fill email based on context if possible
    let recipient = '';
    if (reportType === 'STUDENT' && studentName) {
        const student = STUDENTS.find(s => s.name === studentName);
        if (student && reportAudience === 'PARENTS') {
            recipient = student.fatherEmail || student.motherEmail || '';
        }
    }

    setEmailTo(recipient);
    setEmailSubject(`Report: ${report.title} - ${report.studentName || 'Summary'}`);
    setEmailBody(generatePlainTextReport(report));
    setShowEmailModal(true);
  };

  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSendingEmail(true);
    
    // Simulate network request
    setTimeout(() => {
        setIsSendingEmail(false);
        setShowEmailModal(false);
        alert(`Report successfully sent to ${emailTo}`);
    }, 1500);
  };

  return (
    <div className="animate-fade-in space-y-6">
      <header className="print:hidden">
        <h1 className="text-3xl font-bold text-slate-800">Reports Generator</h1>
        <p className="text-slate-500">Create professional, AI-synthesized progress reports.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Controls Sidebar (Hidden on Print) */}
        <div className="lg:col-span-1 space-y-6 print:hidden">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h2 className="font-bold text-slate-800 mb-4 flex items-center">
              <BookOpen size={20} className="mr-2 text-indigo-600" />
              Configuration
            </h2>
            
            <div className="space-y-4">
              {/* Type Selector */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Report Type</label>
                <div className="flex p-1 bg-slate-100 rounded-lg">
                  <button 
                    onClick={() => {
                        setReportType('STUDENT');
                        setSelectedClass('');
                        setStudentName('');
                    }}
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${reportType === 'STUDENT' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Individual Student
                  </button>
                  <button 
                    onClick={() => {
                        setReportType('CLASS');
                        setStudentName('');
                    }}
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${reportType === 'CLASS' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Class Summary
                  </button>
                </div>
              </div>

              {/* Audience Selector (NEW) */}
              <div>
                 <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center">
                    Report Audience
                    <span className="ml-2 text-xs text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full">AI Context</span>
                 </label>
                 <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">
                        <User size={16} />
                    </div>
                    <select
                        value={reportAudience}
                        onChange={(e) => setReportAudience(e.target.value as any)}
                        className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white cursor-pointer"
                    >
                        <option value="PARENTS">Parent / Guardian (Supportive)</option>
                        <option value="SLT">Senior Leadership (Data-Driven)</option>
                        <option value="DSL">Safeguarding Lead (Formal)</option>
                        <option value="TEACHER">Internal Teacher (Practical)</option>
                        <option value="EXTERNAL">External Agency (Objective)</option>
                    </select>
                 </div>
                 <p className="text-[10px] text-slate-400 mt-1 italic">
                    AI will adjust tone and detail based on selection.
                 </p>
              </div>

              {/* Student/Class Filters */}
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-3">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Target Selection</h3>
                  
                  {/* Year Filter (Optional helper) */}
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Filter by Year Group (Optional)</label>
                    <select
                        value={selectedYear}
                        onChange={(e) => {
                            setSelectedYear(e.target.value);
                            setSelectedClass(''); // Reset class if year changes
                        }}
                        className="w-full px-3 py-2 rounded-md border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                        <option value="">All Years</option>
                        {years.map(yr => <option key={yr} value={yr}>Year {yr}</option>)}
                    </select>
                  </div>

                  {/* Class Filter */}
                  {(reportType === 'CLASS' || selectedYear || reportType === 'STUDENT') && (
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">
                            {reportType === 'CLASS' ? 'Select Class (Required)' : 'Filter by Class (Optional)'}
                        </label>
                        <select
                            value={selectedClass}
                            onChange={(e) => setSelectedClass(e.target.value)}
                            className="w-full px-3 py-2 rounded-md border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                            <option value="">{reportType === 'CLASS' ? 'Select a Class...' : 'All Classes'}</option>
                            {classes
                                .filter(c => !selectedYear || c?.startsWith(selectedYear))
                                .map(cls => <option key={cls} value={cls}>{cls}</option>
                            )}
                        </select>
                      </div>
                  )}

                  {/* Student Search (Only for Student Report) */}
                  {reportType === 'STUDENT' && (
                    <div className="relative" ref={wrapperRef}>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Select Student</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
                        <input
                          type="text"
                          value={studentName}
                          onChange={(e) => {
                            setStudentName(e.target.value);
                            setShowSuggestions(true);
                          }}
                          onFocus={() => setShowSuggestions(true)}
                          className="w-full pl-9 pr-4 py-2 rounded-md border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                          placeholder="Search name..."
                        />
                      </div>
                      {showSuggestions && studentName && filteredStudents.length > 0 && (
                        <div className="absolute z-10 w-full bg-white border border-slate-200 rounded-lg shadow-lg mt-1 overflow-hidden">
                          {filteredStudents.map((student) => (
                            <button
                              key={student.id}
                              onClick={() => {
                                setStudentName(student.name);
                                setShowSuggestions(false);
                              }}
                              className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center justify-between group"
                            >
                              <span className="text-sm text-slate-700 font-medium group-hover:text-indigo-700">{student.name}</span>
                              {student.studentClass && <span className="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{student.studentClass}</span>}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
              </div>

              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Date Range</label>
                <div className="space-y-2">
                   <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
                      <input 
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                   </div>
                   <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
                      <input 
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                   </div>
                </div>
              </div>

              {/* Granular Filters */}
              <div>
                 <label className="block text-sm font-medium text-slate-700 mb-2">Filter Content</label>
                 <div className="space-y-3">
                     <select 
                       value={filterType}
                       onChange={(e) => setFilterType(e.target.value)}
                       className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                     >
                       <option value="All">All Meeting Types</option>
                       {Object.values(MeetingType).map(t => (
                         <option key={t} value={t}>{t}</option>
                       ))}
                     </select>
                     
                     <select 
                       value={filterSentiment}
                       onChange={(e) => setFilterSentiment(e.target.value)}
                       className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                     >
                       <option value="All">All Sentiments</option>
                       <option value="Positive">Positive</option>
                       <option value="Neutral">Neutral</option>
                       <option value="Concerned">Concerned</option>
                     </select>

                     <label className="flex items-center space-x-2 cursor-pointer p-2 rounded-lg hover:bg-slate-50 transition-colors">
                        <input 
                          type="checkbox" 
                          checked={includeSafeguarding}
                          onChange={(e) => setIncludeSafeguarding(e.target.checked)}
                          className="rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm text-slate-600 flex items-center">
                           <Shield size={14} className="mr-1.5 text-red-500" />
                           Include Safeguarding
                        </span>
                     </label>
                 </div>
              </div>

              {generationError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 flex items-start">
                      <AlertTriangle size={14} className="mr-2 mt-0.5 flex-shrink-0" />
                      {generationError}
                  </div>
              )}

              <button 
                onClick={handleGenerate}
                disabled={isGenerating || (reportType === 'STUDENT' && !studentName) || (reportType === 'CLASS' && !selectedClass)}
                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-200"
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={20} className="animate-spin mr-2" />
                    Generating Report...
                  </>
                ) : (
                  <>
                    <FileText size={20} className="mr-2" />
                    Generate Report
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Report Preview (Main Content) */}
        <div className="lg:col-span-2">
           {report ? (
              <div className="bg-white shadow-xl shadow-slate-200 border border-slate-200 min-h-[800px] animate-slide-up print:shadow-none print:border-none">
                 {/* Print Controls */}
                 <div className="bg-slate-800 text-white p-4 flex justify-between items-center print:hidden rounded-t-lg">
                    <span className="font-medium text-sm text-slate-300">
                        Preview: <span className="text-white font-bold">{reportAudience} Edition</span>
                    </span>
                    <div className="flex space-x-3">
                        <button 
                           onClick={handleExportData}
                           className="flex items-center space-x-2 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-sm transition-colors"
                           title="Download Excel of used logs"
                        >
                            <Download size={16} />
                            <span>Export Data</span>
                        </button>
                        <button 
                           onClick={handleOpenEmail}
                           className="flex items-center space-x-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded text-sm transition-colors font-medium shadow-lg shadow-indigo-900/50"
                        >
                            <Mail size={16} />
                            <span>Email Report</span>
                        </button>
                        <button 
                           onClick={handlePrint}
                           className="flex items-center space-x-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded text-sm transition-colors font-medium shadow-lg shadow-blue-900/50"
                        >
                            <Printer size={16} />
                            <span>Print Report</span>
                        </button>
                    </div>
                 </div>

                 {/* Report Document */}
                 <div className="p-12 max-w-[210mm] mx-auto print:p-0 print:max-w-none">
                    
                    {/* Header */}
                    <div className="text-center border-b-2 border-slate-800 pb-8 mb-8">
                       <div className="flex justify-center items-center space-x-2 mb-2 text-slate-800">
                          <Shield size={32} className="text-indigo-600" />
                          <span className="text-2xl font-bold tracking-tight">Sentinel</span>
                       </div>
                       <h1 className="text-3xl font-serif text-slate-900 font-bold mb-2">{report.title}</h1>
                       <p className="text-slate-500 font-medium uppercase tracking-widest text-sm">{report.period}</p>
                    </div>

                    {/* Student Info (if applicable) */}
                    {report.studentName && (
                        <div className="mb-8 flex justify-between items-end">
                             <div>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-wide mb-1">Student Name</p>
                                <h2 className="text-xl font-bold text-slate-800">{report.studentName}</h2>
                             </div>
                             {selectedClass && (
                                 <div className="text-right">
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wide mb-1">Class</p>
                                    <h2 className="text-xl font-bold text-slate-800">{selectedClass}</h2>
                                 </div>
                             )}
                        </div>
                    )}

                    {/* Content Grid */}
                    <div className="space-y-8">
                        
                        {/* Executive Summary */}
                        <section>
                            <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-wider mb-3 border-b border-indigo-100 pb-1">Executive Summary</h3>
                            <p className="text-slate-700 leading-relaxed text-justify">{report.executiveSummary}</p>
                        </section>

                        {/* Strengths & Growth */}
                        <div className="grid grid-cols-2 gap-8">
                            <section className="bg-green-50/50 p-4 rounded-lg border border-green-50 print:border-none print:bg-transparent print:p-0">
                                <h3 className="text-sm font-bold text-green-700 uppercase tracking-wider mb-3 flex items-center">
                                    <CheckCircle2 size={16} className="mr-2" /> Key Strengths
                                </h3>
                                <ul className="space-y-2">
                                    {report.keyStrengths.map((item, i) => (
                                        <li key={i} className="flex items-start text-sm text-slate-700">
                                            <span className="mr-2 text-green-500">•</span> {item}
                                        </li>
                                    ))}
                                </ul>
                            </section>

                             <section className="bg-amber-50/50 p-4 rounded-lg border border-amber-50 print:border-none print:bg-transparent print:p-0">
                                <h3 className="text-sm font-bold text-amber-700 uppercase tracking-wider mb-3 flex items-center">
                                    <TrendingUp size={16} className="mr-2" /> Areas for Growth
                                </h3>
                                <ul className="space-y-2">
                                    {report.areasForGrowth.map((item, i) => (
                                        <li key={i} className="flex items-start text-sm text-slate-700">
                                            <span className="mr-2 text-amber-500">•</span> {item}
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        </div>

                        {/* Action Plan */}
                        <section className="bg-slate-50 p-6 rounded-xl border border-slate-100 print:bg-transparent print:border-slate-200 print:border print:rounded-none">
                             <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center">
                                <AlertTriangle size={16} className="mr-2 text-slate-400" /> Recommended Action Plan
                            </h3>
                            <div className="grid grid-cols-1 gap-3">
                                {report.actionPlan.map((step, i) => (
                                    <div key={i} className="flex items-start">
                                        <span className="flex-shrink-0 w-6 h-6 bg-slate-800 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5 print:bg-transparent print:text-slate-800 print:border print:border-slate-800">{i + 1}</span>
                                        <p className="text-slate-700 text-sm">{step}</p>
                                    </div>
                                ))}
                            </div>
                        </section>
                        
                        {/* Attendance Trend */}
                        <section className="flex justify-between items-center border-t border-slate-200 pt-6 mt-8">
                             <div>
                                 <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Engagement Trend</h4>
                                 <p className="text-lg font-bold text-slate-800">{report.attendanceTrend}</p>
                             </div>
                             <div className="text-right">
                                 <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Report Date</h4>
                                 <p className="text-sm font-medium text-slate-800">{new Date().toLocaleDateString()}</p>
                             </div>
                        </section>

                        <div className="mt-12 pt-12 border-t-2 border-slate-100 flex justify-between print:mt-24">
                            <div className="w-1/3 border-t border-slate-400 pt-2">
                                <p className="text-xs text-slate-500 uppercase">Teacher Signature</p>
                            </div>
                            <div className="w-1/3 border-t border-slate-400 pt-2">
                                <p className="text-xs text-slate-500 uppercase">Parent Signature</p>
                            </div>
                        </div>

                    </div>
                 </div>
              </div>
           ) : (
              <div className="h-full flex flex-col items-center justify-center bg-slate-50 rounded-xl border border-slate-200 border-dashed min-h-[600px] text-slate-400 p-8 print:hidden">
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm">
                      <FileText size={40} className="text-slate-200" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-600 mb-2">No Report Generated</h3>
                  <p className="text-sm text-center max-w-xs leading-relaxed mb-6">
                      Select report parameters on the left and click "Generate Report" to utilize Gemini AI for a comprehensive summary.
                  </p>
                  <div className="flex gap-4 text-xs font-medium text-slate-400">
                      <span className="flex items-center"><User size={14} className="mr-1" /> Student Profiles</span>
                      <span className="flex items-center"><Shield size={14} className="mr-1" /> Safeguarding Data</span>
                      <span className="flex items-center"><Calendar size={14} className="mr-1" /> Meeting Logs</span>
                  </div>
              </div>
           )}
        </div>
      </div>
      
      {/* Email Compose Modal */}
      {showEmailModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in print:hidden">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                  <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                      <h3 className="font-bold text-slate-800 flex items-center">
                          <Mail size={18} className="mr-2 text-indigo-600" /> Compose Email
                      </h3>
                      <button onClick={() => setShowEmailModal(false)} className="text-slate-400 hover:text-slate-600">
                          <X size={20} />
                      </button>
                  </div>
                  <form onSubmit={handleSendEmail} className="p-6 space-y-4 overflow-y-auto">
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">To:</label>
                          <input 
                              type="email" 
                              required
                              value={emailTo}
                              onChange={(e) => setEmailTo(e.target.value)}
                              placeholder="recipient@example.com"
                              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Subject:</label>
                          <input 
                              type="text" 
                              required
                              value={emailSubject}
                              onChange={(e) => setEmailSubject(e.target.value)}
                              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Message:</label>
                          <textarea 
                              required
                              value={emailBody}
                              onChange={(e) => setEmailBody(e.target.value)}
                              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none h-48 text-sm font-mono"
                          />
                      </div>
                      <div className="pt-2 flex justify-end space-x-3">
                          <button 
                              type="button" 
                              onClick={() => setShowEmailModal(false)}
                              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
                          >
                              Cancel
                          </button>
                          <button 
                              type="submit" 
                              disabled={isSendingEmail}
                              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-70"
                          >
                              {isSendingEmail ? <Loader2 size={18} className="animate-spin mr-2" /> : <Send size={18} className="mr-2" />}
                              {isSendingEmail ? 'Sending...' : 'Send Email'}
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default ReportsView;
