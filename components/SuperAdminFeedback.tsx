
import React, { useState } from 'react';
import { FeedbackItem } from '../types';
import { MessageSquare, CheckCircle2, AlertCircle, Lightbulb, Search, Filter, ArrowRight, X } from 'lucide-react';

const MOCK_FEEDBACK: FeedbackItem[] = [
    { id: 'fb-1', user: 'Jane Doe', orgName: 'Springfield High', type: 'Feature', message: 'It would be great to have a dark mode for late night marking.', status: 'New', date: '2023-11-20', priority: 'Low' },
    { id: 'fb-2', user: 'Principal Skinner', orgName: 'Springfield High', type: 'Bug', message: 'Exporting PDF reports fails when the student name has special characters.', status: 'Reviewing', date: '2023-11-19', priority: 'High' },
    { id: 'fb-3', user: 'Admin', orgName: 'Westfield College', type: 'General', message: 'The new AI summary is fantastic, saved us hours this week!', status: 'New', date: '2023-11-18', priority: 'Low' },
    { id: 'fb-4', user: 'Sarah Connor', orgName: 'St. Mary\'s', type: 'Feature', message: 'Can we attach photos to safeguarding incidents directly?', status: 'Planned', date: '2023-11-15', priority: 'Medium' },
];

const SuperAdminFeedback: React.FC = () => {
    const [feedback, setFeedback] = useState<FeedbackItem[]>(MOCK_FEEDBACK);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');

    const filteredItems = feedback.filter(item => {
        const matchesSearch = item.message.toLowerCase().includes(searchTerm.toLowerCase()) || item.orgName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'All' || item.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const handleStatusChange = (id: string, newStatus: FeedbackItem['status']) => {
        setFeedback(prev => prev.map(item => item.id === id ? { ...item, status: newStatus } : item));
    };

    const handleDelete = (id: string) => {
        if(window.confirm('Delete this feedback item?')) {
            setFeedback(prev => prev.filter(item => item.id !== id));
        }
    };

    const renderTypeIcon = (type: string) => {
        switch(type) {
            case 'Bug': return <AlertCircle size={16} className="text-red-500" />;
            case 'Feature': return <Lightbulb size={16} className="text-amber-500" />;
            default: return <MessageSquare size={16} className="text-blue-500" />;
        }
    };

    return (
        <div className="animate-fade-in space-y-6">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 flex items-center">
                        <MessageSquare className="mr-3 text-indigo-600" /> Product Feedback
                    </h1>
                    <p className="text-slate-500">Triage user requests and bugs from across the ecosystem.</p>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div><p className="text-xs font-bold text-slate-400 uppercase">Open Bugs</p><p className="text-2xl font-bold text-red-600">{feedback.filter(f => f.type === 'Bug' && f.status !== 'Shipped').length}</p></div>
                    <div className="p-3 bg-red-50 rounded-lg"><AlertCircle className="text-red-500" /></div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div><p className="text-xs font-bold text-slate-400 uppercase">Feature Requests</p><p className="text-2xl font-bold text-amber-500">{feedback.filter(f => f.type === 'Feature').length}</p></div>
                    <div className="p-3 bg-amber-50 rounded-lg"><Lightbulb className="text-amber-500" /></div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div><p className="text-xs font-bold text-slate-400 uppercase">Planned Items</p><p className="text-2xl font-bold text-indigo-600">{feedback.filter(f => f.status === 'Planned').length}</p></div>
                    <div className="p-3 bg-indigo-50 rounded-lg"><ArrowRight className="text-indigo-500" /></div>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                            type="text" 
                            placeholder="Search feedback..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>
                    <select 
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none bg-white"
                    >
                        <option value="All">All Status</option>
                        <option value="New">New</option>
                        <option value="Reviewing">Reviewing</option>
                        <option value="Planned">Planned</option>
                        <option value="Shipped">Shipped</option>
                    </select>
                </div>

                <div className="divide-y divide-slate-100">
                    {filteredItems.map(item => (
                        <div key={item.id} className="p-4 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-start gap-4">
                            <div className="mt-1">
                                {renderTypeIcon(item.type)}
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-start">
                                    <h4 className="text-sm font-bold text-slate-800">{item.user} <span className="font-normal text-slate-500">from {item.orgName}</span></h4>
                                    <span className="text-xs text-slate-400">{item.date}</span>
                                </div>
                                <p className="text-sm text-slate-600 mt-1 mb-2">{item.message}</p>
                                <div className="flex items-center gap-2">
                                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                                        item.priority === 'High' ? 'bg-red-100 text-red-700' : 
                                        item.priority === 'Medium' ? 'bg-orange-100 text-orange-700' : 'bg-blue-50 text-blue-700'
                                    }`}>
                                        {item.priority} Priority
                                    </span>
                                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                                        {item.type}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 md:self-center">
                                <select 
                                    value={item.status}
                                    onChange={(e) => handleStatusChange(item.id, e.target.value as any)}
                                    className={`text-xs font-bold py-1 px-2 rounded border outline-none cursor-pointer ${
                                        item.status === 'New' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                                        item.status === 'Planned' ? 'bg-purple-50 border-purple-200 text-purple-700' :
                                        item.status === 'Shipped' ? 'bg-green-50 border-green-200 text-green-700' :
                                        'bg-slate-50 border-slate-200 text-slate-700'
                                    }`}
                                >
                                    <option value="New">New</option>
                                    <option value="Reviewing">Reviewing</option>
                                    <option value="Planned">Planned</option>
                                    <option value="Shipped">Shipped</option>
                                </select>
                                <button onClick={() => handleDelete(item.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors">
                                    <X size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                    {filteredItems.length === 0 && (
                        <div className="p-8 text-center text-slate-400 text-sm">No feedback found.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SuperAdminFeedback;
