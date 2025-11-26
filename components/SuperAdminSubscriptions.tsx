
import React, { useState } from 'react';
import { Subscription } from '../types';
import { CreditCard, Download, Search, Filter, CheckCircle2, AlertCircle, Clock, FileText, MoreHorizontal, ArrowUpRight } from 'lucide-react';

const MOCK_SUBSCRIPTIONS: Subscription[] = [
    { id: 'sub-1', orgId: 'org1', orgName: 'Springfield High', plan: 'Enterprise', amount: 5000, billingCycle: 'Annual', nextBillingDate: '2024-09-01', status: 'Active', paymentMethod: 'Invoice' },
    { id: 'sub-2', orgId: 'org2', orgName: 'Westfield College', plan: 'Pro', amount: 250, billingCycle: 'Monthly', nextBillingDate: '2023-12-15', status: 'Past Due', paymentMethod: 'Card' },
    { id: 'sub-3', orgId: 'org3', orgName: 'Oakridge Primary', plan: 'Starter', amount: 99, billingCycle: 'Monthly', nextBillingDate: '2023-12-01', status: 'Active', paymentMethod: 'Card' },
    { id: 'sub-4', orgId: 'org4', orgName: 'St. Mary\'s Academy', plan: 'Pro', amount: 2400, billingCycle: 'Annual', nextBillingDate: '2024-01-10', status: 'Active', paymentMethod: 'Bank Transfer' },
    { id: 'sub-5', orgId: 'org5', orgName: 'Tech City College', plan: 'Enterprise', amount: 6000, billingCycle: 'Annual', nextBillingDate: '2024-03-22', status: 'Trial', paymentMethod: 'Invoice' },
];

const SuperAdminSubscriptions: React.FC = () => {
    const [subscriptions, setSubscriptions] = useState<Subscription[]>(MOCK_SUBSCRIPTIONS);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');

    const filteredSubs = subscriptions.filter(sub => {
        const matchesSearch = sub.orgName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'All' || sub.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const handleStatusChange = (id: string, newStatus: Subscription['status']) => {
        setSubscriptions(prev => prev.map(s => s.id === id ? { ...s, status: newStatus } : s));
    };

    const totalMRR = subscriptions
        .filter(s => s.status === 'Active')
        .reduce((acc, s) => acc + (s.billingCycle === 'Annual' ? s.amount / 12 : s.amount), 0);

    return (
        <div className="animate-fade-in space-y-6">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 flex items-center">
                        <CreditCard className="mr-3 text-emerald-600" /> Subscription Manager
                    </h1>
                    <p className="text-slate-500">Billing, invoicing, and revenue operations.</p>
                </div>
                <div className="text-right">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Estimated MRR</p>
                    <p className="text-3xl font-black text-slate-800">${Math.round(totalMRR).toLocaleString()}</p>
                </div>
            </header>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[600px]">
                {/* Toolbar */}
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <div className="relative flex-1 md:w-80">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
                            <input 
                                type="text" 
                                placeholder="Search organization..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
                            <select 
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="pl-9 pr-8 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white appearance-none cursor-pointer"
                            >
                                <option value="All">All Statuses</option>
                                <option value="Active">Active</option>
                                <option value="Past Due">Past Due</option>
                                <option value="Trial">Trial</option>
                                <option value="Canceled">Canceled</option>
                            </select>
                        </div>
                    </div>
                    <button className="px-4 py-2 bg-slate-900 text-white rounded-lg font-bold text-sm hover:bg-black transition-colors flex items-center shadow-md">
                        <FileText size={16} className="mr-2" /> Create Invoice
                    </button>
                </div>

                {/* Table */}
                <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-white text-slate-500 uppercase font-bold text-xs border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4">Organization</th>
                                <th className="px-6 py-4">Plan Details</th>
                                <th className="px-6 py-4">Billing</th>
                                <th className="px-6 py-4">Next Bill</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredSubs.map((sub) => (
                                <tr key={sub.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <p className="font-bold text-slate-800">{sub.orgName}</p>
                                        <p className="text-xs text-slate-400 font-mono">{sub.id}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold mb-1 ${
                                            sub.plan === 'Enterprise' ? 'bg-purple-100 text-purple-700' :
                                            sub.plan === 'Pro' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                                        }`}>
                                            {sub.plan}
                                        </span>
                                        <div className="text-xs text-slate-500 font-medium">${sub.amount.toLocaleString()} / {sub.billingCycle}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center text-slate-600">
                                            {sub.paymentMethod === 'Card' && <CreditCard size={14} className="mr-2" />}
                                            {sub.paymentMethod === 'Invoice' && <FileText size={14} className="mr-2" />}
                                            {sub.paymentMethod === 'Bank Transfer' && <ArrowUpRight size={14} className="mr-2" />}
                                            {sub.paymentMethod}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">
                                        {new Date(sub.nextBillingDate).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${
                                            sub.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                            sub.status === 'Past Due' ? 'bg-red-50 text-red-700 border-red-100' :
                                            sub.status === 'Trial' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                            'bg-slate-100 text-slate-600 border-slate-200'
                                        }`}>
                                            {sub.status === 'Active' && <CheckCircle2 size={12} className="mr-1.5" />}
                                            {sub.status === 'Past Due' && <AlertCircle size={12} className="mr-1.5" />}
                                            {sub.status === 'Trial' && <Clock size={12} className="mr-1.5" />}
                                            {sub.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg" title="Download Invoice">
                                                <Download size={16} />
                                            </button>
                                            {sub.status === 'Past Due' ? (
                                                <button 
                                                    onClick={() => handleStatusChange(sub.id, 'Active')}
                                                    className="px-3 py-1 bg-emerald-600 text-white text-xs font-bold rounded hover:bg-emerald-700"
                                                >
                                                    Record Pay
                                                </button>
                                            ) : (
                                                <button className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg">
                                                    <MoreHorizontal size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                
                {/* Footer stats */}
                <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between text-xs text-slate-500">
                    <span>Showing {filteredSubs.length} subscriptions</span>
                    <span>Secure Payment Gateway: Connected (Stripe)</span>
                </div>
            </div>
        </div>
    );
};

export default SuperAdminSubscriptions;
