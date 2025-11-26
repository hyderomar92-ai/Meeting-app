
import React, { useState } from 'react';
import { Integration } from '../types';
import { Boxes, Search, ToggleRight, ToggleLeft, Settings, AlertTriangle, CheckCircle2, RefreshCw, Shield, Database, Users, Lock } from 'lucide-react';

const MOCK_INTEGRATIONS: Integration[] = [
    { id: 'int-1', name: 'Google Workspace', category: 'Auth', status: 'Active', connectedTenants: 142, icon: 'Users', description: 'SSO and Classroom roster sync.' },
    { id: 'int-2', name: 'Microsoft 365', category: 'Auth', status: 'Active', connectedTenants: 89, icon: 'Lock', description: 'Entra ID login and Teams integration.' },
    { id: 'int-3', name: 'SIMS (Capita)', category: 'MIS', status: 'Maintenance', connectedTenants: 45, icon: 'Database', description: 'Legacy MIS data write-back support.' },
    { id: 'int-4', name: 'Arbor', category: 'MIS', status: 'Active', connectedTenants: 67, icon: 'Database', description: 'Real-time attendance and behavior sync.' },
    { id: 'int-5', name: 'CPOMS', category: 'Safeguarding', status: 'Beta', connectedTenants: 12, icon: 'Shield', description: 'External safeguarding incident import.' },
    { id: 'int-6', name: 'Wonde', category: 'MIS', status: 'Active', connectedTenants: 210, icon: 'RefreshCw', description: 'Universal data API gateway.' },
];

const SuperAdminIntegrations: React.FC = () => {
    const [integrations, setIntegrations] = useState<Integration[]>(MOCK_INTEGRATIONS);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredIntegrations = integrations.filter(int => 
        int.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        int.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const toggleStatus = (id: string) => {
        setIntegrations(prev => prev.map(i => {
            if (i.id === id) {
                return { ...i, status: i.status === 'Disabled' ? 'Active' : 'Disabled' };
            }
            return i;
        }));
    };

    const renderIcon = (name: string) => {
        switch(name) {
            case 'Users': return <Users size={24} className="text-blue-500" />;
            case 'Lock': return <Lock size={24} className="text-orange-500" />;
            case 'Database': return <Database size={24} className="text-indigo-500" />;
            case 'Shield': return <Shield size={24} className="text-red-500" />;
            case 'RefreshCw': return <RefreshCw size={24} className="text-emerald-500" />;
            default: return <Boxes size={24} className="text-slate-500" />;
        }
    };

    return (
        <div className="animate-fade-in space-y-6">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 flex items-center">
                        <Boxes className="mr-3 text-indigo-600" /> Integration Hub
                    </h1>
                    <p className="text-slate-500">Manage the global marketplace of third-party connectors.</p>
                </div>
                <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-lg shadow-indigo-200 transition-all">
                    Add New Integration
                </button>
            </header>

            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Find connectors..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                />
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredIntegrations.map((integration) => (
                    <div key={integration.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col relative overflow-hidden">
                        {/* Status Ribbon */}
                        {integration.status === 'Maintenance' && (
                            <div className="absolute top-0 right-0 bg-amber-100 text-amber-800 text-[10px] font-bold px-3 py-1 rounded-bl-lg flex items-center">
                                <AlertTriangle size={10} className="mr-1" /> Maintenance
                            </div>
                        )}
                        {integration.status === 'Beta' && (
                            <div className="absolute top-0 right-0 bg-indigo-100 text-indigo-800 text-[10px] font-bold px-3 py-1 rounded-bl-lg">
                                BETA
                            </div>
                        )}

                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                {renderIcon(integration.icon)}
                            </div>
                            <button 
                                onClick={() => toggleStatus(integration.id)}
                                className={`transition-colors ${integration.status === 'Disabled' ? 'text-slate-300 hover:text-slate-500' : 'text-green-500 hover:text-green-600'}`}
                            >
                                {integration.status === 'Disabled' ? <ToggleLeft size={32} /> : <ToggleRight size={32} />}
                            </button>
                        </div>

                        <h3 className="text-lg font-bold text-slate-800 mb-1">{integration.name}</h3>
                        <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-500 text-[10px] font-bold uppercase w-fit mb-3">
                            {integration.category}
                        </span>
                        
                        <p className="text-sm text-slate-500 mb-6 flex-1 leading-relaxed">
                            {integration.description}
                        </p>

                        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                            <div className="flex items-center text-xs text-slate-400 font-medium">
                                <CheckCircle2 size={14} className="mr-1.5 text-slate-300" />
                                {integration.connectedTenants} Active Installs
                            </div>
                            <button className="text-slate-400 hover:text-indigo-600 transition-colors p-2 rounded-lg hover:bg-indigo-50">
                                <Settings size={18} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SuperAdminIntegrations;
