
import React, { useState } from 'react';
import { ResourceItem } from '../types';
import { Library, Plus, FileText, Video, File, Trash2, Edit2, Upload, Download, Search, Filter } from 'lucide-react';

const MOCK_RESOURCES: ResourceItem[] = [
    { id: '1', title: 'Safeguarding Policy Template 2024', category: 'Template', targetTier: 'All', uploadDate: '2023-11-01', fileType: 'DOCX', downloadCount: 124 },
    { id: '2', title: 'Getting Started with Sentinel AI', category: 'Guide', targetTier: 'All', uploadDate: '2023-10-15', fileType: 'PDF', downloadCount: 450 },
    { id: '3', title: 'Advanced Risk Analytics Walkthrough', category: 'Guide', targetTier: 'Pro', uploadDate: '2023-11-10', fileType: 'Video', downloadCount: 85 },
    { id: '4', title: 'Parent Portal Setup Guide', category: 'Guide', targetTier: 'Enterprise', uploadDate: '2023-09-20', fileType: 'PDF', downloadCount: 32 },
];

const SuperAdminResources: React.FC = () => {
    const [resources, setResources] = useState<ResourceItem[]>(MOCK_RESOURCES);
    const [searchTerm, setSearchTerm] = useState('');
    const [showUploadModal, setShowUploadModal] = useState(false);

    const filteredResources = resources.filter(r => r.title.toLowerCase().includes(searchTerm.toLowerCase()));

    const handleUpload = (e: React.FormEvent) => {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        const formData = new FormData(form);
        
        const newResource: ResourceItem = {
            id: crypto.randomUUID(),
            title: formData.get('title') as string,
            category: formData.get('category') as any,
            targetTier: formData.get('tier') as any,
            fileType: 'PDF', // Mocked
            uploadDate: new Date().toISOString().split('T')[0],
            downloadCount: 0
        };
        
        setResources([newResource, ...resources]);
        setShowUploadModal(false);
    };

    const handleDelete = (id: string) => {
        if (window.confirm("Delete this resource? It will disappear from all client dashboards.")) {
            setResources(resources.filter(r => r.id !== id));
        }
    };

    const renderIcon = (type: string) => {
        switch(type) {
            case 'PDF': return <FileText className="text-red-500" size={20} />;
            case 'Video': return <Video className="text-purple-500" size={20} />;
            case 'DOCX': return <File className="text-blue-500" size={20} />;
            default: return <File className="text-slate-400" size={20} />;
        }
    };

    return (
        <div className="animate-fade-in space-y-6">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 flex items-center">
                        <Library className="mr-3 text-indigo-600" /> Resource Library
                    </h1>
                    <p className="text-slate-500">Manage content, guides, and templates available to tenants.</p>
                </div>
                <button 
                    onClick={() => setShowUploadModal(true)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-lg shadow-indigo-200 transition-all flex items-center"
                >
                    <Upload size={18} className="mr-2" /> Upload Resource
                </button>
            </header>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Toolbar */}
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                            type="text" 
                            placeholder="Search resources..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>
                    <div className="flex items-center text-xs text-slate-500">
                        <Filter size={14} className="mr-1" /> Showing {filteredResources.length} items
                    </div>
                </div>

                {/* List */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-white text-slate-500 uppercase font-bold text-xs border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4">Resource Name</th>
                                <th className="px-6 py-4">Category</th>
                                <th className="px-6 py-4">Availability</th>
                                <th className="px-6 py-4">Uploaded</th>
                                <th className="px-6 py-4 text-center">Downloads</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredResources.map((res) => (
                                <tr key={res.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center">
                                            <div className="p-2 bg-slate-50 rounded-lg border border-slate-100 mr-3">
                                                {renderIcon(res.fileType)}
                                            </div>
                                            <span className="font-bold text-slate-700">{res.title}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 bg-slate-100 rounded text-slate-600 text-xs font-bold border border-slate-200">
                                            {res.category}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`text-xs font-bold ${
                                            res.targetTier === 'All' ? 'text-green-600' : 
                                            res.targetTier === 'Enterprise' ? 'text-purple-600' : 'text-blue-600'
                                        }`}>
                                            {res.targetTier === 'All' ? 'Global' : `${res.targetTier} Only`}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500">{res.uploadDate}</td>
                                    <td className="px-6 py-4 text-center text-slate-600 font-medium">{res.downloadCount}</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                                                <Edit2 size={16} />
                                            </button>
                                            <button onClick={() => handleDelete(res.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Upload Modal */}
            {showUploadModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-slide-up">
                        <h2 className="text-xl font-bold text-slate-800 mb-4">Publish New Resource</h2>
                        <form onSubmit={handleUpload} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Title</label>
                                <input name="title" required className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. Q3 Policy Update" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Category</label>
                                    <select name="category" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white">
                                        <option value="Guide">Guide</option>
                                        <option value="Template">Template</option>
                                        <option value="Policy">Policy</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Availability</label>
                                    <select name="tier" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white">
                                        <option value="All">All Tenants</option>
                                        <option value="Pro">Pro & Above</option>
                                        <option value="Enterprise">Enterprise Only</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div className="border-2 border-dashed border-slate-200 rounded-lg p-8 text-center hover:bg-slate-50 cursor-pointer transition-colors">
                                <Upload size={32} className="mx-auto text-slate-300 mb-2" />
                                <p className="text-sm text-slate-500">Drag & Drop file or <span className="text-indigo-600 font-bold">Browse</span></p>
                                <p className="text-xs text-slate-400 mt-1">PDF, DOCX, MP4 (Max 50MB)</p>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setShowUploadModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 shadow-md">Publish</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SuperAdminResources;
