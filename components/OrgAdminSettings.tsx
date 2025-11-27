
import React, { useState, useEffect } from 'react';
import { UserProfile, Device, SupportTicket, SyncLog, RoleDefinition } from '../types';
import { 
    Server, Wifi, Users, Monitor, Ticket, AlertCircle, CheckCircle2, 
    RefreshCw, Search, Plus, Edit2, Trash2, Lock, Laptop, Tablet, 
    Database, KeyRound, Activity, Mail, FileUp, Network, Shield,
    UserCog, ToggleLeft, ToggleRight, BookOpen, ClipboardList, Settings, Download, LayoutGrid
} from 'lucide-react';

interface OrgAdminSettingsProps {
  currentUser: UserProfile;
  users: UserProfile[];
  onUpdateUsers: (users: UserProfile[]) => void;
  roles: RoleDefinition[];
  onUpdateRoles: (roles: RoleDefinition[]) => void;
  initialTab?: 'OVERVIEW' | 'IAM' | 'ROLES' | 'ASSETS' | 'HELPDESK' | 'DATA';
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

const OrgAdminSettings: React.FC<OrgAdminSettingsProps> = ({ currentUser, users, onUpdateUsers, roles, onUpdateRoles, initialTab = 'OVERVIEW' }) => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'IAM' | 'ROLES' | 'ASSETS' | 'HELPDESK' | 'DATA'>(initialTab);
  
  useEffect(() => {
      setActiveTab(initialTab);
  }, [initialTab]);

  // IAM State
  const [userSearch, setUserSearch] = useState('');
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);

  // Role Management State
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleDefinition | null>(null);

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

  // --- Role Handlers ---
  const handleSaveRole = (e: React.FormEvent) => {
      e.preventDefault();
      const form = e.target as HTMLFormElement;
      const formData = new FormData(form);
      const name = formData.get('name') as string;
      
      // Permissions Construction
      const permissions = {
          canViewSafeguarding: formData.get('perm_safeguarding_view') === 'on',
          canManageSafeguarding: formData.get('perm_safeguarding_manage') === 'on',
          canViewBehavior: formData.get('perm_behavior_view') === 'on',
          canEditBehavior: formData.get('perm_behavior_edit') === 'on',
          
          canManageSeating: formData.get('perm_seating') === 'on',
          canRunReports: formData.get('perm_reports') === 'on',
          canExportData: formData.get('perm_export') === 'on',
          
          canManageUsers: formData.get('perm_users') === 'on',
          canConfigureSystem: formData.get('perm_config') === 'on',

          classManager: {
              showRiskAnalysis: formData.get('cm_risk') === 'on',
              showBehaviorTrends: formData.get('cm_trends') === 'on',
              showStudentRoster: formData.get('cm_roster') === 'on',
              showActivityFeed: formData.get('cm_activity') === 'on',
          }
      };

      if (editingRole) {
          onUpdateRoles(roles.map(r => r.id === editingRole.id ? { ...r, name, permissions } : r));
      } else {
          const newRole: RoleDefinition = {
              id: crypto.randomUUID(),
              name,
              isSystem: false,
              permissions,
              orgId: currentUser.orgId
          };
          onUpdateRoles([...roles, newRole]);
      }
      setShowRoleModal(false);
      setEditingRole(null);
  };

  const handleDeleteRole = (roleId: string) => {
      if(window.confirm('Delete this role? Users assigned to this role will lose permissions.')) {
          onUpdateRoles(roles.filter(r => r.id !== roleId));
      }
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

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto">
          {[
              { id: 'OVERVIEW', icon: Activity, label: 'Overview' },
              { id: 'IAM', icon: Users, label: 'Identity (IAM)' },
              { id: 'ROLES', icon: Shield, label: 'Permissions' },
              { id: 'ASSETS', icon: Monitor, label: 'Assets' },
              { id: 'DATA', icon: Database, label: 'Data Sync' },
              { id: 'HELPDESK', icon: Ticket, label: 'Helpdesk' },
          ].map((tab) => (
              <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors flex items-center whitespace-nowrap ${
                      activeTab === tab.id 
                      ? 'border-indigo-600 text-indigo-600' 
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
              >
                  <tab.icon size={16} className="mr-2" /> {tab.label}
              </button>
          ))}
      </div>

      {/* --- OVERVIEW DASHBOARD --- */}
      {activeTab === 'OVERVIEW' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Status Cards */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Active Users</h3>
                  <div className="flex items-end justify-between">
                      <p className="text-3xl font-black text-slate-800">{users.length}</p>
                      <Users size={24} className="text-indigo-500" />
                  </div>
              </div>
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Devices Online</h3>
                  <div className="flex items-end justify-between">
                      <p className="text-3xl font-black text-slate-800">{devices.filter(d => d.status === 'Active').length}</p>
                      <Wifi size={24} className="text-emerald-500" />
                  </div>
              </div>
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Open Tickets</h3>
                  <div className="flex items-end justify-between">
                      <p className="text-3xl font-black text-slate-800">{tickets.filter(t => t.status !== 'Resolved').length}</p>
                      <Ticket size={24} className="text-amber-500" />
                  </div>
              </div>

              {/* Quick Actions */}
              <div className="md:col-span-3 bg-slate-50 p-6 rounded-xl border border-slate-200">
                  <h3 className="font-bold text-slate-800 mb-4">Quick Actions</h3>
                  <div className="flex gap-4">
                      <button onClick={() => setActiveTab('IAM')} className="flex items-center px-4 py-2 bg-white border border-slate-300 rounded-lg shadow-sm hover:border-indigo-300 hover:text-indigo-600 transition-all">
                          <Plus size={16} className="mr-2" /> Add User
                      </button>
                      <button onClick={() => setActiveTab('ASSETS')} className="flex items-center px-4 py-2 bg-white border border-slate-300 rounded-lg shadow-sm hover:border-indigo-300 hover:text-indigo-600 transition-all">
                          <Laptop size={16} className="mr-2" /> Register Device
                      </button>
                      <button onClick={() => handleManualSync('Wonde')} className="flex items-center px-4 py-2 bg-white border border-slate-300 rounded-lg shadow-sm hover:border-indigo-300 hover:text-indigo-600 transition-all">
                          <RefreshCw size={16} className="mr-2" /> Force Sync (Wonde)
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* --- IAM TAB --- */}
      {activeTab === 'IAM' && (
          <div className="space-y-4">
              <div className="flex justify-between items-center">
                  <div className="relative w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input 
                          type="text" 
                          placeholder="Search users..." 
                          value={userSearch} 
                          onChange={(e) => setUserSearch(e.target.value)} 
                          className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                  </div>
                  <button onClick={() => setShowUserModal(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm hover:bg-indigo-700 transition-colors flex items-center">
                      <Plus size={16} className="mr-2" /> Create User
                  </button>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-slate-500 font-bold">
                          <tr>
                              <th className="px-6 py-3">User</th>
                              <th className="px-6 py-3">Role</th>
                              <th className="px-6 py-3">Status</th>
                              <th className="px-6 py-3 text-right">Actions</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                          {filteredUsers.map(user => (
                              <tr key={user.id} className="hover:bg-slate-50">
                                  <td className="px-6 py-3 font-medium text-slate-800">{user.name} <span className="text-slate-400 font-normal text-xs ml-1">({user.email || 'No Email'})</span></td>
                                  <td className="px-6 py-3"><span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-bold uppercase">{user.role}</span></td>
                                  <td className="px-6 py-3">
                                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${user.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                          {user.status || 'Active'}
                                      </span>
                                  </td>
                                  <td className="px-6 py-3 text-right">
                                      <div className="flex justify-end gap-2">
                                          <button onClick={() => handleResetPassword(user.id)} className="p-1.5 text-slate-400 hover:text-amber-500" title="Reset Password"><KeyRound size={16} /></button>
                                          <button onClick={() => { setEditingUser(user); setShowUserModal(true); }} className="p-1.5 text-slate-400 hover:text-blue-500" title="Edit"><Edit2 size={16} /></button>
                                      </div>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>
      )}

      {/* --- ASSETS TAB --- */}
      {activeTab === 'ASSETS' && (
          <div className="space-y-4">
              <div className="flex justify-between items-center">
                  <div className="relative w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input 
                          type="text" 
                          placeholder="Search devices..." 
                          value={deviceSearch} 
                          onChange={(e) => setDeviceSearch(e.target.value)} 
                          className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                  </div>
                  <button onClick={() => setShowDeviceModal(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm hover:bg-indigo-700 transition-colors flex items-center">
                      <Plus size={16} className="mr-2" /> Register Device
                  </button>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-slate-500 font-bold">
                          <tr>
                              <th className="px-6 py-3">Serial Number</th>
                              <th className="px-6 py-3">Type / Model</th>
                              <th className="px-6 py-3">Assigned To</th>
                              <th className="px-6 py-3">Status</th>
                              <th className="px-6 py-3">Last Check-in</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                          {filteredDevices.map(device => (
                              <tr key={device.id} className="hover:bg-slate-50">
                                  <td className="px-6 py-3 font-mono text-slate-700">{device.serialNumber}</td>
                                  <td className="px-6 py-3 text-slate-600">{device.type} <span className="text-slate-400 text-xs">({device.model})</span></td>
                                  <td className="px-6 py-3 font-medium text-slate-800">{device.assignedTo}</td>
                                  <td className="px-6 py-3">
                                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${device.status === 'Active' ? 'bg-green-100 text-green-700' : device.status === 'Repair' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                                          {device.status}
                                      </span>
                                  </td>
                                  <td className="px-6 py-3 text-slate-500 text-xs">{device.lastCheckIn}</td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>
      )}

      {/* --- DATA SYNC TAB --- */}
      {activeTab === 'DATA' && (
          <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                      <h3 className="font-bold text-slate-800 mb-4 flex items-center"><RefreshCw size={18} className="mr-2 text-blue-500"/> Sync Connectors</h3>
                      <div className="space-y-4">
                          <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-200">
                              <div>
                                  <p className="font-bold text-slate-700">Wonde MIS</p>
                                  <p className="text-xs text-slate-500">Last sync: 2 hours ago</p>
                              </div>
                              <button onClick={() => handleManualSync('Wonde')} disabled={isSyncing} className="px-3 py-1 bg-white border border-slate-300 rounded text-xs font-bold hover:bg-slate-100 disabled:opacity-50">
                                  {isSyncing ? 'Syncing...' : 'Sync Now'}
                              </button>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-200">
                              <div>
                                  <p className="font-bold text-slate-700">Google Classroom</p>
                                  <p className="text-xs text-slate-500">Last sync: 15 mins ago</p>
                              </div>
                              <button onClick={() => handleManualSync('Google')} disabled={isSyncing} className="px-3 py-1 bg-white border border-slate-300 rounded text-xs font-bold hover:bg-slate-100 disabled:opacity-50">
                                  {isSyncing ? 'Syncing...' : 'Sync Now'}
                              </button>
                          </div>
                      </div>
                  </div>

                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                      <h3 className="font-bold text-slate-800 mb-4 flex items-center"><Activity size={18} className="mr-2 text-emerald-500"/> Sync History</h3>
                      <div className="space-y-3 max-h-48 overflow-y-auto">
                          {syncLogs.map(log => (
                              <div key={log.id} className="flex items-start space-x-3 text-xs">
                                  <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${log.status === 'Success' ? 'bg-green-500' : log.status === 'Partial' ? 'bg-amber-500' : 'bg-red-500'}`}></div>
                                  <div>
                                      <p className="font-medium text-slate-700">{log.system} - {log.status}</p>
                                      <p className="text-slate-500">{log.timestamp} • {log.recordsProcessed} records</p>
                                      {log.message && <p className="text-slate-400 italic">{log.message}</p>}
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* --- HELPDESK TAB --- */}
      {activeTab === 'HELPDESK' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500 font-bold">
                      <tr>
                          <th className="px-6 py-3">Requester</th>
                          <th className="px-6 py-3">Subject</th>
                          <th className="px-6 py-3">Category</th>
                          <th className="px-6 py-3">Priority</th>
                          <th className="px-6 py-3">Status</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                      {tickets.map(ticket => (
                          <tr key={ticket.id} className="hover:bg-slate-50">
                              <td className="px-6 py-3">
                                  <p className="font-bold text-slate-700">{ticket.requester}</p>
                                  <p className="text-xs text-slate-400">{ticket.role}</p>
                              </td>
                              <td className="px-6 py-3 font-medium text-slate-700">{ticket.subject}</td>
                              <td className="px-6 py-3"><span className="bg-slate-100 text-slate-500 px-2 py-1 rounded text-xs">{ticket.category}</span></td>
                              <td className="px-6 py-3">
                                  <span className={`text-xs font-bold px-2 py-1 rounded ${ticket.priority === 'High' ? 'bg-red-100 text-red-700' : ticket.priority === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                                      {ticket.priority}
                                  </span>
                              </td>
                              <td className="px-6 py-3">
                                  <span className={`inline-flex items-center text-xs font-medium ${ticket.status === 'Open' ? 'text-red-600' : ticket.status === 'Resolved' ? 'text-green-600' : 'text-amber-600'}`}>
                                      {ticket.status === 'Resolved' && <CheckCircle2 size={12} className="mr-1"/>}
                                      {ticket.status}
                                  </span>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      )}

      {/* --- USER MODAL --- */}
      {showUserModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
              <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
                  <h3 className="text-lg font-bold text-slate-800 mb-4">{editingUser ? 'Edit User' : 'Create New User'}</h3>
                  <form onSubmit={handleSaveUser} className="space-y-4">
                      <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Full Name</label>
                          <input name="name" defaultValue={editingUser?.name} required className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label>
                          <input name="email" type="email" defaultValue={editingUser?.email} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Role</label>
                          <select name="role" defaultValue={editingUser?.role || 'Teacher'} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                              {roles.filter(r => r.isSystem || r.orgId === currentUser.orgId).map(r => (
                                  <option key={r.id} value={r.name}>{r.name}</option>
                              ))}
                              {!roles.length && (
                                  <>
                                    <option value="Teacher">Teacher</option>
                                    <option value="Head of Year">Head of Year</option>
                                    <option value="DSL">DSL</option>
                                    <option value="Admin">Admin</option>
                                  </>
                              )}
                          </select>
                      </div>
                      <div className="flex justify-end space-x-3 pt-4">
                          <button type="button" onClick={() => { setShowUserModal(false); setEditingUser(null); }} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium">Cancel</button>
                          <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 shadow-md">Save</button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* --- DEVICE MODAL --- */}
      {showDeviceModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
              <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
                  <h3 className="text-lg font-bold text-slate-800 mb-4">Register New Device</h3>
                  <form onSubmit={handleAddDevice} className="space-y-4">
                      <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Serial Number</label>
                          <input name="serial" required className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Type</label>
                              <select name="type" className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                                  <option value="Laptop">Laptop</option>
                                  <option value="Tablet">Tablet</option>
                                  <option value="Interactive Panel">Panel</option>
                              </select>
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Model</label>
                              <input name="model" className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
                          </div>
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Assign To</label>
                          <input name="assigned" placeholder="User or Room" className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
                      </div>
                      <div className="flex justify-end space-x-3 pt-4">
                          <button type="button" onClick={() => setShowDeviceModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium">Cancel</button>
                          <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 shadow-md">Register</button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default OrgAdminSettings;
