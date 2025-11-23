
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { BehaviourEntry, UserProfile } from '../types';
import { STUDENTS } from '../data/students';
import { Star, AlertCircle, Plus, Search, Trophy, TrendingUp, TrendingDown, Filter, Calendar, User, X, CheckCircle2, BarChart3, Users, Trash2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface BehaviourManagerProps {
  currentUser: UserProfile;
  entries: BehaviourEntry[];
  onAddEntries: (entries: BehaviourEntry[]) => void;
}

const POSITIVE_CATEGORIES = [
  { label: 'Excellent Work', points: 1 },
  { label: 'Helping Others', points: 1 },
  { label: 'Participation', points: 1 },
  { label: 'Resilience', points: 2 },
  { label: 'School Values', points: 3 },
];

const NEGATIVE_CATEGORIES = [
  { label: 'Disruption', points: -1 },
  { label: 'No Homework', points: -1 },
  { label: 'Lateness', points: -1 },
  { label: 'Uniform Issue', points: -1 },
  { label: 'Lack of Equipment', points: -1 },
];

const BehaviourManager: React.FC<BehaviourManagerProps> = ({ currentUser, entries, onAddEntries }) => {
  // View State
  const [activeTab, setActiveTab] = useState<'LEADERBOARD' | 'LOG_ENTRY'>('LEADERBOARD');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [chartTimeRange, setChartTimeRange] = useState<'WEEK' | 'MONTH'>('WEEK');
  
  // Form State
  const [studentSearch, setStudentSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Multi-select state
  const [selectedStudents, setSelectedStudents] = useState<{name: string, class?: string}[]>([]);
  
  const [entryType, setEntryType] = useState<'POSITIVE' | 'NEGATIVE'>('POSITIVE');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [points, setPoints] = useState<number>(1);
  const [description, setDescription] = useState('');

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

  // Derived Data
  const uniqueClasses = useMemo(() => Array.from(new Set(STUDENTS.map(s => s.studentClass).filter(Boolean))).sort(), []);
  
  const filteredStudents = useMemo(() => {
    return STUDENTS.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(studentSearch.toLowerCase());
      const isAlreadySelected = selectedStudents.some(sel => sel.name === s.name);
      return matchesSearch && !isAlreadySelected;
    }).slice(0, 5);
  }, [studentSearch, selectedStudents]);

  // Chart Data Calculation
  const chartData = useMemo(() => {
    const days = chartTimeRange === 'WEEK' ? 7 : 30;
    const data = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const displayDate = d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' });

        const dayEntries = entries.filter(e => e.date.startsWith(dateStr));
        
        const merits = dayEntries
            .filter(e => e.type === 'POSITIVE')
            .reduce((acc, cur) => acc + cur.points, 0);
            
        const sanctions = dayEntries
            .filter(e => e.type === 'NEGATIVE')
            .reduce((acc, cur) => acc + Math.abs(cur.points), 0);

        data.push({
            name: displayDate,
            Merits: merits,
            Sanctions: sanctions
        });
    }
    return data;
  }, [entries, chartTimeRange]);

  // Leaderboard Calculation
  const leaderboardData = useMemo(() => {
    const stats: Record<string, { name: string, class?: string, positive: number, negative: number, net: number }> = {};

    STUDENTS.forEach(s => {
      if (!selectedClass || s.studentClass === selectedClass) {
        stats[s.name] = { 
          name: s.name, 
          class: s.studentClass, 
          positive: 0, 
          negative: 0, 
          net: 0 
        };
      }
    });

    entries.forEach(e => {
       if (stats[e.studentName]) {
         if (e.type === 'POSITIVE') {
            stats[e.studentName].positive += e.points;
            stats[e.studentName].net += e.points;
         } else {
            stats[e.studentName].negative += Math.abs(e.points);
            stats[e.studentName].net -= Math.abs(e.points);
         }
       }
    });

    return Object.values(stats).sort((a, b) => b.net - a.net);
  }, [entries, selectedClass]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStudents.length === 0 || !selectedCategory) return;

    // Create an entry for EACH selected student
    const newEntries: BehaviourEntry[] = selectedStudents.map(student => ({
      id: crypto.randomUUID(),
      studentName: student.name,
      studentClass: student.class,
      date: new Date().toISOString(),
      type: entryType,
      category: selectedCategory,
      points: entryType === 'POSITIVE' ? points : -Math.abs(points),
      description,
      loggedBy: currentUser.name
    }));

    onAddEntries(newEntries);
    
    // Reset Form
    setSelectedStudents([]);
    setStudentSearch('');
    setSelectedCategory('');
    setDescription('');
    setActiveTab('LEADERBOARD');
  };

  const handleQuickAdd = (student: {name: string, class?: string}) => {
    setSelectedStudents([student]);
    setActiveTab('LOG_ENTRY');
  };

  const handleAddStudent = (student: {name: string, class?: string}) => {
      if (!selectedStudents.some(s => s.name === student.name)) {
          setSelectedStudents([...selectedStudents, student]);
      }
      setStudentSearch('');
      setShowSuggestions(false);
  };

  const handleRemoveStudent = (name: string) => {
      setSelectedStudents(selectedStudents.filter(s => s.name !== name));
  };

  const handleAddWholeClass = (className: string) => {
      if (!className) return;
      const classMembers = STUDENTS
        .filter(s => s.studentClass === className)
        .map(s => ({ name: s.name, class: s.studentClass }));
      
      // Merge preventing duplicates
      const uniqueNew = classMembers.filter(cm => !selectedStudents.some(s => s.name === cm.name));
      setSelectedStudents([...selectedStudents, ...uniqueNew]);
  };

  const todayStats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todaysEntries = entries.filter(e => e.date.startsWith(today));
    return {
      count: todaysEntries.length,
      merits: todaysEntries.filter(e => e.type === 'POSITIVE').reduce((acc, curr) => acc + curr.points, 0),
      sanctions: todaysEntries.filter(e => e.type === 'NEGATIVE').length
    };
  }, [entries]);

  return (
    <div className="animate-fade-in space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Behaviour Management</h1>
          <p className="text-slate-500">Track merits, sanctions, and student engagement.</p>
        </div>
        <div className="flex gap-3">
          {activeTab === 'LEADERBOARD' && (
             <button 
                onClick={() => setActiveTab('LOG_ENTRY')}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md transition-colors font-medium"
             >
                <Plus size={18} className="mr-2" /> Log Behaviour
             </button>
          )}
        </div>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
           <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Entries Today</p>
              <p className="text-2xl font-bold text-slate-800">{todayStats.count}</p>
           </div>
           <div className="p-3 bg-slate-100 text-slate-500 rounded-lg"><Calendar size={24} /></div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
           <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Merits Awarded</p>
              <p className="text-2xl font-bold text-green-600">+{todayStats.merits}</p>
           </div>
           <div className="p-3 bg-green-50 text-green-600 rounded-lg"><Star size={24} /></div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
           <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Sanctions Issued</p>
              <p className="text-2xl font-bold text-red-600">{todayStats.sanctions}</p>
           </div>
           <div className="p-3 bg-red-50 text-red-600 rounded-lg"><AlertCircle size={24} /></div>
        </div>
      </div>

      {activeTab === 'LEADERBOARD' ? (
        <div className="space-y-6">
           
           {/* Chart Section */}
           <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-slate-800 flex items-center">
                   <BarChart3 size={20} className="mr-2 text-blue-600" />
                   Behaviour Trends
                </h2>
                <div className="flex bg-slate-100 rounded-lg p-1">
                   <button 
                     onClick={() => setChartTimeRange('WEEK')}
                     className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${chartTimeRange === 'WEEK' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                   >
                     Last 7 Days
                   </button>
                   <button 
                     onClick={() => setChartTimeRange('MONTH')}
                     className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${chartTimeRange === 'MONTH' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                   >
                     Last 30 Days
                   </button>
                </div>
             </div>
             
             <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#64748b', fontSize: 11 }} 
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#64748b', fontSize: 11 }} 
                      />
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        cursor={{ fill: '#f8fafc' }}
                      />
                      <Legend 
                         wrapperStyle={{ paddingTop: '20px' }}
                         iconType="circle"
                         iconSize={8}
                      />
                      <Bar 
                        dataKey="Merits" 
                        fill="#22c55e" 
                        radius={[4, 4, 0, 0]} 
                        barSize={chartTimeRange === 'WEEK' ? 30 : 15}
                      />
                      <Bar 
                        dataKey="Sanctions" 
                        fill="#ef4444" 
                        radius={[4, 4, 0, 0]} 
                        barSize={chartTimeRange === 'WEEK' ? 30 : 15}
                      />
                   </BarChart>
                </ResponsiveContainer>
             </div>
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Leaderboard Section */}
              <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-bold text-slate-800 flex items-center">
                          <Trophy size={20} className="mr-2 text-amber-500" /> 
                          Class Leaderboard
                        </h2>
                        <div className="relative">
                          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={14} />
                          <select 
                            value={selectedClass} 
                            onChange={(e) => setSelectedClass(e.target.value)}
                            className="pl-9 pr-4 py-1.5 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                          >
                              <option value="">All Classes</option>
                              {uniqueClasses.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                              <tr className="border-b border-slate-100 text-left">
                                <th className="pb-3 pl-2 text-xs font-bold text-slate-400 uppercase tracking-wide">Rank</th>
                                <th className="pb-3 text-xs font-bold text-slate-400 uppercase tracking-wide">Student</th>
                                <th className="pb-3 text-center text-xs font-bold text-slate-400 uppercase tracking-wide">Merits</th>
                                <th className="pb-3 text-center text-xs font-bold text-slate-400 uppercase tracking-wide">Sanctions</th>
                                <th className="pb-3 pr-2 text-right text-xs font-bold text-slate-400 uppercase tracking-wide">Net Score</th>
                                <th className="pb-3 w-10"></th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                              {leaderboardData.slice(0, 15).map((student, idx) => (
                                <tr key={student.name} className="group hover:bg-slate-50 transition-colors">
                                    <td className="py-3 pl-2 text-sm text-slate-500 font-medium">
                                      {idx === 0 ? <span className="text-amber-500">🥇 1</span> : 
                                        idx === 1 ? <span className="text-slate-400">🥈 2</span> : 
                                        idx === 2 ? <span className="text-amber-700">🥉 3</span> : idx + 1}
                                    </td>
                                    <td className="py-3">
                                      <div className="flex items-center">
                                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 mr-3">
                                            {student.name.charAt(0)}
                                          </div>
                                          <div>
                                            <p className="text-sm font-semibold text-slate-700">{student.name}</p>
                                            <p className="text-xs text-slate-400">{student.class || 'No Class'}</p>
                                          </div>
                                      </div>
                                    </td>
                                    <td className="py-3 text-center text-sm font-medium text-green-600">
                                      {student.positive > 0 ? `+${student.positive}` : '-'}
                                    </td>
                                    <td className="py-3 text-center text-sm font-medium text-red-500">
                                      {student.negative > 0 ? student.negative : '-'}
                                    </td>
                                    <td className="py-3 pr-2 text-right">
                                      <span className={`px-2.5 py-1 rounded-lg text-sm font-bold ${
                                          student.net > 0 ? 'bg-green-100 text-green-700' : 
                                          student.net < 0 ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'
                                      }`}>
                                          {student.net > 0 ? '+' : ''}{student.net}
                                      </span>
                                    </td>
                                    <td className="py-3 text-right">
                                        <button 
                                          onClick={() => handleQuickAdd({name: student.name, class: student.class})}
                                          className="p-1.5 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                          title="Quick Log"
                                        >
                                          <Plus size={16} />
                                        </button>
                                    </td>
                                </tr>
                              ))}
                              {leaderboardData.length === 0 && (
                                <tr><td colSpan={6} className="py-8 text-center text-slate-400 italic">No students found.</td></tr>
                              )}
                          </tbody>
                        </table>
                    </div>
                  </div>
              </div>

              {/* Recent Activity Feed */}
              <div className="lg:col-span-1">
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-full">
                    <h2 className="text-lg font-bold text-slate-800 mb-4">Recent Activity</h2>
                    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                        {entries.length === 0 ? (
                          <p className="text-sm text-slate-400 text-center py-4">No activity recorded yet.</p>
                        ) : (
                          entries.slice(0, 10).map((entry) => (
                              <div key={entry.id} className="flex gap-3 pb-3 border-b border-slate-50 last:border-0 last:pb-0">
                                <div className={`mt-1 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                                    entry.type === 'POSITIVE' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                                }`}>
                                    {entry.type === 'POSITIVE' ? <Star size={14} /> : <AlertCircle size={14} />}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-800">{entry.studentName}</p>
                                    <p className="text-xs text-slate-500 mb-1">
                                      {entry.type === 'POSITIVE' ? 'Awarded' : 'Sanctioned'}: <span className="font-semibold">{entry.category}</span>
                                    </p>
                                    {entry.description && (
                                      <p className="text-xs text-slate-400 italic mb-1">"{entry.description}"</p>
                                    )}
                                    <p className="text-[10px] text-slate-400">
                                      {new Date(entry.date).toLocaleDateString()} by {entry.loggedBy}
                                    </p>
                                </div>
                                <div className="ml-auto">
                                    <span className={`text-xs font-bold ${entry.type === 'POSITIVE' ? 'text-green-600' : 'text-red-600'}`}>
                                      {entry.type === 'POSITIVE' ? '+' : ''}{entry.points}
                                    </span>
                                </div>
                              </div>
                          ))
                        )}
                    </div>
                  </div>
              </div>
           </div>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto">
           <button 
             onClick={() => setActiveTab('LEADERBOARD')}
             className="mb-4 text-sm text-slate-500 hover:text-slate-800 flex items-center"
           >
             <X size={16} className="mr-1" /> Cancel
           </button>
           
           <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-200">
              <h2 className="text-2xl font-bold text-slate-800 mb-6">Log Behaviour Incident</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                 {/* Student Selection (Multi-select) */}
                 <div className="relative" ref={wrapperRef}>
                    <div className="flex justify-between items-center mb-1">
                       <label className="block text-sm font-medium text-slate-700">Selected Students ({selectedStudents.length})</label>
                       
                       <div className="relative">
                          <select 
                            onChange={(e) => {
                                handleAddWholeClass(e.target.value);
                                e.target.value = ''; // Reset
                            }}
                            className="text-xs bg-slate-100 border-none rounded-md px-2 py-1 text-slate-600 hover:bg-slate-200 cursor-pointer focus:ring-0"
                          >
                             <option value="">+ Quick Add Class</option>
                             {uniqueClasses.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                       </div>
                    </div>

                    {/* Selected Tags */}
                    <div className="flex flex-wrap gap-2 mb-3 min-h-[38px] p-2 bg-slate-50 rounded-lg border border-slate-200">
                        {selectedStudents.length === 0 && (
                            <span className="text-sm text-slate-400 italic px-2">No students selected yet...</span>
                        )}
                        {selectedStudents.map(student => (
                            <span key={student.name} className="flex items-center bg-white border border-slate-300 rounded-full px-3 py-1 text-sm shadow-sm">
                                <span className="font-medium text-slate-700 mr-2">{student.name}</span>
                                {student.class && <span className="text-[10px] bg-slate-100 text-slate-500 px-1 rounded mr-2">{student.class}</span>}
                                <button type="button" onClick={() => handleRemoveStudent(student.name)} className="text-slate-400 hover:text-red-500 rounded-full">
                                    <X size={14} />
                                </button>
                            </span>
                        ))}
                        {selectedStudents.length > 0 && (
                            <button 
                              type="button" 
                              onClick={() => setSelectedStudents([])} 
                              className="text-xs text-red-500 hover:text-red-700 underline ml-auto px-2"
                            >
                                Clear All
                            </button>
                        )}
                    </div>

                    {/* Search Input */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                            type="text"
                            value={studentSearch}
                            onChange={(e) => { setStudentSearch(e.target.value); setShowSuggestions(true); }}
                            onFocus={() => setShowSuggestions(true)}
                            placeholder="Type to search and add more students..."
                            className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                            autoFocus={selectedStudents.length === 0}
                        />
                        {showSuggestions && studentSearch && filteredStudents.length > 0 && (
                            <div className="absolute z-10 w-full bg-white border border-slate-200 rounded-lg shadow-xl mt-1 overflow-hidden">
                            {filteredStudents.map(student => (
                                <button 
                                    key={student.id}
                                    type="button"
                                    onClick={() => handleAddStudent({name: student.name, class: student.studentClass})}
                                    className="w-full text-left px-4 py-3 hover:bg-slate-50 flex justify-between items-center border-b border-slate-50 last:border-0"
                                >
                                    <span className="font-medium text-slate-700">{student.name}</span>
                                    <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded">{student.studentClass}</span>
                                </button>
                            ))}
                            </div>
                        )}
                    </div>
                 </div>

                 {/* Type Toggle */}
                 <div className="flex p-1 bg-slate-100 rounded-lg">
                    <button
                       type="button"
                       onClick={() => { setEntryType('POSITIVE'); setPoints(1); setSelectedCategory(''); }}
                       className={`flex-1 py-2 text-sm font-bold rounded-md transition-all flex items-center justify-center ${
                          entryType === 'POSITIVE' ? 'bg-white text-green-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                       }`}
                    >
                       <Star size={16} className="mr-2" /> Merit (Positive)
                    </button>
                    <button
                       type="button"
                       onClick={() => { setEntryType('NEGATIVE'); setPoints(1); setSelectedCategory(''); }}
                       className={`flex-1 py-2 text-sm font-bold rounded-md transition-all flex items-center justify-center ${
                          entryType === 'NEGATIVE' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                       }`}
                    >
                       <AlertCircle size={16} className="mr-2" /> Sanction (Negative)
                    </button>
                 </div>

                 {/* Categories Grid */}
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                       {(entryType === 'POSITIVE' ? POSITIVE_CATEGORIES : NEGATIVE_CATEGORIES).map((cat) => (
                          <button
                             key={cat.label}
                             type="button"
                             onClick={() => { setSelectedCategory(cat.label); setPoints(Math.abs(cat.points)); }}
                             className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all text-left relative ${
                                selectedCategory === cat.label
                                   ? (entryType === 'POSITIVE' ? 'bg-green-50 border-green-500 text-green-700' : 'bg-red-50 border-red-500 text-red-700')
                                   : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                             }`}
                          >
                             {cat.label}
                             {selectedCategory === cat.label && (
                                <div className="absolute top-1 right-1">
                                   <CheckCircle2 size={12} />
                                </div>
                             )}
                             <span className="block text-xs opacity-60 mt-1">{cat.points > 0 ? '+' : ''}{cat.points} pts</span>
                          </button>
                       ))}
                    </div>
                 </div>

                 {/* Points & Description */}
                 <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-1">
                       <label className="block text-sm font-medium text-slate-700 mb-1">Points (Each)</label>
                       <input 
                          type="number"
                          min="1"
                          max="10"
                          value={points}
                          onChange={(e) => setPoints(parseInt(e.target.value))}
                          className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                       />
                    </div>
                    <div className="col-span-2">
                       <label className="block text-sm font-medium text-slate-700 mb-1">Comment (Optional)</label>
                       <input 
                          type="text"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="e.g. Excellent group work during Science"
                          className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                       />
                    </div>
                 </div>

                 <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                    <div className="text-xs text-slate-500">
                        Applying to {selectedStudents.length} student(s)
                    </div>
                    <button 
                       type="submit"
                       disabled={selectedStudents.length === 0 || !selectedCategory}
                       className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold shadow-lg hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                       Save Entries
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default BehaviourManager;
