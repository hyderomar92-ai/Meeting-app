
import React, { useState, useEffect } from 'react';
import { Organization } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { ShieldCheck, Lock, Terminal, Activity, TrendingUp, AlertTriangle, Users, DollarSign, Server, Radio, Send, Database, Cloud, HardDrive, AlertOctagon } from 'lucide-react';

interface SuperAdminDashboardProps {
  organizations: Organization[];
}

const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ organizations }) => {
  // Real-time log simulation
  const [systemLogs, setSystemLogs] = useState<string[]>([]);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  useEffect(() => {
      const events = [
          "New login detected: Admin @ Springfield High",
          "Sentinel AI: Risk scan completed for Westfield College",
          "Safeguarding Alert: High priority flag raised (ID: #9921)",
          "Database backup completed successfully",
          "New student roster imported: 450 records",
          "API Rate Limit: 45% capacity used",
          "User 'Jane Doe' generated a behavior report",
          "Webhook delivery successful: Canvas LMS"
      ];

      const interval = setInterval(() => {
          const randomEvent = events[Math.floor(Math.random() * events.length)];
          const timestamp = new Date().toLocaleTimeString();
          setSystemLogs(prev => [`[${timestamp}] ${randomEvent}`, ...prev].slice(0, 8));
      }, 2000);

      return () => clearInterval(interval);
  }, []);

  // Growth Data
  const data = [
    { name: 'Jan', active: 40, revenue: 2400 },
    { name: 'Feb', active: 45, revenue: 3200 },
    { name: 'Mar', active: 55, revenue: 4500 },
    { name: 'Apr', active: 68, revenue: 5100 },
    { name: 'May', active: 80, revenue: 6800 },
    { name: 'Jun', active: 95, revenue: 8400 },
  ];

  // AI Usage Data
  const usageData = [
      { name: 'Mon', tokens: 120000 },
      { name: 'Tue', tokens: 150000 },
      { name: 'Wed', tokens: 180000 },
      { name: 'Thu', tokens: 160000 },
      { name: 'Fri', tokens: 140000 },
      { name: 'Sat', tokens: 50000 },
      { name: 'Sun', tokens: 40000 },
  ];

  const totalUsers = organizations.reduce((acc, org) => acc + org.staffCount + org.studentCount, 0);
  const totalRevenue = organizations.reduce((acc, org) => {
      const base = org.licenseTier === 'Enterprise' ? 5000 : org.licenseTier === 'Pro' ? 2000 : 500;
      return acc + base;
  }, 0);

  const atRiskTenants = organizations.filter(o => o.churnRisk === 'High');

  const handleBroadcast = (e: React.FormEvent) => {
      e.preventDefault();
      if(!broadcastMessage) return;
      setIsBroadcasting(true);
      setTimeout(() => {
          alert(`Broadcast sent to ${organizations.length} organizations.`);
          setBroadcastMessage('');
          setIsBroadcasting(false);
      }, 1000);
  }

  return (
    <div className="animate-fade-in space-y-8">
      
      {/* --- Command Header --- */}
      <div className="bg-slate-900 rounded-2xl p-8 text-white shadow-2xl relative overflow-hidden">
         <div className="absolute top-0 right-0 p-10 opacity-5">
             <ShieldCheck size={200} />
         </div>
         
         <div className="relative z-10">
             <header className="flex justify-between items-start mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center mb-1">
                        <Lock className="mr-3 text-emerald-400" /> Sentinel Command
                    </h1>
                    <p className="text-slate-400">Global Oversight & Threat Monitoring System</p>
                </div>
                <div className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-bold animate-pulse">
                    SYSTEM OPERATIONAL
                </div>
             </header>

             {/* High Level KPI */}
             <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                 <div className="bg-white/5 border border-white/10 p-4 rounded-xl backdrop-blur-sm">
                     <div className="flex justify-between items-start mb-2">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Lives Protected</p>
                        <Users size={16} className="text-slate-500" />
                     </div>
                     <p className="text-3xl font-black text-white">{totalUsers.toLocaleString()}</p>
                     <p className="text-xs text-emerald-400 mt-1 flex items-center">+450 this week</p>
                 </div>
                 <div className="bg-white/5 border border-white/10 p-4 rounded-xl backdrop-blur-sm">
                     <div className="flex justify-between items-start mb-2">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Tenants</p>
                        <Server size={16} className="text-slate-500" />
                     </div>
                     <p className="text-3xl font-black text-indigo-400">{organizations.length}</p>
                     <p className="text-xs text-slate-500 mt-1">100% Uptime</p>
                 </div>
                 <div className="bg-white/5 border border-white/10 p-4 rounded-xl backdrop-blur-sm">
                     <div className="flex justify-between items-start mb-2">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">MRR</p>
                        <DollarSign size={16} className="text-slate-500" />
                     </div>
                     <p className="text-3xl font-black text-white">${totalRevenue.toLocaleString()}</p>
                     <p className="text-xs text-emerald-400 mt-1 flex items-center"><TrendingUp size={10} className="mr-1"/> +12.5% Growth</p>
                 </div>
                 <div className="bg-white/5 border border-white/10 p-4 rounded-xl backdrop-blur-sm">
                     <div className="flex justify-between items-start mb-2">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Global AI Load</p>
                        <Activity size={16} className="text-slate-500" />
                     </div>
                     <p className="text-3xl font-black text-amber-400">42ms</p>
                     <p className="text-xs text-slate-500 mt-1">Avg Latency</p>
                 </div>
             </div>
         </div>
      </div>

      {/* Infrastructure Status Matrix */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg flex items-center justify-between">
              <div className="flex items-center">
                  <Database size={18} className="text-emerald-600 mr-2" />
                  <span className="text-sm font-bold text-emerald-800">Core Database</span>
              </div>
              <span className="text-xs bg-white px-2 py-0.5 rounded text-emerald-600 font-medium border border-emerald-100">Healthy</span>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg flex items-center justify-between">
              <div className="flex items-center">
                  <Activity size={18} className="text-emerald-600 mr-2" />
                  <span className="text-sm font-bold text-emerald-800">AI Gateway</span>
              </div>
              <span className="text-xs bg-white px-2 py-0.5 rounded text-emerald-600 font-medium border border-emerald-100">Healthy</span>
          </div>
          <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg flex items-center justify-between">
              <div className="flex items-center">
                  <Cloud size={18} className="text-amber-600 mr-2" />
                  <span className="text-sm font-bold text-amber-800">Auth Service</span>
              </div>
              <span className="text-xs bg-white px-2 py-0.5 rounded text-amber-600 font-medium border border-amber-100">Degraded</span>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg flex items-center justify-between">
              <div className="flex items-center">
                  <HardDrive size={18} className="text-emerald-600 mr-2" />
                  <span className="text-sm font-bold text-emerald-800">Storage</span>
              </div>
              <span className="text-xs bg-white px-2 py-0.5 rounded text-emerald-600 font-medium border border-emerald-100">Healthy</span>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Growth Chart */}
          <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">Platform Growth</h3>
                    <p className="text-sm text-slate-500">Active users vs Revenue</p>
                  </div>
              </div>
              <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                          <defs>
                              <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                              </linearGradient>
                          </defs>
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                          <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                          <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
                          <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                          <Area type="monotone" dataKey="active" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorActive)" />
                      </AreaChart>
                  </ResponsiveContainer>
              </div>
          </div>

          {/* Real-time System Feed */}
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-sm flex flex-col h-full">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center">
                  <Terminal size={14} className="mr-2 text-green-400" /> Live System Logs
              </h3>
              <div className="flex-1 space-y-3 font-mono text-xs overflow-hidden">
                  {systemLogs.map((log, i) => (
                      <div key={i} className={`truncate border-l-2 pl-3 py-1 ${i === 0 ? 'text-white border-green-500 font-bold' : 'text-slate-500 border-slate-800'}`}>
                          {log}
                      </div>
                  ))}
              </div>
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Global Alerts */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                    <AlertTriangle size={20} className="mr-2 text-amber-500" /> Churn Risk Radar
                </h3>
                <div className="space-y-4">
                    {atRiskTenants.length > 0 ? atRiskTenants.map(tenant => (
                        <div key={tenant.id} className="p-4 bg-red-50 border border-red-100 rounded-lg flex items-center justify-between">
                            <div>
                                <h4 className="text-sm font-bold text-red-800">{tenant.name}</h4>
                                <p className="text-xs text-red-600 mt-1">Usage dropped 45% last 30 days</p>
                            </div>
                            <button className="text-xs bg-white border border-red-200 px-2 py-1 rounded text-red-600 font-medium hover:bg-red-50">Contact</button>
                        </div>
                    )) : (
                        <div className="p-4 bg-green-50 border border-green-100 rounded-lg text-green-800 text-sm text-center">
                            All tenants showing healthy usage.
                        </div>
                    )}
                </div>
            </div>

            {/* Token Usage Mini Chart */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                 <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                    <Activity size={20} className="mr-2 text-indigo-500" /> Global AI Token Usage
                </h3>
                <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={usageData}>
                            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                            <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}/>
                            <Bar dataKey="tokens" fill="#6366f1" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Global Broadcast */}
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-6 rounded-xl shadow-lg text-white flex flex-col">
                <h3 className="text-lg font-bold mb-4 flex items-center">
                    <Radio size={20} className="mr-2" /> System Broadcast
                </h3>
                <p className="text-xs text-indigo-200 mb-4">Send an urgent announcement to all active tenant dashboards.</p>
                <form onSubmit={handleBroadcast} className="flex-1 flex flex-col">
                    <textarea 
                        value={broadcastMessage}
                        onChange={(e) => setBroadcastMessage(e.target.value)}
                        placeholder="Type announcement message..."
                        className="flex-1 w-full bg-white/10 border border-white/20 rounded-lg p-3 text-sm text-white placeholder:text-indigo-300 focus:outline-none focus:ring-2 focus:ring-white/50 resize-none mb-3"
                    />
                    <button 
                        type="submit" 
                        disabled={!broadcastMessage || isBroadcasting}
                        className="w-full py-2 bg-white text-indigo-600 font-bold rounded-lg hover:bg-indigo-50 transition-colors flex items-center justify-center disabled:opacity-50"
                    >
                        <Send size={16} className="mr-2" /> {isBroadcasting ? 'Sending...' : 'Push Broadcast'}
                    </button>
                </form>
            </div>
      </div>

      {/* Live Tenant Monitor Section */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
            <Activity size={20} className="mr-2 text-indigo-600" /> Live Tenant Monitor
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {organizations.map(org => {
                // Mock live data for simulation
                // Stable seed based on name length for visual consistency during re-renders in this demo
                const seed = org.name.length;
                const activeUsers = Math.floor((org.staffCount + org.studentCount) * (0.1 + (seed % 5)/10)); 
                const alerts = (seed % 3 === 0) ? 1 : 0;
                const usagePercent = (org.tokenUsageCurrentPeriod / org.tokenLimit) * 100;

                return (
                    <div key={org.id} className="p-4 border border-slate-200 rounded-lg hover:border-indigo-300 transition-all bg-slate-50/50 hover:shadow-md group cursor-default">
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <h4 className="font-bold text-slate-700 text-sm truncate max-w-[120px]" title={org.name}>{org.name}</h4>
                                <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border ${
                                    org.licenseTier === 'Enterprise' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                                    'bg-slate-100 text-slate-500 border-slate-200'
                                }`}>{org.licenseTier}</span>
                            </div>
                            <div className="flex items-center text-xs font-medium text-emerald-600 bg-white px-2 py-1 rounded-full border border-emerald-100 shadow-sm">
                                <span className="relative flex h-2 w-2 mr-1.5">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                {activeUsers} Active
                            </div>
                        </div>
                        
                        <div className="mb-4">
                            <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1">
                                <span className="flex items-center"><Terminal size={10} className="mr-1"/> AI Load</span>
                                <span>{Math.round(usagePercent)}%</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                                <div 
                                    className={`h-1.5 rounded-full transition-all duration-1000 ${usagePercent > 80 ? 'bg-red-500' : usagePercent > 50 ? 'bg-amber-500' : 'bg-indigo-500'}`} 
                                    style={{width: `${usagePercent}%`}}
                                ></div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-xs border-t border-slate-200 pt-3">
                            {alerts > 0 ? (
                                <div className="flex items-center text-red-600 font-bold bg-red-50 px-2 py-1 rounded border border-red-100 animate-pulse">
                                    <AlertOctagon size={12} className="mr-1" /> Security Alert
                                </div>
                            ) : (
                                <div className="flex items-center text-slate-400 font-medium">
                                    <ShieldCheck size={12} className="mr-1 text-emerald-500" /> Secure
                                </div>
                            )}
                            <span className="text-[10px] text-slate-400 font-mono">ID: {org.id.substring(0,4)}</span>
                        </div>
                    </div>
                )
            })}
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
