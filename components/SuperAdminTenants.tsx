
import React, { useState } from 'react';
import { Organization, UserProfile } from '../types';
import { Building2, Search, Globe, Plus, Trash2, Edit, CheckCircle2, X, Settings, Shield, BrainCircuit, MessageSquare, CreditCard, Eye } from 'lucide-react';

interface SuperAdminTenantsProps {
  organizations: Organization[];
  onAddOrg: (org: Organization, initialAdmin?: UserProfile) => void;
  onUpdateOrg: (org: Organization) => void;
  onImpersonate: (orgId: string) => void;
}

const SuperAdminTenants: React.FC<SuperAdminTenantsProps> = ({ organizations, onAddOrg, onUpdateOrg, onImpersonate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterType, setFilterType] = useState('All');
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);

  const filteredOrgs = organizations.filter(o => {
      const matchSearch = o.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchType = filterType === 'All' || o.type === filterType;
      return matchSearch && matchType;
  });

  const handleCreateOrg = (e: React.FormEvent) => {
      e.preventDefault();
      const form = e.target as HTMLFormElement;
      const formData = new FormData(form);
      
      const orgId = crypto.randomUUID();
      const orgName = formData.get('orgName') as string;

      const newOrg: Organization = {
          id: orgId,
          name: orgName,
          type: formData.get('orgType') as any,
          status: 'Active',
          licenseTier: formData.get('licenseTier') as any,
          staffCount: 1, // Starts with 1 admin
          studentCount: 0,
          renewalDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
          tokenUsageCurrentPeriod: 0,
          tokenLimit: 1000000,
          aiCostEstimate: 0,
          features: {
              safeguarding: true,
              aiAssistant: true,
              parentPortal: false
          }
      };

      // Create Initial Admin User
      const initialAdmin: UserProfile = {
          id: crypto.randomUUID(),
          name: 'School Admin',
          email: `admin@${orgName.toLowerCase().replace(/\s+/g, '')}.edu`, // Mock email generation
          role: 'IT Admin',
          initials: 'SA',
          orgId: orgId,
          status: 'Active'
      };

      onAddOrg(newOrg, initialAdmin);
      setShowAddModal(false);
  };

  const handleToggleFeature = (feature: keyof Organization['features']) => {
      if (!selectedOrg) return;
      const updatedOrg = {
          ...selectedOrg,
          features: {
              ...selectedOrg.features,
              [feature]: !selectedOrg.features[feature]
          }
      };
      setSelectedOrg(updatedOrg);
      onUpdateOrg(updatedOrg);
  };

  return (
    <div className="animate-fade-in space-y-6 relative">
      <header className="flex justify-between items-end">
          <div>
              <h1 className="text-3xl font-bold text-slate-800">Tenant Management</h1>
              <p className="text-slate-500">Manage schools, colleges, and university instances.</p>
          </div>
          <button 
             onClick={() => setShowAddModal(true)}
             className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-lg shadow-indigo-200 transition-all flex items-center"
          >
              <Plus size={18} className="mr-2" /> Onboard Tenant
          </button>
      </header>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Toolbar */}
          <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50">
             <div className="flex items-center space-x-2 w-full md:w-auto">
                 <div className="relative flex-1 md:w-80">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                        type="text" 
                        placeholder="Search organizations..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                 </div>
                 <select 
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                 >
                     <option value="All">All Types</option>
                     <option value="School">School</option>
                     <option value="College">College</option>
                     <option value="University">University</option>
                 </select>
             </div>
             <div className="text-xs text-slate-500 font-medium">
                 Showing {filteredOrgs.length} of {organizations.length} tenants
             </div>
          </div>

          <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                  <thead className="bg-white text-slate-500 uppercase font-bold text-xs border-b border-slate-100">
                      <tr>
                          <th className="px-6 py-4">Organization</th>
                          <th className="px-6 py-4">Subscription</th>
                          <th className="px-6 py-4 text-center">Seats</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                      {filteredOrgs.map((org) => (
                          <tr key={org.id} className="hover:bg-slate-50 transition-colors group cursor-pointer" onClick={() => setSelectedOrg(org)}>
                              <td className="px-6 py-4">
                                  <div className="flex items-center">
                                      <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold mr-3 border border-indigo-100">
                                          {org.name.charAt(0)}
                                      </div>
                                      <div>
                                          <p className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{org.name}</p>
                                          <p className="text-xs text-slate-400 font-normal flex items-center">
                                              <Globe size={10} className="mr-1"/> {org.type} • {org.id.substring(0,6)}
                                          </p>
                                      </div>
                                  </div>
                              </td>
                              <td className="px-6 py-4">
                                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                                      org.licenseTier === 'Enterprise' ? 'bg-purple-100 text-purple-700' :
                                      org.licenseTier === 'Pro' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'
                                  }`}>
                                      {org.licenseTier}
                                  </span>
                                  <p className="text-[10px] text-slate-400 mt-1">Renews: {new Date(org.renewalDate).toLocaleDateString()}</p>
                              </td>
                              <td className="px-6 py-4 text-center">
                                  <div className="flex flex-col items-center">
                                      <span className="font-bold text-slate-700">{org.staffCount + org.studentCount}</span>
                                      <span className="text-[10px] text-slate-400">Total Users</span>
                                  </div>
                              </td>
                              <td className="px-6 py-4">
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border ${
                                      org.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                      org.status === 'Trial' ? 'bg-blue-50 text-blue-700 border-blue-100' : 
                                      'bg-red-50 text-red-700 border-red-100'
                                  }`}>
                                      {org.status === 'Active' ? <CheckCircle2 size={10} className="mr-1" /> : null}
                                      {org.status}
                                  </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                  <div className="flex justify-end space-x-2">
                                      <button 
                                        className="flex items-center px-3 py-1.5 bg-slate-800 text-white text-xs font-bold rounded-lg hover:bg-slate-900 transition-colors shadow-sm"
                                        onClick={(e) => { e.stopPropagation(); onImpersonate(org.id); }}
                                      >
                                          <Eye size={14} className="mr-1" /> Login as Admin
                                      </button>
                                      <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Edit Details" onClick={(e) => { e.stopPropagation(); setSelectedOrg(org); }}>
                                          <Edit size={16} />
                                      </button>
                                  </div>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      </div>

      {/* Tenant Inspector Drawer */}
      {selectedOrg && (
          <div className="fixed inset-y-0 right-0 w-full md:w-[480px] bg-white shadow-2xl z-50 transform transition-transform animate-slide-in-right flex flex-col">
              <div className="p-6 border-b border-slate-200 flex justify-between items-start bg-slate-50">
                  <div className="flex items-center space-x-4">
                      <div className="w-14 h-14 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-2xl font-bold text-slate-700 shadow-sm">
                          {selectedOrg.name.charAt(0)}
                      </div>
                      <div>
                          <h2 className="text-xl font-bold text-slate-800">{selectedOrg.name}</h2>
                          <div className="flex items-center space-x-2 mt-1">
                              <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-bold">{selectedOrg.licenseTier}</span>
                              <span className="text-xs text-slate-500">ID: {selectedOrg.id}</span>
                          </div>
                      </div>
                  </div>
                  <button onClick={() => setSelectedOrg(null)} className="text-slate-400 hover:text-slate-600">
                      <X size={24} />
                  </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                  
                  {/* Quick Actions */}
                  <section>
                      <button 
                        onClick={() => onImpersonate(selectedOrg.id)}
                        className="w-full py-3 bg-slate-900 text-white font-bold rounded-lg hover:bg-black transition-colors flex items-center justify-center shadow-md mb-4"
                      >
                          <Eye size={18} className="mr-2" /> Impersonate Organization Admin
                      </button>
                  </section>

                  {/* Feature Flags */}
                  <section>
                      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-4 flex items-center">
                          <Settings size={16} className="mr-2 text-indigo-500" /> Feature Configuration
                      </h3>
                      <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:border-indigo-300 transition-colors">
                              <div className="flex items-center">
                                  <Shield size={18} className="text-red-500 mr-3" />
                                  <div>
                                      <p className="text-sm font-bold text-slate-800">Safeguarding Module</p>
                                      <p className="text-xs text-slate-500">Critical incident tracking & AI risk analysis.</p>
                                  </div>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                  <input type="checkbox" className="sr-only peer" checked={selectedOrg.features?.safeguarding} onChange={() => handleToggleFeature('safeguarding')} />
                                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                              </label>
                          </div>

                          <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:border-indigo-300 transition-colors">
                              <div className="flex items-center">
                                  <BrainCircuit size={18} className="text-indigo-500 mr-3" />
                                  <div>
                                      <p className="text-sm font-bold text-slate-800">Sentinel AI Assistant</p>
                                      <p className="text-xs text-slate-500">Enable generative text and predictive insights.</p>
                                  </div>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                  <input type="checkbox" className="sr-only peer" checked={selectedOrg.features?.aiAssistant} onChange={() => handleToggleFeature('aiAssistant')} />
                                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                              </label>
                          </div>

                          <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:border-indigo-300 transition-colors">
                              <div className="flex items-center">
                                  <MessageSquare size={18} className="text-blue-500 mr-3" />
                                  <div>
                                      <p className="text-sm font-bold text-slate-800">Parent Portal</p>
                                      <p className="text-xs text-slate-500">Allow external access for guardians.</p>
                                  </div>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                  <input type="checkbox" className="sr-only peer" checked={selectedOrg.features?.parentPortal} onChange={() => handleToggleFeature('parentPortal')} />
                                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                              </label>
                          </div>
                      </div>
                  </section>

                  {/* Usage & Limits */}
                  <section>
                      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-4 flex items-center">
                          <CreditCard size={16} className="mr-2 text-emerald-600" /> Usage & Limits
                      </h3>
                      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-4">
                          <div>
                              <div className="flex justify-between text-sm mb-1">
                                  <span className="font-medium text-slate-700">AI Token Budget</span>
                                  <span className="font-bold text-indigo-600">{selectedOrg.tokenUsageCurrentPeriod.toLocaleString()} / {selectedOrg.tokenLimit.toLocaleString()}</span>
                              </div>
                              <div className="w-full bg-slate-200 rounded-full h-2">
                                  <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${(selectedOrg.tokenUsageCurrentPeriod / selectedOrg.tokenLimit) * 100}%` }}></div>
                              </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4 pt-2">
                              <div>
                                  <label className="block text-xs font-bold text-slate-500 mb-1">Monthly Cap</label>
                                  <input type="number" defaultValue={selectedOrg.tokenLimit} className="w-full px-3 py-1.5 border border-slate-300 rounded text-sm" />
                              </div>
                              <div>
                                  <label className="block text-xs font-bold text-slate-500 mb-1">Seat Count</label>
                                  <input type="number" defaultValue={50} className="w-full px-3 py-1.5 border border-slate-300 rounded text-sm" />
                              </div>
                          </div>
                      </div>
                  </section>

                  <section className="pt-4 border-t border-slate-100">
                      <button className="w-full py-2 text-red-600 font-bold text-sm border border-red-200 rounded-lg hover:bg-red-50 flex items-center justify-center">
                          <Trash2 size={16} className="mr-2" /> Suspend Organization
                      </button>
                  </section>
              </div>
              
              <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end space-x-3">
                  <button onClick={() => setSelectedOrg(null)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg">Close</button>
                  <button onClick={() => setSelectedOrg(null)} className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 shadow-md">Save Changes</button>
              </div>
          </div>
      )}

       {/* Add Org Modal */}
       {showAddModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-8 animate-slide-up border border-slate-200">
                  <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
                      <Building2 className="mr-2 text-indigo-600"/> Onboard New Tenant
                  </h2>
                  <form onSubmit={handleCreateOrg} className="space-y-5">
                      <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1">Organization Name</label>
                          <input name="orgName" required className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 transition-all" placeholder="e.g. Springfield Academy" />
                      </div>
                      <div className="grid grid-cols-2 gap-5">
                          <div>
                              <label className="block text-sm font-bold text-slate-700 mb-1">Type</label>
                              <select name="orgType" className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-white transition-all">
                                  <option value="School">School</option>
                                  <option value="College">College</option>
                                  <option value="University">University</option>
                              </select>
                          </div>
                          <div>
                              <label className="block text-sm font-bold text-slate-700 mb-1">License Tier</label>
                              <select name="licenseTier" className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-white transition-all">
                                  <option value="Starter">Starter</option>
                                  <option value="Pro">Pro</option>
                                  <option value="Enterprise">Enterprise</option>
                              </select>
                          </div>
                      </div>
                      <div className="pt-6 flex justify-end space-x-3 border-t border-slate-100 mt-2">
                          <button type="button" onClick={() => setShowAddModal(false)} className="px-5 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors">Cancel</button>
                          <button type="submit" className="px-5 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all">Deploy Tenant</button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default SuperAdminTenants;
