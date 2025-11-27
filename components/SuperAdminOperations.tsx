
import React, { useState } from 'react';
import { UserProfile, SystemAnnouncement } from '../types';
import { Search, User, Unlock, KeyRound, Link, Power, MessageSquare, Plus, Trash2, Tag, AlertTriangle, Bell, CheckCircle2, X } from 'lucide-react';

interface SuperAdminOperationsProps {
  allUsers: UserProfile[];
  onUpdateUsers: (users: UserProfile[]) => void;
}

const DEFAULT_INCIDENT_TYPES = ['Bullying', 'Physical Abuse', 'Sexual Harassment', 'Online Safety', 'Substance Misuse', 'Neglect', 'Radicalization'];
const DEFAULT_BEHAVIOR_TYPES = ['Disruption', 'Homework', 'Lateness', 'Uniform', 'Equipment', 'Defiance', 'Truancy'];

const SuperAdminOperations: React.FC<SuperAdminOperationsProps> = ({ allUsers, onUpdateUsers }) => {
  const [activeTab, setActiveTab] = useState<'SUPPORT' | 'MASTER_DATA' | 'COMMUNICATION'>('SUPPORT');
  
  // SUPPORT STATE
  const [userSearch, setUserSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

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

  // FILTER USERS
  const filteredUsers = allUsers.filter(u => 
      u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
      u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.id.toLowerCase().includes(userSearch.toLowerCase())
  );

  // HANDLERS
  const handleUserAction = (action: string) => {
      if(!selectedUser) return;
      
      // Perform actual logic based on action
      let updatedUser = { ...selectedUser };
      let successMessage = `${action} successful for ${selectedUser.name}.`;

      if (action === 'Unlock Account') {
          updatedUser.status = 'Active';
      } else if (action === 'Kill Session' || action === 'Force Logout') {
          // For simulation, we'll lock the account or just reset status if it was something else
          // In a real app, this would invalidate a session token.
          // Here let's toggle lock for demonstration or keep as Active but notify
          successMessage = `Session terminated for ${selectedUser.name}.`;
      } else if (action === 'Lock Account') {
          updatedUser.status = 'Locked';
          successMessage = `Account locked for ${selectedUser.name}.`;
      }

      // Update Global State if user changed
      if (updatedUser.status !== selectedUser.status) {
          onUpdateUsers(allUsers.map(u => u.id === updatedUser.id ? updatedUser : u));
          setSelectedUser(updatedUser);
      }

      setActionFeedback(`Executing: ${action}...`);
      setTimeout(() => {
          setActionFeedback(successMessage);
          setTimeout(() => setActionFeedback(null), 3000);
      }, 800);
  };

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
                <User size={16} className="mr-2" /> User Support
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
                {/* Left: Search List */}
                <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-slate-50">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
                            <input 
                                type="text" 
                                placeholder="Search global user database..." 
                                value={userSearch}
                                onChange={(e) => setUserSearch(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2">
                        {filteredUsers.length === 0 ? (
                            <p className="text-sm text-slate-400 text-center py-8">No users found.</p>
                        ) : (
                            filteredUsers.map(u => (
                                <div 
                                    key={u.id}
                                    onClick={() => setSelectedUser(u)}
                                    className={`p-3 rounded-lg cursor-pointer transition-colors border mb-2 ${selectedUser?.id === u.id ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-300' : 'bg-white border-slate-100 hover:bg-slate-50'}`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="font-bold text-slate-800 text-sm">{u.name}</span>
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${u.status === 'Locked' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                            {u.status || 'Active'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 truncate">{u.email || 'No Email'}</p>
                                    <p className="text-[10px] text-slate-400 mt-1 flex items-center">
                                        <span className="uppercase font-bold mr-1">{u.role}</span> • ID: {u.id.slice(0,6)}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Right: Detail & Actions */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-8 flex flex-col justify-center">
                    {selectedUser ? (
                        <div className="space-y-8">
                            <div className="flex items-start space-x-6">
                                <div className="w-24 h-24 rounded-full bg-indigo-100 flex items-center justify-center text-3xl font-bold text-indigo-600 border-4 border-white shadow-lg">
                                    {selectedUser.initials}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-800">{selectedUser.name}</h2>
                                    <p className="text-slate-500 flex items-center mt-1">
                                        <MessageSquare size={14} className="mr-1" /> {selectedUser.email || 'No email configured'}
                                    </p>
                                    <div className="flex gap-2 mt-3">
                                        <span className="px-3 py-1 bg-slate-100 rounded-lg text-xs font-bold text-slate-600">Role: {selectedUser.role}</span>
                                        <span className="px-3 py-1 bg-slate-100 rounded-lg text-xs font-bold text-slate-600">Org ID: {selectedUser.orgId || 'Global'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <button onClick={() => handleUserAction('Send Password Reset')} className="flex items-center justify-center p-4 border border-slate-200 rounded-xl hover:border-indigo-300 hover:bg-indigo-50 transition-all group">
                                    <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg mr-3 group-hover:bg-indigo-200">
                                        <KeyRound size={20} />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-bold text-slate-800 text-sm">Reset Password</p>
                                        <p className="text-xs text-slate-500">Send reset email to user</p>
                                    </div>
                                </button>

                                <button onClick={() => handleUserAction('Generate Magic Link')} className="flex items-center justify-center p-4 border border-slate-200 rounded-xl hover:border-indigo-300 hover:bg-indigo-50 transition-all group">
                                    <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg mr-3 group-hover:bg-emerald-200">
                                        <Link size={20} />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-bold text-slate-800 text-sm">Magic Login Link</p>
                                        <p className="text-xs text-slate-500">Generate one-time access URL</p>
                                    </div>
                                </button>

                                {selectedUser.status === 'Locked' ? (
                                    <button onClick={() => handleUserAction('Unlock Account')} className="flex items-center justify-center p-4 border border-slate-200 rounded-xl hover:border-indigo-300 hover:bg-indigo-50 transition-all group">
                                        <div className="p-2 bg-amber-100 text-amber-600 rounded-lg mr-3 group-hover:bg-amber-200">
                                            <Unlock size={20} />
                                        </div>
                                        <div className="text-left">
                                            <p className="font-bold text-slate-800 text-sm">Unlock Account</p>
                                            <p className="text-xs text-slate-500">Clear failed login attempts</p>
                                        </div>
                                    </button>
                                ) : (
                                    <button onClick={() => handleUserAction('Lock Account')} className="flex items-center justify-center p-4 border border-slate-200 rounded-xl hover:border-red-300 hover:bg-red-50 transition-all group">
                                        <div className="p-2 bg-red-100 text-red-600 rounded-lg mr-3 group-hover:bg-red-200">
                                            <Power size={20} />
                                        </div>
                                        <div className="text-left">
                                            <p className="font-bold text-slate-800 text-sm">Lock Account</p>
                                            <p className="text-xs text-slate-500">Prevent user login immediately</p>
                                        </div>
                                    </button>
                                )}

                                <button onClick={() => handleUserAction('Kill Session')} className="flex items-center justify-center p-4 border border-slate-200 rounded-xl hover:border-red-300 hover:bg-red-50 transition-all group">
                                    <div className="p-2 bg-red-100 text-red-600 rounded-lg mr-3 group-hover:bg-red-200">
                                        <Power size={20} />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-bold text-slate-800 text-sm">Force Logout</p>
                                        <p className="text-xs text-slate-500">Terminate active sessions</p>
                                    </div>
                                </button>
                            </div>

                            {actionFeedback && (
                                <div className="p-3 bg-green-100 text-green-800 rounded-lg text-sm font-bold text-center flex items-center justify-center animate-fade-in">
                                    <CheckCircle2 size={16} className="mr-2" /> {actionFeedback}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center text-slate-400">
                            <User size={48} className="mx-auto mb-4 opacity-20" />
                            <p>Select a user from the list to view details and perform actions.</p>
                        </div>
                    )}
                </div>
            </div>
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
