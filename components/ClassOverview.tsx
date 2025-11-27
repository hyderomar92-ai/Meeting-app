import React, { useState, useMemo, useEffect } from 'react';
import { MeetingLog, BehaviourEntry, SafeguardingCase, UserProfile, RoleDefinition } from '../types';
import { STUDENTS } from '../data/students';
import { Users, TrendingUp, AlertTriangle, Shield, Calendar, ChevronRight, Star, AlertCircle, Grid, PieChart as PieChartIcon, Lock, EyeOff } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface ClassOverviewProps {
  logs: MeetingLog[];
  behaviourEntries: BehaviourEntry[];
  safeguardingCases: SafeguardingCase[];
  onNavigateToStudent: (name: string) => void;
  currentUser: UserProfile;
  roles?: RoleDefinition[];
}

const RISK_COLORS = {
  Low: '#4ade80',      // green-400
  Medium: '#facc15',   // yellow-400
  High: '#fb923c',     // orange-400
  Critical: '#f87171', // red-400
  None: '#cbd5e1'      // slate-300
};

const ClassOverview: React.FC<ClassOverviewProps> = ({ logs, behaviourEntries, safeguardingCases, onNavigateToStudent, currentUser, roles = [] }) => {
  const [selectedClass, setSelectedClass] = useState<string>('');

  // Permission Check Logic
  const permissions = useMemo(() => {
      const userRoleDef = roles.find(r => r.name === currentUser.role);
      // Default fallback if role definition missing
      if (!userRoleDef) return {
          classManager: {
              showRiskAnalysis: true, 
              showBehaviorTrends: true, 
              showStudentRoster: true, 
              showActivityFeed: true 
          }
      };
      return userRoleDef.permissions;
  }, [currentUser, roles]);

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
            currentUser.allowedYearGroups?.some(year => cls?.startsWith(year))
        );
    }

    return []; 
  }, [currentUser]);

  // Auto-select first available class
  useEffect(() => {
      if (classes.length > 0 && (!selectedClass || !classes.includes(selectedClass))) {
          setSelectedClass(classes[0] || '');
      }
  }, [classes, selectedClass]);

  // Derived Data for Selected Class
  const classData = useMemo(() => {
    if (!selectedClass) return null;

    // 1. Identify Students
    const students = STUDENTS.filter(s => s.studentClass === selectedClass);
    const studentNames = students.map(s => s.name);

    // 2. Filter Data
    const classLogs = logs.filter(l => l.attendees.some(a => studentNames.includes(a)));
    const classBehavior = behaviourEntries.filter(b => b.studentClass === selectedClass || studentNames.includes(b.studentName));
    const classSafeguarding = safeguardingCases.filter(c => studentNames.includes(c.studentName) && c.status !== 'Closed');

    // 3. Stats
    const totalMerits = classBehavior.filter(b => b.type === 'POSITIVE').reduce((acc, b) => acc + b.points, 0);
    const totalSanctions = classBehavior.filter(b => b.type === 'NEGATIVE').reduce((acc, b) => acc + Math.abs(b.points), 0);
    const atRiskCount = new Set(classSafeguarding.map(c => c.studentName)).size;

    return {
        students,
        logs: classLogs,
        behavior: classBehavior,
        safeguarding: classSafeguarding,
        stats: { totalMerits, totalSanctions, atRiskCount }
    };
  }, [selectedClass, logs, behaviourEntries, safeguardingCases]);

  if (classes.length === 0) {
      return (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <Lock size={48} className="mb-4 opacity-20" />
              <p>You do not have access to any class data.</p>
              <p className="text-sm">Please contact your administrator to assign Year Groups.</p>
          </div>
      );
  }

  return (
    <div className="space-y-6 animate-fade-in">
        <header className="flex justify-between items-center">
            <div>
                <h1 className="text-3xl font-bold text-slate-800">Class Overview</h1>
                <p className="text-slate-500">Performance and wellbeing analytics.</p>
            </div>
            <div className="relative w-48">
                <Grid className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <select 
                    value={selectedClass} 
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-bold text-slate-700"
                >
                    {classes.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
            </div>
        </header>

        {classData && (
            <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-slate-500 text-xs font-bold uppercase">Class Size</p>
                                <p className="text-3xl font-bold text-slate-800 mt-1">{classData.students.length}</p>
                            </div>
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                                <Users size={24} />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-slate-500 text-xs font-bold uppercase">Net Behavior</p>
                                <div className="flex items-baseline mt-1">
                                    <p className={`text-3xl font-bold ${classData.stats.totalMerits >= classData.stats.totalSanctions ? 'text-emerald-600' : 'text-red-600'}`}>
                                        {classData.stats.totalMerits - classData.stats.totalSanctions}
                                    </p>
                                    <span className="text-xs text-slate-400 ml-2">
                                        (+{classData.stats.totalMerits} / -{classData.stats.totalSanctions})
                                    </span>
                                </div>
                            </div>
                            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
                                <Star size={24} />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-slate-500 text-xs font-bold uppercase">Active Risks</p>
                                <p className="text-3xl font-bold text-slate-800 mt-1">{permissions?.classManager?.showRiskAnalysis ? classData.stats.atRiskCount : <span className="text-lg text-slate-400 flex items-center"><EyeOff size={16} className="mr-1"/> Hidden</span>}</p>
                            </div>
                            <div className="p-3 bg-red-50 text-red-600 rounded-lg">
                                <Shield size={24} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Student List */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                            <h3 className="font-bold text-slate-700">Student Roster</h3>
                            <span className="text-xs text-slate-500">{classData.students.length} Students</span>
                        </div>
                        <div className="divide-y divide-slate-50 max-h-[400px] overflow-y-auto">
                            {permissions?.classManager?.showStudentRoster ? (
                                classData.students.map(student => {
                                    const studentRisks = classData.safeguarding.filter(c => c.studentName === student.name);
                                    const highestRisk = studentRisks.reduce((max, c) => {
                                        const levels = ['Low', 'Medium', 'High', 'Critical'];
                                        return levels.indexOf(c.generatedReport.riskLevel) > levels.indexOf(max) ? c.generatedReport.riskLevel : max;
                                    }, 'None');

                                    return (
                                        <div key={student.id} onClick={() => onNavigateToStudent(student.name)} className="p-4 hover:bg-slate-50 transition-colors cursor-pointer flex justify-between items-center group">
                                            <div className="flex items-center">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 mr-3">
                                                    {student.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-700 group-hover:text-indigo-700">{student.name}</p>
                                                    <p className="text-xs text-slate-400">{student.id}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-3">
                                                {highestRisk !== 'None' && permissions?.classManager?.showRiskAnalysis && (
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                                        highestRisk === 'Critical' ? 'bg-red-100 text-red-600' :
                                                        highestRisk === 'High' ? 'bg-orange-100 text-orange-600' :
                                                        'bg-yellow-100 text-yellow-600'
                                                    }`}>
                                                        {highestRisk} Risk
                                                    </span>
                                                )}
                                                <ChevronRight size={16} className="text-slate-300 group-hover:text-indigo-400" />
                                            </div>
                                        </div>
                                    )
                                })
                            ) : (
                                <div className="p-8 text-center text-slate-400 flex flex-col items-center">
                                    <Lock size={24} className="mb-2" />
                                    <p className="text-sm">Roster access restricted.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Charts Area */}
                    <div className="space-y-6">
                        {permissions?.classManager?.showBehaviorTrends ? (
                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-full">
                                <h3 className="font-bold text-slate-700 mb-4">Behavior Distribution</h3>
                                <div className="h-64 w-full">
                                    {classData.stats.totalMerits + classData.stats.totalSanctions > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={[
                                                        { name: 'Merits', value: classData.stats.totalMerits },
                                                        { name: 'Sanctions', value: classData.stats.totalSanctions }
                                                    ]}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={80}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                >
                                                    <Cell fill="#10b981" />
                                                    <Cell fill="#ef4444" />
                                                </Pie>
                                                <Tooltip />
                                                <Legend />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                                            No behavior data recorded yet.
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-full flex flex-col items-center justify-center text-slate-400">
                                <Lock size={32} className="mb-2" />
                                <p>Behavior analytics restricted.</p>
                            </div>
                        )}
                    </div>
                </div>
            </>
        )}
    </div>
  );
};

export default ClassOverview;