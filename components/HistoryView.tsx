
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { MeetingLog, UserProfile } from '../types';
import { Search, Filter, Calendar, User, X, CalendarDays, Activity, GraduationCap, CheckCircle2, Circle } from 'lucide-react';
import { STUDENTS } from '../data/students';

interface HistoryViewProps {
  logs: MeetingLog[];
  onSelectStudent: (name: string) => void;
  currentUser: UserProfile;
}

const HistoryView: React.FC<HistoryViewProps> = ({ logs, onSelectStudent, currentUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('All');
  const [sentimentFilter, setSentimentFilter] = useState<string>('All');
  
  // Auto-select current user as author filter if they are a teacher, to reduce noise
  const [authorFilter, setAuthorFilter] = useState<string>(
      currentUser.role === 'Teacher' ? currentUser.name : 'All'
  );
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const searchWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [searchWrapperRef]);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesSearch = 
        log.attendees.some(a => a.toLowerCase().includes(searchTerm.toLowerCase())) ||
        log.notes.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.type.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = filterType === 'All' || log.type === filterType;
      const matchesSentiment = sentimentFilter === 'All' || log.sentiment === sentimentFilter;
      const matchesAuthor = authorFilter === 'All' || log.createdBy === authorFilter;

      const logDate = log.date;
      const matchesStartDate = startDate ? logDate >= startDate : true;
      const matchesEndDate = endDate ? logDate <= endDate : true;

      return matchesSearch && matchesType && matchesSentiment && matchesStartDate && matchesEndDate && matchesAuthor;
    });
  }, [logs, searchTerm, filterType, sentimentFilter, startDate, endDate, authorFilter]);

  const studentSuggestions = useMemo(() => {
    if (!searchTerm.trim()) return [];
    return STUDENTS.filter(s => 
      s.name.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 5);
  }, [searchTerm]);

  const uniqueTypes = Array.from(new Set(logs.map(l => l.type)));
  const uniqueAuthors = Array.from(new Set(logs.map(l => l.createdBy).filter(Boolean))) as string[];

  const handleSelectSuggestion = (name: string) => {
    setSearchTerm(name);
    setShowSuggestions(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
       <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Interaction History</h1>
          <p className="text-slate-500">Search and review past meeting logs.</p>
        </div>
      </header>

      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex flex-col gap-5">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative" ref={searchWrapperRef}>
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Search by student name, keywords..." 
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            />
            
            {showSuggestions && studentSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-20 overflow-hidden">
                {studentSuggestions.map((student) => (
                  <div 
                    key={student.id}
                    onClick={() => handleSelectSuggestion(student.name)}
                    className="px-4 py-2 hover:bg-blue-50 cursor-pointer flex justify-between items-center border-b border-slate-50 last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-700">{student.name}</p>
                      <p className="text-xs text-slate-400">ID: {student.id}</p>
                    </div>
                    {student.studentClass && (
                       <span className="flex items-center text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                          <GraduationCap size={12} className="mr-1" />
                          {student.studentClass}
                       </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="w-full sm:w-40 relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
              <select 
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none appearance-none bg-white transition-all cursor-pointer text-sm"
              >
                <option value="All">All Types</option>
                {uniqueTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div className="w-full sm:w-40 relative">
              <Activity className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
              <select 
                value={sentimentFilter}
                onChange={(e) => setSentimentFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none appearance-none bg-white transition-all cursor-pointer text-sm"
              >
                <option value="All">All Sentiments</option>
                <option value="Positive">Positive</option>
                <option value="Neutral">Neutral</option>
                <option value="Concerned">Concerned</option>
              </select>
            </div>

            <div className="w-full sm:w-40 relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
              <select 
                value={authorFilter}
                onChange={(e) => setAuthorFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none appearance-none bg-white transition-all cursor-pointer text-sm"
              >
                <option value="All">All Authors</option>
                {uniqueAuthors.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-4 border-t border-slate-100">
           <div className="flex items-center gap-2 text-slate-500">
              <CalendarDays size={18} />
              <span className="text-sm font-medium">Date Range:</span>
           </div>
           <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
              <div className="relative">
                  <input 
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-600 transition-all hover:border-slate-300"
                    placeholder="Start Date"
                  />
              </div>
              <span className="text-slate-300 font-medium">to</span>
              <div className="relative">
                  <input 
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-600 transition-all hover:border-slate-300"
                    placeholder="End Date"
                  />
              </div>
              {(startDate || endDate) && (
                 <button 
                   onClick={() => { setStartDate(''); setEndDate(''); }}
                   className="ml-auto sm:ml-2 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                   title="Clear date filter"
                 >
                   <X size={16} />
                 </button>
              )}
           </div>
        </div>
      </div>

      <div className="space-y-4">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-slate-100 border-dashed">
            <div className="mx-auto w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <Search size={32} className="text-slate-300" />
            </div>
            <p className="text-slate-500 font-medium">No meeting logs found</p>
            <p className="text-slate-400 text-sm mt-1">Try adjusting your search or filters.</p>
          </div>
        ) : (
          filteredLogs.map(log => (
            <div key={log.id} className="group bg-white p-5 rounded-xl border border-slate-200 hover:shadow-md transition-all hover:border-blue-200">
              <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wide ${
                       log.sentiment === 'Concerned' ? 'bg-red-100 text-red-700' : 
                       log.sentiment === 'Positive' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {log.type}
                    </span>
                    <span className="text-slate-400 text-xs flex items-center font-medium">
                       <Calendar size={12} className="mr-1.5" />
                       {new Date(log.date).toLocaleDateString()}
                       <span className="mx-2">•</span>
                       {log.time}
                    </span>
                    {log.sentiment && log.sentiment !== 'Neutral' && (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                         log.sentiment === 'Positive' ? 'bg-green-50 text-green-600 border-green-200' : 
                         log.sentiment === 'Concerned' ? 'bg-red-50 text-red-600 border-red-200' : ''
                      }`}>
                        {log.sentiment}
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-lg font-bold text-slate-800 mb-2 flex flex-wrap gap-2">
                     {log.attendees.map((attendee, i) => (
                       <span key={i} className="hover:text-blue-600 cursor-pointer" onClick={() => onSelectStudent(attendee)}>
                         {attendee}{i < log.attendees.length - 1 ? ',' : ''}
                       </span>
                     ))}
                  </h3>
                  
                  <p className="text-slate-600 text-sm mb-4 leading-relaxed">
                    {log.notes}
                  </p>

                  {log.actionItems && log.actionItems.length > 0 && (
                    <div className="flex flex-wrap gap-3">
                      {log.actionItems.map((item) => (
                        <span key={item.id} className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${item.status === 'Completed' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                          {item.status === 'Completed' ? <CheckCircle2 size={12} className="mr-1.5" /> : <Circle size={12} className="mr-1.5" />}
                          {item.task}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Created By Footer */}
                  {log.createdBy && (
                    <div className="mt-4 pt-3 border-t border-slate-50 flex items-center text-xs text-slate-400">
                      <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center mr-2 text-[10px] font-bold text-slate-500">
                        {log.createdBy.charAt(0)}
                      </div>
                      <span className="font-medium mr-1">Logged by:</span> {log.createdBy}
                    </div>
                  )}
                </div>

                <div className="flex items-center self-start md:self-center pl-0 md:pl-4 md:border-l border-slate-100">
                  <button 
                    onClick={() => onSelectStudent(log.attendees[0])}
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-all text-sm font-medium"
                    title="View Student Profile"
                  >
                    <User size={18} />
                    <span className="md:hidden">View Profile</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default HistoryView;
