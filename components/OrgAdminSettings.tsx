
import React, { useState, useEffect } from 'react';
import { UserProfile, Device, SupportTicket, SyncLog } from '../types';
import { 
    Server, Wifi, Users, Monitor, Ticket, AlertCircle, CheckCircle2, 
    RefreshCw, Search, Plus, Edit2, Trash2, Lock, Laptop, Tablet, 
    Database, KeyRound, Activity, Mail, FileUp, Network, Shield
} from 'lucide-react';

interface OrgAdminSettingsProps {
  currentUser: UserProfile;
  users: UserProfile[];
  onUpdateUsers: (users: UserProfile[]) => void;
  initialTab?: 'OVERVIEW' | 'IAM' | 'ASSETS' | 'HELPDESK' | 'DATA';
}

// Mock Data
const MOCK_DEVICES: Device[] = [
    { id: '1', serialNumber: 'LPT-8821', type: 'Laptop', model: 'Dell Latitude', assignedTo: 'Jane Doe', status: 'Active', lastCheckIn: '2023-11-20' },
    { id: '2', serialNumber: 'TAB-9912', type: 'Tablet', model: 'iPad Air', assignedTo: 'Cart 1 (Library)', status: 'Active', lastCheckIn: '2023-11-19' },
    { id: '3', serialNumber: 'PNL-1102', type: 'Interactive Panel', model: 'Promethean', assignedTo: 'Room 3B', status: 'Repair', lastCheckIn: '2023-11-15' },
    { id: '4', serialNumber: 'LPT-8822', type: 'Laptop', model: 'Dell Latitude', assignedTo: 'John Smith', status: 'Active', lastCheckIn: '2023-11-20' },
];

const MOCK_TICKETS: SupportTicket[] = [
    { id: 't1', requester: 'Sarah Connor', role: 'DSL', subject: 'Unable to access safeguarding archive', priority: 'High', status: 'Open', date: '2023-11-21 09:30', category: 'Account' },
    { id: 't2', requester: 'John Smith', role: 'Teacher', subject: 'Projector in Room 4 not connecting', priority: 'Medium', status: 'In Progress', date: '2023-11-20 14:15', category: 'Hardware' },
    { id: 't3', requester: 'Jane Doe', role: 'Head of Year', subject: 'Need new student added to roster', priority: 'Low', status: 'Resolved', date: '2023-11-19 11:00', category: 'Software' },
];

const MOCK_SYNC_LOGS: SyncLog[] = [
    { id: 's1', system: 'Wonde', status: 'Success', recordsProcessed: 1240, timestamp: '2023-11-22 02:00:00', message: 'Daily roster sync completed' },
    { id: 's2', system: 'Google', status: 'Success', recordsProcessed: 45, timestamp: '2023-11-22 02:15:00', message: 'Classroom rosters updated' },
    { id: 's3', system: 'SIMS', status: 'Partial', recordsProcessed: 1238, timestamp: '2023-11-21 02:00:00', message: '2 records skipped due to missing UPN' },
    { id: 's4', system: 'Arbor', status: 'Failed', recordsProcessed: 0, timestamp: '2023-11-20 14:00:00', message: 'API Timeout' },
];

const OrgAdminSettings: React.FC<OrgAdminSettingsProps> = ({ currentUser, users, onUpdateUsers, initialTab = 'OVERVIEW' }) => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'IAM' | 'ASSETS' | 'HELPDESK' | 'DATA'>(initialTab);
  
  useEffect(() => {
      setActiveTab(initialTab);
  }, [initialTab]);

  // IAM State
  const [userSearch, setUserSearch] = useState('');
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);

  // Asset State
  const [devices, setDevices] = useState<Device[]>(MOCK_DEVICES);
  const [deviceSearch, setDeviceSearch] = useState('');
  const [showDeviceModal, setShowDeviceModal] = useState(false);

  // Helpdesk State
  const [tickets, setTickets] = useState<SupportTicket[]>(MOCK_TICKETS);

  // Data State
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>(MOCK_SYNC_LOGS);
  const [isSyncing, setIsSyncing] = useState(false);

  const filteredUsers = users.filter(u => u.name.toLowerCase().includes(userSearch.toLowerCase()));
  const filteredDevices = devices.filter(d => d.serialNumber.toLowerCase().includes(deviceSearch.toLowerCase()) || d.assignedTo?.toLowerCase().includes(deviceSearch.toLowerCase()));

  // --- IAM Handlers ---
  const handleSaveUser = (e: React.FormEvent) => {
      e.preventDefault();
      const form = e.target as HTMLFormElement;
      const formData = new FormData(form);
      const name = formData.get('name') as string;
      const role = formData.get('role') as any;
      const email = formData.get('email') as string;

      if (editingUser) {
          onUpdateUsers(users.map(u => u.id === editingUser.id ? { ...u, name, role, email, initials: name.substring(0,2).toUpperCase() } : u));
      } else {
          const newUser: UserProfile = {
              id: crypto.randomUUID(),
              name,
              role,
              email,
              initials: name.substring(0,2).toUpperCase(),
              orgId: currentUser.orgId
          };
          onUpdateUsers([...users, newUser]);
      }
      setShowUserModal(false);
      setEditingUser(null);
  };

  const handleResetPassword = (userId: string) => {
      alert(`Password reset link sent to user ID: ${userId}`);
  };

  const handleBulkImport = () => {
      alert("Opening CSV import wizard...");
  };

  // --- Asset Handlers ---
  const handleAddDevice = (e: React.FormEvent) => {
      e.preventDefault();
      const form = e.target as HTMLFormElement;
      const formData = new FormData(form);
      
      const newDevice: Device = {
          id: crypto.randomUUID(),
          serialNumber: formData.get('serial') as string,
          type: formData.get('type') as any,
          model: formData.get('model') as string,
          assignedTo: formData.get('assigned') as string,
          status: 'Active',
          lastCheckIn: new Date().toISOString().split('T')[0]
      };
      setDevices([...devices, newDevice]);
      setShowDeviceModal(false);
  };

  // --- Data Handlers ---
  const handleManualSync = (system: SyncLog['system']) => {
      setIsSyncing(true);
      setTimeout(() => {
          const newLog: SyncLog = {
              id: crypto.randomUUID(),
              system,
              status: 'Success',
              recordsProcessed: Math.floor(Math.random() * 100),
              timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
              message: 'Manual sync completed successfully'
          };
          setSyncLogs([newLog, ...syncLogs]);
          setIsSyncing(false);
      }, 2000);
  };

  return (
    <div className="animate-fade-in space-y-6">
      <header className="flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-bold text-slate-800">IT Command Console</h1>
            <p className="text-slate-500">Infrastructure, Identity, and Data Management</p>
        </div>
        <div className="flex items-center space-x-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-full">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
            </span>
            <span className="text-xs font-bold text-green-700">Systems Nominal</span>
        </div>
      </header>

      {/* Navigation Tabs - Now purely visual indicators if controlled by sidebar, or clickable if standalone */}
      <div className="flex border-b border-slate-200 overflow-x-auto bg-white rounded-t-xl px-2">
          <button 
            onClick={() => setActiveTab('OVERVIEW')}
            className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors flex items-center whitespace-nowrap ${activeTab === 'OVERVIEW' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
              <Activity size={16} className="mr-2" /> Overview
          </button>
          <button 
            onClick={() => setActiveTab('IAM')}
            className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors flex items-center whitespace-nowrap ${activeTab === 'IAM' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
              <Users size={16} className="mr-2" /> Users & IAM
          </button>
          <button 
            onClick={() => setActiveTab('DATA')}
            className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors flex items-center whitespace-nowrap ${activeTab === 'DATA' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
              <Database size={16} className="mr-2" /> Data Sync
          </button>
          <button 
            onClick={() => setActiveTab('ASSETS')}
            className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors flex items-center whitespace-nowrap ${activeTab === 'ASSETS' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
              <Monitor size={16} className="mr-2" /> Assets
          </button>
          <button 
            onClick={() => setActiveTab('HELPDESK')}
            className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors flex items-center whitespace-nowrap ${activeTab === 'HELPDESK' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
              <Ticket size={16} className="mr-2" /> Helpdesk
          </button>
      </div>

      {/* --- OVERVIEW TAB --- */}
      {activeTab === 'OVERVIEW' && (
          <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Infrastructure Status */}
                  <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                      <h3 className="font-bold text-slate-700 mb-4 flex items-center"><Server size={18} className="mr-2 text-slate-400" /> Network Status</h3>
                      <div className="space-y-3">
                          <div className="flex justify-between items-center p-2 bg-slate-50 rounded">
                              <span className="text-sm text-slate-600 flex items-center"><Wifi size={14} className="mr-2 text-green-500"/> Staff WiFi</span>
                              <span className="text-[10px] font-bold text-green-600 border border-green-200 bg-white px-2 py-0.5 rounded">120mbps</span>
                          </div>
                          <div className="flex justify-between items-center p-2 bg-slate-50 rounded">
                              <span className="text-sm text-slate-600 flex items-center"><Wifi size={14} className="mr-2 text-amber-500"/> Student WiFi</span>
                              <span className="text-[10px] font-bold text-amber-600 border border-amber-200 bg-white px-2 py-0.5 rounded">High Load</span>
                          </div>
                          <div className="flex justify-between items-center p-2 bg-slate-50 rounded">
                              <span className="text-sm text-slate-600 flex items-center"><Network size={14} className="mr-2 text-green-500"/> Core Switch</span>
                              <span className="text-[10px] font-bold text-green-600 border border-green-200 bg-white px-2 py-0.5 rounded">Online</span>
                          </div>
                      </div>
                  </div>

                  {/* Ticket Summary */}
                  <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                      <h3 className="font-bold text-slate-700 mb-4 flex items-center"><Ticket size={18} className="mr-2 text-slate-400" /> Support Queue</h3>
                      <div className="flex items-center justify-between mb-4">
                          <div>
                              <span className="text-4xl font-black text-slate-800">{tickets.filter(t => t.status !== 'Resolved').length}</span>
                              <p className="text-xs text-slate-500">Pending Tickets</p>
                          </div>
                          <div className="text-right">
                              <p className="text-xs text-red-500 font-bold flex items-center justify-end"><AlertCircle size={12} className="mr-1"/> 1 Critical</p>
                              <p className="text-xs text-slate-400">Est wait: 15m</p>
                          </div>
                      </div>
                      <button 
                        onClick={() => setActiveTab('HELPDESK')}
                        className="w-full py-2 text-xs font-bold text-white bg-slate-800 rounded-lg hover:bg-black transition-colors"
                      >
                          Go to Helpdesk
                      </button>
                  </div>

                  {/* Sync Health */}
                  <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                      <h3 className="font-bold text-slate-700 mb-4 flex items-center"><RefreshCw size={18} className="mr-2 text-slate-400" /> Data Integrity</h3>
                      <div className="grid grid-cols-2 gap-4 text-center">
                          <div className="p-2 bg-green-50 rounded-lg border border-green-100">
                              <p className="text-lg font-bold text-green-700">Healthy</p>
                              <p className="text-[10px] text-green-600 uppercase font-bold">MIS Sync</p>
                          </div>
                          <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                              <p className="text-lg font-bold text-slate-700">4h ago</p>
                              <p className="text-[10px] text-slate-500 uppercase font-bold">Last Import</p>
                          </div>
                      </div>
                      <button 
                        onClick={() => setActiveTab('DATA')}
                        className="w-full mt-3 py-1.5 text-xs font-bold text-indigo-600 border border-indigo-200 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                      >
                          Check Logs
                      </button>
                  </div>
              </div>

              <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-6 text-white flex items-center justify-between shadow-lg">
                  <div>
                      <h3 className="font-bold text-lg mb-1 flex items-center"><Shield size={18} className="mr-2 text-emerald-400"/> Security Patch 2.4.1</h3>
                      <p className="text-slate-400 text-sm">Critical update for Interactive Panels pending deployment.</p>
                  </div>
                  <button className="px-4 py-2 bg-white text-slate-900 font-bold rounded-lg hover:bg-slate-100 transition-colors text-sm">
                      Deploy Now
                  </button>
              </div>
          </div>
      )}

      {/* --- IAM TAB --- */}
      {activeTab === 'IAM' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[600px]">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
                      <input 
                          type="text" 
                          value={userSearch}
                          onChange={(e) => setUserSearch(e.target.value)}
                          placeholder="Search staff directory..." 
                          className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-64"
                      />
                  </div>
                  <div className="flex gap-2">
                      <button 
                        onClick={handleBulkImport}
                        className="flex items-center px-3 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-bold text-xs transition-colors"
                      >
                          <FileUp size={14} className="mr-2" /> Bulk Import CSV
                      </button>
                      <button 
                        onClick={() => { setEditingUser(null); setShowUserModal(true); }}
                        className="flex items-center px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold text-xs transition-colors shadow-sm"
                      >
                          <Plus size={14} className="mr-2" /> Create User
                      </button>
                  </div>
              </div>
              <table className="w-full text-left text-sm">
                  <thead className="bg-white text-slate-500 uppercase font-bold text-xs border-b border-slate-100">
                      <tr>
                          <th className="px-6 py-3">Identity</th>
                          <th className="px-6 py-3">Role</th>
                          <th className="px-6 py-3">Security</th>
                          <th className="px-6 py-3 text-right">Actions</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                      {filteredUsers.map(user => (
                          <tr key={user.id} className="hover:bg-slate-50">
                              <td className="px-6 py-3">
                                  <div className="flex items-center">
                                      <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold mr-3 border border-slate-200">
                                          {user.initials}
                                      </div>
                                      <div>
                                          <p className="font-medium text-slate-800">{user.name}</p>
                                          <p className="text-xs text-slate-400">{user.email}</p>
                                      </div>
                                  </div>
                              </td>
                              <td className="px-6 py-3">
                                  <span className="px-2 py-1 bg-slate-100 rounded text-xs font-bold text-slate-600 border border-slate-200">
                                      {user.role}
                                  </span>
                              </td>
                              <td className="px-6 py-3">
                                  <div className="flex items-center gap-3">
                                      <span className={`flex items-center text-xs font-medium ${user.status === 'Locked' ? 'text-red-600' : 'text-green-600'}`}>
                                          {user.status === 'Locked' ? <Lock size={12} className="mr-1" /> : <CheckCircle2 size={12} className="mr-1" />}
                                          {user.status || 'Active'}
                                      </span>
                                      {user.role !== 'Teacher' && (
                                          <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100">MFA</span>
                                      )}
                                  </div>
                              </td>
                              <td className="px-6 py-3 text-right space-x-2">
                                  <button onClick={() => handleResetPassword(user.id)} className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-amber-600" title="Reset Password"><KeyRound size={16} /></button>
                                  <button onClick={() => { setEditingUser(user); setShowUserModal(true); }} className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-indigo-600" title="Edit"><Edit2 size={16} /></button>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      )}

      {/* --- DATA & SYNC TAB --- */}
      {activeTab === 'DATA' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="p-4 border-b border-slate-100 bg-slate-50">
                      <h3 className="font-bold text-slate-700 text-sm uppercase">Sync Logs</h3>
                  </div>
                  <div className="divide-y divide-slate-50">
                      {syncLogs.map(log => (
                          <div key={log.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                              <div className="flex items-center">
                                  <div className={`p-2 rounded-lg mr-3 ${
                                      log.status === 'Success' ? 'bg-green-50 text-green-600' : 
                                      log.status === 'Partial' ? 'bg-amber-50 text-amber-600' : 
                                      'bg-red-50 text-red-600'
                                  }`}>
                                      <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
                                  </div>
                                  <div>
                                      <p className="text-sm font-bold text-slate-800">{log.system} Integration</p>
                                      <p className="text-xs text-slate-500">{log.message}</p>
                                  </div>
                              </div>
                              <div className="text-right">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                      log.status === 'Success' ? 'bg-green-100 text-green-700' : 
                                      log.status === 'Partial' ? 'bg-amber-100 text-amber-700' : 
                                      'bg-red-100 text-red-700'
                                  }`}>
                                      {log.status}
                                  </span>
                                  <p className="text-[10px] text-slate-400 mt-1">{log.timestamp}</p>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>

              <div className="lg:col-span-1 space-y-4">
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                      <h3 className="font-bold text-slate-800 mb-4">Manual Triggers</h3>
                      <p className="text-xs text-slate-500 mb-4">Force data synchronization if auto-sync fails.</p>
                      <div className="space-y-3">
                          <button 
                            onClick={() => handleManualSync('Wonde')}
                            disabled={isSyncing}
                            className="w-full flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-all group disabled:opacity-50"
                          >
                              <span className="font-bold text-sm text-slate-700 group-hover:text-indigo-700">Sync Wonde (MIS)</span>
                              <RefreshCw size={14} className={`text-slate-400 group-hover:text-indigo-500 ${isSyncing ? 'animate-spin' : ''}`} />
                          </button>
                          <button 
                            onClick={() => handleManualSync('Google')}
                            disabled={isSyncing}
                            className="w-full flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all group disabled:opacity-50"
                          >
                              <span className="font-bold text-sm text-slate-700 group-hover:text-blue-700">Sync Google Users</span>
                              <RefreshCw size={14} className={`text-slate-400 group-hover:text-blue-500 ${isSyncing ? 'animate-spin' : ''}`} />
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* --- ASSETS TAB --- */}
      {activeTab === 'ASSETS' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[600px]">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
                      <input 
                          type="text" 
                          value={deviceSearch}
                          onChange={(e) => setDeviceSearch(e.target.value)}
                          placeholder="Search serial or user..." 
                          className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-64"
                      />
                  </div>
                  <button 
                    onClick={() => setShowDeviceModal(true)}
                    className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm transition-colors shadow-sm"
                  >
                      <Plus size={16} className="mr-2" /> Add Device
                  </button>
              </div>
              <table className="w-full text-left text-sm">
                  <thead className="bg-white text-slate-500 uppercase font-bold text-xs border-b border-slate-100">
                      <tr>
                          <th className="px-6 py-3">Device Info</th>
                          <th className="px-6 py-3">Type</th>
                          <th className="px-6 py-3">Assigned To</th>
                          <th className="px-6 py-3">Status</th>
                          <th className="px-6 py-3">Last Seen</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                      {filteredDevices.map(device => (
                          <tr key={device.id} className="hover:bg-slate-50">
                              <td className="px-6 py-3">
                                  <div>
                                      <p className="font-bold text-slate-800">{device.model}</p>
                                      <p className="text-xs text-slate-500 font-mono">{device.serialNumber}</p>
                                  </div>
                              </td>
                              <td className="px-6 py-3">
                                  <span className="flex items-center text-slate-600">
                                      {device.type === 'Laptop' && <Laptop size={14} className="mr-2" />}
                                      {device.type === 'Tablet' && <Tablet size={14} className="mr-2" />}
                                      {device.type === 'Interactive Panel' && <Monitor size={14} className="mr-2" />}
                                      {device.type}
                                  </span>
                              </td>
                              <td className="px-6 py-3 font-medium text-slate-700">{device.assignedTo}</td>
                              <td className="px-6 py-3">
                                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                                      device.status === 'Active' ? 'bg-green-100 text-green-700' : 
                                      device.status === 'Repair' ? 'bg-amber-100 text-amber-700' : 
                                      'bg-red-100 text-red-700'
                                  }`}>
                                      {device.status}
                                  </span>
                              </td>
                              <td className="px-6 py-3 text-slate-500 text-xs">
                                  {device.lastCheckIn}
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      )}

      {/* --- HELPDESK TAB --- */}
      {activeTab === 'HELPDESK' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50">
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide">Internal Support Queue</h3>
              </div>
              <div className="divide-y divide-slate-100">
                  {tickets.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 text-sm italic">No open tickets. Nice work!</div>
                  ) : (
                      tickets.map(ticket => (
                          <div key={ticket.id} className="p-4 hover:bg-slate-50 transition-colors flex justify-between items-center group">
                              <div className="flex items-start space-x-4">
                                  <div className={`mt-1 p-2 rounded-full ${
                                      ticket.priority === 'High' ? 'bg-red-100 text-red-600' : 
                                      ticket.priority === 'Medium' ? 'bg-amber-100 text-amber-600' : 
                                      'bg-blue-100 text-blue-600'
                                  }`}>
                                      <AlertCircle size={16} />
                                  </div>
                                  <div>
                                      <h4 className="font-bold text-slate-800 text-sm">{ticket.subject}</h4>
                                      <p className="text-xs text-slate-500 mt-0.5">
                                          Requested by <span className="font-medium text-slate-700">{ticket.requester}</span> ({ticket.role}) • {ticket.date}
                                      </p>
                                      <span className="inline-block mt-2 text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded border border-slate-200 uppercase tracking-wide font-bold">
                                          {ticket.category}
                                      </span>
                                  </div>
                              </div>
                              <div className="flex items-center space-x-3">
                                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                      ticket.status === 'Open' ? 'bg-red-50 text-red-700' :
                                      ticket.status === 'In Progress' ? 'bg-blue-50 text-blue-700' :
                                      'bg-green-50 text-green-700'
                                  }`}>
                                      {ticket.status}
                                  </span>
                                  <button className="p-2 text-slate-400 hover:bg-slate-200 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                                      <Edit2 size={16} />
                                  </button>
                              </div>
                          </div>
                      ))
                  )}
              </div>
          </div>
      )}

      {/* User Modal */}
      {showUserModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-slide-up">
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                      <Users className="mr-2 text-indigo-600" />
                      {editingUser ? 'Edit User Identity' : 'Provision New Identity'}
                  </h3>
                  <form onSubmit={handleSaveUser} className="space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                          <input name="name" defaultValue={editingUser?.name} required className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                          <input name="email" type="email" defaultValue={editingUser?.email} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                          <select name="role" defaultValue={editingUser?.role || 'Teacher'} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                              <option value="Teacher">Teacher</option>
                              <option value="Head of Year">Head of Year</option>
                              <option value="DSL">DSL (Safeguarding)</option>
                              <option value="Admin">IT / Admin</option>
                          </select>
                      </div>
                      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-4">
                          <button type="button" onClick={() => setShowUserModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium">Cancel</button>
                          <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 shadow-md">Save Identity</button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* Device Modal */}
      {showDeviceModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-slide-up">
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                      <Monitor className="mr-2 text-indigo-600" />
                      Register Asset
                  </h3>
                  <form onSubmit={handleAddDevice} className="space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Model Name</label>
                          <input name="model" required className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. Dell Latitude 3510" />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Serial Number</label>
                          <input name="serial" required className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. SN-99281" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                              <select name="type" className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none bg-white">
                                  <option value="Laptop">Laptop</option>
                                  <option value="Tablet">Tablet</option>
                                  <option value="Interactive Panel">Panel</option>
                              </select>
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">Assigned To</label>
                              <input name="assigned" className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none" placeholder="User or Room" />
                          </div>
                      </div>
                      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-4">
                          <button type="button" onClick={() => setShowDeviceModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium">Cancel</button>
                          <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 shadow-md">Register Device</button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default OrgAdminSettings;
