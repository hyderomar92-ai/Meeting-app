
import React, { useState } from 'react';
import { UserProfile, Student } from '../types'; // Import Student type if exported, otherwise define
import { STUDENTS } from '../data/students'; // We will use this as a base, but ideally props pass the data
import { Users, GraduationCap, Settings, Plus, Search, Trash2, Edit2, Save, Upload, Download, Mail, Shield } from 'lucide-react';

interface OrgAdminSettingsProps {
  currentUser: UserProfile;
  users: UserProfile[]; // Org specific users
  onUpdateUsers: (users: UserProfile[]) => void;
}

const OrgAdminSettings: React.FC<OrgAdminSettingsProps> = ({ currentUser, users, onUpdateUsers }) => {
  const [activeTab, setActiveTab] = useState<'USERS' | 'STUDENTS' | 'SETTINGS'>('USERS');
  
  // User Management State
  const [userSearch, setUserSearch] = useState('');
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);

  // Student Management State - Mocking local state for the list management part
  // In a real app, this would modify the global 'STUDENTS' data source via a prop function
  const [localStudents, setLocalStudents] = useState(STUDENTS); 
  const [studentSearch, setStudentSearch] = useState('');

  const filteredUsers = users.filter(u => u.name.toLowerCase().includes(userSearch.toLowerCase()));
  const filteredStudents = localStudents.filter(s => s.name.toLowerCase().includes(studentSearch.toLowerCase()));

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

  const handleDeleteUser = (id: string) => {
      if(window.confirm('Remove this user from the organization?')) {
          onUpdateUsers(users.filter(u => u.id !== id));
      }
  };

  const handleFileUpload = () => {
      alert("CSV Upload feature would parse a file here and bulk-add students.");
  };

  return (
    <div className="animate-fade-in space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-slate-800">Organization Settings</h1>
        <p className="text-slate-500">Manage staff, students, and school preferences.</p>
      </header>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
          <button 
            onClick={() => setActiveTab('USERS')}
            className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors flex items-center ${activeTab === 'USERS' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
              <Users size={16} className="mr-2" /> Staff Management
          </button>
          <button 
            onClick={() => setActiveTab('STUDENTS')}
            className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors flex items-center ${activeTab === 'STUDENTS' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
              <GraduationCap size={16} className="mr-2" /> Student Roster
          </button>
          <button 
            onClick={() => setActiveTab('SETTINGS')}
            className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors flex items-center ${activeTab === 'SETTINGS' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
              <Settings size={16} className="mr-2" /> General
          </button>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 min-h-[500px]">
          
          {/* USER TAB */}
          {activeTab === 'USERS' && (
              <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                      <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
                          <input 
                              type="text" 
                              value={userSearch}
                              onChange={(e) => setUserSearch(e.target.value)}
                              placeholder="Search staff..." 
                              className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-64"
                          />
                      </div>
                      <button 
                        onClick={() => { setEditingUser(null); setShowUserModal(true); }}
                        className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors"
                      >
                          <Plus size={18} className="mr-2" /> Add Staff Member
                      </button>
                  </div>

                  <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                          <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-xs">
                              <tr>
                                  <th className="px-6 py-3">Name</th>
                                  <th className="px-6 py-3">Role</th>
                                  <th className="px-6 py-3">Email</th>
                                  <th className="px-6 py-3 text-right">Actions</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                              {filteredUsers.map(user => (
                                  <tr key={user.id} className="hover:bg-slate-50">
                                      <td className="px-6 py-3 font-medium text-slate-800 flex items-center">
                                          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold mr-3 text-slate-600">
                                              {user.initials}
                                          </div>
                                          {user.name}
                                      </td>
                                      <td className="px-6 py-3">
                                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                                              user.role === 'DSL' ? 'bg-red-100 text-red-700' :
                                              user.role === 'Head of Year' ? 'bg-purple-100 text-purple-700' :
                                              user.role === 'Admin' ? 'bg-slate-800 text-white' :
                                              'bg-blue-50 text-blue-700'
                                          }`}>
                                              {user.role}
                                          </span>
                                      </td>
                                      <td className="px-6 py-3 text-slate-500">{user.email || 'N/A'}</td>
                                      <td className="px-6 py-3 text-right space-x-2">
                                          <button onClick={() => { setEditingUser(user); setShowUserModal(true); }} className="p-1.5 hover:bg-slate-200 rounded text-slate-500"><Edit2 size={16} /></button>
                                          <button onClick={() => handleDeleteUser(user.id)} className="p-1.5 hover:bg-red-50 rounded text-slate-400 hover:text-red-500"><Trash2 size={16} /></button>
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </div>
          )}

          {/* STUDENTS TAB */}
          {activeTab === 'STUDENTS' && (
              <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                      <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
                          <input 
                              type="text" 
                              value={studentSearch}
                              onChange={(e) => setStudentSearch(e.target.value)}
                              placeholder="Search student roster..." 
                              className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-64"
                          />
                      </div>
                      <div className="flex space-x-3">
                        <button 
                            onClick={handleFileUpload}
                            className="flex items-center px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors"
                        >
                            <Upload size={18} className="mr-2" /> Upload CSV
                        </button>
                        <button className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors">
                            <Plus size={18} className="mr-2" /> Add Student
                        </button>
                      </div>
                  </div>

                  <div className="overflow-x-auto max-h-[600px]">
                      <table className="w-full text-left text-sm">
                          <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-xs sticky top-0">
                              <tr>
                                  <th className="px-6 py-3">ID</th>
                                  <th className="px-6 py-3">Name</th>
                                  <th className="px-6 py-3">Class</th>
                                  <th className="px-6 py-3">Parent Email</th>
                                  <th className="px-6 py-3 text-right">Actions</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                              {filteredStudents.map(student => (
                                  <tr key={student.id} className="hover:bg-slate-50">
                                      <td className="px-6 py-3 text-slate-500 font-mono text-xs">{student.id}</td>
                                      <td className="px-6 py-3 font-medium text-slate-800">{student.name}</td>
                                      <td className="px-6 py-3">
                                          <span className="bg-slate-100 px-2 py-1 rounded text-slate-600 font-medium text-xs">{student.studentClass}</span>
                                      </td>
                                      <td className="px-6 py-3 text-slate-500 max-w-[200px] truncate">{student.fatherEmail || student.motherEmail || '-'}</td>
                                      <td className="px-6 py-3 text-right">
                                          <button className="p-1.5 hover:bg-slate-200 rounded text-slate-500"><Edit2 size={16} /></button>
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </div>
          )}

           {/* SETTINGS TAB */}
           {activeTab === 'SETTINGS' && (
              <div className="p-8 max-w-2xl">
                  <h3 className="text-lg font-bold text-slate-800 mb-6">General Configuration</h3>
                  <div className="space-y-6">
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Organization Name</label>
                          <input type="text" defaultValue="Springfield High School" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Contact Email</label>
                            <input type="email" defaultValue="admin@springfield.edu" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Academic Year</label>
                            <input type="text" defaultValue="2023-2024" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                          </div>
                      </div>

                      <div className="pt-6 border-t border-slate-100">
                          <h4 className="text-sm font-bold text-slate-800 mb-4">Module Management</h4>
                          <div className="space-y-3">
                              <label className="flex items-center justify-between p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                                  <div className="flex items-center">
                                      <Shield className="text-red-500 mr-3" size={20} />
                                      <div>
                                          <p className="text-sm font-medium text-slate-800">Safeguarding Module</p>
                                          <p className="text-xs text-slate-500">Enable advanced reporting and AI risk detection</p>
                                      </div>
                                  </div>
                                  <input type="checkbox" defaultChecked className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500" />
                              </label>
                              
                               <label className="flex items-center justify-between p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                                  <div className="flex items-center">
                                      <Mail className="text-blue-500 mr-3" size={20} />
                                      <div>
                                          <p className="text-sm font-medium text-slate-800">Parent Communication</p>
                                          <p className="text-xs text-slate-500">Allow automatic email reports to parents</p>
                                      </div>
                                  </div>
                                  <input type="checkbox" className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500" />
                              </label>
                          </div>
                      </div>

                      <div className="pt-6">
                          <button className="px-6 py-2 bg-slate-900 text-white rounded-lg font-bold hover:bg-black transition-colors">
                              Save Changes
                          </button>
                      </div>
                  </div>
              </div>
          )}
      </div>

      {/* User Modal */}
      {showUserModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-slide-up">
                  <h3 className="text-lg font-bold text-slate-800 mb-4">{editingUser ? 'Edit Staff Member' : 'Add New Staff'}</h3>
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
                      <div className="flex justify-end gap-3 pt-4">
                          <button type="button" onClick={() => setShowUserModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium">Cancel</button>
                          <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700">Save User</button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default OrgAdminSettings;
