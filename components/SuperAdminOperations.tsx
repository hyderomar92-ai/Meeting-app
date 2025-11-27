
import React, { useState } from 'react';
import { UserProfile, SystemAnnouncement } from '../types';
import { User, Search, Unlock, KeyRound, Link, Power, MessageSquare, Plus, Trash2, Tag, AlertTriangle, Bell, CheckCircle2, X } from 'lucide-react';
import SuperAdminUserManagement from './SuperAdminUserManagement';

interface SuperAdminOperationsProps {
  allUsers: UserProfile[];
  onUpdateUsers: (users: UserProfile[]) => void;
}

const DEFAULT_INCIDENT_TYPES = ['Bullying', 'Physical Abuse', 'Sexual Harassment', 'Online Safety', 'Substance Misuse', 'Neglect', 'Radicalization'];
const DEFAULT_BEHAVIOR_TYPES = ['Disruption', 'Homework', 'Lateness', 'Uniform', 'Equipment', 'Defiance', 'Truancy'];

const SuperAdminOperations: React.FC<SuperAdminOperationsProps> = ({ allUsers, onUpdateUsers }) => {
  const [activeTab, setActiveTab] = useState<'SUPPORT' | 'MASTER_DATA' | 'COMMUNICATION'>('SUPPORT');
  
  // MASTER DATA STATE
  const [incidentTypes, setIncidentTypes] = useState(DEFAULT_INCIDENT_TYPES);
  const [behaviorTypes, setBehaviorTypes] = useState(DEFAULT_BEHAVIOR_TYPES);
  const [newIncident, setNewIncident] = useState('');
  const [newBehavior, setNewBehavior] = useState('');

  // COMMUNICATION STATE
  const [announcements, setAnnouncements] = useState<SystemAnnouncement[]>([
      { id: '1', message: 'Scheduled Maintenance: Sunday 2am - 4am UTC', type: 'Warning', active: true, expiresAt: '2023-12-01' }
  ]);
  const [newAnnouncementMsg, setNewAnnouncementMsg] = useState('');
  const [newAnnouncementType, setNewAnnouncementType] = useState<'Info'|'Warning'|'Critical'>('Info');

  // HANDLERS
  const handleAddTag = (type: 'INCIDENT' | 'BEHAVIOR') => {
      if (type === 'INCIDENT' && newIncident.trim()) {
          setIncidentTypes([...incidentTypes, newIncident.trim()]);
          setNewIncident('');
      } else if (type === 'BEHAVIOR' && newBehavior.trim()) {
          setBehaviorTypes([...behaviorTypes, newBehavior.trim()]);
          setNewBehavior('');
      }
  };

  const handleRemoveTag = (type: 'INCIDENT' | 'BEHAVIOR', tag: string) => {
      if (type === 'INCIDENT') setIncidentTypes(incidentTypes.filter(t => t !== tag));
      else setBehaviorTypes(behaviorTypes.filter(t => t !== tag));
  };

  const handleCreateAnnouncement = (e: React.FormEvent) => {
      e.preventDefault();
      if(!newAnnouncementMsg) return;
      const newAnn: SystemAnnouncement = {
          id: crypto.randomUUID(),
          message: newAnnouncementMsg,
          type: newAnnouncementType,
          active: true,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      };
      setAnnouncements([newAnn, ...announcements]);
      setNewAnnouncementMsg('');
  };

  return (
    <div className="animate-fade-in space-y-6 max-w-6xl mx-auto">
        <header>
            <h1 className="text-3xl font-bold text-slate-800">Support & Operations</h1>
            <p className="text-slate-500">Global user management, master data, and system communication.</p>
        </header>

        {/* TABS */}
        <div className="flex border-b border-slate-200">
            <button onClick={() => setActiveTab('SUPPORT')} className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors flex items-center ${activeTab === 'SUPPORT' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                <User size={16} className="mr-2" /> User Management
            </button>
            <button onClick={() => setActiveTab('MASTER_DATA')} className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors flex items-center ${activeTab === 'MASTER_DATA' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                <Tag size={16} className="mr-2" /> Master Data
            </button>
            <button onClick={() => setActiveTab('COMMUNICATION')} className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors flex items-center ${activeTab === 'COMMUNICATION' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                <Bell size={16} className="mr-2" /> Announcements
            </button>
        </div>

        {/* USER SUPPORT TAB */}
        {activeTab === 'SUPPORT' && (
            <SuperAdminUserManagement users={allUsers} onUpdateUsers={onUpdateUsers} />
        )}

        {/* MASTER DATA TAB */}
        {activeTab === 'MASTER_DATA' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center">
                        <AlertTriangle size={20} className="mr-2 text-red-500" /> Default Safeguarding Types
                    </h3>
                    <div className="flex space-x-2 mb-4">
                        <input 
                            type="text" 
                            value={newIncident} 
                            onChange={(e) => setNewIncident(e.target.value)}
                            placeholder="Add new type..."
                            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-500"
                        />
                        <button onClick={() => handleAddTag('INCIDENT')} className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700"><Plus size={18} /></button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {incidentTypes.map(tag => (
                            <span key={tag} className="px-3 py-1 bg-red-50 text-red-700 rounded-full text-sm font-medium flex items-center border border-red-100">
                                {tag}
                                <button onClick={() => handleRemoveTag('INCIDENT', tag)} className="ml-2 text-red-400 hover:text-red-700"><X size={14} /></button>
                            </span>
                        ))}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center">
                        <Tag size={20} className="mr-2 text-blue-500" /> Default Behavior Categories
                    </h3>
                    <div className="flex space-x-2 mb-4">
                        <input 
                            type="text" 
                            value={newBehavior} 
                            onChange={(e) => setNewBehavior(e.target.value)}
                            placeholder="Add new category..."
                            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button onClick={() => handleAddTag('BEHAVIOR')} className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><Plus size={18} /></button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {behaviorTypes.map(tag => (
                            <span key={tag} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium flex items-center border border-blue-100">
                                {tag}
                                <button onClick={() => handleRemoveTag('BEHAVIOR', tag)} className="ml-2 text-blue-400 hover:text-blue-700"><X size={14} /></button>
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {/* COMMUNICATION TAB */}
        {activeTab === 'COMMUNICATION' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="font-bold text-slate-800 mb-4">Create Announcement</h3>
                    <form onSubmit={handleCreateAnnouncement} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Message</label>
                            <textarea 
                                value={newAnnouncementMsg}
                                onChange={(e) => setNewAnnouncementMsg(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none h-24 resize-none"
                                placeholder="Enter system message..."
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Severity</label>
                            <select 
                                value={newAnnouncementType}
                                onChange={(e) => setNewAnnouncementType(e.target.value as any)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                            >
                                <option value="Info">Info (Blue)</option>
                                <option value="Warning">Warning (Amber)</option>
                                <option value="Critical">Critical (Red)</option>
                            </select>
                        </div>
                        <button type="submit" className="w-full py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 shadow-md">
                            Push Announcement
                        </button>
                    </form>
                </div>

                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="font-bold text-slate-800 mb-4">Active Broadcasts</h3>
                    <div className="space-y-3">
                        {announcements.map(ann => (
                            <div key={ann.id} className={`p-4 rounded-lg border flex justify-between items-start ${
                                ann.type === 'Critical' ? 'bg-red-50 border-red-200' : 
                                ann.type === 'Warning' ? 'bg-amber-50 border-amber-200' : 
                                'bg-blue-50 border-blue-200'
                            }`}>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                                            ann.type === 'Critical' ? 'bg-red-200 text-red-800' : 
                                            ann.type === 'Warning' ? 'bg-amber-200 text-amber-800' : 
                                            'bg-blue-200 text-blue-800'
                                        }`}>{ann.type}</span>
                                        <span className="text-xs text-slate-500">Expires: {ann.expiresAt}</span>
                                    </div>
                                    <p className="text-sm text-slate-800 font-medium">{ann.message}</p>
                                </div>
                                <button onClick={() => setAnnouncements(announcements.filter(a => a.id !== ann.id))} className="text-slate-400 hover:text-slate-600">
                                    <X size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default SuperAdminOperations;
