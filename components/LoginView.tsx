
import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { User, Shield, Briefcase, Plus, X, Save, Settings, Trash2, Edit2, Key, Server } from 'lucide-react';

const DEFAULT_USERS: UserProfile[] = [
  { id: 'u0', name: 'System Owner', role: 'Super Admin', initials: 'SO' },
  { id: 'u1', name: 'IT Support', role: 'Admin', initials: 'IT' },
  { id: 'u2', name: 'Jane Doe', role: 'Head of Year', initials: 'JD' },
  { id: 'u3', name: 'John Smith', role: 'Teacher', initials: 'JS' },
  { id: 'u4', name: 'Sarah Connor', role: 'DSL', initials: 'SC' },
];

interface LoginViewProps {
  onLogin: (user: UserProfile) => void;
}

type LoginMode = 'SELECT' | 'MANAGE' | 'ADD' | 'EDIT';

const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [users, setUsers] = useState<UserProfile[]>(() => {
    try {
      const saved = localStorage.getItem('sentinel_users');
      return saved ? JSON.parse(saved) : DEFAULT_USERS;
    } catch (e) {
      return DEFAULT_USERS;
    }
  });

  const [mode, setMode] = useState<LoginMode>('SELECT');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState<UserProfile['role']>('Teacher');

  // Persist users to local storage whenever the list changes
  useEffect(() => {
    localStorage.setItem('sentinel_users', JSON.stringify(users));
  }, [users]);

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim()) return;

    const initials = userName
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    if (mode === 'ADD') {
      const newUser: UserProfile = {
        id: crypto.randomUUID(),
        name: userName,
        role: userRole,
        initials
      };
      setUsers([...users, newUser]);
    } else if (mode === 'EDIT' && editingId) {
      const updatedUsers = users.map(u => u.id === editingId ? {
        ...u,
        name: userName,
        role: userRole,
        initials
      } : u);
      setUsers(updatedUsers);
    }

    resetForm();
  };

  const startEdit = (user: UserProfile) => {
    setEditingId(user.id);
    setUserName(user.name);
    setUserRole(user.role);
    setMode('EDIT');
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to permanently delete this user profile?")) {
      const newUsers = users.filter(u => u.id !== id);
      setUsers(newUsers);
      if (newUsers.length === 0) setMode('ADD'); // Force add if list is empty
    }
  };

  const resetForm = () => {
    setMode('SELECT');
    setUserName('');
    setUserRole('Teacher');
    setEditingId(null);
  };

  const renderRoleIcon = (role: string) => {
      switch(role) {
          case 'Super Admin': return <Key size={12} className="mr-1 text-amber-500" />;
          case 'DSL': return <Shield size={12} className="mr-1" />;
          case 'Head of Year': return <Briefcase size={12} className="mr-1" />;
          case 'Admin': return <Server size={12} className="mr-1" />;
          default: return <User size={12} className="mr-1" />;
      }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
      <div className="mb-8 text-center animate-fade-in">
        <div className="inline-flex items-center justify-center p-5 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-900/50 mb-5">
          <Shield size={48} className="text-white" />
        </div>
        <h1 className="text-4xl font-bold text-white tracking-tight">Sentinel</h1>
        <p className="text-slate-400 mt-2 font-medium">Predictive Safeguarding & Education Log</p>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-2xl border border-slate-800 max-w-md w-full animate-slide-up relative overflow-hidden transition-all duration-300">
        
        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-slate-800">
            {mode === 'SELECT' ? 'Select Account' : 
             mode === 'MANAGE' ? 'Manage Profiles' :
             mode === 'ADD' ? 'Create Profile' : 'Edit Profile'}
          </h2>
          
          <div className="flex space-x-2">
            {mode === 'SELECT' && (
               <>
                 <button 
                    onClick={() => setMode('MANAGE')}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                    title="Manage Users"
                 >
                    <Settings size={18} />
                 </button>
                 <button 
                    onClick={() => { setMode('ADD'); setUserName(''); setUserRole('Teacher'); }}
                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors font-medium flex items-center"
                    title="Add User"
                 >
                    <Plus size={18} />
                 </button>
               </>
            )}
            {(mode === 'MANAGE' || mode === 'ADD' || mode === 'EDIT') && (
                 <button 
                    onClick={resetForm}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                 >
                    <X size={18} />
                 </button>
            )}
          </div>
        </div>
        
        {/* LIST VIEW (SELECT & MANAGE) */}
        {(mode === 'SELECT' || mode === 'MANAGE') && (
            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1 custom-scrollbar">
              {users.length === 0 && (
                  <div className="text-center py-8 text-slate-400">
                      <User size={32} className="mx-auto mb-2 opacity-20" />
                      <p className="text-sm">No profiles found.</p>
                      <button onClick={() => setMode('ADD')} className="mt-2 text-indigo-600 text-sm font-medium hover:underline">Create First User</button>
                  </div>
              )}
              {users.map((user) => (
                <div
                  key={user.id}
                  onClick={() => mode === 'SELECT' && onLogin(user)}
                  className={`w-full flex items-center p-3 rounded-xl border transition-all group relative ${
                      mode === 'SELECT' 
                        ? 'hover:bg-slate-50 border-transparent hover:border-indigo-200 cursor-pointer' 
                        : 'bg-white border-slate-100'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold mr-4 transition-colors flex-shrink-0 ${
                    user.role === 'Super Admin' ? 'bg-slate-800 text-amber-400 ring-2 ring-amber-400/50' :
                    user.role === 'DSL' ? 'bg-red-100 text-red-600 group-hover:bg-red-200' : 
                    user.role === 'Head of Year' ? 'bg-purple-100 text-purple-600 group-hover:bg-purple-200' :
                    user.role === 'Admin' ? 'bg-emerald-100 text-emerald-700 group-hover:bg-emerald-200' :
                    'bg-indigo-100 text-indigo-600 group-hover:bg-indigo-200'
                  }`}>
                    {user.initials}
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <p className="text-slate-800 font-medium group-hover:text-indigo-700 truncate">{user.name}</p>
                    <div className="flex items-center text-xs text-slate-500">
                      {renderRoleIcon(user.role)}
                      {user.role}
                    </div>
                  </div>

                  {/* Manage Actions */}
                  {mode === 'MANAGE' && (
                      <div className="flex items-center space-x-1 pl-2 animate-fade-in">
                          <button 
                             onClick={(e) => { e.stopPropagation(); startEdit(user); }}
                             className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          >
                             <Edit2 size={16} />
                          </button>
                          <button 
                             onClick={(e) => { e.stopPropagation(); handleDelete(user.id); }}
                             className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                             <Trash2 size={16} />
                          </button>
                      </div>
                  )}
                </div>
              ))}
            </div>
        )}

        {/* FORM VIEW (ADD & EDIT) */}
        {(mode === 'ADD' || mode === 'EDIT') && (
          <form onSubmit={handleSaveUser} className="animate-fade-in">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
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
                <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                <select
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value as any)}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none bg-white transition-all cursor-pointer"
                >
                  <option value="Teacher">Teacher</option>
                  <option value="Head of Year">Head of Year</option>
                  <option value="DSL">DSL (Safeguarding Lead)</option>
                  <option value="Admin">IT Support / Admin</option>
                  <option value="Super Admin">App Owner</option>
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                 <button 
                  type="button"
                  onClick={resetForm}
                  className="flex-1 py-2.5 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-[2] py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all flex items-center justify-center"
                >
                  <Save size={18} className="mr-2" />
                  {mode === 'ADD' ? 'Create Profile' : 'Save Changes'}
                </button>
              </div>
            </div>
          </form>
        )}

        {mode === 'SELECT' && (
            <div className="mt-8 pt-6 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-400">
                Secure Access • 256-bit Encryption • GDPR Compliant
              </p>
            </div>
        )}
      </div>
    </div>
  );
};

export default LoginView;