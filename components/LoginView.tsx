
import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { User, Shield, GraduationCap, Briefcase, Plus, X, Save } from 'lucide-react';

const DEFAULT_USERS: UserProfile[] = [
  { id: 'u1', name: 'Jane Doe', role: 'Head of Year', initials: 'JD' },
  { id: 'u2', name: 'John Smith', role: 'Teacher', initials: 'JS' },
  { id: 'u3', name: 'Sarah Connor', role: 'DSL', initials: 'SC' },
  { id: 'u4', name: 'Emily Blunt', role: 'Admin', initials: 'EB' },
];

interface LoginViewProps {
  onLogin: (user: UserProfile) => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [users, setUsers] = useState<UserProfile[]>(() => {
    try {
      const saved = localStorage.getItem('edulog_users');
      return saved ? JSON.parse(saved) : DEFAULT_USERS;
    } catch (e) {
      return DEFAULT_USERS;
    }
  });

  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserProfile['role']>('Teacher');

  useEffect(() => {
    localStorage.setItem('edulog_users', JSON.stringify(users));
  }, [users]);

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim()) return;

    const initials = newUserName
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    const newUser: UserProfile = {
      id: crypto.randomUUID(),
      name: newUserName,
      role: newUserRole,
      initials
    };

    setUsers([...users, newUser]);
    setIsAddingUser(false);
    setNewUserName('');
    setNewUserRole('Teacher');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="mb-8 text-center animate-fade-in">
        <div className="inline-flex items-center justify-center p-4 bg-blue-600 rounded-2xl shadow-lg mb-4">
          <GraduationCap size={48} className="text-white" />
        </div>
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">EduLog Pro</h1>
        <p className="text-slate-500 mt-2">AI-Powered Educational Documentation</p>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100 max-w-md w-full animate-slide-up relative overflow-hidden">
        
        {!isAddingUser ? (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-slate-800">Select User Account</h2>
              <button 
                onClick={() => setIsAddingUser(true)}
                className="text-xs flex items-center text-blue-600 hover:text-blue-700 font-medium"
              >
                <Plus size={14} className="mr-1" /> Add User
              </button>
            </div>
            
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {users.map((user) => (
                <button
                  key={user.id}
                  onClick={() => onLogin(user)}
                  className="w-full flex items-center p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-blue-200 transition-all group"
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold mr-4 transition-colors ${
                    user.role === 'DSL' ? 'bg-red-100 text-red-600 group-hover:bg-red-200' : 
                    user.role === 'Head of Year' ? 'bg-indigo-100 text-indigo-600 group-hover:bg-indigo-200' :
                    'bg-blue-100 text-blue-600 group-hover:bg-blue-200'
                  }`}>
                    {user.initials}
                  </div>
                  <div className="text-left flex-1">
                    <p className="text-slate-800 font-medium group-hover:text-blue-700">{user.name}</p>
                    <div className="flex items-center text-xs text-slate-500">
                      {user.role === 'DSL' && <Shield size={12} className="mr-1" />}
                      {user.role === 'Head of Year' && <Briefcase size={12} className="mr-1" />}
                      {user.role === 'Teacher' && <User size={12} className="mr-1" />}
                      {user.role}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-400">
                Secure Access • 256-bit Encryption • GDPR Compliant
              </p>
            </div>
          </>
        ) : (
          <form onSubmit={handleAddUser} className="animate-fade-in">
             <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-slate-800">New User Profile</h2>
              <button 
                type="button"
                onClick={() => setIsAddingUser(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input 
                  type="text" 
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g. Alice Johnson"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as any)}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  <option value="Teacher">Teacher</option>
                  <option value="Head of Year">Head of Year</option>
                  <option value="DSL">DSL (Safeguarding Lead)</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>

              <div className="pt-4">
                <button 
                  type="submit"
                  className="w-full py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all flex items-center justify-center"
                >
                  <Save size={18} className="mr-2" />
                  Create Profile
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default LoginView;
