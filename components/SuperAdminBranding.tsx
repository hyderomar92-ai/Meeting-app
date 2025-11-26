
import React, { useState } from 'react';
import { AppThemeConfig } from '../types';
import { Palette, Layout, Image as ImageIcon, Save, RefreshCw, Shield } from 'lucide-react';

const SuperAdminBranding: React.FC = () => {
    const [config, setConfig] = useState<AppThemeConfig>({
        appName: 'Sentinel',
        primaryColor: '#4f46e5', // Indigo-600
        logoUrl: 'https://cdn-icons-png.flaticon.com/512/2997/2997495.png',
        loginBackgroundUrl: ''
    });

    const handleSave = () => {
        // In a real app, this saves to backend and updates context
        alert("Global Theme Updated Successfully!");
    };

    return (
        <div className="animate-fade-in space-y-6 max-w-6xl mx-auto">
            <header>
                <h1 className="text-3xl font-bold text-slate-800 flex items-center">
                    <Palette className="mr-3 text-indigo-600" /> Platform Branding
                </h1>
                <p className="text-slate-500">White-label the application identity, colors, and logos for all tenants.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Config Form */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center">
                            <Layout size={18} className="mr-2 text-slate-400" /> Identity Settings
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Application Name</label>
                                <input 
                                    type="text" 
                                    value={config.appName} 
                                    onChange={(e) => setConfig({...config, appName: e.target.value})}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Primary Brand Color</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="color" 
                                        value={config.primaryColor} 
                                        onChange={(e) => setConfig({...config, primaryColor: e.target.value})}
                                        className="h-10 w-12 rounded cursor-pointer border-0 bg-transparent"
                                    />
                                    <input 
                                        type="text" 
                                        value={config.primaryColor} 
                                        onChange={(e) => setConfig({...config, primaryColor: e.target.value})}
                                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm uppercase font-mono"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Logo URL</label>
                                <div className="relative">
                                    <ImageIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input 
                                        type="text" 
                                        value={config.logoUrl} 
                                        onChange={(e) => setConfig({...config, logoUrl: e.target.value})}
                                        className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 text-indigo-800 text-xs leading-relaxed">
                        <strong>Note:</strong> Changes affect the login screen, sidebar, and email templates for all tenants immediately.
                    </div>

                    <button 
                        onClick={handleSave}
                        className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-black transition-colors flex items-center justify-center shadow-lg"
                    >
                        <Save size={18} className="mr-2" /> Publish Changes
                    </button>
                </div>

                {/* Live Preview */}
                <div className="lg:col-span-2 bg-slate-100 p-8 rounded-xl border border-slate-200 flex flex-col items-center justify-center">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Live Preview: Login Screen</p>
                    
                    {/* Mock Login Screen */}
                    <div className="bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-800 relative">
                        <div className="p-8 flex flex-col items-center text-center relative z-10">
                            <div 
                                className="inline-flex items-center justify-center p-4 rounded-2xl shadow-lg mb-6 transition-colors duration-300"
                                style={{ backgroundColor: config.primaryColor }}
                            >
                                <img src={config.logoUrl} alt="Logo" className="w-12 h-12 object-contain filter brightness-0 invert" onError={(e) => e.currentTarget.src = 'https://cdn-icons-png.flaticon.com/512/2997/2997495.png'} />
                            </div>
                            <h1 className="text-3xl font-bold text-white tracking-tight mb-1">{config.appName}</h1>
                            <p className="text-slate-400 text-sm mb-8">Secure Access Portal</p>

                            <div className="w-full space-y-3 bg-white rounded-xl p-1">
                                <div className="flex items-center p-3 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors">
                                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 mr-3">JD</div>
                                    <div className="text-left flex-1">
                                        <p className="text-sm font-bold text-slate-800">Jane Doe</p>
                                        <p className="text-[10px] text-slate-500">Head of Year</p>
                                    </div>
                                </div>
                                <div className="flex items-center p-3 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors border-t border-slate-100">
                                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 mr-3">JS</div>
                                    <div className="text-left flex-1">
                                        <p className="text-sm font-bold text-slate-800">John Smith</p>
                                        <p className="text-[10px] text-slate-500">Teacher</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="mt-6 text-xs text-slate-500 flex items-center justify-center">
                                <Shield size={12} className="mr-1" /> Powered by {config.appName} Platform
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SuperAdminBranding;
