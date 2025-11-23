
import React from 'react';
import { MeetingLog, MeetingType, UserProfile } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Users, Calendar, ClipboardList, AlertCircle, User as UserIcon } from 'lucide-react';

interface DashboardProps {
  logs: MeetingLog[];
  onNavigate: (view: any) => void;
  currentUser: UserProfile;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const Dashboard: React.FC<DashboardProps> = ({ logs, onNavigate, currentUser }) => {
  
  // Calculate Stats
  const totalMeetings = logs.length;
  const uniqueStudents = new Set(logs.flatMap(l => l.attendees)).size;
  // Count only pending action items (safe check for array existence)
  const pendingActions = logs.reduce((acc, log) => {
    return acc + (log.actionItems ? log.actionItems.filter(item => item.status === 'Pending').length : 0);
  }, 0);
  
  // Prepare Chart Data
  const typeCount = logs.reduce((acc, log) => {
    acc[log.type] = (acc[log.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.keys(typeCount).map(type => ({
    name: type,
    value: typeCount[type]
  }));

  // Recent activity data
  const recentLogs = [...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-slate-500">Welcome back, {currentUser.name}. Here is your overview.</p>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center space-x-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
            <Calendar size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Total Meetings</p>
            <p className="text-2xl font-bold text-slate-800">{totalMeetings}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center space-x-4">
          <div className="p-3 bg-emerald-100 text-emerald-600 rounded-lg">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Unique Attendees</p>
            <p className="text-2xl font-bold text-slate-800">{uniqueStudents}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center space-x-4">
          <div className="p-3 bg-amber-100 text-amber-600 rounded-lg">
            <ClipboardList size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Pending Actions</p>
            <p className="text-2xl font-bold text-slate-800">{pendingActions}</p>
          </div>
        </div>
      </div>

      {/* Charts & Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Meeting Types</h3>
          <div className="h-64 w-full">
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
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-slate-800">Recent Logs</h3>
            <button onClick={() => onNavigate('HISTORY')} className="text-sm text-blue-600 hover:underline">View All</button>
          </div>
          <div className="space-y-4">
            {recentLogs.length === 0 ? (
              <p className="text-slate-400 text-center py-8">No meetings recorded yet.</p>
            ) : (
              recentLogs.map(log => (
                <div key={log.id} className="flex items-start p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className={`w-2 h-2 mt-2 rounded-full mr-3 flex-shrink-0 ${
                    log.type === MeetingType.IEP ? 'bg-red-500' : 
                    log.type === MeetingType.BEHAVIORAL ? 'bg-orange-500' : 'bg-blue-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between">
                      <p className="text-sm font-medium text-slate-800 truncate">
                        {log.attendees.join(', ')}
                      </p>
                      {log.sentiment === 'Concerned' && (
                        <AlertCircle size={16} className="text-red-400 ml-2" />
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      {log.type} • {new Date(log.date).toLocaleDateString()}
                    </p>
                    {log.createdBy && (
                      <p className="text-[10px] text-slate-400 mt-0.5 flex items-center">
                        <UserIcon size={10} className="mr-1" /> {log.createdBy}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
