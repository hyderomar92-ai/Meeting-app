
import React, { useState } from 'react';
import { LicenseKey, GlobalAIConfig } from '../types';
import { Key, Copy, CheckCircle2, RefreshCw, Save, Shield, Terminal, Database, AlertTriangle, Play } from 'lucide-react';

const SuperAdminTools: React.FC = () => {
  // --- LICENSE GENERATOR STATE ---
  const [generatedKeys, setGeneratedKeys] = useState<LicenseKey[]>([]);
  const [tier, setTier] = useState<'Starter' | 'Pro' | 'Enterprise'>('Pro');
  const [duration, setDuration] = useState(365);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  // --- AI CONFIG STATE ---
  const [aiConfig, setAiConfig] = useState<GlobalAIConfig>({
      safeguardingSensitivity: 'Strict',
      baseSystemPrompt: "You are 'Sentinel', a highly intelligent educational assistant. Prioritize child safety above all else. Maintain a professional, objective tone.",
      excludedKeywords: ['gambling', 'casino']
  });

  // --- UTILS ---
  const generateKey = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let key = 'SENTINEL-';
      for(let i=0; i<4; i++) {
          let segment = '';
          for(let j=0; j<4; j++) segment += chars.charAt(Math.floor(Math.random() * chars.length));
          key += segment + (i < 3 ? '-' : '');
      }
      
      const newKey: LicenseKey = {
          key,
          tier,
          durationDays: duration,
          generatedDate: new Date().toISOString(),
          status: 'Active'
      };
      setGeneratedKeys([newKey, ...generatedKeys]);
  };

  const handleCopy = (text: string) => {
      navigator.clipboard.writeText(text);
      setCopySuccess(text);
      setTimeout(() => setCopySuccess(null), 2000);
  };

  const handleSaveAIConfig = () => {
      // In a real app, this would push to the backend/DB
      alert("Global AI Configuration pushed to production.");
  };

  return (
    <div className="animate-fade-in space-y-8 max-w-6xl mx-auto">
        <header>
            <h1 className="text-3xl font-bold text-slate-800">Platform Operations</h1>
            <p className="text-slate-500">System controls, revenue tools, and global configuration.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* LICENSE GENERATOR */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center">
                        <Key className="mr-2 text-amber-500" size={20} /> License Key Generator
                    </h2>
                    <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2 py-1 rounded">Sales Tool</span>
                </div>
                <div className="p-6 space-y-6">
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Plan Tier</label>
                            <select 
                                value={tier} 
                                onChange={(e) => setTier(e.target.value as any)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                            >
                                <option value="Starter">Starter</option>
                                <option value="Pro">Pro</option>
                                <option value="Enterprise">Enterprise</option>
                            </select>
                        </div>
                        <div className="flex-1">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Duration (Days)</label>
                            <input 
                                type="number" 
                                value={duration} 
                                onChange={(e) => setDuration(parseInt(e.target.value))}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                            />
                        </div>
                    </div>
                    
                    <button 
                        onClick={generateKey}
                        className="w-full py-3 bg-slate-900 text-white font-bold rounded-lg hover:bg-black transition-colors flex items-center justify-center"
                    >
                        <RefreshCw size={18} className="mr-2" /> Generate New Key
                    </button>

                    <div className="space-y-3 mt-4">
                        <p className="text-xs font-bold text-slate-400 uppercase">Recent Keys</p>
                        {generatedKeys.length === 0 ? (
                            <p className="text-sm text-slate-400 italic text-center py-4">No keys generated this session.</p>
                        ) : (
                            generatedKeys.slice(0, 5).map((k, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-lg">
                                    <div>
                                        <p className="font-mono text-sm font-bold text-slate-700">{k.key}</p>
                                        <p className="text-[10px] text-slate-500">{k.tier} • {k.durationDays} Days</p>
                                    </div>
                                    <button 
                                        onClick={() => handleCopy(k.key)}
                                        className={`p-2 rounded-md transition-colors ${copySuccess === k.key ? 'bg-green-100 text-green-600' : 'hover:bg-white text-slate-400 hover:text-indigo-600'}`}
                                    >
                                        {copySuccess === k.key ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* GLOBAL AI GOVERNANCE */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center">
                        <Terminal className="mr-2 text-indigo-600" size={20} /> AI Brain Config
                    </h2>
                    <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-2 py-1 rounded">Global Production</span>
                </div>
                <div className="p-6 space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Safeguarding Sensitivity</label>
                        <div className="grid grid-cols-3 gap-2">
                            {['Standard', 'Strict', 'Lenient'].map(mode => (
                                <button 
                                    key={mode}
                                    onClick={() => setAiConfig({...aiConfig, safeguardingSensitivity: mode as any})}
                                    className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                                        aiConfig.safeguardingSensitivity === mode 
                                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700' 
                                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                    }`}
                                >
                                    {mode}
                                </button>
                            ))}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">
                            {aiConfig.safeguardingSensitivity === 'Strict' ? 'Will flag minor behavioral issues as potential risks.' : 'Focuses only on explicit harm or serious threats.'}
                        </p>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Base System Prompt</label>
                        <textarea 
                            value={aiConfig.baseSystemPrompt}
                            onChange={(e) => setAiConfig({...aiConfig, baseSystemPrompt: e.target.value})}
                            className="w-full h-24 px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                        />
                    </div>

                    <button 
                        onClick={handleSaveAIConfig}
                        className="w-full py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center"
                    >
                        <Save size={18} className="mr-2" /> Update Production Models
                    </button>
                </div>
            </div>
        </div>

        {/* SYSTEM MAINTENANCE */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50">
                <h2 className="text-lg font-bold text-slate-800 flex items-center">
                    <Database className="mr-2 text-slate-500" size={20} /> Data & Maintenance
                </h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 border border-slate-200 rounded-xl flex flex-col items-center text-center hover:border-slate-300 transition-colors group">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-full mb-3 group-hover:bg-blue-100">
                        <RefreshCw size={24} />
                    </div>
                    <h3 className="font-bold text-slate-700">Clear Global Cache</h3>
                    <p className="text-xs text-slate-500 mt-1 mb-3">Force refresh all dashboards.</p>
                    <button className="px-4 py-1.5 bg-white border border-slate-300 text-slate-600 text-xs font-bold rounded hover:bg-slate-50">Execute</button>
                </div>

                <div className="p-4 border border-slate-200 rounded-xl flex flex-col items-center text-center hover:border-slate-300 transition-colors group">
                    <div className="p-3 bg-green-50 text-green-600 rounded-full mb-3 group-hover:bg-green-100">
                        <Play size={24} />
                    </div>
                    <h3 className="font-bold text-slate-700">Run Health Check</h3>
                    <p className="text-xs text-slate-500 mt-1 mb-3">Ping all integration endpoints.</p>
                    <button className="px-4 py-1.5 bg-white border border-slate-300 text-slate-600 text-xs font-bold rounded hover:bg-slate-50">Execute</button>
                </div>

                <div className="p-4 border border-red-200 rounded-xl flex flex-col items-center text-center hover:border-red-300 transition-colors group bg-red-50/10">
                    <div className="p-3 bg-red-50 text-red-600 rounded-full mb-3 group-hover:bg-red-100">
                        <AlertTriangle size={24} />
                    </div>
                    <h3 className="font-bold text-red-700">Purge Deleted Logs</h3>
                    <p className="text-xs text-slate-500 mt-1 mb-3">Remove soft-deleted items > 30 days.</p>
                    <button className="px-4 py-1.5 bg-white border border-red-200 text-red-600 text-xs font-bold rounded hover:bg-red-50">Execute</button>
                </div>
            </div>
        </div>
    </div>
  );
};

export default SuperAdminTools;