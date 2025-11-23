import React, { useState, useEffect } from 'react';
import { ViewState, MeetingLog, MeetingType, SafeguardingCase, UserProfile, BehaviourEntry } from './types';
import Dashboard from './components/Dashboard';
import MeetingForm from './components/MeetingForm';
import HistoryView from './components/HistoryView';
import StudentProfile from './components/StudentProfile';
import StudentDirectory from './components/StudentDirectory';
import SafeguardingBuilder from './components/SafeguardingBuilder';
import ReportsView from './components/ReportsView';
import LoginView from './components/LoginView';
import BehaviourManager from './components/BehaviourManager';
import SeatingPlanView from './components/SeatingPlanView';
import { LayoutDashboard, PlusCircle, Users, Menu, X, GraduationCap, FileText, BookUser, Shield, FileBarChart, LogOut, Star, LayoutGrid } from 'lucide-react';
import { STUDENTS } from './data/students';

// Update mocks to use real student names from the new data file
const MOCK_LOGS: MeetingLog[] = [
  {
    id: '1',
    date: '2023-10-25',
    time: '14:00',
    attendees: ['Abdulaziz Jaber A A'],
    type: MeetingType.ACADEMIC,
    notes: 'Discussed math performance. Abdulaziz is struggling with algebra but doing well in geometry.',
    actionItems: [
      { id: 'a1', task: 'Send extra worksheets', status: 'Pending' },
      { id: 'a2', task: 'Email parents about tutoring', status: 'Completed' }
    ],
    sentiment: 'Neutral',
    createdBy: 'John Smith'
  },
  {
    id: '2',
    date: '2023-10-28',
    time: '10:30',
    attendees: ['Hamad Salem A D'],
    type: MeetingType.BEHAVIORAL,
    notes: 'Meeting regarding disruptive behavior in class. Agreed on a daily report card system.',
    actionItems: [
      { id: 'b1', task: 'Create daily report template', status: 'Pending' },
      { id: 'b2', task: 'Check in next Friday', status: 'Pending' }
    ],
    sentiment: 'Concerned',
    createdBy: 'Jane Doe'
  },
  {
    id: '3',
    date: '2023-11-02',
    time: '15:45',
    attendees: ['Abdulaziz Jaber A A'],
    type: MeetingType.ACADEMIC,
    notes: 'Follow up on algebra. Significant improvement shown. Keep up the good work.',
    actionItems: [],
    sentiment: 'Positive',
    createdBy: 'John Smith'
  },
  {
    id: '4',
    date: '2023-11-05',
    time: '09:00',
    attendees: ['Adyan Adel'],
    type: MeetingType.PARENT_TEACHER,
    notes: 'Met with mother regarding English proficiency. Suggested reading list.',
    actionItems: [
      { id: 'c1', task: 'Share reading list with parent', status: 'Pending' }
    ],
    sentiment: 'Positive',
    createdBy: 'Sarah Connor'
  }
];

const MOCK_SAFEGUARDING_CASES: SafeguardingCase[] = [
  {
    id: 'sg-1',
    studentName: 'Abdulaziz Jaber A A',
    date: '2023-10-20',
    incidentType: 'Bullying',
    rawDescription: 'Excluding other students from group activities during lunch break.',
    generatedReport: {
      dslSummary: 'Student involved in repeated exclusion of peers, indicating relational aggression.',
      chronology: ['12:30 PM - Lunch break started', '12:45 PM - Observed excluding peer', '1:00 PM - Initial discussion with student'],
      keyEvidence: ['Teacher observation at 12:45 PM'],
      policiesApplied: ['Anti-Bullying', 'Behavioral Expectations'],
      witnessQuestions: ['Who else was present?', 'How long has this been happening?'],
      nextSteps: ['Monitor break times', 'Parent notification'],
      riskLevel: 'Medium',
      sentiment: 'Cautionary'
    },
    status: 'Investigating',
    createdBy: 'Jane Doe'
  },
  {
    id: 'sg-2',
    studentName: 'Hamad Salem A D',
    date: '2023-10-25',
    incidentType: 'Online Safety',
    rawDescription: 'Accessing inappropriate games on school tablet during math lesson.',
    generatedReport: {
      dslSummary: 'Violation of ICT Acceptable Use Policy. Student accessed restricted content.',
      chronology: ['10:15 AM - Math lesson', '10:20 AM - Teacher noticed screen', '10:20 AM - Device confiscated'],
      keyEvidence: ['Confiscated Device log'],
      policiesApplied: ['ICT Acceptable Use', 'Online Safety'],
      witnessQuestions: [],
      nextSteps: ['ICT privilege suspension', 'Re-sign acceptable use policy'],
      riskLevel: 'Low',
      sentiment: 'Routine'
    },
    status: 'Closed',
    createdBy: 'Sarah Connor'
  }
];

function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>('DASHBOARD');
  
  const [logs, setLogs] = useState<MeetingLog[]>(() => {
    try {
      const savedLogs = localStorage.getItem('edulog_data');
      return savedLogs ? JSON.parse(savedLogs) : MOCK_LOGS; 
    } catch (error) {
      console.error('Failed to load logs from storage:', error);
      return MOCK_LOGS;
    }
  });

  const [safeguardingCases, setSafeguardingCases] = useState<SafeguardingCase[]>(() => {
    try {
      const savedCases = localStorage.getItem('edulog_safeguarding');
      return savedCases ? JSON.parse(savedCases) : MOCK_SAFEGUARDING_CASES;
    } catch (error) {
      return MOCK_SAFEGUARDING_CASES;
    }
  });

  const [behaviourEntries, setBehaviourEntries] = useState<BehaviourEntry[]>(() => {
    try {
      const saved = localStorage.getItem('edulog_behaviour');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Save logs to LocalStorage whenever they change
  useEffect(() => {
    localStorage.setItem('edulog_data', JSON.stringify(logs));
  }, [logs]);

  // Save safeguarding cases
  useEffect(() => {
    localStorage.setItem('edulog_safeguarding', JSON.stringify(safeguardingCases));
  }, [safeguardingCases]);

  // Save behavior entries
  useEffect(() => {
    localStorage.setItem('edulog_behaviour', JSON.stringify(behaviourEntries));
  }, [behaviourEntries]);

  useEffect(() => {
    const handleResize = () => {
       const mobile = window.innerWidth < 768;
       setIsMobile(mobile);
       if (!mobile) setIsSidebarOpen(true);
       else setIsSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    handleResize(); // Init
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleAddLog = (log: MeetingLog) => {
    setLogs([log, ...logs]);
    setCurrentView('DASHBOARD');
  };

  const handleAddSafeguardingCase = (newCase: SafeguardingCase) => {
    setSafeguardingCases([newCase, ...safeguardingCases]);
    const logEntry: MeetingLog = {
      id: crypto.randomUUID(),
      date: newCase.date,
      time: new Date().toTimeString().slice(0, 5),
      attendees: [newCase.studentName],
      type: MeetingType.BEHAVIORAL,
      notes: `[SAFEGUARDING CASE FILED] ${newCase.generatedReport.dslSummary}`,
      actionItems: newCase.generatedReport.nextSteps.map(step => ({
        id: crypto.randomUUID(),
        task: step,
        status: 'Pending'
      })),
      sentiment: 'Concerned',
      createdBy: newCase.createdBy
    };
    setLogs([logEntry, ...logs]);
    setCurrentView('SAFEGUARDING');
  };

  const handleDeleteSafeguardingCase = (id: string) => {
    setSafeguardingCases(prev => prev.filter(c => c.id !== id));
  };

  const handleAddBehaviourEntry = (newEntries: BehaviourEntry[]) => {
    setBehaviourEntries(prev => [...newEntries, ...prev]);
  };

  const handleNavigate = (view: ViewState, studentName?: string) => {
    if (view === 'STUDENT_PROFILE' && studentName) {
      setSelectedStudent(studentName);
    } else if (view === 'NEW_LOG' && studentName) {
       setSelectedStudent(studentName);
    } else if (view === 'SAFEGUARDING' && studentName) {
       // Allow passing student name to safeguarding view to filter list
       setSelectedStudent(studentName);
    } else if (view !== 'STUDENT_PROFILE' && view !== 'NEW_LOG' && view !== 'SAFEGUARDING') {
       setSelectedStudent(null);
    }
    setCurrentView(view);
    if (isMobile) setIsSidebarOpen(false);
  };

  const handleToggleActionItem = (logId: string, actionItemId: string) => {
    setLogs(prevLogs => prevLogs.map(log => {
      if (log.id === logId) {
        return {
          ...log,
          actionItems: log.actionItems.map(item => 
            item.id === actionItemId 
              ? { ...item, status: item.status === 'Pending' ? 'Completed' : 'Pending' } 
              : item
          )
        };
      }
      return log;
    }));
  };

  const handleMarkAllActionsCompleted = (studentName: string) => {
    setLogs(prevLogs => prevLogs.map(log => {
      if (log.attendees.includes(studentName)) {
        return {
          ...log,
          actionItems: log.actionItems.map(item => ({ ...item, status: 'Completed' }))
        };
      }
      return log;
    }));
  };

  const handleLogin = (user: UserProfile) => {
    setCurrentUser(user);
    setCurrentView('DASHBOARD');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setSelectedStudent(null);
    setCurrentView('DASHBOARD');
  };

  const NavItem = ({ view, icon: Icon, label }: { view: ViewState, icon: any, label: string }) => (
    <button 
      onClick={() => handleNavigate(view)}
      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
        currentView === view && !selectedStudent
          ? 'bg-blue-600 text-white shadow-md shadow-blue-200' 
          : 'text-slate-600 hover:bg-slate-100'
      }`}
    >
      <Icon size={20} />
      <span className="font-medium">{label}</span>
    </button>
  );

  if (!currentUser) {
    return <LoginView onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Mobile Overlay with Backdrop Blur */}
      {isMobile && isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-20 transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar with Smooth Slide-in */}
      <aside 
        className={`fixed md:static inset-y-0 left-0 z-30 w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0 shadow-2xl md:shadow-none' : '-translate-x-full md:translate-x-0'
        } print:hidden`}
      >
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-blue-700">
            <GraduationCap size={28} />
            <span className="text-xl font-bold tracking-tight">EduLog Pro</span>
          </div>
          {isMobile && (
             <button onClick={() => setIsSidebarOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
               <X size={24} />
             </button>
          )}
        </div>

        <nav className="px-4 space-y-2 mt-4">
          <NavItem view="DASHBOARD" icon={LayoutDashboard} label="Dashboard" />
          <NavItem view="NEW_LOG" icon={PlusCircle} label="New Entry" />
          <NavItem view="STUDENTS_DIRECTORY" icon={BookUser} label="Students" />
          <NavItem view="HISTORY" icon={FileText} label="History Logs" />
          <NavItem view="BEHAVIOUR" icon={Star} label="Behaviour" />
          <NavItem view="SEATING_PLAN" icon={LayoutGrid} label="Seating Plan" />
          <NavItem view="REPORTS" icon={FileBarChart} label="Reports" />
          <div className="pt-4 mt-4 border-t border-slate-100">
            <p className="px-4 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Specialized</p>
            <NavItem view="SAFEGUARDING" icon={Shield} label="Safeguarding" />
          </div>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-100 bg-slate-50">
          <div className="flex items-center space-x-3 mb-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-sm ${
              currentUser.role === 'DSL' ? 'bg-red-500' : 'bg-blue-600'
            }`}>
              {currentUser.initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate">{currentUser.name}</p>
              <p className="text-xs text-slate-500 truncate">{currentUser.role}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 text-sm hover:bg-slate-100 hover:text-red-600 transition-colors"
          >
            <LogOut size={16} />
            <span>Switch User</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Mobile Header */}
        <header className="bg-white border-b border-slate-200 p-4 flex md:hidden justify-between items-center print:hidden">
           <div className="flex items-center space-x-2 text-blue-700">
            <GraduationCap size={24} />
            <span className="text-lg font-bold">EduLog Pro</span>
          </div>
          <button onClick={() => setIsSidebarOpen(true)} className="text-slate-600 hover:text-blue-600 transition-colors">
            <Menu size={24} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 print:p-0 print:overflow-visible">
          <div className="max-w-5xl mx-auto print:max-w-none h-full">
            {currentView === 'DASHBOARD' && (
              <Dashboard 
                logs={logs} 
                safeguardingCases={safeguardingCases}
                behaviourEntries={behaviourEntries}
                onNavigate={handleNavigate} 
                currentUser={currentUser} 
              />
            )}
            
            {currentView === 'NEW_LOG' && (
              <MeetingForm 
                initialAttendees={currentView === 'NEW_LOG' && selectedStudent ? [selectedStudent] : []}
                onSubmit={handleAddLog} 
                onCancel={() => handleNavigate('DASHBOARD')}
                currentUser={currentUser}
              />
            )}

            {currentView === 'STUDENTS_DIRECTORY' && (
              <StudentDirectory 
                onSelectStudent={(name) => handleNavigate('STUDENT_PROFILE', name)}
                onQuickLog={(name) => handleNavigate('NEW_LOG', name)}
              />
            )}

            {currentView === 'HISTORY' && (
              <HistoryView 
                logs={logs} 
                onSelectStudent={(name) => handleNavigate('STUDENT_PROFILE', name)} 
              />
            )}

            {currentView === 'BEHAVIOUR' && (
              <BehaviourManager 
                currentUser={currentUser} 
                entries={behaviourEntries}
                onAddEntries={handleAddBehaviourEntry}
              />
            )}

            {currentView === 'SEATING_PLAN' && (
              <SeatingPlanView />
            )}

            {currentView === 'REPORTS' && (
              <ReportsView 
                logs={logs}
                safeguardingCases={safeguardingCases}
              />
            )}

            {currentView === 'STUDENT_PROFILE' && selectedStudent && (
              <StudentProfile 
                studentName={selectedStudent} 
                logs={logs}
                behaviourEntries={behaviourEntries}
                safeguardingCases={safeguardingCases}
                onBack={() => handleNavigate('STUDENTS_DIRECTORY')}
                onToggleActionItem={handleToggleActionItem}
                onMarkAllCompleted={handleMarkAllActionsCompleted}
                onQuickLog={(name) => handleNavigate('NEW_LOG', name)}
                onViewSafeguarding={(name) => handleNavigate('SAFEGUARDING', name)}
              />
            )}

            {currentView === 'SAFEGUARDING' && (
              <SafeguardingBuilder 
                cases={safeguardingCases}
                logs={logs}
                onSave={handleAddSafeguardingCase}
                onDelete={handleDeleteSafeguardingCase}
                onCancel={() => handleNavigate('DASHBOARD')}
                currentUser={currentUser}
                initialSearchTerm={selectedStudent || ''}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;