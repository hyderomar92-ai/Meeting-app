
import React, { useMemo, useState, useEffect } from 'react';
import { MeetingLog, MeetingType, UserProfile, SafeguardingCase, BehaviourEntry, RiskAlert, ViewState } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Users, Calendar, ClipboardList, AlertCircle, User as UserIcon, Shield, ChevronRight, TrendingUp, TrendingDown, Star, BarChart2, Activity, Zap, BrainCircuit, Loader2, ArrowRight, Plus, Search, FileText, CheckSquare, Clock, Siren } from 'lucide-react';
import { scanForRisks } from '../services/geminiService';
import { useLanguage } from '../contexts/LanguageContext';

interface DashboardProps {
  logs: MeetingLog[];
  safeguardingCases: SafeguardingCase[];
  behaviourEntries: BehaviourEntry[];
  onNavigate: (view: ViewState, studentName?: string) => void;
  currentUser: UserProfile;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
const RISK_COLORS = { Low: '#4ade80', Medium: '#facc15', High: '#fb923c', Critical: '#f87171' };

const Dashboard: React.FC<DashboardProps> = ({ logs, safeguardingCases, behaviourEntries, onNavigate, currentUser }) => {
  const { t, language } = useLanguage();
  const isLeader = ['Head of Year', 'DSL', 'Admin', 'Super Admin'].includes(currentUser.role);

  // Sentinel State
  const [isScanning, setIsScanning] = useState(false);
  const [riskAlerts, setRiskAlerts] = useState<RiskAlert[]>([]);
  const [hasScanned, setHasScanned] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [lastScanTime, setLastScanTime] = useState<string | null>(null);

  // --- Scan Schedule Logic ---
  const getNextScheduledScan = () => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMin = now.getMinutes();
      const timeVal = currentHour + currentMin / 60;

      if (timeVal < 8) return "08:00 (Registration)";
      if (timeVal < 10.5) return "10:30 (Morning Break)";
      if (timeVal < 12.5) return "12:30 (Lunch)";
      if (timeVal < 15) return "15:00 (Dismissal)";
      return "08:00 (Tomorrow)";
  };

  const handleRunSentinel = async (auto = false) => {
      setIsScanning(true);
      setScanError(null);
      try {
          const results = await scanForRisks(logs, behaviourEntries, language);
          setRiskAlerts(results);
          setHasScanned(true);
          setLastScanTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      } catch (e) {
          console.error(e);
          if (!auto) setScanError("Sentinel scan failed to complete. Please check your connection and try again.");
      } finally {
          setIsScanning(false);
      }
  };

  // Auto-run Sentinel for Leaders on mount
  useEffect(() => {
      if (isLeader && !hasScanned) {
          handleRunSentinel(true);
      }
  }, [isLeader]);

  // --- Common Stats ---
  const totalMeetings = logs.length;
  
  // My Pending Actions
  const myPendingActions = useMemo(() => {
      const actions: {id: string, task: string, date: string, student: string}[] = [];
      logs.forEach(l => {
          if (l.createdBy === currentUser.name || isLeader) {
              l.actionItems?.forEach(item => {
                  if (item.status === 'Pending') {
                      actions.push({
                          id: item.id,
                          task: item.task,
                          date: l.date,
                          student: l.attendees[0]
                      });
                  }
              });
          }
      });
      return actions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
  }, [logs, currentUser, isLeader]);

  const pendingActionsCount = logs.reduce((acc, log) => {
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
  const typeCount = logs.reduce((acc, log) => {
    acc[log.type] = (acc[log.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.keys(typeCount).map(type => ({
    name: type,
    value: typeCount[type]
  }));

  const riskDistribution = useMemo(() => {
    const counts = { Low: 0, Medium: 0, High: 0, Critical: 0 };
    safeguardingCases.forEach(c => {
      const risk = c.generatedReport.riskLevel;
      if (counts[risk] !== undefined) counts[risk]++;
    });
    return Object.keys(counts).map(key => ({ name: key, count: counts[key as keyof typeof counts] }));
  }, [safeguardingCases]);

  const staffActivity = useMemo(() => {
    const counts: Record<string, number> = {};
    logs.forEach(l => {
        if(l.createdBy) counts[l.createdBy] = (counts[l.createdBy] || 0) + 1;
    });
    return Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }));
  }, [logs]);

  const behaviourTrendData = useMemo(() => {
    const data = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        
        const entriesForDay = behaviourEntries.filter(e => e.date.startsWith(dateStr));
        const positive = entriesForDay.filter(e => e.type === 'POSITIVE').reduce((acc, e) => acc + e.points, 0);
        const negative = entriesForDay.filter(e => e.type === 'NEGATIVE').reduce((acc, e) => acc + Math.abs(e.points), 0);
        
        data.push({
            name: d.toLocaleDateString(language === 'ar' ? 'ar-QA' : 'en-US', { month: 'short', day: 'numeric' }),
            Positive: positive,
            Negative: negative
        });
    }
    return data;
  }, [behaviourEntries, language]);

  const myLogs = logs.filter(l => l.createdBy === currentUser.name);
  const logsToDisplay = isLeader ? logs : (myLogs.length > 0 ? myLogs : logs);
  const recentLogs = [...logsToDisplay].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

  const highPriorityAlerts = riskAlerts.filter(a => a.riskScore >= 75);

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* PROMINENT CRITICAL ALERT BANNER */}
      {highPriorityAlerts.length > 0 && (
          <div className="bg-red-600 rounded-xl shadow-lg shadow-red-200 p-4 text-white flex flex-col sm:flex-row items-center justify-between animate-pulse-subtle border-2 border-red-500">
              <div className="flex items-center mb-3 sm:mb-0">
                  <div className="p-3 bg-white/20 rounded-full mr-4">
                      <Siren size={32} className="text-white animate-bounce" />
                  </div>
                  <div>
                      <h2 className="text-xl font-black uppercase tracking-wider">Critical Risk Detected</h2>
                      <p className="text-red-100 font-medium">{highPriorityAlerts.length} student(s) showing immediate high-risk patterns.</p>
                  </div>
              </div>
              <button 
                  onClick={() => {
                      const element = document.getElementById('sentinel-results');
                      element?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-6 py-2 bg-white text-red-600 font-bold rounded-lg hover:bg-red-50 transition-colors shadow-sm"
              >
                  Review Alerts
              </button>
          </div>
      )}

      <header className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
           <div className="flex items-center space-x-2 text-slate-400 text-sm mb-1 font-medium uppercase tracking-wide">
             <span>{new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
           </div>
           <h1 className="text-3xl font-bold text-slate-800">
             {isLeader ? 'Executive Dashboard' : t('dashboard.title')}
           </h1>
           <p className="text-slate-500 mt-1">
             {isLeader 
                ? `Overview for ${currentUser.role} • ${currentUser.name}`
                : `${t('dashboard.welcome')}, ${currentUser.name}.`
             }
           </p>
        </div>
        
        {/* Quick Actions Dock */}
        <div className="flex space-x-2 bg-white p-1.5 rounded-xl shadow-sm border border-slate-200">
            <button 
                onClick={() => onNavigate('NEW_LOG')}
                className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
            >
                <Plus size={16} />
                <span className="text-sm">Log Entry</span>
            </button>
            <button 
                onClick={() => onNavigate('STUDENTS_DIRECTORY')}
                className="p-2 text-slate-500 hover:bg-slate-100 hover:text-indigo-600 rounded-lg transition-colors"
                title="Find Student"
            >
                <Search size={20} />
            </button>
            <button 
                onClick={() => onNavigate('REPORTS')}
                className="p-2 text-slate-500 hover:bg-slate-100 hover:text-indigo-600 rounded-lg transition-colors"
                title="Generate Report"
            >
                <FileText size={20} />
            </button>
        </div>
      </header>

      {/* --- PREDICTIVE SAFEGUARDING SENTINEL (Leadership Only) --- */}
      {isLeader && (
        <div className="bg-slate-900 rounded-xl overflow-hidden shadow-lg border border-slate-800 mb-8 text-white relative">
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                <BrainCircuit size={120} />
            </div>
            <div className="p-6 relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <div>
                        <div className="flex items-center space-x-3 mb-2">
                            <Zap className="text-indigo-400" size={24} />
                            <h2 className="text-xl font-bold text-white tracking-wide">Predictive Safeguarding Sentinel</h2>
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider flex items-center">
                                <Activity size={10} className="mr-1" /> Auto-Pilot Active
                            </span>
                        </div>
                        <p className="text-slate-400 text-sm">
                            Real-time analysis of behavioral patterns and risk indicators.
                        </p>
                    </div>
                    
                    <div className="flex items-center space-x-4 bg-white/5 p-2 rounded-lg border border-white/10">
                        <div className="text-right px-2">
                            <p className="text-[10px] text-slate-400 uppercase font-bold">Last Scan</p>
                            <p className="text-sm font-mono text-white">{lastScanTime || 'Pending...'}</p>
                        </div>
                        <div className="h-8 w-px bg-white/10"></div>
                        <div className="text-right px-2">
                            <p className="text-[10px] text-slate-400 uppercase font-bold">Next Scan</p>
                            <p className="text-sm font-mono text-indigo-300">{getNextScheduledScan()}</p>
                        </div>
                        <button 
                            onClick={() => handleRunSentinel(false)}
                            disabled={isScanning}
                            className={`ml-2 p-2 rounded-lg transition-colors ${isScanning ? 'bg-indigo-900 text-indigo-400' : 'bg-indigo-600 hover:bg-indigo-500 text-white'}`}
                            title="Run Manual Scan"
                        >
                            {isScanning ? <Loader2 size={18} className="animate-spin" /> : <Clock size={18} />}
                        </button>
                    </div>
                </div>

                {scanError && (
                    <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-3 rounded-lg flex items-center mb-4">
                        <AlertCircle size={18} className="mr-2 text-red-400" />
                        <span className="text-sm font-medium">{scanError}</span>
                    </div>
                )}

                {hasScanned && riskAlerts.length === 0 && !scanError && (
                    <div className="bg-emerald-900/20 rounded-lg p-4 border border-emerald-500/30 flex items-center text-emerald-400">
                        <Shield size={20} className="mr-3" />
                        <span className="font-medium">System Clear. No elevated risk patterns detected in the last 24h.</span>
                    </div>
                )}

                <div id="sentinel-results">
                    {hasScanned && riskAlerts.length > 0 && !scanError && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 animate-slide-up">
                            {riskAlerts.map((alert, idx) => (
                                <div key={idx} className={`bg-slate-800 rounded-lg p-4 border transition-colors ${alert.riskScore > 75 ? 'border-red-500/60 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'border-slate-700'}`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-lg text-white">{alert.studentName}</h3>
                                        <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                                            alert.riskScore > 75 ? 'bg-red-500 text-white' : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                                        }`}>
                                            Risk Score: {alert.riskScore}%
                                        </span>
                                    </div>
                                    <div className="mb-2">
                                        <p className="text-xs text-indigo-300 font-bold uppercase tracking-wider mb-1">Pattern Detected</p>
                                        <p className="text-sm text-slate-200 font-medium flex items-start">
                                            <AlertCircle size={14} className="mr-2 mt-0.5 text-red-400 flex-shrink-0" />
                                            {alert.riskFactor}
                                        </p>
                                        <p className="text-xs text-slate-400 ml-6 mt-1">{alert.details}</p>
                                    </div>
                                    <div className="mt-3 pt-3 border-t border-slate-700/50">
                                        <p className="text-xs text-indigo-300 font-bold uppercase tracking-wider mb-1">AI Recommendation</p>
                                        <div className="flex justify-between items-end">
                                            <p className="text-sm text-green-400">{alert.suggestedIntervention}</p>
                                            <button 
                                                onClick={() => onNavigate('STUDENT_PROFILE', alert.studentName)}
                                                className="text-xs bg-slate-700 hover:bg-slate-600 text-white px-2 py-1 rounded ml-2 whitespace-nowrap transition-colors"
                                            >
                                                View Profile
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}

      {/* Critical Risks Watchlist (Manual/Existing Cases) */}
      {isLeader && activeHighRiskCount > 0 && (
        <div className="bg-red-50 rounded-xl border border-red-200 overflow-hidden mb-8 animate-fade-in shadow-sm">
            <div className="p-4 bg-red-100/50 border-b border-red-200 flex justify-between items-center">
                <div className="flex items-center space-x-2 text-red-800">
                    <Shield size={20} className="text-red-600" />
                    <h3 className="font-bold">Active High-Risk Cases ({activeHighRiskCount})</h3>
                </div>
                <button 
                  onClick={() => onNavigate('SAFEGUARDING')} 
                  className="text-xs font-bold text-red-700 hover:text-red-900 flex items-center bg-white/60 hover:bg-white px-3 py-1.5 rounded-lg transition-colors border border-red-100"
                >
                    View All Cases <ArrowRight size={14} className="ml-1" />
                </button>
            </div>
            <div className="divide-y divide-red-100/50">
                {criticalCases.map(c => (
                    <div 
                      key={c.id} 
                      className="p-4 hover:bg-red-100/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between cursor-pointer group" 
                      onClick={() => onNavigate('SAFEGUARDING', c.studentName)}
                    >
                        <div className="flex items-center space-x-4 mb-2 sm:mb-0">
                             <div className="w-10 h-10 rounded-full bg-white border-2 border-red-100 flex items-center justify-center text-red-600 font-bold shadow-sm group-hover:border-red-200">
                                {c.studentName.charAt(0)}
                             </div>
                             <div>
                                <p className="font-bold text-slate-800 text-sm">{c.studentName}</p>
                                <div className="flex items-center text-xs text-red-600/80 font-medium mt-0.5">
                                   <span>{c.incidentType}</span>
                                   <span className="mx-2">•</span>
                                   <span>{new Date(c.date).toLocaleDateString()}</span>
                                </div>
                             </div>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto pl-14 sm:pl-0">
                             <p className="text-xs text-slate-500 mr-4 hidden sm:block line-clamp-1 max-w-[250px] italic">
                               {c.generatedReport.dslSummary}
                             </p>
                             <div className="flex items-center">
                                <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full border shadow-sm ${
                                  c.generatedReport.riskLevel === 'Critical' 
                                    ? 'bg-red-500 text-white border-red-600' 
                                    : 'bg-orange-100 text-orange-700 border-orange-200'
                                }`}>
                                    {c.generatedReport.riskLevel} Risk
                                </span>
                                <ChevronRight size={16} className="text-slate-300 ml-2 group-hover:text-red-400 transition-colors" />
                             </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      )}

      {/* --- KPI GRID --- */}
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
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Safeguarding</p>
                    <p className="text-2xl font-black text-slate-800">{activeCases.length}</p>
                    {activeHighRiskCount > 0 && <p className="text-xs text-red-500 font-medium">{activeHighRiskCount} Critical</p>}
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
                    <p className="text-2xl font-black text-slate-800">{pendingActionsCount}</p>
                </div>
                <div className="p-3 bg-amber-50 text-amber-600 rounded-xl group-hover:bg-amber-600 group-hover:text-white transition-colors">
                    <ClipboardList size={24} />
                </div>
            </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Charts or Tasks */}
          <div className="lg:col-span-2 space-y-6">
              {isLeader ? (
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
              ) : (
                 <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-full">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                        <CheckSquare size={18} className="mr-2 text-amber-500" />
                        My Pending Tasks
                    </h3>
                    <div className="space-y-3">
                        {myPendingActions.length === 0 ? (
                            <div className="text-center py-8 text-slate-400 italic">
                                No pending actions. Great job!
                            </div>
                        ) : (
                            myPendingActions.map(action => (
                                <div key={action.id} className="flex items-start p-3 bg-slate-50 rounded-lg border border-slate-100 hover:border-amber-200 transition-colors cursor-pointer" onClick={() => onNavigate('STUDENT_PROFILE', action.student)}>
                                    <div className="mt-0.5 mr-3">
                                        <div className="w-4 h-4 rounded border-2 border-slate-300 hover:border-amber-500 cursor-pointer"></div>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm text-slate-700 font-medium">{action.task}</p>
                                        <div className="flex items-center mt-1 text-xs text-slate-400">
                                            <UserIcon size={10} className="mr-1" /> {action.student}
                                            <span className="mx-1">•</span>
                                            <span className="text-amber-600 font-medium">Due soon</span>
                                        </div>
                                    </div>
                                    <ChevronRight size={16} className="text-slate-300" />
                                </div>
                            ))
                        )}
                    </div>
                 </div>
              )}

              {/* Behaviour Trends (New Chart) */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
                        <TrendingUp size={18} className="mr-2 text-indigo-500" />
                        Behaviour Trends (30 Days)
                    </h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={behaviourTrendData}>
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
                                <Bar dataKey="Positive" fill="#4ade80" radius={[4, 4, 0, 0]} barSize={8} name="Merits" />
                                <Bar dataKey="Negative" fill="#f87171" radius={[4, 4, 0, 0]} barSize={8} name="Sanctions" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
              </div>

              {/* Recent Logs */}
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

          {/* Right Column: Sidebar Stats */}
          <div className="lg:col-span-1 space-y-6">
                 {isLeader && (
                     <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                         <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
                            <BarChart2 size={18} className="mr-2 text-blue-500" />
                            Staff Activity
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
                 )}

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
      </div>
    </div>
  );
};

export default Dashboard;
