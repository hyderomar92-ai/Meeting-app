
import React, { useState, useMemo, useEffect } from 'react';
import { MeetingLog, BehaviourEntry, SafeguardingCase, UserProfile } from '../types';
import { STUDENTS } from '../data/students';
import { Users, TrendingUp, AlertTriangle, Shield, Calendar, ChevronRight, Star, AlertCircle, Grid, PieChart as PieChartIcon, Lock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface ClassOverviewProps {
  logs: MeetingLog[];
  behaviourEntries: BehaviourEntry[];
  safeguardingCases: SafeguardingCase[];
  onNavigateToStudent: (name: string) => void;
  currentUser: UserProfile;
}

const RISK_COLORS = {
  Low: '#4ade80',      // green-400
  Medium: '#facc15',   // yellow-400
  High: '#fb923c',     // orange-400
  Critical: '#f87171', // red-400
  None: '#cbd5e1'      // slate-300
};

const ClassOverview: React.FC<ClassOverviewProps> = ({ logs, behaviourEntries, safeguardingCases, onNavigateToStudent, currentUser }) => {
  const [selectedClass, setSelectedClass] = useState<string>('');

  // Extract unique classes with RBAC
  const classes = useMemo(() => {
    let allClassOptions = Array.from(new Set(STUDENTS.map(s => s.studentClass).filter(Boolean))).sort();
    
    // Global Roles see everything
    if (['DSL', 'Admin', 'Super Admin'].includes(currentUser.role)) {
        return allClassOptions;
    }

    // Restricted Roles check allowedYearGroups
    if (currentUser.allowedYearGroups && currentUser.allowedYearGroups.length > 0) {
        return allClassOptions.filter(cls => 
            // Check if class (e.g. '07B') starts with any allowed year (e.g. '07')
            currentUser.allowedYearGroups?.some(year => cls?.startsWith(year))
        );
    }

    // Default fallback (if role is restricted but no groups assigned, show nothing or maybe all? Safe to show nothing)
    return []; 
  }, [currentUser]);

  // Auto-select first available class if current selection is invalid or empty
  useEffect(() => {
      if (classes.length > 0 && (!selectedClass || !classes.includes(selectedClass))) {
          setSelectedClass(classes[0] || '');
      }
  }, [classes]);

  // Derived Data for Selected Class
  const classData = useMemo(() => {
    if (!selectedClass) return null;

    // 1. Identify Students
    const students = STUDENTS.filter(s => s.studentClass === selectedClass);
    const studentNames = students.map(s => s.name);

    // 2. Filter Data Sources
    const relevantBehavior = behaviourEntries.filter(b => studentNames.includes(b.studentName));
    const relevantLogs = logs.filter(l => l.attendees.some(a => studentNames.includes(a)));
    const relevantSafeguarding = safeguardingCases.filter(c => studentNames.includes(c.studentName));

    // 3. Calculate Stats
    const totalMerits = relevantBehavior.filter(b => b.type === 'POSITIVE').reduce((acc, curr) => acc + curr.points, 0);
    const totalSanctions = relevantBehavior.filter(b => b.type === 'NEGATIVE').reduce((acc, curr) => acc + Math.abs(curr.points), 0);
    const netScore = totalMerits - totalSanctions;
    
    const activeRisks = relevantSafeguarding.filter(c => c.status !== 'Closed').length;
    const criticalRisks = relevantSafeguarding.filter(c => ['High', 'Critical'].includes(c.generatedReport.riskLevel) && c.status !== 'Closed').length;

    // 4. Chart Data (Last 14 Days)
    const trendData = [];
    const today = new Date();
    for (let i = 13; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        
        const dayEntries = relevantBehavior.filter(e => e.date.startsWith(dateStr));
        trendData.push({
            name: d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' }),
            Merits: dayEntries.filter(e => e.type === 'POSITIVE').reduce((acc, e) => acc + e.points, 0),
            Sanctions: dayEntries.filter(e => e.type === 'NEGATIVE').reduce((acc, e) => acc + Math.abs(e.points), 0)
        });
    }

    // 5. Student Breakdown & Risk Distribution
    const riskCounts = { Low: 0, Medium: 0, High: 0, Critical: 0, None: 0 };

    const studentBreakdown = students.map(student => {
        const sBehav = relevantBehavior.filter(b => b.studentName === student.name);
        const sNet = sBehav.reduce((acc, b) => acc + b.points, 0);
        const sRisk = relevantSafeguarding.find(c => c.studentName === student.name && c.status !== 'Closed');
        
        const level = sRisk ? sRisk.generatedReport.riskLevel : 'None';
        // @ts-ignore
        if (riskCounts[level] !== undefined) riskCounts[level]++;
        else riskCounts['None']++;

        return {
            ...student,
            netBehavior: sNet,
            riskLevel: level,
            riskId: sRisk?.id
        };
    }).sort((a, b) => b.netBehavior - a.netBehavior);

    const riskPieData = Object.keys(riskCounts).filter(k => riskCounts[k as keyof typeof riskCounts] > 0).map(key => ({
        name: key,
        value: riskCounts[key as keyof typeof riskCounts]
    }));

    // 6. Recent Activity (Combined Logs & Behavior)
    const recentActivity = [
        ...relevantLogs.map(l => ({ type: 'LOG', date: l.date, subject: l.attendees.join(', '), detail: l.type, id: l.id })),
        ...relevantBehavior.map(b => ({ type: 'BEHAVIOR', date: b.date, subject: b.studentName, detail: `${b.type === 'POSITIVE' ? '+' : ''}${b.points} ${b.category}`, id: b.id }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);

    return {
        students,
        totalMerits,
        totalSanctions,
        netScore,
        activeRisks,
        criticalRisks,
        trendData,
        studentBreakdown,
        recentActivity,
        riskPieData
    };
  }, [selectedClass, logs, behaviourEntries, safeguardingCases]);

  return (
    <div className="animate-fade-in space-y-6">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
            <div>
                <h1 className="text-3xl font-bold text-slate-800">Class Overview</h1>
                <p className="text-slate-500">Aggregated insights, trends, and risk analysis.</p>
            </div>
            
            <div className="relative w-full sm:w-64">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">
                    <Grid size={18} />
                </div>
                <select 
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    disabled={classes.length === 0}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold text-slate-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {classes.length === 0 ? (
                        <option value="">No Access Assigned</option>
                    ) : (
                        <option value="">Select a Class...</option>
                    )}
                    {classes.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
            </div>
        </header>

        {classes.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-96 bg-slate-50 rounded-xl border border-slate-200 border-dashed">
                <div className="p-4 bg-white rounded-full shadow-sm mb-4">
                    <Lock size={32} className="text-slate-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-700">Access Restricted</h3>
                <p className="text-slate-500 text-center max-w-md mt-2">
                    You do not have any Year Groups assigned to your profile. Please contact an Administrator to configure your access scope.
                </p>
            </div>
        ) : !selectedClass || !classData ? (
            <div className="flex flex-col items-center justify-center h-96 bg-slate-50 rounded-xl border border-slate-200 border-dashed">
                <div className="p-4 bg-white rounded-full shadow-sm mb-4">
                    <Users size={32} className="text-indigo-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-700">No Class Selected</h3>
                <p className="text-slate-500">Please select a class group from the dropdown above.</p>
            </div>
        ) : (
            <>
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between group hover:border-indigo-300 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Class Size</p>
                            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors"><Users size={18} /></div>
                        </div>
                        <p className="text-3xl font-black text-slate-800">{classData.students.length}</p>
                    </div>
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between group hover:border-emerald-300 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Net Behavior</p>
                            <div className={`p-2 rounded-lg transition-colors ${classData.netScore >= 0 ? "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white" : "bg-red-50 text-red-600 group-hover:bg-red-600 group-hover:text-white"}`}>
                                <TrendingUp size={18} />
                            </div>
                        </div>
                        <p className={`text-3xl font-black ${classData.netScore >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                            {classData.netScore > 0 ? '+' : ''}{classData.netScore}
                        </p>
                    </div>
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between group hover:border-amber-300 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Risks</p>
                            <div className="p-2 bg-amber-50 rounded-lg text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors"><Shield size={18} /></div>
                        </div>
                        <p className="text-3xl font-black text-slate-800">{classData.activeRisks}</p>
                        {classData.criticalRisks > 0 && (
                            <p className="text-xs font-bold text-red-600 mt-1 flex items-center">
                                <AlertTriangle size={12} className="mr-1" /> {classData.criticalRisks} Critical
                            </p>
                        )}
                    </div>
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between group hover:border-blue-300 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Avg Engagement</p>
                            <div className="p-2 bg-blue-50 rounded-lg text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors"><Star size={18} /></div>
                        </div>
                        <p className="text-3xl font-black text-slate-800">
                            {classData.students.length > 0 ? Math.round((classData.totalMerits / (classData.totalMerits + classData.totalSanctions || 1)) * 100) : 0}%
                        </p>
                        <p className="text-xs text-slate-400 mt-1">Positive Ratio</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Charts Area */}
                    <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <h3 className="text-lg font-bold text-slate-800 mb-6">Behavior Pulse (14 Days)</h3>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={classData.trendData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis 
                                        dataKey="name" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{fontSize: 10, fill: '#94a3b8'}} 
                                        minTickGap={30}
                                    />
                                    <YAxis 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{fontSize: 10, fill: '#94a3b8'}} 
                                    />
                                    <Tooltip 
                                        cursor={{fill: '#f8fafc'}}
                                        contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                                    />
                                    <Legend iconType="circle" wrapperStyle={{fontSize: '12px', paddingTop: '10px'}} />
                                    <Bar dataKey="Merits" fill="#4ade80" radius={[4, 4, 0, 0]} barSize={20} />
                                    <Bar dataKey="Sanctions" fill="#f87171" radius={[4, 4, 0, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Risk Distribution Pie */}
                    <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col">
                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                            <PieChartIcon size={20} className="mr-2 text-slate-400"/> Risk Distribution
                        </h3>
                        <div className="flex-1 min-h-[250px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={classData.riskPieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {classData.riskPieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={RISK_COLORS[entry.name as keyof typeof RISK_COLORS] || '#cbd5e1'} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Main Content Split: Roster vs Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Student Roster Table */}
                    <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 bg-slate-50">
                            <h3 className="font-bold text-slate-800">Student Roster</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-white text-slate-500 uppercase font-bold text-xs border-b border-slate-100">
                                    <tr>
                                        <th className="px-6 py-4">Student Name</th>
                                        <th className="px-6 py-4">ID</th>
                                        <th className="px-6 py-4 text-center">Net Behavior</th>
                                        <th className="px-6 py-4">Risk Status</th>
                                        <th className="px-6 py-4 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {classData.studentBreakdown.map(student => (
                                        <tr key={student.id} className="hover:bg-slate-50 transition-colors group">
                                            <td className="px-6 py-4 font-bold text-slate-700 cursor-pointer" onClick={() => onNavigateToStudent(student.name)}>
                                                {student.name}
                                            </td>
                                            <td className="px-6 py-4 text-slate-500 font-mono text-xs">{student.id}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-2 py-1 rounded font-bold text-xs ${
                                                    student.netBehavior > 0 ? 'bg-green-100 text-green-700' : 
                                                    student.netBehavior < 0 ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'
                                                }`}>
                                                    {student.netBehavior > 0 ? '+' : ''}{student.netBehavior}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {student.riskLevel !== 'None' ? (
                                                    <span className={`flex items-center text-xs font-bold px-2 py-1 rounded w-fit ${
                                                        student.riskLevel === 'Critical' ? 'bg-red-50 text-red-600 border border-red-100' : 
                                                        student.riskLevel === 'High' ? 'bg-orange-50 text-orange-600 border border-orange-100' : 
                                                        'bg-yellow-50 text-yellow-600 border border-yellow-100'
                                                    }`}>
                                                        <AlertCircle size={12} className="mr-1.5" /> {student.riskLevel}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-slate-400 flex items-center">
                                                        <Shield size={12} className="mr-1.5" /> Secure
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button 
                                                    onClick={() => onNavigateToStudent(student.name)}
                                                    className="text-slate-400 hover:text-indigo-600 transition-colors p-2"
                                                >
                                                    <ChevronRight size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Recent Activity Feed */}
                    <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col h-full">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Class Activity Feed</h3>
                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3 max-h-[500px]">
                            {classData.recentActivity.length === 0 ? (
                                <p className="text-sm text-slate-400 italic">No recent activity recorded.</p>
                            ) : (
                                classData.recentActivity.map((item, idx) => (
                                    <div key={`${item.id}-${idx}`} className="flex items-start pb-3 border-b border-slate-50 last:border-0 last:pb-0">
                                        <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 mr-3 ${item.type === 'LOG' ? 'bg-blue-400' : 'bg-purple-400'}`}></div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-700">{item.subject}</p>
                                            <p className="text-xs text-slate-600">{item.detail}</p>
                                            <p className="text-[10px] text-slate-400 mt-0.5 flex items-center">
                                                {item.type === 'LOG' ? <Calendar size={10} className="mr-1"/> : <Star size={10} className="mr-1"/>}
                                                {new Date(item.date).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </>
        )}
    </div>
  );
};

export default ClassOverview;
