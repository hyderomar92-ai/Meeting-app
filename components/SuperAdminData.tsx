
import React, { useState } from 'react';
import { Organization, DataExportJob } from '../types';
import { Database, Download, Search, Trash2, HardDrive, FileArchive, ShieldAlert, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

interface SuperAdminDataProps {
  organizations: Organization[];
}

const SuperAdminData: React.FC<SuperAdminDataProps> = ({ organizations }) => {
  const [activeTab, setActiveTab] = useState<'EXPORT' | 'GDPR' | 'RETENTION'>('EXPORT');
  
  // EXPORT STATE
  const [selectedOrgForExport, setSelectedOrgForExport] = useState('');
  const [exportJobs, setExportJobs] = useState<DataExportJob[]>([
      { id: 'job-123', orgName: 'Westfield College', requestDate: '2023-11-18', status: 'Completed', size: '450 MB', type: 'Full Export' },
      { id: 'job-124', orgName: 'Springfield High', requestDate: '2023-11-19', status: 'Completed', size: '1.2 GB', type: 'Audit Logs' },
  ]);
  const [isExporting, setIsExporting] = useState(false);

  // GDPR STATE
  const [piiSearch, setPiiSearch] = useState('');
  const [gdprResults, setGdprResults] = useState<any[]>([]);
  const [isSearchingPii, setIsSearchingPii] = useState(false);

  const handleStartExport = () => {
      if (!selectedOrgForExport) return;
      setIsExporting(true);
      const orgName = organizations.find(o => o.id === selectedOrgForExport)?.name || 'Unknown';
      
      setTimeout(() => {
          const newJob: DataExportJob = {
              id: `job-${Date.now()}`,
              orgName,
              requestDate: new Date().toISOString().split('T')[0],
              status: 'Completed',
              size: '25 MB (Mock)',
              type: 'Full Export'
          };
          setExportJobs([newJob, ...exportJobs]);
          setIsExporting(false);
          setSelectedOrgForExport('');
      }, 2000);
  };

  const handlePiiSearch = (e: React.FormEvent) => {
      e.preventDefault();
      if (!piiSearch) return;
      setIsSearchingPii(true);
      // Mock search
      setTimeout(() => {
          setGdprResults([
              { type: 'Student Profile', id: 'ST-992', detail: `Name match: ${piiSearch}`, location: 'Springfield High' },
              { type: 'Meeting Log', id: 'LOG-441', detail: `Mentioned in notes`, location: 'Springfield High' },
              { type: 'Behavior Record', id: 'BHV-112', detail: `Student Name`, location: 'Springfield High' }
          ]);
          setIsSearchingPii(false);
      }, 1000);
  };

  const handleAnonymize = () => {
      if (window.confirm("WARNING: This will permanently replace PII with [REDACTED] in the database. This action is irreversible. Proceed?")) {
          setGdprResults([]);
          setPiiSearch('');
          alert("Records anonymized successfully.");
      }
  };

  return (
    <div className="animate-fade-in space-y-6">
        <header>
            <h1 className="text-3xl font-bold text-slate-800 flex items-center">
                <Database className="mr-3 text-blue-600" /> Data Governance
            </h1>
            <p className="text-slate-500">Manage data sovereignty, exports, and privacy compliance.</p>
        </header>

        {/* TABS */}
        <div className="flex border-b border-slate-200">
            <button onClick={() => setActiveTab('EXPORT')} className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors flex items-center ${activeTab === 'EXPORT' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                <HardDrive size={16} className="mr-2" /> Tenant Exports
            </button>
            <button onClick={() => setActiveTab('GDPR')} className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors flex items-center ${activeTab === 'GDPR' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                <ShieldAlert size={16} className="mr-2" /> Privacy & GDPR
            </button>
            <button onClick={() => setActiveTab('RETENTION')} className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors flex items-center ${activeTab === 'RETENTION' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                <Trash2 size={16} className="mr-2" /> Retention Policy
            </button>
        </div>

        {/* EXPORT TAB */}
        {activeTab === 'EXPORT' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="font-bold text-slate-800 mb-4">Request Data Dump</h3>
                    <p className="text-xs text-slate-500 mb-4">
                        Generate a full archive of a tenant's data (SQL dump + File assets). 
                        Useful for offboarding or compliance audits.
                    </p>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Target Organization</label>
                            <select 
                                value={selectedOrgForExport}
                                onChange={(e) => setSelectedOrgForExport(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            >
                                <option value="">Select Tenant...</option>
                                {organizations.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                            </select>
                        </div>
                        <button 
                            onClick={handleStartExport}
                            disabled={!selectedOrgForExport || isExporting}
                            className="w-full py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                        >
                            {isExporting ? <Loader2 size={18} className="animate-spin mr-2" /> : <FileArchive size={18} className="mr-2" />}
                            {isExporting ? 'Packaging...' : 'Generate Archive'}
                        </button>
                    </div>
                </div>

                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="font-bold text-slate-800 mb-4">Export History</h3>
                    <div className="overflow-hidden rounded-lg border border-slate-100">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-xs">
                                <tr>
                                    <th className="px-4 py-3">Organization</th>
                                    <th className="px-4 py-3">Date</th>
                                    <th className="px-4 py-3">Type</th>
                                    <th className="px-4 py-3">Size</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {exportJobs.map(job => (
                                    <tr key={job.id}>
                                        <td className="px-4 py-3 font-medium text-slate-800">{job.orgName}</td>
                                        <td className="px-4 py-3 text-slate-500">{job.requestDate}</td>
                                        <td className="px-4 py-3 text-slate-600">{job.type}</td>
                                        <td className="px-4 py-3 text-slate-500 font-mono text-xs">{job.size}</td>
                                        <td className="px-4 py-3">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-green-100 text-green-700">
                                                <CheckCircle2 size={10} className="mr-1" /> Completed
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button className="text-blue-600 hover:text-blue-800 font-medium text-xs flex items-center justify-end">
                                                <Download size={14} className="mr-1" /> Download
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        )}

        {/* GDPR TAB */}
        {activeTab === 'GDPR' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 bg-red-50 border border-red-100 p-6 rounded-xl">
                    <h3 className="font-bold text-red-800 mb-2 flex items-center">
                        <AlertCircle size={20} className="mr-2" /> Right to be Forgotten
                    </h3>
                    <p className="text-xs text-red-700 mb-6 leading-relaxed">
                        Use this tool to permanently anonymize or delete Personal Identifiable Information (PII) from the database in compliance with GDPR/CCPA requests.
                    </p>
                    
                    <form onSubmit={handlePiiSearch} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-red-800 uppercase mb-1">Search Entity (Name/ID/Email)</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-red-400" size={16} />
                                <input 
                                    type="text" 
                                    value={piiSearch}
                                    onChange={(e) => setPiiSearch(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 border border-red-200 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none"
                                    placeholder="e.g. John Doe"
                                />
                            </div>
                        </div>
                        <button 
                            type="submit"
                            disabled={isSearchingPii}
                            className="w-full py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                        >
                            {isSearchingPii ? 'Scanning DB...' : 'Find Records'}
                        </button>
                    </form>
                </div>

                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col">
                    <h3 className="font-bold text-slate-800 mb-4">Search Results</h3>
                    <div className="flex-1 border border-slate-200 rounded-lg bg-slate-50 p-4 overflow-y-auto max-h-[400px]">
                        {gdprResults.length === 0 ? (
                            <div className="text-center text-slate-400 py-8">
                                <Search size={32} className="mx-auto mb-2 opacity-20" />
                                <p className="text-sm">Enter a search term to locate PII.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                                    <span className="text-sm font-bold text-slate-700">{gdprResults.length} records found</span>
                                    <button 
                                        onClick={handleAnonymize}
                                        className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded hover:bg-red-700 shadow-sm"
                                    >
                                        Anonymize All Matches
                                    </button>
                                </div>
                                {gdprResults.map((res, i) => (
                                    <div key={i} className="p-3 bg-white border border-slate-200 rounded-lg flex justify-between items-center">
                                        <div>
                                            <p className="font-bold text-sm text-slate-800">{res.type} <span className="font-normal text-slate-500">({res.id})</span></p>
                                            <p className="text-xs text-slate-500">{res.detail}</p>
                                        </div>
                                        <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600">{res.location}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}

        {/* RETENTION TAB */}
        {activeTab === 'RETENTION' && (
            <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-xl font-bold text-slate-800 mb-6">Data Retention Policy</h3>
                
                <div className="space-y-8">
                    <div>
                        <div className="flex justify-between mb-2">
                            <label className="font-bold text-slate-700">Inactive User Data</label>
                            <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">3 Years</span>
                        </div>
                        <input type="range" className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                        <p className="text-xs text-slate-500 mt-2">Time before inactive user profiles are soft-deleted.</p>
                    </div>

                    <div>
                        <div className="flex justify-between mb-2">
                            <label className="font-bold text-slate-700">Chat Logs & Transient AI Data</label>
                            <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">30 Days</span>
                        </div>
                        <input type="range" className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                        <p className="text-xs text-slate-500 mt-2">Temporary data retention period for AI interaction logs.</p>
                    </div>

                    <div>
                        <div className="flex justify-between mb-2">
                            <label className="font-bold text-slate-700">Safeguarding Case Archives</label>
                            <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">Indefinite</span>
                        </div>
                        <input type="range" className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600" disabled />
                        <p className="text-xs text-slate-500 mt-2">Legal requirement: Safeguarding data must be retained indefinitely or until student is 25.</p>
                    </div>

                    <div className="pt-6 border-t border-slate-100 flex justify-end">
                        <button className="px-6 py-2 bg-slate-900 text-white font-bold rounded-lg hover:bg-black transition-colors">Save Policy</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default SuperAdminData;
