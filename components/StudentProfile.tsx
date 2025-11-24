
import React, { useState, useMemo } from 'react';
import { MeetingLog, BehaviourEntry, SafeguardingCase } from '../types';
import { generateCertificateContent, CertificateResponse } from '../services/geminiService';
import { useLanguage } from '../contexts/LanguageContext';
import { ArrowLeft, Mail, Phone, Clock, GraduationCap, ClipboardList, CheckCircle2, Circle, Plus, User, Users, Flag, Star, AlertCircle, Shield, ChevronRight, TrendingUp, Sparkles, Loader2, Award, Printer, X } from 'lucide-react';
import { STUDENTS } from '../data/students';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';

interface StudentProfileProps {
  studentName: string;
  logs: MeetingLog[];
  behaviourEntries: BehaviourEntry[];
  safeguardingCases?: SafeguardingCase[];
  onBack: () => void;
  onToggleActionItem: (logId: string, actionItemId: string) => void;
  onMarkAllCompleted: (studentName: string) => void;
  onQuickLog: (studentName: string) => void;
  onViewSafeguarding: (studentName: string) => void;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const StudentProfile: React.FC<StudentProfileProps> = ({ 
  studentName, 
  logs, 
  behaviourEntries, 
  safeguardingCases = [], 
  onBack, 
  onToggleActionItem, 
  onMarkAllCompleted, 
  onQuickLog,
  onViewSafeguarding
}) => {
  const { language } = useLanguage();
  const studentDetails = STUDENTS.find(s => s.name === studentName);
  const studentLogs = logs.filter(l => l.attendees.includes(studentName)).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const studentBehaviour = behaviourEntries.filter(b => b.studentName === studentName).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  // Certificate State
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [isGeneratingCert, setIsGeneratingCert] = useState(false);
  const [certificateData, setCertificateData] = useState<CertificateResponse | null>(null);
  const [certificateError, setCertificateError] = useState<string | null>(null);

  // Safeguarding check
  const activeSafeguarding = safeguardingCases.filter(c => c.studentName === studentName && c.status !== 'Closed');
  const criticalSafeguarding = activeSafeguarding.filter(c => c.generatedReport.riskLevel === 'High' || c.generatedReport.riskLevel === 'Critical');

  const totalMeetings = studentLogs.length;
  const concerns = studentLogs.filter(l => l.sentiment === 'Concerned').length;
  const latestLog = studentLogs[0];
  
  const pendingActionsCount = studentLogs.reduce((acc, log) => acc + (log.actionItems ? log.actionItems.filter(i => i.status === 'Pending').length : 0), 0);

  // Behaviour Stats
  const netBehaviourScore = studentBehaviour.reduce((acc, curr) => acc + curr.points, 0);

  const typeCount = studentLogs.reduce((acc, log) => {
    acc[log.type] = (acc[log.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.keys(typeCount).map(type => ({
    name: type,
    value: typeCount[type]
  }));

  // Sentiment Trend Data
  const sentimentTrendData = useMemo(() => {
     // Sort chronological
     const sortedLogs = [...studentLogs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
     return sortedLogs.map(l => ({
        date: new Date(l.date).toLocaleDateString(),
        score: l.sentiment === 'Positive' ? 1 : l.sentiment === 'Concerned' ? -1 : 0,
        label: l.sentiment
     }));
  }, [studentLogs]);

  const handleGenerateCertificate = async () => {
      setIsGeneratingCert(true);
      setCertificateData(null);
      setCertificateError(null);
      setShowCertificateModal(true);

      const positiveLogs = studentLogs
        .filter(l => l.sentiment === 'Positive')
        .slice(0, 3)
        .map(l => l.notes);
      
      const merits = studentBehaviour
        .filter(b => b.type === 'POSITIVE')
        .slice(0, 5)
        .map(b => b.category);

      try {
          const result = await generateCertificateContent(studentName, positiveLogs, merits, language);
          setCertificateData(result);
      } catch (e) {
          console.error(e);
          setCertificateError("Failed to generate certificate content. Please try again later.");
      } finally {
          setIsGeneratingCert(false);
      }
  };

  const handlePrintCertificate = () => {
      const printContents = document.getElementById('certificate-print-area')?.innerHTML;
      const originalContents = document.body.innerHTML;
      
      if(printContents) {
          document.body.innerHTML = printContents;
          window.print();
          document.body.innerHTML = originalContents;
          window.location.reload(); // Simple reload to restore listeners
      }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <button onClick={onBack} className="flex items-center text-slate-500 hover:text-slate-800 transition-colors">
            <ArrowLeft size={20} className="mr-2" />
            Back to Directory
        </button>
        {netBehaviourScore > 0 && (
             <button 
                onClick={handleGenerateCertificate}
                className="flex items-center px-4 py-2 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-lg shadow-md hover:shadow-lg transition-all font-bold"
             >
                <Award size={18} className="mr-2" />
                Generate Praise Certificate
             </button>
        )}
      </div>
      
      {/* Safeguarding Alert Banner */}
      {activeSafeguarding.length > 0 && (
         <div className={`mb-6 p-4 rounded-xl border flex items-center justify-between ${
             criticalSafeguarding.length > 0 ? 'bg-red-50 border-red-200 text-red-800' : 'bg-orange-50 border-orange-200 text-orange-800'
         }`}>
             <div className="flex items-center space-x-3">
                 <div className={`p-2 rounded-full ${criticalSafeguarding.length > 0 ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                     <Shield size={24} />
                 </div>
                 <div>
                     <h3 className="font-bold text-sm uppercase tracking-wide">Active Safeguarding Case</h3>
                     <p className="text-sm">{activeSafeguarding.length} open case(s) on file. {criticalSafeguarding.length > 0 && <span className="font-bold underline">CRITICAL RISK DETECTED.</span>}</p>
                 </div>
             </div>
             <button 
               onClick={() => onViewSafeguarding(studentName)}
               className="px-4 py-2 bg-white border border-slate-200 rounded-lg shadow-sm text-sm font-bold hover:bg-slate-50 transition-colors flex items-center"
             >
                View Case File <ChevronRight size={16} className="ml-1" />
             </button>
         </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
        <div className="h-32 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
        <div className="px-8 pb-8 relative">
          <div className="absolute -top-12 left-8 w-24 h-24 bg-white rounded-full p-1 shadow-lg">
            <div className="w-full h-full bg-slate-200 rounded-full flex items-center justify-center text-slate-400 text-2xl font-bold">
              {studentName.charAt(0)}
            </div>
          </div>
          <div className="pl-28 pt-4 flex flex-col md:flex-row justify-between items-start gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">{studentName}</h1>
              <div className="flex flex-wrap items-center text-slate-500 gap-4 mt-1">
                 <span>Student Profile</span>
                 {studentDetails?.studentClass && (
                    <>
                       <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                       <span className="flex items-center text-blue-600 font-medium">
                          <GraduationCap size={16} className="mr-1.5" />
                          Class {studentDetails.studentClass}
                       </span>
                    </>
                 )}
                 {studentDetails?.nationality && (
                    <>
                        <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                        <span className="flex items-center text-slate-600">
                            <Flag size={14} className="mr-1.5" />
                            {studentDetails.nationality}
                        </span>
                    </>
                 )}
              </div>
              {studentDetails?.id && (
                  <p className="text-xs text-slate-400 mt-1">ID: {studentDetails.id}</p>
              )}
            </div>
            <div className="flex flex-wrap space-x-2 gap-y-2">
               {pendingActionsCount > 0 && (
                 <button
                     onClick={() => onMarkAllCompleted(studentName)}
                     className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 shadow-md shadow-emerald-100 transition-all font-medium"
                     title="Mark all pending actions as completed"
                 >
                     <CheckCircle2 size={18} className="mr-2" />
                     Resolve All ({pendingActionsCount})
                 </button>
               )}
               <button 
                 onClick={() => onQuickLog(studentName)}
                 className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md shadow-blue-100 transition-all font-medium"
                 title="Log New Meeting for this student"
               >
                 <Plus size={18} className="mr-2" />
                 Quick Log
               </button>
            </div>
          </div>
        </div>

        <div className="px-8 pb-8 grid grid-cols-2 md:grid-cols-4 gap-6 border-t border-slate-100 pt-6">
           <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Clock size={20} /></div>
              <div><p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Total Interactions</p><p className="text-lg font-semibold">{totalMeetings}</p></div>
           </div>
           <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-50 text-red-600 rounded-lg"><GraduationCap size={20} /></div>
              <div><p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Concerns</p><p className="text-lg font-semibold">{concerns}</p></div>
           </div>
           <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-50 text-green-600 rounded-lg"><Clock size={20} /></div>
              <div><p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Last Met</p><p className="text-lg font-semibold">{latestLog ? new Date(latestLog.date).toLocaleDateString() : 'Never'}</p></div>
           </div>
           <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${netBehaviourScore >= 0 ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'}`}>
                  {netBehaviourScore >= 0 ? <Star size={20} /> : <AlertCircle size={20} />}
              </div>
              <div>
                  <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Net Behaviour</p>
                  <p className={`text-lg font-semibold ${netBehaviourScore >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {netBehaviourScore > 0 ? '+' : ''}{netBehaviourScore}
                  </p>
              </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          
          {/* Sentiment Trend Chart */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8">
             <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
                <TrendingUp size={20} className="mr-2 text-indigo-600" />
                Sentiment Trajectory
             </h3>
             <div className="h-64 w-full">
                {sentimentTrendData.length > 1 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={sentimentTrendData} margin={{ top: 5, right: 30, left: -20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="date" tick={{fontSize: 10}} />
                            <YAxis 
                                domain={[-1, 1]} 
                                ticks={[-1, 0, 1]} 
                                tickFormatter={(val) => val === 1 ? 'Positive' : val === -1 ? 'Concern' : 'Neutral'}
                                tick={{fontSize: 10}}
                            />
                            <Tooltip 
                                formatter={(value) => value === 1 ? 'Positive' : value === -1 ? 'Concerned' : 'Neutral'}
                                labelStyle={{color: '#64748b'}}
                            />
                            <Line 
                                type="monotone" 
                                dataKey="score" 
                                stroke="#4f46e5" 
                                strokeWidth={2} 
                                dot={{r: 4, strokeWidth: 2}} 
                                activeDot={{r: 6}}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 italic">
                        Not enough data points for trend analysis.
                    </div>
                )}
             </div>
          </div>

          {/* Contact Information Section */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                <Users size={20} className="mr-2 text-blue-600" />
                Contact Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 border-b border-slate-100 pb-2">Student Contact</h4>
                    <div className="space-y-3">
                        {studentDetails?.email ? (
                            <div className="flex items-start">
                                <Mail size={16} className="text-slate-400 mt-1 mr-2" />
                                <div>
                                    <p className="text-sm text-slate-500">Email</p>
                                    <a href={`mailto:${studentDetails.email}`} className="text-sm font-medium text-blue-600 hover:underline">{studentDetails.email}</a>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-start">
                                <Mail size={16} className="text-slate-200 mt-1 mr-2" />
                                <p className="text-sm text-slate-400 italic">No email available</p>
                            </div>
                        )}
                        {studentDetails?.phone ? (
                            <div className="flex items-start">
                                <Phone size={16} className="text-slate-400 mt-1 mr-2" />
                                <div>
                                    <p className="text-sm text-slate-500">Phone</p>
                                    <a href={`tel:${studentDetails.phone}`} className="text-sm font-medium text-blue-600 hover:underline">{studentDetails.phone}</a>
                                </div>
                            </div>
                        ) : (
                             <div className="flex items-start">
                                <Phone size={16} className="text-slate-200 mt-1 mr-2" />
                                <p className="text-sm text-slate-400 italic">No phone available</p>
                            </div>
                        )}
                    </div>
                </div>

                <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 border-b border-slate-100 pb-2">Parent/Guardian Contact</h4>
                    <div className="space-y-4">
                        {(studentDetails?.fatherName || studentDetails?.fatherPhone || studentDetails?.fatherEmail) && (
                             <div>
                                <p className="text-sm font-semibold text-slate-700 mb-1">{studentDetails.fatherName || "Father"}</p>
                                <div className="space-y-1 pl-2 border-l-2 border-slate-100">
                                    {studentDetails.fatherPhone && (
                                        <div className="flex items-center text-sm text-slate-600">
                                            <Phone size={14} className="mr-2" /> 
                                            <a href={`tel:${studentDetails.fatherPhone}`} className="hover:text-blue-600">{studentDetails.fatherPhone}</a>
                                        </div>
                                    )}
                                    {studentDetails.fatherEmail && (
                                        <div className="flex items-center text-sm text-slate-600">
                                            <Mail size={14} className="mr-2" /> 
                                            <a href={`mailto:${studentDetails.fatherEmail}`} className="hover:text-blue-600 truncate max-w-[200px]">{studentDetails.fatherEmail}</a>
                                        </div>
                                    )}
                                </div>
                             </div>
                        )}

                        {(studentDetails?.motherName || studentDetails?.motherPhone || studentDetails?.motherEmail) && (
                             <div>
                                <p className="text-sm font-semibold text-slate-700 mb-1">{studentDetails.motherName || "Mother"}</p>
                                <div className="space-y-1 pl-2 border-l-2 border-slate-100">
                                    {studentDetails.motherPhone && (
                                        <div className="flex items-center text-sm text-slate-600">
                                            <Phone size={14} className="mr-2" /> 
                                            <a href={`tel:${studentDetails.motherPhone}`} className="hover:text-blue-600">{studentDetails.motherPhone}</a>
                                        </div>
                                    )}
                                    {studentDetails.motherEmail && (
                                        <div className="flex items-center text-sm text-slate-600">
                                            <Mail size={14} className="mr-2" /> 
                                            <a href={`mailto:${studentDetails.motherEmail}`} className="hover:text-blue-600 truncate max-w-[200px]">{studentDetails.motherEmail}</a>
                                        </div>
                                    )}
                                </div>
                             </div>
                        )}
                        
                        {!studentDetails?.fatherName && !studentDetails?.motherName && (
                            <p className="text-sm text-slate-400 italic">No parent contact details available.</p>
                        )}
                    </div>
                </div>
            </div>
          </div>

          {/* Interaction Logs Section */}
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
             <ClipboardList size={20} className="mr-2 text-blue-600" />
             Interaction History
          </h3>
          <div className="space-y-4">
            {studentLogs.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-slate-200 border-dashed">
                <p className="text-slate-500">No interaction logs found for this student.</p>
              </div>
            ) : (
              studentLogs.map(log => (
                <div key={log.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                       <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{new Date(log.date).toLocaleDateString()} • {log.time}</span>
                       <h4 className="text-lg font-bold text-slate-800 mt-1">{log.type}</h4>
                    </div>
                    {log.sentiment && log.sentiment !== 'Neutral' && (
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                         log.sentiment === 'Concerned' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {log.sentiment}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-600 text-sm leading-relaxed mb-4">{log.notes}</p>
                  
                  {log.actionItems && log.actionItems.length > 0 && (
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-100 mb-3">
                       <p className="text-xs font-bold text-slate-500 uppercase mb-2">Action Items</p>
                       <div className="space-y-2">
                          {log.actionItems.map(item => (
                            <div 
                              key={item.id} 
                              className="flex items-start cursor-pointer hover:bg-slate-100 p-1 rounded transition-colors"
                              onClick={() => onToggleActionItem(log.id, item.id)}
                            >
                               {item.status === 'Completed' 
                                 ? <CheckCircle2 size={16} className="text-green-500 mt-0.5 mr-2 flex-shrink-0" /> 
                                 : <Circle size={16} className="text-slate-400 mt-0.5 mr-2 flex-shrink-0" />
                               }
                               <span className={`text-sm ${item.status === 'Completed' ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                                 {item.task}
                               </span>
                            </div>
                          ))}
                       </div>
                    </div>
                  )}

                  {log.createdBy && (
                    <div className="flex items-center text-xs text-slate-400 mt-3 pt-3 border-t border-slate-100">
                      <User size={12} className="mr-1" />
                      Logged by {log.createdBy}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Analytics Sidebar */}
        <div className="lg:col-span-1 space-y-6">
           <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Interaction Types</h3>
              <div className="h-64 w-full">
                {totalMeetings > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        fill="#8884d8"
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                    No data available
                  </div>
                )}
              </div>
           </div>

           {/* Recent Behaviour List */}
           <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Recent Behaviour</h3>
              <div className="space-y-3">
                {studentBehaviour.length === 0 ? (
                    <p className="text-sm text-slate-400 italic">No behavior entries recorded.</p>
                ) : (
                    studentBehaviour.slice(0, 5).map(entry => (
                        <div key={entry.id} className="flex items-start justify-between pb-2 border-b border-slate-50 last:border-0">
                            <div>
                                <p className="text-sm font-medium text-slate-700">{entry.category}</p>
                                <p className="text-xs text-slate-400">{new Date(entry.date).toLocaleDateString()}</p>
                            </div>
                            <span className={`text-sm font-bold ${entry.points > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {entry.points > 0 ? '+' : ''}{entry.points}
                            </span>
                        </div>
                    ))
                )}
              </div>
           </div>
        </div>
      </div>

      {/* Certificate Modal */}
      {showCertificateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
              <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
                  <div className="flex justify-between items-center p-4 border-b border-slate-100">
                      <h3 className="text-lg font-bold text-slate-800 flex items-center">
                          <Award className="mr-2 text-amber-500" />
                          Generate Certificate
                      </h3>
                      <button onClick={() => setShowCertificateModal(false)} className="text-slate-400 hover:text-slate-600">
                          <X size={24} />
                      </button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-8 bg-slate-100 flex items-center justify-center">
                      {isGeneratingCert ? (
                          <div className="text-center">
                              <Loader2 size={48} className="text-indigo-600 animate-spin mx-auto mb-4" />
                              <h4 className="text-lg font-semibold text-slate-700">Writing Praise...</h4>
                              <p className="text-sm text-slate-500">Gemini is analyzing {studentName}'s achievements.</p>
                          </div>
                      ) : certificateData ? (
                          <div id="certificate-print-area" className="bg-white p-12 shadow-lg w-full text-center border-8 border-double border-amber-200 relative">
                               {/* Decorative corners */}
                               <div className="absolute top-4 left-4 w-16 h-16 border-t-4 border-l-4 border-amber-400"></div>
                               <div className="absolute top-4 right-4 w-16 h-16 border-t-4 border-r-4 border-amber-400"></div>
                               <div className="absolute bottom-4 left-4 w-16 h-16 border-b-4 border-l-4 border-amber-400"></div>
                               <div className="absolute bottom-4 right-4 w-16 h-16 border-b-4 border-r-4 border-amber-400"></div>
                               
                               <div className="mb-6">
                                   <Sparkles size={48} className="mx-auto text-amber-400 mb-2" />
                                   <h1 className="text-4xl font-serif font-bold text-slate-800 mb-2 uppercase tracking-wider">{certificateData.title}</h1>
                                   <p className="text-amber-600 font-bold uppercase tracking-widest text-sm">{certificateData.awardType} Award</p>
                               </div>

                               <p className="text-slate-500 italic mb-4">This certificate is proudly presented to</p>
                               <h2 className="text-3xl font-cursive font-bold text-indigo-700 mb-6 border-b-2 border-slate-100 pb-4 inline-block px-12">{studentName}</h2>

                               <p className="text-lg text-slate-700 leading-relaxed max-w-lg mx-auto mb-12 font-serif">
                                   "{certificateData.message}"
                               </p>

                               <div className="flex justify-between items-end mt-12 px-12">
                                   <div className="text-center">
                                       <div className="w-40 border-b border-slate-400 mb-2"></div>
                                       <p className="text-xs text-slate-500 uppercase font-bold">Date</p>
                                       <p className="text-sm">{new Date().toLocaleDateString()}</p>
                                   </div>
                                   <div className="w-24 h-24 bg-amber-500 rounded-full flex items-center justify-center text-white font-bold shadow-inner border-4 border-amber-300">
                                       <Award size={48} />
                                   </div>
                                   <div className="text-center">
                                       <div className="w-40 border-b border-slate-400 mb-2"></div>
                                       <p className="text-xs text-slate-500 uppercase font-bold">Signed</p>
                                       <p className="text-sm font-serif">Principal / Teacher</p>
                                   </div>
                               </div>
                          </div>
                      ) : (
                          <div className="flex flex-col items-center justify-center text-center p-6 bg-red-50 rounded-xl border border-red-200">
                              <AlertCircle size={48} className="text-red-500 mb-3" />
                              <h4 className="text-lg font-bold text-red-700">Generation Failed</h4>
                              <p className="text-red-600 mb-4">{certificateError || "An unexpected error occurred."}</p>
                              <button 
                                onClick={handleGenerateCertificate}
                                className="px-4 py-2 bg-white text-red-600 border border-red-200 rounded-lg hover:bg-red-50 font-medium"
                              >
                                Try Again
                              </button>
                          </div>
                      )}
                  </div>

                  {!isGeneratingCert && certificateData && (
                      <div className="p-4 bg-white border-t border-slate-100 flex justify-end space-x-3">
                          <button 
                            onClick={() => setShowCertificateModal(false)}
                            className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg font-medium"
                          >
                              Close
                          </button>
                          <button 
                            onClick={handlePrintCertificate}
                            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium shadow-lg"
                          >
                              <Printer size={18} className="mr-2" /> Print Certificate
                          </button>
                      </div>
                  )}
              </div>
          </div>
      )}
    </div>
  );
};

export default StudentProfile;
