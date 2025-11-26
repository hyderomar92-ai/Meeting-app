
import React, { useState } from 'react';
import { Organization } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { BrainCircuit, DollarSign, Zap, Server, AlertTriangle, Sliders, Lock, Power, CheckCircle2 } from 'lucide-react';

interface SuperAdminAIMonitorProps {
  organizations: Organization[];
}

const SuperAdminAIMonitor: React.FC<SuperAdminAIMonitorProps> = ({ organizations }) => {
    const [activeModel, setActiveModel] = useState('gemini-2.5-flash');
    const [temperature, setTemperature] = useState(0.7);
    const [globalBudget, setGlobalBudget] = useState(1000);

    // Mock Data for the charts
    const costTrend = [
        { day: 'Mon', cost: 45 },
        { day: 'Tue', cost: 52 },
        { day: 'Wed', cost: 49 },
        { day: 'Thu', cost: 68 },
        { day: 'Fri', cost: 60 },
        { day: 'Sat', cost: 20 },
        { day: 'Sun', cost: 15 },
    ];

    const modelUsage = [
        { name: 'Gemini 2.5 Flash', requests: 45000 },
        { name: 'Gemini Pro', requests: 12000 },
        { name: 'Embedding', requests: 8000 },
    ];

    const handleSaveConfig = () => {
        alert("Global AI Configuration Updated");
    };

    return (
        <div className="animate-fade-in space-y-6">
            <header>
                <h1 className="text-3xl font-bold text-slate-800 flex items-center">
                    <BrainCircuit className="mr-3 text-indigo-600" /> Sentinel Cortex
                </h1>
                <p className="text-slate-500">AI Model Performance, Token Usage & Cost Analysis.</p>
            </header>

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Est. Cost (MTD)</p>
                        <DollarSign size={16} className="text-emerald-500" />
                    </div>
                    <p className="text-2xl font-black text-slate-800">$342.50</p>
                    <p className="text-xs text-slate-500 mt-1">Projected: $500.00</p>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Tokens</p>
                        <Zap size={16} className="text-amber-500" />
                    </div>
                    <p className="text-2xl font-black text-slate-800">45.2M</p>
                    <p className="text-xs text-slate-500 mt-1">Last 30 days</p>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Avg Latency</p>
                        <ActivityIcon />
                    </div>
                    <p className="text-2xl font-black text-slate-800">1.2s</p>
                    <p className="text-xs text-green-500 mt-1">-0.3s vs last week</p>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                     <div className="flex justify-between items-start mb-2">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Model Status</p>
                        <Server size={16} className="text-indigo-500" />
                    </div>
                    <p className="text-lg font-bold text-emerald-600">Healthy</p>
                    <p className="text-xs text-slate-500 mt-1">Gemini 2.5 Flash</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Global Model Config */}
                <div className="lg:col-span-1 bg-slate-900 text-white p-6 rounded-xl shadow-lg border border-slate-800">
                    <h3 className="text-lg font-bold mb-6 flex items-center">
                        <Sliders size={20} className="mr-2 text-indigo-400" /> Global Model Config
                    </h3>
                    
                    <div className="space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Active Base Model</label>
                            <div className="space-y-2">
                                <button onClick={() => setActiveModel('gemini-2.5-flash')} className={`w-full text-left px-4 py-3 rounded-lg border flex justify-between items-center transition-all ${activeModel === 'gemini-2.5-flash' ? 'bg-indigo-600 border-indigo-500 shadow-md' : 'bg-slate-800 border-slate-700 hover:bg-slate-700'}`}>
                                    <span className="font-bold text-sm">Gemini 2.5 Flash</span>
                                    {activeModel === 'gemini-2.5-flash' && <CheckCircle2 size={16} />}
                                </button>
                                <button onClick={() => setActiveModel('gemini-pro')} className={`w-full text-left px-4 py-3 rounded-lg border flex justify-between items-center transition-all ${activeModel === 'gemini-pro' ? 'bg-indigo-600 border-indigo-500 shadow-md' : 'bg-slate-800 border-slate-700 hover:bg-slate-700'}`}>
                                    <span className="font-bold text-sm">Gemini 3.0 Pro</span>
                                    {activeModel === 'gemini-pro' && <CheckCircle2 size={16} />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2 flex justify-between">
                                <span>Temperature (Creativity)</span>
                                <span>{temperature}</span>
                            </label>
                            <input 
                                type="range" 
                                min="0" max="1" step="0.1" 
                                value={temperature}
                                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Global Monthly Spend Cap ($)</label>
                            <div className="relative">
                                <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input 
                                    type="number" 
                                    value={globalBudget} 
                                    onChange={(e) => setGlobalBudget(parseInt(e.target.value))}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 pl-8 pr-4 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                        </div>

                        <button onClick={handleSaveConfig} className="w-full py-2 bg-white text-slate-900 font-bold rounded-lg hover:bg-indigo-50 transition-colors">
                            Apply Global Changes
                        </button>
                    </div>
                </div>

                {/* Cost Charts */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Daily AI Cost Trend</h3>
                        <div className="h-48">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={costTrend}>
                                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
                                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                                    <YAxis 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{fontSize: 12, fill: '#94a3b8'}} 
                                        tickFormatter={(value) => `$${value}`} 
                                    />
                                    <Tooltip />
                                    <Line type="monotone" dataKey="cost" stroke="#10b981" strokeWidth={3} dot={{r: 4}} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Requests by Model</h3>
                        <div className="h-48">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={modelUsage} layout="vertical">
                                    <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="#f1f5f9" />
                                    <XAxis type="number" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                                    <YAxis type="category" dataKey="name" width={120} axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 600, fill: '#475569'}} />
                                    <Tooltip />
                                    <Bar dataKey="requests" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={24} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tenant Usage Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-100">
                    <h3 className="font-bold text-slate-700">Token Usage by Tenant</h3>
                </div>
                <table className="w-full text-left text-sm">
                    <thead className="bg-white text-slate-500 uppercase font-bold text-xs border-b border-slate-100">
                        <tr>
                            <th className="px-6 py-4">Organization</th>
                            <th className="px-6 py-4">Tier</th>
                            <th className="px-6 py-4">Tokens Used</th>
                            <th className="px-6 py-4">Limit</th>
                            <th className="px-6 py-4">Est. Cost</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {organizations.map(org => {
                            // Mocking usage data for display
                            const usage = Math.floor(Math.random() * 800000);
                            const percent = (usage / 1000000) * 100;
                            return (
                                <tr key={org.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 font-bold text-slate-700">{org.name}</td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 bg-slate-100 rounded text-xs font-bold text-slate-600">{org.licenseTier}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center">
                                            <span className="w-16 font-mono text-xs">{usage.toLocaleString()}</span>
                                            <div className="w-24 h-1.5 bg-slate-100 rounded-full ml-3 overflow-hidden">
                                                <div className={`h-full rounded-full ${percent > 80 ? 'bg-red-500' : 'bg-indigo-500'}`} style={{width: `${percent}%`}}></div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500 font-mono text-xs">1,000,000</td>
                                    <td className="px-6 py-4 font-mono text-slate-700">${(usage * 0.00001).toFixed(2)}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const ActivityIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
)

export default SuperAdminAIMonitor;
