
import React, { useState, useMemo } from 'react';
import { UserProfile, Organization } from '../types';
import { User, Shield, Briefcase, Plus, X, Save, Settings, Trash2, Edit2, Key, RefreshCw, Building2, ChevronRight, LogIn, ArrowLeft } from 'lucide-react';

interface LoginViewProps {
  onLogin: (user: UserProfile) => void;
  users: UserProfile[];
  onUpdateUsers: (users: UserProfile[]) => void;
  organizations?: Organization[];
  onDeleteUserRequest?: (id: string) => void;
  onResetSystemRequest?: () => void;
}

interface ConfirmationState {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    isDestructive?: boolean;
}

type LoginMode = 'ORG_SELECT' | 'USER_SELECT' | 'ADD' | 'EDIT';

const LoginView: React.FC<LoginViewProps> = ({ onLogin, users, onUpdateUsers, organizations = [], onDeleteUserRequest, onResetSystemRequest }) => {
  const [mode, setMode] = useState<LoginMode>('ORG_SELECT');
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Confirmation Modal State
  const [confirmation, setConfirmation] = useState<ConfirmationState>({
      isOpen: false,
      title: '',
      message: '',
      onConfirm: () => {},
  });

  // Form State
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState<UserProfile['role']>('Teacher');

  // Group Users by Organization
  const { superAdmins, orgUsers } = useMemo(() => {
      const superAdmins = users.filter(u => u.role === 'Super Admin');
      const orgUsers = users.filter(u => u.role !== 'Super Admin');
      return { superAdmins, orgUsers };
  }, [users]);

  // Users to display based on selection
  const displayedUsers = useMemo(() => {
      if (selectedOrgId === 'SUPER_ADMIN') return superAdmins;
      if (selectedOrgId) return orgUsers.filter(u => u.orgId === selectedOrgId);
      return [];
  }, [selectedOrgId, superAdmins, orgUsers]);

  const selectedOrgName = useMemo(() => {
      if (selectedOrgId === 'SUPER_ADMIN') return 'Sentinel Command';
      return organizations.find(o => o.id === selectedOrgId)?.name || 'Unknown Organization';
  }, [selectedOrgId, organizations]);

  // --- Actions ---

  const handleOrgSelect = (orgId: string) => {
      setSelectedOrgId(orgId);
      setMode('USER_SELECT');
  };

  const handleBack = () => {
      setMode('ORG_SELECT');
      setSelectedOrgId(null);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim()) return;

    const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    if (mode === 'ADD') {
      const newUser: UserProfile = {
        id: crypto.randomUUID(),
        name: userName,
        role: userRole,
        initials,
        orgId: selectedOrgId === 'SUPER_ADMIN' ? undefined : selectedOrgId || 'org-1', // Default to org-1 if manual add
        status: 'Active'
      };
      onUpdateUsers([...users, newUser]);
    } else if (mode === 'EDIT' && editingId) {
      const updatedUsers = users.map(u => u.id === editingId ? {
        ...u,
        name: userName,
        role: userRole,
        initials
      } : u);
      onUpdateUsers(updatedUsers);
    }

    resetForm();
  };

  const startEdit = (user: UserProfile) => {
    setEditingId(user.id);
    setUserName(user.name);
    setUserRole(user.role);
    setMode('EDIT');
  };

  const handleDeleteRequest = (id: string) => {
      setConfirmation({
          isOpen: true,
          title: 'Delete Profile',
          message: 'Are you sure you want to delete this user profile? This cannot be undone.',
          isDestructive: true,
          onConfirm: () => {
              if (onDeleteUserRequest) {
                  onDeleteUserRequest(id);
              } else {
                  // Fallback if prop not provided
                  const newUsers = users.filter(u => u.id !== id);
                  onUpdateUsers(newUsers);
              }
              setConfirmation(prev => ({ ...prev, isOpen: false }));
          }
      });
  };

  const handleResetSystemRequest = () => {
      setConfirmation({
          isOpen: true,
          title: 'System Reset',
          message: 'WARNING: This will delete ALL local data (logs, users, settings) and reload the application. Are you sure?',
          isDestructive: true,
          onConfirm: () => {
              if (onResetSystemRequest) {
                  onResetSystemRequest();
              } else {
                  localStorage.clear();
                  window.location.reload();
              }
          }
      });
  };

  const resetForm = () => {
    setMode('USER_SELECT');
    setUserName('');
    setUserRole('Teacher');
    setEditingId(null);
  };

  const renderRoleIcon = (role: string) => {
      switch(role) {
          case 'Super Admin': return <Key size={14} className="text-amber-500" />;
          case 'DSL': return <Shield size={14} className="text-red-500" />;
          case 'Head of Year': return <Briefcase size={14} className="text-purple-500" />;
          default: return <User size={14} className="text-blue-500" />;
      }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
      {/* Background Decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[100px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[100px]"></div>
      </div>

      <div className="mb-8 text-center animate-fade-in z-10">
        <div className="inline-flex items-center justify-center p-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl mb-5">
          <Shield size={40} className="text-white" />
        </div>
        <h1 className="text-4xl font-black text-white tracking-tight">Sentinel</h1>
        <p className="text-slate-400 mt-2 font-medium text-lg">Education Safeguarding Intelligence</p>
      </div>

      <div className="bg-white rounded-2xl shadow-2xl border border-slate-800 w-full max-w-md animate-slide-up relative overflow-hidden z-10 flex flex-col max-h-[600px]">
        
        {/* HEADER */}
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            {mode !== 'ORG_SELECT' && (
                <button onClick={handleBack} className="mr-3 p-1 hover:bg-slate-200 rounded-full transition-colors">
                    <ArrowLeft size={20} className="text-slate-600" />
                </button>
            )}
            
            <div className="flex-1">
                <h2 className="text-lg font-bold text-slate-800 leading-tight">
                    {mode === 'ORG_SELECT' ? 'Select Organization' : 
                     mode === 'USER_SELECT' ? selectedOrgName :
                     mode === 'ADD' ? 'New User' : 'Edit User'}
                </h2>
                {mode === 'USER_SELECT' && <p className="text-xs text-slate-500">Select account to login</p>}
            </div>

            {(mode === 'USER_SELECT' || mode === 'ADD' || mode === 'EDIT') && (
                <div className="flex space-x-1">
                    {mode === 'USER_SELECT' ? (
                        <button 
                            onClick={() => { setMode('ADD'); setUserName(''); setUserRole('Teacher'); }}
                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Create User"
                        >
                            <Plus size={20} />
                        </button>
                    ) : (
                        <button 
                            onClick={resetForm}
                            className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            <X size={20} />
                        </button>
                    )}
                </div>
            )}
        </div>
        
        {/* BODY CONTENT */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-50/30">
            
            {/* VIEW 1: ORGANIZATION SELECT */}
            {mode === 'ORG_SELECT' && (
                <div className="space-y-3">
                    {/* Super Admin Entry */}
                    <button 
                        onClick={() => handleOrgSelect('SUPER_ADMIN')}
                        className="w-full flex items-center p-4 bg-slate-800 text-white rounded-xl shadow-md hover:bg-slate-900 transition-all group border border-slate-700"
                    >
                        <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center mr-4 border border-slate-600 group-hover:border-amber-500/50 transition-colors">
                            <Key size={20} className="text-amber-400" />
                        </div>
                        <div className="text-left flex-1">
                            <p className="font-bold">System Command</p>
                            <p className="text-xs text-slate-400">Super Admin Access</p>
                        </div>
                        <ChevronRight size={20} className="text-slate-500 group-hover:text-white transition-colors" />
                    </button>

                    <div className="relative py-2">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
                        <div className="relative flex justify-center"><span className="bg-slate-50 px-2 text-xs text-slate-400 font-medium uppercase">Organizations</span></div>
                    </div>

                    {organizations.length === 0 ? (
                        <div className="text-center py-8 text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
                            <Building2 size={32} className="mx-auto mb-2 opacity-20" />
                            <p className="text-sm">No organizations found.</p>
                            <p className="text-xs">Please login as Super Admin to onboard tenants.</p>
                        </div>
                    ) : (
                        organizations.map(org => (
                            <button 
                                key={org.id}
                                onClick={() => handleOrgSelect(org.id)}
                                className="w-full flex items-center p-4 bg-white rounded-xl border border-slate-200 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all group text-left"
                            >
                                <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-lg mr-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                    {org.name.charAt(0)}
                                </div>
                                <div className="flex-1">
                                    <p className="font-bold text-slate-700 group-hover:text-indigo-700">{org.name}</p>
                                    <div className="flex items-center text-xs text-slate-500 mt-0.5">
                                        <span className={`w-2 h-2 rounded-full mr-1.5 ${org.status === 'Active' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                                        {org.type} • {org.status}
                                    </div>
                                </div>
                                <ChevronRight size={20} className="text-slate-300 group-hover:text-indigo-400" />
                            </button>
                        ))
                    )}
                </div>
            )}

            {/* VIEW 2: USER SELECT */}
            {mode === 'USER_SELECT' && (
                <div className="space-y-3">
                    {displayedUsers.length === 0 ? (
                        <div className="text-center py-12 text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
                            <User size={32} className="mx-auto mb-2 opacity-20" />
                            <p className="text-sm font-medium">No users found for this organization.</p>
                            <button onClick={() => setMode('ADD')} className="mt-3 text-indigo-600 text-xs font-bold hover:underline flex items-center justify-center">
                                <Plus size={14} className="mr-1"/> Create First User
                            </button>
                        </div>
                    ) : (
                        displayedUsers.map(user => (
                            <div key={user.id} className="group relative flex items-center p-3 bg-white rounded-xl border border-slate-200 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer"
                                onClick={() => onLogin(user)}
                            >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold mr-4 transition-colors flex-shrink-0 ${
                                    user.role === 'Super Admin' ? 'bg-slate-800 text-amber-400' :
                                    'bg-slate-100 text-slate-600 group-hover:bg-indigo-100 group-hover:text-indigo-700'
                                }`}>
                                    {user.initials}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-slate-800 group-hover:text-indigo-700 truncate">{user.name}</p>
                                    <div className="flex items-center text-xs text-slate-500 mt-0.5">
                                        {renderRoleIcon(user.role)}
                                        <span className="ml-1">{user.role}</span>
                                    </div>
                                </div>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 absolute right-3 bg-white pl-2 shadow-[-10px_0_10px_white]">
                                    <button onClick={(e) => { e.stopPropagation(); startEdit(user); }} className="p-1.5 text-slate-400 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 rounded-md">
                                        <Edit2 size={14} />
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); handleDeleteRequest(user.id); }} className="p-1.5 text-slate-400 hover:text-red-600 bg-slate-50 hover:bg-red-50 rounded-md">
                                        <Trash2 size={14} />
                                    </button>
                                    <div className="w-px h-4 bg-slate-200 mx-1"></div>
                                    <div className="p-1.5 text-indigo-600">
                                        <LogIn size={16} />
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* VIEW 3: ADD / EDIT FORM */}
            {(mode === 'ADD' || mode === 'EDIT') && (
                <form onSubmit={handleSaveUser} className="space-y-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Full Name</label>
                        <input 
                            type="text" 
                            value={userName}
                            onChange={(e) => setUserName(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            placeholder="e.g. Alice Johnson"
                            required
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Role</label>
                        <select
                            value={userRole}
                            onChange={(e) => setUserRole(e.target.value as any)}
                            className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none bg-white cursor-pointer"
                        >
                            {selectedOrgId === 'SUPER_ADMIN' ? (
                                <option value="Super Admin">Super Admin</option>
                            ) : (
                                <>
                                    <option value="Teacher">Teacher</option>
                                    <option value="Head of Year">Head of Year</option>
                                    <option value="DSL">DSL (Safeguarding Lead)</option>
                                    <option value="Admin">Org Admin</option>
                                </>
                            )}
                        </select>
                    </div>

                    <div className="pt-4">
                        <button 
                            type="submit"
                            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all flex items-center justify-center"
                        >
                            <Save size={18} className="mr-2" />
                            {mode === 'ADD' ? 'Create User' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            )}
        </div>
      </div>

      {/* Footer / System Reset */}
      <button 
        onClick={handleResetSystemRequest}
        className="fixed bottom-4 right-4 text-xs font-medium text-slate-500 hover:text-red-400 flex items-center opacity-30 hover:opacity-100 transition-all z-50"
        title="Delete all local data"
      >
        <RefreshCw size={12} className="mr-1" /> Reset System
      </button>

      {/* Confirmation Modal */}
      {confirmation.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
              <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-slate-200 transform scale-100 transition-all">
                  <h3 className={`text-lg font-bold mb-2 ${confirmation.isDestructive ? 'text-red-600' : 'text-slate-800'}`}>
                      {confirmation.title}
                  </h3>
                  <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                      {confirmation.message}
                  </p>
                  <div className="flex justify-end space-x-3">
                      <button 
                          onClick={() => setConfirmation(prev => ({ ...prev, isOpen: false }))}
                          className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium text-sm transition-colors"
                      >
                          Cancel
                      </button>
                      <button 
                          onClick={confirmation.onConfirm}
                          className={`px-4 py-2 text-white rounded-lg font-bold text-sm shadow-md transition-colors ${
                              confirmation.isDestructive ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'
                          }`}
                      >
                          Confirm
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default LoginView;
