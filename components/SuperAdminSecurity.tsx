
import React, { useState } from 'react';
import { ShieldAlert, Search, Download, Filter, Eye, Lock, Map, Globe, UserX } from 'lucide-react';

const MOCK_AUDIT_LOGS = [
    { id: '1', action: 'ORG_CREATE', actor: 'System Owner', target: 'Springfield Academy', ip: '192.168.1.1', date: '2023-11-20 14:30:00', status: 'SUCCESS' },
    { id: '2', action: 'USER_LOGIN_FAIL', actor: 'admin@westfield.edu', target: 'Auth System', ip: '45.32.11.2', date: '2023-11-20 12:15:00', status: 'FAILURE' },
    { id: '3', action: 'API_KEY_ROTATE', actor: 'System System', target: 'Gemini Service', ip: 'INTERNAL', date: '2023-11-19 09:00:00', status: 'SUCCESS' },
    { id: '4', action: 'EXPORT_DATA', actor: 'Principal Skinner', target: 'Student Records', ip: '82.11.44.2', date: '2023-11-19 16:45:00', status: 'SUCCESS' },
    { id: '5', action: 'DELETE_LOG', actor: 'Jane Doe', target: 'Meeting Log #442', ip: '82.11.44.2', date: '2023-11-18 10:20:00', status: 'SUCCESS' },
];

const BLOCKED_IPS = [
    { ip: '103.21.244.0', reason: 'Brute Force Attempt', location: 'Unknown', timestamp: '2 mins ago' },
    { ip: '45.22.19.112', reason: 'SQL Injection Scan', location: 'Eastern Europe', timestamp: '15 mins ago' },
    { ip: '185.11.12.1', reason: 'Rate Limit Exceeded', location: 'Asia Pacific', timestamp: '1 hour ago' },
];

const SuperAdminSecurity: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredLogs = MOCK_AUDIT_LOGS.filter(log => 
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) || 
        log.actor.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="animate-fade-in space-y-6">
             <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 flex items-center">
                        <ShieldAlert className="mr-3 text-red-600" /> Security Audit
                    </h1>
                    <p className="text-slate-500">Immutable records of system access and critical actions.</p>
                </div>
                <div className="flex space-x-3">
                    <button className="px-4 py-2 bg-slate-900 text-white rounded-lg font-bold hover:bg-black transition-colors flex items-center shadow-lg">
                        <Lock size={18} className="mr-2" /> Emergency Lockdown
                    </button>
                    <button className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors flex items-center shadow-sm">
                        <Download size={18} className="mr-2" /> Export CSV
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Active Threats */}
                <div className="lg:col-span-1 bg-white p-6 rounded-xl border border-red-200 shadow-sm">
                    <h3 className="text-lg font-bold text-red-800 mb-4 flex items-center">
                        <UserX size={20} className="mr-2" /> Threat Radar
                    </h3>
                    <div className="space-y-3">
                        {BLOCKED_IPS.map((threat, i) => (
                            <div key={i} className="p-3 bg-red-50 border border-red-100 rounded-lg">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="font-mono text-xs font-bold text-slate-700">{threat.ip}</span>
                                    <span className="text-[10px] text-red-500 font-bold">{threat.timestamp}</span>
                                </div>
                                <p className="text-xs text-red-700 font-medium">{threat.reason}</p>
                                <p className="text-[10px] text-slate-500 flex items-center mt-1">
                                    <Globe size={10} className="mr-1" /> {threat.location}
                                </p>
                            </div>
                        ))}
                        <button className="w-full py-2 text-xs font-bold text-slate-500 border border-slate-200 rounded hover:bg-slate-50 mt-2">
                            View All Blocked IPs
                        </button>
                    </div>
                </div>

                {/* Main Audit Log */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
                    <div className="p-4 border-b border-slate-100 flex gap-4 bg-slate-50">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
                            <input 
                                type="text" 
                                placeholder="Search logs by actor, action..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none"
                            />
                        </div>
                        <button className="p-2 bg-white border border-slate-300 rounded-lg text-slate-500 hover:text-slate-800">
                            <Filter size={18} />
                        </button>
                    </div>
                    <div className="overflow-x-auto flex-1">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-white text-slate-500 uppercase font-bold text-xs border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4">Timestamp</th>
                                    <th className="px-6 py-4">Action</th>
                                    <th className="px-6 py-4">Actor</th>
                                    <th className="px-6 py-4">Target</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredLogs.map(log => (
                                    <tr key={log.id} className="hover:bg-slate-50 font-mono text-xs transition-colors">
                                        <td className="px-6 py-4 text-slate-500">{log.date}</td>
                                        <td className="px-6 py-4 font-bold text-slate-700">{log.action}</td>
                                        <td className="px-6 py-4 text-blue-600">{log.actor}</td>
                                        <td className="px-6 py-4 text-slate-600">{log.target}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                log.status === 'SUCCESS' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                                {log.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="text-slate-400 hover:text-indigo-600"><Eye size={14} /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SuperAdminSecurity;
