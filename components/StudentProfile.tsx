import React from 'react';
import { MeetingLog, BehaviourEntry, SafeguardingCase } from '../types';
import { ArrowLeft, Mail, Phone, Clock, GraduationCap, ClipboardList, CheckCircle2, Circle, Plus, User, Users, Flag, Star, AlertCircle, Shield, ChevronRight } from 'lucide-react';
import { STUDENTS } from '../data/students';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

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
  const studentDetails = STUDENTS.find(s => s.name === studentName);
  const studentLogs = logs.filter(l => l.attendees.includes(studentName)).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const studentBehaviour = behaviourEntries.filter(b => b.studentName === studentName).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
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

  return (
    <div className="animate-fade-in">
      <button onClick={onBack} className="mb-6 flex items-center text-slate-500 hover:text-slate-800 transition-colors">
        <ArrowLeft size={20} className="mr-2" />
        Back to Directory
      </button>
      
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
    </div>
  );
};

export default StudentProfile;