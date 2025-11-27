
import React, { useState, useMemo } from 'react';
import { UserProfile, RoleDefinition } from '../types';
import { Search, User, Plus, Edit2, Trash2, Lock, Unlock, KeyRound, Power, Link, CheckCircle2, X, Save, Mail, Shield, Layers } from 'lucide-react';
import { STUDENTS } from '../data/students';

interface SuperAdminUserManagementProps {
  users: UserProfile[];
  onUpdateUsers: (users: UserProfile[]) => void;
  roles?: RoleDefinition[];
}

const SuperAdminUserManagement: React.FC<SuperAdminUserManagementProps> = ({ users, onUpdateUsers, roles = [] }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  
  // Form specific state for scope
  const [selectedYearGroups, setSelectedYearGroups] = useState<string[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>('Teacher');

  // Extract unique years from student data
  const availableYears = useMemo(() => {
      const years = new Set(STUDENTS.map(s => s.studentClass ? s.studentClass.substring(0, 2) : '').filter(Boolean));
      return Array.from(years).sort();
  }, []);

  // Filter Users
  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Use dynamic roles or default if empty
  const roleOptions = useMemo(() => {
      if (roles.length > 0) {
          // Filter to show system roles + potentially any roles relevant to context if available
          // For Super Admin global view, showing System Roles is safest default
          return roles.filter(r => r.isSystem);
      }
      return [
          { id: 'def-t', name: 'Teacher' },
          { id: 'def-hoy', name: 'Head of Year' },
          { id: 'def-dsl', name: 'DSL' },
          { id: 'def-admin', name: 'IT Admin' },
          { id: 'def-super', name: 'Super Admin' }
      ];
  }, [roles]);

  // CRUD Handlers
  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const role = formData.get('role') as any;
    const orgId = formData.get('orgId') as string;
    
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    const userScope = (role === 'Head of Year' || role === 'Teacher') ? selectedYearGroups : undefined;

    if (editingUser) {
      // Edit Mode
      const updatedUsers = users.map(u => u.id === editingUser.id ? {
        ...u,
        name,
        email,
        role,
        orgId,
        initials,
        allowedYearGroups: userScope
      } : u);
      onUpdateUsers(updatedUsers);
      if (selectedUser?.id === editingUser.id) {
          setSelectedUser({ ...selectedUser, name, email, role, orgId, initials, allowedYearGroups: userScope });
      }
      showFeedback(`User ${name} updated successfully.`);
    } else {
      // Add Mode
      const newUser: UserProfile = {
        id: crypto.randomUUID(),
        name,
        email,
        role,
        orgId,
        initials,
        status: 'Active',
        allowedYearGroups: userScope
      };
      onUpdateUsers([...users, newUser]);
      showFeedback(`User ${name} created successfully.`);
    }
    closeModal();
  };

  const handleDeleteUser = (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      onUpdateUsers(users.filter(u => u.id !== userId));
      if (selectedUser?.id === userId) setSelectedUser(null);
      showFeedback('User deleted successfully.');
    }
  };

  // Action Handlers
  const handleUserAction = (action: string) => {
    if (!selectedUser) return;
    let updatedUser = { ...selectedUser };
    let message = '';

    switch (action) {
      case 'LOCK':
        updatedUser.status = 'Locked';
        message = 'Account locked.';
        break;
      case 'UNLOCK':
        updatedUser.status = 'Active';
        message = 'Account unlocked.';
        break;
      case 'RESET_PASSWORD':
        message = 'Password reset email sent.';
        break;
      case 'FORCE_LOGOUT':
        message = 'Active sessions terminated.';
        break;
      case 'MAGIC_LINK':
        message = 'Magic link generated.';
        break;
    }

    if (updatedUser.status !== selectedUser.status) {
      onUpdateUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
      setSelectedUser(updatedUser);
    }
    showFeedback(message);
  };

  const showFeedback = (msg: string) => {
    setActionFeedback(msg);
    setTimeout(() => setActionFeedback(null), 3000);
  };

  const openModal = (user?: UserProfile) => {
    setEditingUser(user || null);
    setSelectedYearGroups(user?.allowedYearGroups || []);
    setSelectedRole(user?.role || 'Teacher');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setEditingUser(null);
    setIsModalOpen(false);
  };

  const toggleYearGroup = (year: string) => {
      setSelectedYearGroups(prev => 
          prev.includes(year) ? prev.filter(y => y !== year) : [...prev, year]
      );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
      {/* Left Column: User List */}
      <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search users..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <button 
            onClick={() => openModal()}
            className="w-full py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center"
          >
            <Plus size={16} className="mr-2" /> Add New User
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <User size={24} className="mx-auto mb-2 opacity-20" />
              <p className="text-xs">No users found.</p>
            </div>
          ) : (
            filteredUsers.map(u => (
              <div 
                key={u.id}
                onClick={() => setSelectedUser(u)}
                className={`p-3 rounded-lg cursor-pointer transition-colors border mb-2 flex items-center justify-between ${selectedUser?.id === u.id ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-300' : 'bg-white border-slate-100 hover:bg-slate-50'}`}
              >
                <div className="flex items-center overflow-hidden">
                   <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mr-3 flex-shrink-0 ${u.status === 'Locked' ? 'bg-slate-200 text-slate-500' : 'bg-indigo-100 text-indigo-600'}`}>
                      {u.status === 'Locked' ? <Lock size={12} /> : u.initials}
                   </div>
                   <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">{u.name}</p>
                      <p className="text-[10px] text-slate-500 truncate">{u.email}</p>
                   </div>
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ml-2 flex-shrink-0 ${u.status === 'Locked' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                    {u.status || 'Active'}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Column: User Detail */}
      <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-8 flex flex-col relative">
        {selectedUser ? (
          <div className="h-full flex flex-col">
            <div className="flex justify-between items-start mb-6">
               <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-2xl font-bold text-slate-600 border-2 border-slate-200">
                      {selectedUser.initials}
                  </div>
                  <div>
                      <h2 className="text-2xl font-bold text-slate-800">{selectedUser.name}</h2>
                      <div className="flex items-center space-x-2 mt-1">
                          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold uppercase">{selectedUser.role}</span>
                          <span className={`text-xs px-2 py-0.5 rounded font-bold uppercase ${selectedUser.status === 'Locked' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                              {selectedUser.status || 'Active'}
                          </span>
                      </div>
                  </div>
               </div>
               <div className="flex space-x-2">
                  <button onClick={() => openModal(selectedUser)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Edit User">
                      <Edit2 size={18} />
                  </button>
                  <button onClick={() => handleDeleteUser(selectedUser.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete User">
                      <Trash2 size={18} />
                  </button>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                    <p className="text-xs font-bold text-slate-400 uppercase mb-1">Contact Email</p>
                    <p className="text-sm font-medium text-slate-700 flex items-center">
                        <Mail size={14} className="mr-2 text-slate-400" />
                        {selectedUser.email || 'No email configured'}
                    </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                    <p className="text-xs font-bold text-slate-400 uppercase mb-1">Organization ID</p>
                    <p className="text-sm font-medium text-slate-700 flex items-center">
                        <Shield size={14} className="mr-2 text-slate-400" />
                        {selectedUser.orgId || 'Global System'}
                    </p>
                </div>
            </div>

            {selectedUser.allowedYearGroups && selectedUser.allowedYearGroups.length > 0 && (
                <div className="mb-8 p-4 bg-indigo-50 border border-indigo-100 rounded-lg">
                    <p className="text-xs font-bold text-indigo-400 uppercase mb-2 flex items-center">
                        <Layers size={12} className="mr-1" /> Access Scope
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {selectedUser.allowedYearGroups.map(year => (
                            <span key={year} className="px-2 py-1 bg-white text-indigo-600 border border-indigo-200 rounded text-xs font-bold">
                                Year {year}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            <h3 className="text-sm font-bold text-slate-800 uppercase mb-3 border-b border-slate-100 pb-2">Security Actions</h3>
            <div className="grid grid-cols-2 gap-4">
                {selectedUser.status === 'Locked' ? (
                    <button onClick={() => handleUserAction('UNLOCK')} className="flex items-center justify-center p-3 border border-slate-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-all group text-sm font-medium text-slate-600 hover:text-green-700">
                        <Unlock size={16} className="mr-2" /> Unlock Account
                    </button>
                ) : (
                    <button onClick={() => handleUserAction('LOCK')} className="flex items-center justify-center p-3 border border-slate-200 rounded-lg hover:border-red-300 hover:bg-red-50 transition-all group text-sm font-medium text-slate-600 hover:text-red-700">
                        <Lock size={16} className="mr-2" /> Lock Account
                    </button>
                )}
                <button onClick={() => handleUserAction('RESET_PASSWORD')} className="flex items-center justify-center p-3 border border-slate-200 rounded-lg hover:border-amber-300 hover:bg-amber-50 transition-all group text-sm font-medium text-slate-600 hover:text-amber-700">
                    <KeyRound size={16} className="mr-2" /> Reset Password
                </button>
                <button onClick={() => handleUserAction('FORCE_LOGOUT')} className="flex items-center justify-center p-3 border border-slate-200 rounded-lg hover:border-slate-400 hover:bg-slate-50 transition-all group text-sm font-medium text-slate-600 hover:text-slate-800">
                    <Power size={16} className="mr-2" /> Force Logout
                </button>
                <button onClick={() => handleUserAction('MAGIC_LINK')} className="flex items-center justify-center p-3 border border-slate-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all group text-sm font-medium text-slate-600 hover:text-blue-700">
                    <Link size={16} className="mr-2" /> Send Magic Link
                </button>
            </div>

            {actionFeedback && (
                <div className="absolute bottom-6 left-8 right-8 p-3 bg-slate-800 text-white rounded-lg text-sm font-bold text-center flex items-center justify-center animate-slide-up shadow-lg">
                    <CheckCircle2 size={16} className="mr-2 text-green-400" /> {actionFeedback}
                </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
             <User size={48} className="mb-4 opacity-20" />
             <p>Select a user to view details.</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-slide-up flex flex-col max-h-[90vh] overflow-hidden">
              <div className="flex justify-between items-center mb-6 flex-shrink-0">
                  <h3 className="text-lg font-bold text-slate-800">
                      {editingUser ? 'Edit User Profile' : 'Create New User'}
                  </h3>
                  <button onClick={closeModal} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
              </div>
              <form onSubmit={handleSaveUser} className="space-y-4 overflow-y-auto px-1 custom-scrollbar">
                  <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Full Name</label>
                      <input name="name" defaultValue={editingUser?.name} required className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label>
                      <input name="email" type="email" defaultValue={editingUser?.email} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                      <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Role</label>
                          <select 
                            name="role" 
                            value={selectedRole} 
                            onChange={(e) => setSelectedRole(e.target.value)} 
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                          >
                              {roleOptions.map(r => (
                                  <option key={r.id} value={r.name}>{r.name}</option>
                              ))}
                          </select>
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Org ID</label>
                          <input name="orgId" defaultValue={editingUser?.orgId} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Optional" />
                      </div>
                  </div>

                  {/* Scope Selection for specific roles */}
                  {(selectedRole === 'Head of Year' || selectedRole === 'Teacher') && (
                      <div className="pt-2 border-t border-slate-100">
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Access Scope (Year Groups)</label>
                          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                              {availableYears.map(year => (
                                  <button
                                    key={year}
                                    type="button"
                                    onClick={() => toggleYearGroup(year)}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                                        selectedYearGroups.includes(year) 
                                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' 
                                        : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300'
                                    }`}
                                  >
                                      Year {year}
                                  </button>
                              ))}
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1">
                              Select which year groups this user can view in Class Manager.
                          </p>
                      </div>
                  )}

                  <div className="flex justify-end pt-4">
                      <button type="submit" className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors">
                          {editingUser ? 'Save Changes' : 'Create User'}
                      </button>
                  </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminUserManagement;
