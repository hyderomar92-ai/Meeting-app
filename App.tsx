
import React, { useState, useEffect } from 'react';
import { ViewState, MeetingLog, MeetingType, SafeguardingCase, UserProfile, BehaviourEntry, Organization } from './types';
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
import SentinelChat from './components/SentinelChat';
import SuperAdminDashboard from './components/SuperAdminDashboard';
import SuperAdminTenants from './components/SuperAdminTenants';
import SuperAdminAIMonitor from './components/SuperAdminAIMonitor';
import SuperAdminSecurity from './components/SuperAdminSecurity';
import SuperAdminTools from './components/SuperAdminTools';
import SuperAdminOperations from './components/SuperAdminOperations';
import SuperAdminSubscriptions from './components/SuperAdminSubscriptions';
import SuperAdminIntegrations from './components/SuperAdminIntegrations';
import SuperAdminData from './components/SuperAdminData';
import SuperAdminResources from './components/SuperAdminResources';
import SuperAdminBranding from './components/SuperAdminBranding';
import SuperAdminFeedback from './components/SuperAdminFeedback';
import OrgAdminSettings from './components/OrgAdminSettings';
import { LayoutDashboard, PlusCircle, Users, Menu, X, Shield, FileText, BookUser, FileBarChart, LogOut, Star, LayoutGrid, Globe, Building2, Settings, BrainCircuit, ShieldAlert, Sliders, Eye, LifeBuoy, CreditCard, Network, Database, Library, Palette, MessageSquare, Activity, Monitor, Ticket, Wifi } from 'lucide-react';
import { STUDENTS } from './data/students';
import { useLanguage, Language } from './contexts/LanguageContext';

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
    createdBy: 'Jane Doe',
    completedSteps: [],
    resolutionNotes: ''
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
    createdBy: 'Sarah Connor',
    completedSteps: ['ICT privilege suspension'],
    resolutionNotes: 'Privileges suspended for 1 week. Parent signed new agreement.'
  }
];

const MOCK_ORGANIZATIONS: Organization[] = [
    { 
        id: 'org1', name: 'Springfield High', type: 'School', status: 'Active', licenseTier: 'Enterprise', 
        staffCount: 45, studentCount: 1200, renewalDate: '2024-09-01',
        tokenUsageCurrentPeriod: 450000, tokenLimit: 1000000, aiCostEstimate: 4.50,
        features: { safeguarding: true, aiAssistant: true, parentPortal: true },
        churnRisk: 'Low'
    },
    { 
        id: 'org2', name: 'Westfield College', type: 'College', status: 'Trial', licenseTier: 'Pro', 
        staffCount: 20, studentCount: 450, renewalDate: '2024-05-15',
        tokenUsageCurrentPeriod: 12000, tokenLimit: 500000, aiCostEstimate: 0.12,
        features: { safeguarding: true, aiAssistant: false, parentPortal: false },
        churnRisk: 'High'
    },
];

function App() {
  const { t, language, setLanguage, dir } = useLanguage();

  // Initialize from LocalStorage if available
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
      try {
          const saved = localStorage.getItem('sentinel_current_user');
          return saved ? JSON.parse(saved) : null;
      } catch {
          return null;
      }
  });

  // SUPER ADMIN IMPERSONATION STATE
  const [realAdminUser, setRealAdminUser] = useState<UserProfile | null>(null);

  const [currentView, setCurrentView] = useState<ViewState>('DASHBOARD');
  
  const [logs, setLogs] = useState<MeetingLog[]>(() => {
    try {
      const savedLogs = localStorage.getItem('sentinel_logs');
      return savedLogs ? JSON.parse(savedLogs) : MOCK_LOGS; 
    } catch (error) {
      console.error('Failed to load logs from storage:', error);
      return MOCK_LOGS;
    }
  });

  const [safeguardingCases, setSafeguardingCases] = useState<SafeguardingCase[]>(() => {
    try {
      const savedCases = localStorage.getItem('sentinel_safeguarding');
      return savedCases ? JSON.parse(savedCases) : MOCK_SAFEGUARDING_CASES;
    } catch (error) {
      return MOCK_SAFEGUARDING_CASES;
    }
  });

  const [behaviourEntries, setBehaviourEntries] = useState<BehaviourEntry[]>(() => {
    try {
      const saved = localStorage.getItem('sentinel_behaviour');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Admin Data States
  const [organizations, setOrganizations] = useState<Organization[]>(() => {
      try {
          const saved = localStorage.getItem('sentinel_organizations');
          return saved ? JSON.parse(saved) : MOCK_ORGANIZATIONS;
      } catch {
          return MOCK_ORGANIZATIONS;
      }
  });
  
  const [allUsers, setAllUsers] = useState<UserProfile[]>(() => {
       try {
        const saved = localStorage.getItem('sentinel_users');
        // Ensure fallback mock data if empty for admin tools to work
        const parsed = saved ? JSON.parse(saved) : [];
        return parsed.length > 0 ? parsed : [
            { id: 'u0', name: 'System Owner', role: 'Super Admin', initials: 'SO', email: 'sysadmin@sentinel.ai', status: 'Active' },
            { id: 'u1', name: 'IT Support', role: 'Admin', initials: 'IT', email: 'it@springfield.edu', status: 'Active' },
            { id: 'u2', name: 'Jane Doe', role: 'Head of Year', initials: 'JD', email: 'jane.doe@springfield.edu', status: 'Active' },
            { id: 'u3', name: 'John Smith', role: 'Teacher', initials: 'JS', email: 'j.smith@springfield.edu', status: 'Locked' },
            { id: 'u4', name: 'Sarah Connor', role: 'DSL', initials: 'SC', email: 's.connor@springfield.edu', status: 'Active' }
        ];
       } catch {
           return [];
       }
  });
  
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  // Escalation State
  const [escalationData, setEscalationData] = useState<{ studentName: string; description: string; date: string } | null>(null);

  // Persist Current User
  useEffect(() => {
      if (currentUser) {
          localStorage.setItem('sentinel_current_user', JSON.stringify(currentUser));
      } else {
          localStorage.removeItem('sentinel_current_user');
      }
  }, [currentUser]);

  // Persistence Hooks
  useEffect(() => { localStorage.setItem('sentinel_logs', JSON.stringify(logs)); }, [logs]);
  useEffect(() => { localStorage.setItem('sentinel_safeguarding', JSON.stringify(safeguardingCases)); }, [safeguardingCases]);
  useEffect(() => { localStorage.setItem('sentinel_behaviour', JSON.stringify(behaviourEntries)); }, [behaviourEntries]);
  useEffect(() => { localStorage.setItem('sentinel_organizations', JSON.stringify(organizations)); }, [organizations]);
  useEffect(() => { localStorage.setItem('sentinel_users', JSON.stringify(allUsers)); }, [allUsers]);

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
  
  const handleEscalateLog = (data: { studentName: string; description: string; date: string }) => {
      setEscalationData(data);
      setCurrentView('SAFEGUARDING');
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
    setEscalationData(null); // Clear escalation state
    setCurrentView('SAFEGUARDING');
  };

  const handleUpdateSafeguardingCase = (updatedCase: SafeguardingCase) => {
    setSafeguardingCases(prev => prev.map(c => c.id === updatedCase.id ? updatedCase : c));
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
       setEscalationData(null);
    } else if (view !== 'STUDENT_PROFILE' && view !== 'NEW_LOG' && view !== 'SAFEGUARDING') {
       setSelectedStudent(null);
       setEscalationData(null);
    }
    
    // Clear escalation data if navigating away from safeguarding unless specifically escalating
    if (view !== 'SAFEGUARDING') {
        setEscalationData(null);
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
    setRealAdminUser(null); // Clear any previous impersonation
    if (user.role === 'Super Admin') {
        setCurrentView('SUPER_ADMIN_DASHBOARD');
    } else if (user.role === 'Admin') {
        setCurrentView('IT_DASHBOARD'); // Default view for IT Admin
    } else {
        setCurrentView('DASHBOARD');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setRealAdminUser(null);
    setSelectedStudent(null);
    setCurrentView('DASHBOARD');
  };

  // --- IMPERSONATION LOGIC ---
  const handleImpersonate = (orgId: string) => {
      const org = organizations.find(o => o.id === orgId);
      if (!org || !currentUser) return;

      setRealAdminUser(currentUser); // Store the real admin
      
      // Create a temporary admin user for that org
      const tempUser: UserProfile = {
          id: `temp-${orgId}`,
          name: `${org.name} Admin (Ghost)`,
          role: 'Admin',
          initials: 'GA',
          orgId: orgId
      };
      
      setCurrentUser(tempUser);
      setCurrentView('IT_DASHBOARD'); // Go to their dashboard
  };

  const stopImpersonation = () => {
      if (realAdminUser) {
          setCurrentUser(realAdminUser);
          setRealAdminUser(null);
          setCurrentView('SUPER_ADMIN_TENANTS');
      }
  };

  const NavItem = ({ view, icon: Icon, labelKey, customLabel }: { view: ViewState, icon: any, labelKey?: string, customLabel?: string }) => (
    <button 
      onClick={() => handleNavigate(view)}
      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors text-left ${
        currentView === view && !selectedStudent
          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20 font-semibold' 
          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      }`}
    >
      <Icon size={20} className={currentView === view ? 'text-white' : 'text-slate-500 group-hover:text-white'} />
      <span className="font-medium">{customLabel || (labelKey ? t(labelKey) : '')}</span>
    </button>
  );

  if (!currentUser) {
    return <LoginView onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden" dir={dir}>
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
        className={`fixed md:static inset-y-0 left-0 z-30 w-64 bg-slate-900 border-r border-slate-800 transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0 shadow-2xl md:shadow-none' : (dir === 'rtl' ? 'translate-x-full md:translate-x-0' : '-translate-x-full md:translate-x-0')
        } print:hidden`}
      >
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-white">
            <Shield size={28} className="text-indigo-500" />
            <span className="text-xl font-bold tracking-tight">{t("app.name")}</span>
          </div>
          {isMobile && (
             <button onClick={() => setIsSidebarOpen(false)} className="text-slate-400 hover:text-white transition-colors">
               <X size={24} />
             </button>
          )}
        </div>

        <nav className="px-4 space-y-2 mt-4 overflow-y-auto max-h-[calc(100vh-180px)] custom-scrollbar">
          {currentUser.role === 'Super Admin' ? (
              /* SUPER ADMIN NAVIGATION */
              <>
                <p className="px-4 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Platform</p>
                <NavItem view="SUPER_ADMIN_DASHBOARD" icon={Building2} customLabel="Command Center" />
                <NavItem view="SUPER_ADMIN_TENANTS" icon={Globe} customLabel="Organizations" />
                <NavItem view="SUPER_ADMIN_SUBSCRIPTIONS" icon={CreditCard} customLabel="Subscriptions" />
                <NavItem view="SUPER_ADMIN_INTEGRATIONS" icon={Network} customLabel="Integrations" />
                <NavItem view="SUPER_ADMIN_OPS" icon={LifeBuoy} customLabel="Support & Ops" />
                
                <p className="px-4 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 mt-4">Data & Content</p>
                <NavItem view="SUPER_ADMIN_DATA" icon={Database} customLabel="Data Governance" />
                <NavItem view="SUPER_ADMIN_RESOURCES" icon={Library} customLabel="Resource Library" />
                
                <p className="px-4 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 mt-4">Product & Growth</p>
                <NavItem view="SUPER_ADMIN_FEEDBACK" icon={MessageSquare} customLabel="Feedback Loop" />
                <NavItem view="SUPER_ADMIN_BRANDING" icon={Palette} customLabel="Platform Branding" />

                <p className="px-4 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 mt-4">System</p>
                <NavItem view="SUPER_ADMIN_AI" icon={BrainCircuit} customLabel="Sentinel Cortex" />
                <NavItem view="SUPER_ADMIN_SECURITY" icon={ShieldAlert} customLabel="Audit & Security" />
                <NavItem view="SUPER_ADMIN_TOOLS" icon={Sliders} customLabel="Admin Tools" />
              </>
          ) : currentUser.role === 'Admin' ? (
              /* IT ADMIN NAVIGATION */
              <>
                <p className="px-4 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">IT Operations</p>
                <NavItem view="IT_DASHBOARD" icon={Activity} customLabel="System Overview" />
                <NavItem view="IT_USERS" icon={Users} customLabel="Identity & Access" />
                <NavItem view="IT_ASSETS" icon={Monitor} customLabel="Asset Register" />
                <NavItem view="IT_DATA" icon={Database} customLabel="Data Sync" />
                <NavItem view="IT_HELPDESK" icon={Ticket} customLabel="Helpdesk" />
              </>
          ) : (
             /* STANDARD SCHOOL NAVIGATION */
             <>
                <NavItem view="DASHBOARD" icon={LayoutDashboard} labelKey="nav.dashboard" />
                <NavItem view="NEW_LOG" icon={PlusCircle} labelKey="nav.new_entry" />
                <NavItem view="STUDENTS_DIRECTORY" icon={BookUser} labelKey="nav.students" />
                <NavItem view="HISTORY" icon={FileText} labelKey="nav.history" />
                <NavItem view="BEHAVIOUR" icon={Star} labelKey="nav.behaviour" />
                <NavItem view="SEATING_PLAN" icon={LayoutGrid} labelKey="nav.seating" />
                <NavItem view="REPORTS" icon={FileBarChart} labelKey="nav.reports" />
                <div className="pt-4 mt-4 border-t border-slate-800">
                    <p className="px-4 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t("nav.specialized")}</p>
                    <NavItem view="SAFEGUARDING" icon={Shield} labelKey="nav.safeguarding" />
                </div>
             </>
          )}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 bg-slate-900/50">
           {/* Language Selector */}
           <div className="px-4 py-2 border-t border-slate-800">
              <div className="relative">
                  <Globe className="absolute left-2 top-1/2 transform -translate-y-1/2 text-slate-400" size={14} />
                  <select 
                      value={language}
                      onChange={(e) => setLanguage(e.target.value as Language)}
                      className="w-full pl-8 pr-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                  >
                      <option value="en">{t('lang.en')}</option>
                      <option value="ar">{t('lang.ar')}</option>
                      <option value="fr">{t('lang.fr')}</option>
                      <option value="es">{t('lang.es')}</option>
                      <option value="de">{t('lang.de')}</option>
                  </select>
              </div>
           </div>

          <div className="p-4 border-t border-slate-800">
            <div className="flex items-center space-x-3 mb-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-sm ring-2 ring-slate-800 ${
                currentUser.role === 'DSL' ? 'bg-red-600' : currentUser.role === 'Super Admin' ? 'bg-amber-500' : 'bg-indigo-600'
                }`}>
                {currentUser.initials}
                </div>
                <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{currentUser.name}</p>
                <p className="text-xs text-slate-400 truncate">{currentUser.role}</p>
                </div>
            </div>
            <button 
                onClick={handleLogout}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 text-sm hover:bg-slate-700 hover:text-white transition-colors"
            >
                <LogOut size={16} />
                <span>{t("user.switch")}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* IMPERSONATION BANNER */}
        {realAdminUser && (
            <div className="bg-amber-500 text-slate-900 px-4 py-2 font-bold flex justify-between items-center shadow-lg z-50">
                <div className="flex items-center">
                    <Eye className="mr-2" />
                    <span>GHOST MODE: You are impersonating {currentUser.name}. Actions will be logged.</span>
                </div>
                <button 
                    onClick={stopImpersonation}
                    className="px-4 py-1 bg-slate-900 text-white rounded hover:bg-slate-800 text-sm"
                >
                    Return to Command
                </button>
            </div>
        )}

        {/* Mobile Header */}
        <header className="bg-slate-900 border-b border-slate-800 p-4 flex md:hidden justify-between items-center print:hidden">
           <div className="flex items-center space-x-2 text-white">
            <Shield size={24} className="text-indigo-500" />
            <span className="text-lg font-bold">Sentinel</span>
          </div>
          <button onClick={() => setIsSidebarOpen(true)} className="text-slate-400 hover:text-white transition-colors">
            <Menu size={24} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 print:p-0 print:overflow-visible bg-slate-50">
          <div className="max-w-7xl mx-auto print:max-w-none h-full">
            {currentView === 'SUPER_ADMIN_DASHBOARD' && (
                <SuperAdminDashboard 
                    organizations={organizations}
                />
            )}

            {currentView === 'SUPER_ADMIN_TENANTS' && (
                <SuperAdminTenants 
                    organizations={organizations}
                    onAddOrg={(org) => setOrganizations([...organizations, org])}
                    onUpdateOrg={(org) => setOrganizations(organizations.map(o => o.id === org.id ? org : o))}
                    onImpersonate={handleImpersonate}
                />
            )}

            {currentView === 'SUPER_ADMIN_SUBSCRIPTIONS' && (
                <SuperAdminSubscriptions />
            )}

            {currentView === 'SUPER_ADMIN_INTEGRATIONS' && (
                <SuperAdminIntegrations />
            )}

            {currentView === 'SUPER_ADMIN_DATA' && (
                <SuperAdminData organizations={organizations} />
            )}

            {currentView === 'SUPER_ADMIN_RESOURCES' && (
                <SuperAdminResources />
            )}

            {currentView === 'SUPER_ADMIN_BRANDING' && (
                <SuperAdminBranding />
            )}

            {currentView === 'SUPER_ADMIN_FEEDBACK' && (
                <SuperAdminFeedback />
            )}

            {currentView === 'SUPER_ADMIN_AI' && (
                <SuperAdminAIMonitor organizations={organizations} />
            )}

            {currentView === 'SUPER_ADMIN_SECURITY' && (
                <SuperAdminSecurity />
            )}

            {currentView === 'SUPER_ADMIN_TOOLS' && (
                <SuperAdminTools />
            )}

            {currentView === 'SUPER_ADMIN_OPS' && (
                <SuperAdminOperations allUsers={allUsers} />
            )}

            {/* IT ADMIN VIEWS - Mapped to OrgAdminSettings with tabs */}
            {currentView === 'IT_DASHBOARD' && (
                <OrgAdminSettings 
                    currentUser={currentUser}
                    users={allUsers} 
                    onUpdateUsers={setAllUsers}
                    initialTab="OVERVIEW"
                />
            )}
            {currentView === 'IT_USERS' && (
                <OrgAdminSettings 
                    currentUser={currentUser}
                    users={allUsers} 
                    onUpdateUsers={setAllUsers}
                    initialTab="IAM"
                />
            )}
            {currentView === 'IT_ASSETS' && (
                <OrgAdminSettings 
                    currentUser={currentUser}
                    users={allUsers} 
                    onUpdateUsers={setAllUsers}
                    initialTab="ASSETS"
                />
            )}
            {currentView === 'IT_DATA' && (
                <OrgAdminSettings 
                    currentUser={currentUser}
                    users={allUsers} 
                    onUpdateUsers={setAllUsers}
                    initialTab="DATA"
                />
            )}
            {currentView === 'IT_HELPDESK' && (
                <OrgAdminSettings 
                    currentUser={currentUser}
                    users={allUsers} 
                    onUpdateUsers={setAllUsers}
                    initialTab="HELPDESK"
                />
            )}

            {/* Fallback for old routing */}
            {currentView === 'ORG_SETTINGS' && (
                <OrgAdminSettings 
                    currentUser={currentUser}
                    users={allUsers}
                    onUpdateUsers={setAllUsers}
                />
            )}

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
                onEscalate={handleEscalateLog}
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
              <SeatingPlanView 
                behaviourEntries={behaviourEntries}
                safeguardingCases={safeguardingCases}
              />
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
                onUpdate={handleUpdateSafeguardingCase}
                onDelete={handleDeleteSafeguardingCase}
                onCancel={() => handleNavigate('DASHBOARD')}
                currentUser={currentUser}
                initialSearchTerm={selectedStudent || ''}
                initialData={escalationData}
              />
            )}
          </div>
        </div>
        
        {/* Floating Global AI Assistant - Only for School Users */}
        {currentUser.role !== 'Super Admin' && currentUser.role !== 'Admin' && (
             <SentinelChat 
                logs={logs} 
                safeguarding={safeguardingCases} 
                behavior={behaviourEntries} 
            />
        )}
      </main>
    </div>
  );
}

export default App;
