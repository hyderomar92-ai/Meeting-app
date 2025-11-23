import React, { useMemo } from 'react';
import { MeetingLog, MeetingType, UserProfile, SafeguardingCase, BehaviourEntry } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Users, Calendar, ClipboardList, AlertCircle, User as UserIcon, Shield, ChevronRight, TrendingUp, TrendingDown, Star, BarChart2, Activity } from 'lucide-react';

interface DashboardProps {
  logs: MeetingLog[];
  safeguardingCases: SafeguardingCase[];
  behaviourEntries: BehaviourEntry[];
  onNavigate: (view: any) => void;
  currentUser: UserProfile;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
const RISK_COLORS = { Low: '#4ade80', Medium: '#facc15', High: '#fb923c', Critical: '#f87171' };

const Dashboard: React.FC<DashboardProps> = ({ logs, safeguardingCases, behaviourEntries, onNavigate, currentUser }) => {
  
  const isLeader = ['Head of Year', 'DSL', 'Admin'].includes(currentUser.role);

  // --- Common Stats ---
  const totalMeetings = logs.length;
  const uniqueStudents = new Set(logs.flatMap(l => l.attendees)).size;
  const pendingActions = logs.reduce((acc, log) => {
    return acc + (log.actionItems ? log.actionItems.filter(item => item.status === 'Pending').length : 0);
  }, 0);

  // --- Safeguarding Stats ---
  const activeCases = safeguardingCases.filter(c => c.status === 'Open' || c.status === 'Investigating');
  const criticalCases = activeCases.filter(c => c.generatedReport.riskLevel === 'High' || c.generatedReport.riskLevel === 'Critical');
  const activeHighRiskCount = criticalCases.length;

  // --- Behavior Stats ---
  const netBehaviorScore = behaviourEntries.reduce((acc, curr) => acc + curr.points, 0);
  const todaysEntries = behaviourEntries.filter(e => e.date.startsWith(new Date().toISOString().split('T')[0]));
  const todayNet = todaysEntries.reduce((acc, curr) => acc + curr.points, 0);

  // --- Charts Data ---

  // 1. Meeting Types Distribution
  const typeCount = logs.reduce((acc, log) => {
    acc[log.type] = (acc[log.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.keys(typeCount).map(type => ({
    name: type,
    value: typeCount[type]
  }));

  // 2. Risk Distribution (Leadership Only)
  const riskDistribution = useMemo(() => {
    const counts = { Low: 0, Medium: 0, High: 0, Critical: 0 };
    safeguardingCases.forEach(c => {
      const risk = c.generatedReport.riskLevel;
      if (counts[risk] !== undefined) counts[risk]++;
    });
    return Object.keys(counts).map(key => ({ name: key, count: counts[key as keyof typeof counts] }));
  }, [safeguardingCases]);

  // 3. Staff Leaderboard (Leadership Only)
  const staffActivity = useMemo(() => {
    const counts: Record<string, number> = {};
    logs.forEach(l => {
        if(l.createdBy) counts[l.createdBy] = (counts[l.createdBy] || 0) + 1;
    });
    return Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5) // Top 5
        .map(([name, count]) => ({ name, count }));
  }, [logs]);

  // --- Recent Logs Filtering ---
  // If Leader, show everything. If Teacher, prefer their own logs, or show all if they have none.
  const myLogs = logs.filter(l => l.createdBy === currentUser.name);
  const logsToDisplay = isLeader ? logs : (myLogs.length > 0 ? myLogs : logs);
  const recentLogs = [...logsToDisplay].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
           <div className="flex items-center space-x-2 text-slate-400 text-sm mb-1 font-medium uppercase tracking-wide">
             <span>{new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
           </div>
           <h1 className="text-3xl font-bold text-slate-800">
             {isLeader ? 'Executive Dashboard' : 'My Dashboard'}
           </h1>
           <p className="text-slate-500 mt-1">
             {isLeader 
                ? `Overview for ${currentUser.role} • ${currentUser.name}`
                : `Welcome back, ${currentUser.name}. Here are your recent updates.`
             }
           </p>
        </div>
        
        {isLeader && (
            <div className="flex space-x-2">
                <div className="px-4 py-2 bg-white rounded-lg border border-slate-200 shadow-sm text-center">
                    <p className="text-xs text-slate-400 font-bold uppercase">Active Students</p>
                    <p className="text-lg font-bold text-slate-700">{uniqueStudents}</p>
                </div>
                 <div className="px-4 py-2 bg-white rounded-lg border border-slate-200 shadow-sm text-center">
                    <p className="text-xs text-slate-400 font-bold uppercase">Total Logs</p>
                    <p className="text-lg font-bold text-blue-600">{totalMeetings}</p>
                </div>
            </div>
        )}
      </header>

      {/* Critical Alerts Banner */}
      {activeHighRiskCount > 0 && (
        <div 
          onClick={() => onNavigate('SAFEGUARDING')}
          className="bg-red-50 border border-red-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between cursor-pointer hover:bg-red-100 transition-colors animate-pulse-subtle shadow-sm"
        >
          <div className="flex items-center space-x-4 mb-3 sm:mb-0">
             <div className="p-3 bg-red-100 text-red-600 rounded-full shadow-sm ring-2 ring-red-200">
               <Shield size={24} />
             </div>
             <div>
               <h3 className="text-red-900 font-bold text-lg">Action Required</h3>
               <p className="text-red-700 text-sm font-medium">
                   {activeHighRiskCount} High/Critical risk safeguarding case{activeHighRiskCount !== 1 ? 's' : ''} active.
               </p>
             </div>
          </div>
          <div className="flex items-center text-red-700 font-bold text-sm bg-white/50 px-4 py-2 rounded-lg hover:bg-white transition-colors">
             Review Cases <ChevronRight size={16} className="ml-1" />
          </div>
        </div>
      )}

      {/* --- LEADERSHIP VIEW --- */}
      {isLeader ? (
        <>
            {/* Executive KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between group hover:border-blue-300 transition-colors">
                    <div>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Total Logs</p>
                        <p className="text-2xl font-black text-slate-800">{totalMeetings}</p>
                    </div>
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <Activity size={24} />
                    </div>
                </div>

                <div 
                    onClick={() => onNavigate('SAFEGUARDING')}
                    className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between group hover:border-red-300 transition-colors cursor-pointer"
                >
                    <div>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Open Safeguarding</p>
                        <p className="text-2xl font-black text-slate-800">{activeCases.length}</p>
                        <p className="text-xs text-red-500 font-medium">{activeHighRiskCount} Critical</p>
                    </div>
                    <div className="p-3 bg-red-50 text-red-600 rounded-xl group-hover:bg-red-600 group-hover:text-white transition-colors">
                        <Shield size={24} />
                    </div>
                </div>

                <div 
                    onClick={() => onNavigate('BEHAVIOUR')}
                    className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between group hover:border-emerald-300 transition-colors cursor-pointer"
                >
                    <div>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Net Behavior</p>
                        <p className={`text-2xl font-black ${netBehaviorScore >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {netBehaviorScore > 0 ? '+' : ''}{netBehaviorScore}
                        </p>
                        <p className="text-xs text-slate-500 font-medium">
                            {todayNet > 0 ? '+' : ''}{todayNet} Today
                        </p>
                    </div>
                    <div className={`p-3 rounded-xl transition-colors ${netBehaviorScore >= 0 ? 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white' : 'bg-red-50 text-red-600 group-hover:bg-red-600 group-hover:text-white'}`}>
                        {netBehaviorScore >= 0 ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
                    </div>
                </div>

                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between group hover:border-amber-300 transition-colors">
                    <div>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Pending Actions</p>
                        <p className="text-2xl font-black text-slate-800">{pendingActions}</p>
                    </div>
                    <div className="p-3 bg-amber-50 text-amber-600 rounded-xl group-hover:bg-amber-600 group-hover:text-white transition-colors">
                        <ClipboardList size={24} />
                    </div>
                </div>
            </div>

            {/* Leadership Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 {/* Safeguarding Risk Breakdown */}
                 <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
                        <Shield size={18} className="mr-2 text-red-500" />
                        Safeguarding Risk Profile
                    </h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={riskDistribution} layout="vertical" margin={{ left: 10, right: 30 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={60} tick={{fontSize: 12, fontWeight: 600}} />
                                <Tooltip cursor={{fill: 'transparent'}} />
                                <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={32}>
                                    {riskDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={RISK_COLORS[entry.name as keyof typeof RISK_COLORS] || '#8884d8'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                 </div>

                 {/* Staff Activity Leaderboard */}
                 <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                     <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
                        <BarChart2 size={18} className="mr-2 text-blue-500" />
                        Staff Activity (Top 5)
                     </h3>
                     <div className="space-y-4">
                        {staffActivity.map((staff, idx) => (
                            <div key={idx} className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mr-3 ${
                                        idx === 0 ? 'bg-amber-100 text-amber-700' : 
                                        idx === 1 ? 'bg-slate-200 text-slate-600' : 
                                        idx === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-500'
                                    }`}>
                                        {idx + 1}
                                    </div>
                                    <span className="text-sm font-medium text-slate-700">{staff.name}</span>
                                </div>
                                <span className="text-sm font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg">{staff.count} Logs</span>
                            </div>
                        ))}
                        {staffActivity.length === 0 && <p className="text-sm text-slate-400 italic">No activity recorded yet.</p>}
                     </div>
                 </div>

                 {/* Meeting Types */}
                 <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">Intervention Types</h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend wrapperStyle={{ fontSize: '11px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                 </div>
            </div>
        </>
      ) : (
        /* --- TEACHER VIEW --- */
        <>
           {/* Teacher KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center space-x-4">
                    <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                        <Calendar size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 font-medium">My Logs</p>
                        <p className="text-2xl font-bold text-slate-800">{myLogs.length}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center space-x-4">
                    <div className="p-3 bg-emerald-100 text-emerald-600 rounded-lg">
                        <Star size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 font-medium">Points Awarded</p>
                        <p className="text-2xl font-bold text-slate-800">
                            {behaviourEntries.filter(e => e.loggedBy === currentUser.name && e.type === 'POSITIVE').length}
                        </p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center space-x-4">
                    <div className="p-3 bg-amber-100 text-amber-600 rounded-lg">
                        <ClipboardList size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 font-medium">My Open Actions</p>
                        <p className="text-2xl font-bold text-slate-800">
                           {myLogs.reduce((acc, l) => acc + (l.actionItems ? l.actionItems.filter(i => i.status === 'Pending').length : 0), 0)}
                        </p>
                    </div>
                </div>
            </div>
        </>
      )}

      {/* Recent Logs (Shared Layout) */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-800">
                {isLeader ? 'Recent School Activity' : 'My Recent Logs'}
            </h3>
            <button onClick={() => onNavigate('HISTORY')} className="text-sm text-blue-600 hover:underline font-medium">View Full History</button>
          </div>
          <div className="space-y-4">
            {recentLogs.length === 0 ? (
              <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <p>No meetings recorded yet.</p>
              </div>
            ) : (
              recentLogs.map(log => (
                <div key={log.id} className="flex items-start p-4 bg-slate-50/50 hover:bg-slate-50 rounded-xl border border-slate-100 transition-colors group">
                  <div className={`w-2.5 h-2.5 mt-2 rounded-full mr-4 flex-shrink-0 ${
                    log.type === MeetingType.IEP ? 'bg-red-500' : 
                    log.type === MeetingType.BEHAVIORAL ? 'bg-orange-500' : 'bg-blue-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-bold text-slate-800 truncate">
                                {log.attendees.join(', ')}
                            </p>
                            <div className="flex items-center text-xs text-slate-500 mt-1">
                                <span className="font-medium text-slate-600">{log.type}</span>
                                <span className="mx-2">•</span>
                                <span>{new Date(log.date).toLocaleDateString()}</span>
                                {isLeader && log.createdBy && (
                                    <>
                                        <span className="mx-2">•</span>
                                        <span className="flex items-center text-slate-400">
                                            <UserIcon size={10} className="mr-1" /> {log.createdBy}
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>
                        {log.sentiment === 'Concerned' && (
                            <span className="px-2 py-1 bg-red-100 text-red-700 text-[10px] font-bold uppercase rounded-md flex items-center">
                                <AlertCircle size={10} className="mr-1" /> Concern
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-slate-600 mt-2 line-clamp-1 group-hover:line-clamp-2 transition-all">
                      {log.notes}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
    </div>
  );
};

export default Dashboard;