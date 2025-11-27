
import React, { useState, useEffect, useMemo } from 'react';
import { ViewState, MeetingLog, MeetingType, SafeguardingCase, UserProfile, BehaviourEntry, Organization, UserRole } from './types';
import Dashboard from './components/Dashboard';
import MeetingForm from './components/MeetingForm';
import HistoryView from './components/HistoryView';
import StudentProfile from './components/StudentProfile';
import StudentDirectory from './components/StudentDirectory';
import ClassOverview from './components/ClassOverview';
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
import { LayoutDashboard, PlusCircle, Users, Menu, X, Shield, FileText, BookUser, FileBarChart, LogOut, Star, LayoutGrid, Globe, Building2, Settings, BrainCircuit, ShieldAlert, Sliders, Eye, LifeBuoy, CreditCard, Network, Database, Library, Palette, MessageSquare, Activity, Monitor, Ticket, Wifi, CheckCircle2, AlertCircle, Lock, CornerUpLeft, School } from 'lucide-react';
import { STUDENTS } from './data/students';
import { useLanguage, Language } from './contexts/LanguageContext';

// --- MOCK DATA ---

const MOCK_LOGS: MeetingLog[] = [
  {
    id: '1',
    orgId: 'org-1',
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
    orgId: 'org-1',
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
    orgId: 'org-1',
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
    orgId: 'org-1',
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
    orgId: 'org-1',
    studentName: 'Abdulaziz Jaber A A',
    date: '2023-10-20',
    incidentType: 'Bullying',
    rawDescription: 'Excluding other students from group activities during lunch break.',
    generatedReport: {
      dslSummary: 'Report of social exclusion behavior during unstructured time. Student observed actively preventing peers from joining games.',
      chronology: ['20 Oct 12:30 - Incident observed by Lunch Supervisor'],
      keyEvidence: ['"You cant play with us" heard by staff'],
      policiesApplied: ['Anti-Bullying Policy', 'Peer Inclusion Framework'],
      witnessQuestions: ['Did you see who started the exclusion?', 'How long did this last?'],
      nextSteps: ['Restorative justice meeting', 'Lunchtime monitoring for 1 week'],
      riskLevel: 'Low',
      sentiment: 'Cautionary'
    },
    status: 'Open',
    createdBy: 'John Smith'
  },
  {
    id: 'sg-2',
    orgId: 'org-1',
    studentName: 'Hamad Salem A D',
    date: '2023-11-01',
    incidentType: 'Physical Abuse',
    rawDescription: 'Allegation of physical altercation behind the sports hall.',
    generatedReport: {
      dslSummary: 'Serious incident involving physical aggression. Student A pushed Student B causing minor injury.',
      chronology: ['01 Nov 10:15 - Fight reported by student witness', '01 Nov 10:20 - Staff intervention'],
      keyEvidence: ['CCTV footage from Sports Hall Exterior', 'Nurse report of grazed knee'],
      evidenceAnalysis: 'Pattern of escalation during unstructured breaks.',
      policiesApplied: ['Behavior Policy - Physical Aggression', 'Safeguarding - Peer on Peer Abuse'],
      witnessQuestions: ['What triggered the push?', 'Were others encouraging it?'],
      nextSteps: ['Internal exclusion (1 day)', 'Parent meeting required', 'Risk assessment for break times'],
      riskLevel: 'High',
      sentiment: 'Critical'
    },
    status: 'Investigating',
    createdBy: 'Jane Doe',
    isConfidential: true
  }
];

const MOCK_BEHAVIOUR_ENTRIES: BehaviourEntry[] = [
    { id: 'b1', orgId: 'org-1', studentName: 'Abdulaziz Jaber A A', date: '2023-11-20T10:00:00', type: 'POSITIVE', category: 'Excellent Work', points: 1, loggedBy: 'John Smith', description: 'Great essay.' },
    { id: 'b2', orgId: 'org-1', studentName: 'Hamad Salem A D', date: '2023-11-20T11:30:00', type: 'NEGATIVE', category: 'Lateness', points: -1, loggedBy: 'Jane Doe', description: '10 mins late.' },
    { id: 'b3', orgId: 'org-1', studentName: 'Adyan Adel', date: '2023-11-21T09:00:00', type: 'POSITIVE', category: 'Helping Others', points: 2, loggedBy: 'Sarah Connor', description: 'Helped new student.' },
    { id: 'b4', orgId: 'org-1', studentName: 'Abdulaziz Jaber A A', date: '2023-11-21T14:00:00', type: 'POSITIVE', category: 'Participation', points: 1, loggedBy: 'John Smith' },
    { id: 'b5', orgId: 'org-1', studentName: 'Hamad Salem A D', date: '2023-11-22T08:45:00', type: 'NEGATIVE', category: 'Uniform Issue', points: -1, loggedBy: 'Head of Year' },
];

const MOCK_ORGANIZATIONS: Organization[] = [
    { id: 'org-1', name: 'Springfield Academy', type: 'School', status: 'Active', licenseTier: 'Enterprise', studentCount: 1200, staffCount: 85, renewalDate: '2024-09-01', tokenUsageCurrentPeriod: 450000, tokenLimit: 1000000, aiCostEstimate: 22.50, features: { safeguarding: true, aiAssistant: true, parentPortal: true }, churnRisk: 'Low' },
    { id: 'org-2', name: 'Westfield College', type: 'College', status: 'Active', licenseTier: 'Pro', studentCount: 800, staffCount: 40, renewalDate: '2024-01-15', tokenUsageCurrentPeriod: 12000, tokenLimit: 500000, aiCostEstimate: 0.60, features: { safeguarding: true, aiAssistant: true, parentPortal: false }, churnRisk: 'High' },
    { id: 'org-3', name: 'Oakridge Primary', type: 'School', status: 'Trial', licenseTier: 'Starter', studentCount: 300, staffCount: 25, renewalDate: '2023-12-20', tokenUsageCurrentPeriod: 5000, tokenLimit: 100000, aiCostEstimate: 0.25, features: { safeguarding: false, aiAssistant: true, parentPortal: false }, churnRisk: 'Medium' },
];

const INITIAL_USERS: UserProfile[] = [
    { id: 'u0', name: 'System Owner', role: 'Super Admin', initials: 'SO', status: 'Active' },
    { id: 'u1', name: 'Jane Doe', role: 'Head of Year', initials: 'JD', email: 'jane@springfield.edu', status: 'Active', orgId: 'org-1' },
    { id: 'u2', name: 'John Smith', role: 'Teacher', initials: 'JS', email: 'john@springfield.edu', status: 'Active', orgId: 'org-1' },
    { id: 'u3', name: 'Sarah Connor', role: 'DSL', initials: 'SC', email: 'sarah@springfield.edu', status: 'Active', orgId: 'org-1' },
    { id: 'u4', name: 'Emily Blunt', role: 'Admin', initials: 'EB', email: 'admin@springfield.edu', status: 'Active', orgId: 'org-1' },
];

// --- RBAC CONFIG ---
const PERMISSIONS: Record<UserRole, ViewState[]> = {
    'Super Admin': [
        'SUPER_ADMIN_DASHBOARD', 'SUPER_ADMIN_TENANTS', 'SUPER_ADMIN_AI', 'SUPER_ADMIN_SECURITY',
        'SUPER_ADMIN_TOOLS', 'SUPER_ADMIN_OPS', 'SUPER_ADMIN_SUBSCRIPTIONS', 'SUPER_ADMIN_INTEGRATIONS',
        'SUPER_ADMIN_DATA', 'SUPER_ADMIN_RESOURCES', 'SUPER_ADMIN_BRANDING', 'SUPER_ADMIN_FEEDBACK',
        'DASHBOARD' // Can view dashboard when impersonating
    ],
    'Admin': [
        'DASHBOARD', 'NEW_LOG', 'HISTORY', 'STUDENT_PROFILE', 'STUDENTS_DIRECTORY', 'CLASS_OVERVIEW',
        'REPORTS', 'BEHAVIOUR', 'SEATING_PLAN', 'ORG_SETTINGS',
        'IT_DASHBOARD', 'IT_USERS', 'IT_ASSETS', 'IT_DATA', 'IT_HELPDESK'
    ],
    'DSL': [
        'DASHBOARD', 'NEW_LOG', 'HISTORY', 'STUDENT_PROFILE', 'STUDENTS_DIRECTORY', 'CLASS_OVERVIEW',
        'SAFEGUARDING', 'REPORTS', 'BEHAVIOUR', 'SEATING_PLAN'
    ],
    'Head of Year': [
        'DASHBOARD', 'NEW_LOG', 'HISTORY', 'STUDENT_PROFILE', 'STUDENTS_DIRECTORY', 'CLASS_OVERVIEW',
        'SAFEGUARDING', 'REPORTS', 'BEHAVIOUR', 'SEATING_PLAN'
    ],
    'Teacher': [
        'DASHBOARD', 'NEW_LOG', 'HISTORY', 'STUDENT_PROFILE', 'STUDENTS_DIRECTORY', 'CLASS_OVERVIEW',
        'REPORTS', 'BEHAVIOUR', 'SEATING_PLAN', 'SAFEGUARDING' // Access allowed for Reporting Only (Internal logic handles restrictions)
    ]
};

const AccessDenied: React.FC<{ onHome: () => void }> = ({ onHome }) => (
    <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in">
        <div className="bg-red-50 p-6 rounded-full mb-6">
            <Lock size={64} className="text-red-500" />
        </div>
        <h2 className="text-3xl font-bold text-slate-800 mb-2">Access Denied</h2>
        <p className="text-slate-500 max-w-md mb-8">
            You do not have permission to view this area. If you believe this is an error, please contact your IT Administrator.
        </p>
        <button 
            onClick={onHome}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors"
        >
            Return to Dashboard
        </button>
    </div>
);

export default function App() {
  // --- STATE ---
  // Initialize user from local storage for session persistence
  const [user, setUser] = useState<UserProfile | null>(() => {
      const savedUser = localStorage.getItem('sentinel_current_user');
      return savedUser ? JSON.parse(savedUser) : null;
  });

  const [view, setView] = useState<ViewState>(() => {
      // Restore previous view if available and user is logged in
      const savedView = localStorage.getItem('sentinel_last_view');
      return (savedView && user) ? (savedView as ViewState) : 'DASHBOARD';
  });

  const [selectedStudent, setSelectedStudent] = useState<string | undefined>(undefined);
  
  // Data State with Persistence
  const [logs, setLogs] = useState<MeetingLog[]>(() => {
      const saved = localStorage.getItem('sentinel_logs');
      return saved ? JSON.parse(saved) : MOCK_LOGS;
  });
  const [safeguardingCases, setSafeguardingCases] = useState<SafeguardingCase[]>(() => {
      const saved = localStorage.getItem('sentinel_safeguarding');
      return saved ? JSON.parse(saved) : MOCK_SAFEGUARDING_CASES;
  });
  const [behaviourEntries, setBehaviourEntries] = useState<BehaviourEntry[]>(() => {
      const saved = localStorage.getItem('sentinel_behaviour');
      return saved ? JSON.parse(saved) : MOCK_BEHAVIOUR_ENTRIES;
  });
  const [organizations, setOrganizations] = useState<Organization[]>(() => {
      const saved = localStorage.getItem('sentinel_organizations');
      return saved ? JSON.parse(saved) : MOCK_ORGANIZATIONS;
  });
  
  // Fix: Ensure safety check on users loading
  const [allUsers, setAllUsers] = useState<UserProfile[]>(() => {
      try {
          const saved = localStorage.getItem('sentinel_users');
          const parsed = saved ? JSON.parse(saved) : null;
          return Array.isArray(parsed) ? parsed : INITIAL_USERS;
      } catch (e) {
          console.error("Failed to load users from storage", e);
          return INITIAL_USERS;
      }
  });

  // Transient state for escalation from Log -> Safeguarding
  const [escalationData, setEscalationData] = useState<{studentName: string, description: string, date: string} | null>(null);

  // Notification State
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // UI State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { setLanguage, t } = useLanguage();

  // Persistence Effects
  useEffect(() => { 
      if (user) {
          localStorage.setItem('sentinel_current_user', JSON.stringify(user));
      } else {
          localStorage.removeItem('sentinel_current_user');
      }
  }, [user]);

  useEffect(() => {
      if (user) {
          localStorage.setItem('sentinel_last_view', view);
      }
  }, [view, user]);

  useEffect(() => { localStorage.setItem('sentinel_logs', JSON.stringify(logs)); }, [logs]);
  useEffect(() => { localStorage.setItem('sentinel_safeguarding', JSON.stringify(safeguardingCases)); }, [safeguardingCases]);
  useEffect(() => { localStorage.setItem('sentinel_behaviour', JSON.stringify(behaviourEntries)); }, [behaviourEntries]);
  useEffect(() => { localStorage.setItem('sentinel_organizations', JSON.stringify(organizations)); }, [organizations]);
  useEffect(() => { localStorage.setItem('sentinel_users', JSON.stringify(allUsers)); }, [allUsers]);

  // --- MULTI-TENANCY DATA FILTERING ---
  // Critical: Only show data relevant to the current user's organization.
  // If user is Super Admin AND looking at global dashboard, they might see all, but general views are filtered.
  
  const currentOrgId = user?.orgId || 'org-1'; // Default to org-1 for demo safety, but usually strictly user.orgId

  const filteredLogs = useMemo(() => logs.filter(l => l.orgId === currentOrgId || !l.orgId), [logs, currentOrgId]);
  const filteredCases = useMemo(() => safeguardingCases.filter(c => c.orgId === currentOrgId || !c.orgId), [safeguardingCases, currentOrgId]);
  const filteredBehaviour = useMemo(() => behaviourEntries.filter(b => b.orgId === currentOrgId || !b.orgId), [behaviourEntries, currentOrgId]);

  // Dynamic Alert Logic
  const hasCriticalRisks = useMemo(() => {
      return filteredCases.some(c => 
          (c.status === 'Open' || c.status === 'Investigating') &&
          (c.generatedReport.riskLevel === 'High' || c.generatedReport.riskLevel === 'Critical')
      );
  }, [filteredCases]);

  // Auto-dismiss notification
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // --- HANDLERS ---

  const handleLogin = (loggedInUser: UserProfile) => {
    setUser(loggedInUser);
    if (loggedInUser.role === 'Super Admin') {
        setView('SUPER_ADMIN_DASHBOARD');
    } else {
        setView('DASHBOARD');
    }
  };

  const handleLogout = () => {
    // If impersonating (temp user ID usually starts with temp-), we might want to go back to Super Admin
    // But for simplicity, full logout clears session.
    setUser(null);
    localStorage.removeItem('sentinel_current_user');
    localStorage.removeItem('sentinel_last_view');
    setView('DASHBOARD');
    setSelectedStudent(undefined);
    setEscalationData(null);
  };

  const handleNavigate = (newView: ViewState, studentName?: string) => {
    setView(newView);
    setSelectedStudent(studentName); // Clear if undefined to prevent stale state
    if (newView !== 'SAFEGUARDING') {
       setEscalationData(null);
    }
    setIsMobileMenuOpen(false);
  };

  const handleSaveLog = (newLog: MeetingLog) => {
    // Inject Organization ID
    const logWithOrg = { ...newLog, orgId: user?.orgId };
    setLogs([logWithOrg, ...logs]);
    setNotification({ message: 'Meeting logged successfully', type: 'success' });
    handleNavigate('DASHBOARD');
  };

  const handleSaveCase = (newCase: SafeguardingCase) => {
    const caseWithOrg = { ...newCase, orgId: user?.orgId };
    setSafeguardingCases([caseWithOrg, ...safeguardingCases]);
    setEscalationData(null); 
    setNotification({ message: 'Safeguarding case created', type: 'success' });
    handleNavigate('SAFEGUARDING');
  };

  const handleUpdateCase = (updatedCase: SafeguardingCase) => {
    setSafeguardingCases(prev => prev.map(c => c.id === updatedCase.id ? updatedCase : c));
    setNotification({ message: 'Case file updated', type: 'success' });
  };

  const handleDeleteCase = (id: string) => {
    setSafeguardingCases(prev => prev.filter(c => c.id !== id));
    setNotification({ message: 'Case file deleted', type: 'success' });
  };

  const handleAddBehaviour = (newEntries: BehaviourEntry[]) => {
    const entriesWithOrg = newEntries.map(e => ({ ...e, orgId: user?.orgId }));
    setBehaviourEntries([...entriesWithOrg, ...behaviourEntries]);
    setNotification({ message: `${newEntries.length} behaviour entries added`, type: 'success' });
  };

  const handleToggleActionItem = (logId: string, actionId: string) => {
    setLogs(logs.map(log => {
      if (log.id === logId) {
        return {
          ...log,
          actionItems: log.actionItems.map(item => 
            item.id === actionId ? { ...item, status: item.status === 'Pending' ? 'Completed' : 'Pending' } : item
          )
        };
      }
      return log;
    }));
  };

  const handleMarkAllActionsCompleted = (studentName: string) => {
      setLogs(logs.map(log => {
          if (log.attendees.includes(studentName) && log.actionItems) {
              return {
                  ...log,
                  actionItems: log.actionItems.map(item => ({ ...item, status: 'Completed' }))
              };
          }
          return log;
      }));
      setNotification({ message: 'All actions marked completed', type: 'success' });
  };

  const handleImpersonate = (orgId: string) => {
      const org = organizations.find(o => o.id === orgId);
      if (org) {
          // Find valid admin user for this org
          let targetUser = allUsers.find(u => u.orgId === orgId && ['Admin', 'Head of Year', 'DSL'].includes(u.role));
          
          // If no admin exists (e.g. newly created empty org), create a temp one for the session
          if (!targetUser) {
             targetUser = {
                 id: `temp-${orgId}`,
                 name: `${org.name} Admin`,
                 role: 'Admin',
                 initials: 'AD',
                 orgId: org.id,
                 status: 'Active'
             };
             // We don't save this to allUsers permanently to avoid clutter, 
             // but in a real app, you'd create a real user.
          }

          setNotification({ message: `Accessing ${org.name} as Administrator...`, type: 'success' });
          
          // Switch user context to simulate login
          setUser(targetUser);
          setView('DASHBOARD');
      }
  };

  const handleAddOrg = (newOrg: Organization, initialAdmin?: UserProfile) => {
      setOrganizations([...organizations, newOrg]);
      if (initialAdmin) {
          setAllUsers([...allUsers, initialAdmin]);
          setNotification({ message: `Organization "${newOrg.name}" created with admin user.`, type: 'success' });
      } else {
          setNotification({ message: 'Organization created.', type: 'success' });
      }
  };

  const handleDeleteUserRequest = (userId: string) => {
      setAllUsers(allUsers.filter(u => u.id !== userId));
      setNotification({ message: 'User deleted.', type: 'success' });
  };

  const handleSystemReset = () => {
      localStorage.clear();
      window.location.reload();
  };

  // --- VIEW RENDERER ---

  const renderContent = () => {
    if (!user) return null;

    // Role-Based Access Check
    const allowedViews = PERMISSIONS[user.role] || [];
    const hasAccess = allowedViews.includes(view) || (user.role === 'Super Admin' && view === 'DASHBOARD');

    if (!hasAccess) {
        return <AccessDenied onHome={() => handleNavigate(user.role === 'Super Admin' ? 'SUPER_ADMIN_DASHBOARD' : 'DASHBOARD')} />;
    }

    // Pass FILTERED data to components
    switch (view) {
      case 'DASHBOARD':
        return <Dashboard logs={filteredLogs} safeguardingCases={filteredCases} behaviourEntries={filteredBehaviour} onNavigate={handleNavigate} currentUser={user} />;
      case 'NEW_LOG':
        return (
            <MeetingForm 
                onSubmit={handleSaveLog} 
                onCancel={() => handleNavigate('DASHBOARD')} 
                initialAttendees={selectedStudent ? [selectedStudent] : []} 
                currentUser={user} 
                onEscalate={(data) => { 
                    setEscalationData(data);
                    setView('SAFEGUARDING');
                }} 
            />
        );
      case 'HISTORY':
        return <HistoryView logs={filteredLogs} onSelectStudent={(name) => handleNavigate('STUDENT_PROFILE', name)} currentUser={user} />;
      case 'STUDENT_PROFILE':
        return selectedStudent ? (
          <StudentProfile 
            studentName={selectedStudent} 
            logs={filteredLogs} 
            behaviourEntries={filteredBehaviour}
            safeguardingCases={filteredCases}
            onBack={() => handleNavigate('STUDENTS_DIRECTORY')} 
            onToggleActionItem={handleToggleActionItem}
            onMarkAllCompleted={handleMarkAllActionsCompleted}
            onQuickLog={(name) => handleNavigate('NEW_LOG', name)}
            onViewSafeguarding={(name) => handleNavigate('SAFEGUARDING', name)}
            currentUser={user}
          />
        ) : <StudentDirectory onSelectStudent={(name) => handleNavigate('STUDENT_PROFILE', name)} onQuickLog={(name) => handleNavigate('NEW_LOG', name)} safeguardingCases={filteredCases} />;
      case 'STUDENTS_DIRECTORY':
        return <StudentDirectory onSelectStudent={(name) => handleNavigate('STUDENT_PROFILE', name)} onQuickLog={(name) => handleNavigate('NEW_LOG', name)} safeguardingCases={filteredCases} />;
      case 'CLASS_OVERVIEW':
        return <ClassOverview logs={filteredLogs} behaviourEntries={filteredBehaviour} safeguardingCases={filteredCases} onNavigateToStudent={(name) => handleNavigate('STUDENT_PROFILE', name)} currentUser={user} />;
      case 'SAFEGUARDING':
        return (
            <SafeguardingBuilder 
                cases={filteredCases} 
                logs={filteredLogs} 
                onSave={handleSaveCase} 
                onUpdate={handleUpdateCase} 
                onDelete={handleDeleteCase} 
                onCancel={() => {
                    setEscalationData(null);
                    handleNavigate('DASHBOARD');
                }} 
                currentUser={user} 
                initialSearchTerm={selectedStudent}
                initialData={escalationData}
            />
        );
      case 'REPORTS':
        return <ReportsView logs={filteredLogs} safeguardingCases={filteredCases} />;
      case 'BEHAVIOUR':
        return <BehaviourManager currentUser={user} entries={filteredBehaviour} onAddEntries={handleAddBehaviour} />;
      case 'SEATING_PLAN':
        return <SeatingPlanView behaviourEntries={filteredBehaviour} safeguardingCases={filteredCases} />;
      case 'ORG_SETTINGS':
        // Filter users to show only those in the current Org
        const orgUsers = allUsers.filter(u => u.orgId === user.orgId);
        return <OrgAdminSettings currentUser={user} users={orgUsers} onUpdateUsers={setAllUsers} />;
      
      // Super Admin Views
      case 'SUPER_ADMIN_DASHBOARD': return <SuperAdminDashboard organizations={organizations} />;
      case 'SUPER_ADMIN_TENANTS': 
        return <SuperAdminTenants 
            organizations={organizations} 
            onAddOrg={handleAddOrg} 
            onUpdateOrg={(o) => setOrganizations(organizations.map(org => org.id === o.id ? o : org))} 
            onImpersonate={handleImpersonate} 
        />;
      case 'SUPER_ADMIN_AI': return <SuperAdminAIMonitor organizations={organizations} />;
      case 'SUPER_ADMIN_SECURITY': return <SuperAdminSecurity />;
      case 'SUPER_ADMIN_TOOLS': return <SuperAdminTools />;
      case 'SUPER_ADMIN_OPS': return <SuperAdminOperations allUsers={allUsers} onUpdateUsers={setAllUsers} />;
      case 'SUPER_ADMIN_SUBSCRIPTIONS': return <SuperAdminSubscriptions />;
      case 'SUPER_ADMIN_INTEGRATIONS': return <SuperAdminIntegrations />;
      case 'SUPER_ADMIN_DATA': return <SuperAdminData organizations={organizations} />;
      case 'SUPER_ADMIN_RESOURCES': return <SuperAdminResources />;
      case 'SUPER_ADMIN_BRANDING': return <SuperAdminBranding />;
      case 'SUPER_ADMIN_FEEDBACK': return <SuperAdminFeedback />;
      
      // IT Admin View (Reuses Org Settings Component but different initial tab)
      case 'IT_DASHBOARD': return <OrgAdminSettings currentUser={user} users={allUsers.filter(u => u.orgId === user.orgId)} onUpdateUsers={setAllUsers} initialTab="OVERVIEW" />;
      case 'IT_USERS': return <OrgAdminSettings currentUser={user} users={allUsers.filter(u => u.orgId === user.orgId)} onUpdateUsers={setAllUsers} initialTab="IAM" />;
      case 'IT_ASSETS': return <OrgAdminSettings currentUser={user} users={allUsers.filter(u => u.orgId === user.orgId)} onUpdateUsers={setAllUsers} initialTab="ASSETS" />;
      case 'IT_DATA': return <OrgAdminSettings currentUser={user} users={allUsers.filter(u => u.orgId === user.orgId)} onUpdateUsers={setAllUsers} initialTab="DATA" />;
      case 'IT_HELPDESK': return <OrgAdminSettings currentUser={user} users={allUsers.filter(u => u.orgId === user.orgId)} onUpdateUsers={setAllUsers} initialTab="HELPDESK" />;

      default:
        return <Dashboard logs={filteredLogs} safeguardingCases={filteredCases} behaviourEntries={filteredBehaviour} onNavigate={handleNavigate} currentUser={user} />;
    }
  };

  const isSuperAdmin = user?.role === 'Super Admin';
  const isAdmin = ['Admin', 'Super Admin'].includes(user?.role || '');
  const isLeader = ['Head of Year', 'DSL', 'Admin', 'Super Admin'].includes(user?.role || '');

  if (!user) {
    return (
        <LoginView 
            onLogin={handleLogin} 
            users={allUsers} 
            onUpdateUsers={setAllUsers} 
            organizations={organizations}
            onDeleteUserRequest={handleDeleteUserRequest}
            onResetSystemRequest={handleSystemReset}
        />
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans relative">
        {/* Toast Notification */}
        {notification && (
            <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in">
                <div className={`px-6 py-3 rounded-full shadow-xl flex items-center space-x-2 text-sm font-bold ${
                    notification.type === 'success' ? 'bg-slate-900 text-white' : 'bg-red-600 text-white'
                }`}>
                    {notification.type === 'success' ? <CheckCircle2 size={18} className="text-emerald-400" /> : <AlertCircle size={18} />}
                    <span>{notification.message}</span>
                </div>
            </div>
        )}

        {/* Impersonation Banner */}
        {user.id.startsWith('temp-') && (
            <div className="fixed top-0 left-0 right-0 h-8 bg-amber-400 text-slate-900 z-50 flex items-center justify-center text-xs font-bold shadow-md">
                <span>Viewing as: {user.name} ({organizations.find(o => o.id === user.orgId)?.name})</span>
                <button onClick={handleLogout} className="ml-4 bg-white/20 hover:bg-white/40 px-2 py-0.5 rounded flex items-center">
                    <CornerUpLeft size={12} className="mr-1" /> Return to Super Admin
                </button>
            </div>
        )}

        {/* Sidebar Navigation */}
        <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 text-slate-300 transform transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 flex flex-col pt-8`}>
            <div className="p-6 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg">
                        <Shield size={18} />
                    </div>
                    <span className="text-xl font-bold text-white tracking-tight">Sentinel</span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-slate-400 hover:text-white"><X size={24} /></button>
            </div>

            <nav className="flex-1 px-3 space-y-1 overflow-y-auto custom-scrollbar">
                {/* Standard User Navigation */}
                {!isSuperAdmin && (
                    <>
                        <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mt-4 mb-2">School Module</p>
                        <NavItem icon={<LayoutDashboard size={20} />} label={t('nav.dashboard')} active={view === 'DASHBOARD'} onClick={() => handleNavigate('DASHBOARD')} />
                        <NavItem icon={<PlusCircle size={20} />} label={t('nav.new_entry')} active={view === 'NEW_LOG'} onClick={() => handleNavigate('NEW_LOG')} />
                        <NavItem icon={<BookUser size={20} />} label={t('nav.students')} active={view === 'STUDENTS_DIRECTORY' || view === 'STUDENT_PROFILE'} onClick={() => handleNavigate('STUDENTS_DIRECTORY')} />
                        <NavItem icon={<School size={20} />} label={t('nav.class_overview')} active={view === 'CLASS_OVERVIEW'} onClick={() => handleNavigate('CLASS_OVERVIEW')} />
                        <NavItem icon={<FileBarChart size={20} />} label={t('nav.history')} active={view === 'HISTORY'} onClick={() => handleNavigate('HISTORY')} />
                        <NavItem icon={<Star size={20} />} label={t('nav.behaviour')} active={view === 'BEHAVIOUR'} onClick={() => handleNavigate('BEHAVIOUR')} />
                        <NavItem icon={<LayoutGrid size={20} />} label={t('nav.seating')} active={view === 'SEATING_PLAN'} onClick={() => handleNavigate('SEATING_PLAN')} />
                        <NavItem icon={<FileText size={20} />} label={t('nav.reports')} active={view === 'REPORTS'} onClick={() => handleNavigate('REPORTS')} />
                        
                        {/* Safeguarding Link: Dynamic Label based on Role */}
                        <NavItem 
                            icon={<ShieldAlert size={20} />} 
                            label={isLeader ? t('nav.safeguarding') : 'Report Concern'} 
                            active={view === 'SAFEGUARDING'} 
                            onClick={() => handleNavigate('SAFEGUARDING')} 
                            alert={isLeader && hasCriticalRisks} 
                        />
                        
                        {isAdmin && (
                            <>
                                <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mt-6 mb-2">IT Admin</p>
                                <NavItem icon={<Activity size={20} />} label="Overview" active={view === 'IT_DASHBOARD'} onClick={() => handleNavigate('IT_DASHBOARD')} />
                                <NavItem icon={<Users size={20} />} label="Users & IAM" active={view === 'IT_USERS'} onClick={() => handleNavigate('IT_USERS')} />
                                <NavItem icon={<Monitor size={20} />} label="Assets" active={view === 'IT_ASSETS'} onClick={() => handleNavigate('IT_ASSETS')} />
                                <NavItem icon={<Database size={20} />} label="Data Sync" active={view === 'IT_DATA'} onClick={() => handleNavigate('IT_DATA')} />
                                <NavItem icon={<Ticket size={20} />} label="Helpdesk" active={view === 'IT_HELPDESK'} onClick={() => handleNavigate('IT_HELPDESK')} />
                                <NavItem icon={<Settings size={20} />} label="Org Settings" active={view === 'ORG_SETTINGS'} onClick={() => handleNavigate('ORG_SETTINGS')} />
                            </>
                        )}
                    </>
                )}

                {/* Super Admin Navigation */}
                {isSuperAdmin && (
                    <>
                        <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mt-2 mb-2">Global Command</p>
                        <NavItem icon={<Globe size={20} />} label="Global Overview" active={view === 'SUPER_ADMIN_DASHBOARD'} onClick={() => handleNavigate('SUPER_ADMIN_DASHBOARD')} />
                        <NavItem icon={<Building2 size={20} />} label="Tenant Manager" active={view === 'SUPER_ADMIN_TENANTS'} onClick={() => handleNavigate('SUPER_ADMIN_TENANTS')} />
                        <NavItem icon={<CreditCard size={20} />} label="Subscriptions" active={view === 'SUPER_ADMIN_SUBSCRIPTIONS'} onClick={() => handleNavigate('SUPER_ADMIN_SUBSCRIPTIONS')} />
                        <NavItem icon={<Network size={20} />} label="Integrations" active={view === 'SUPER_ADMIN_INTEGRATIONS'} onClick={() => handleNavigate('SUPER_ADMIN_INTEGRATIONS')} />
                        
                        <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mt-6 mb-2">Intelligence & Ops</p>
                        <NavItem icon={<BrainCircuit size={20} />} label="AI Monitor" active={view === 'SUPER_ADMIN_AI'} onClick={() => handleNavigate('SUPER_ADMIN_AI')} />
                        <NavItem icon={<ShieldAlert size={20} />} label="Security Audit" active={view === 'SUPER_ADMIN_SECURITY'} onClick={() => handleNavigate('SUPER_ADMIN_SECURITY')} />
                        <NavItem icon={<Database size={20} />} label="Data Governance" active={view === 'SUPER_ADMIN_DATA'} onClick={() => handleNavigate('SUPER_ADMIN_DATA')} />
                        <NavItem icon={<Sliders size={20} />} label="Ops & Support" active={view === 'SUPER_ADMIN_OPS'} onClick={() => handleNavigate('SUPER_ADMIN_OPS')} />
                        <NavItem icon={<Settings size={20} />} label="Platform Tools" active={view === 'SUPER_ADMIN_TOOLS'} onClick={() => handleNavigate('SUPER_ADMIN_TOOLS')} />

                        <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mt-6 mb-2">Product</p>
                        <NavItem icon={<Library size={20} />} label="Resources" active={view === 'SUPER_ADMIN_RESOURCES'} onClick={() => handleNavigate('SUPER_ADMIN_RESOURCES')} />
                        <NavItem icon={<Palette size={20} />} label="Branding" active={view === 'SUPER_ADMIN_BRANDING'} onClick={() => handleNavigate('SUPER_ADMIN_BRANDING')} />
                        <NavItem icon={<MessageSquare size={20} />} label="Feedback" active={view === 'SUPER_ADMIN_FEEDBACK'} onClick={() => handleNavigate('SUPER_ADMIN_FEEDBACK')} />
                    </>
                )}
            </nav>

            {/* Sidebar Footer */}
            <div className="p-4 border-t border-slate-800">
                <div className="flex items-center mb-4">
                    <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-sm font-bold text-white mr-3">
                        {user.initials}
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-sm font-medium text-white truncate">{user.name}</p>
                        <p className="text-xs text-slate-500 truncate">{user.role}</p>
                    </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 mb-3">
                    <button onClick={() => setLanguage('en')} className="text-xs text-slate-400 hover:text-white border border-slate-700 rounded py-1">EN</button>
                    <button onClick={() => setLanguage('ar')} className="text-xs text-slate-400 hover:text-white border border-slate-700 rounded py-1">AR</button>
                </div>

                <button 
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-red-400 bg-slate-800 hover:bg-red-900/30 hover:text-red-300 rounded-lg transition-colors"
                >
                    <LogOut size={16} className="mr-2" /> Sign Out
                </button>
            </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col h-screen overflow-hidden">
            {/* Mobile Header */}
            <header className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200 z-20">
                <div className="flex items-center space-x-2">
                    <Shield size={24} className="text-indigo-600" />
                    <span className="font-bold text-slate-800">Sentinel</span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(true)} className="text-slate-600 hover:text-slate-900">
                    <Menu size={24} />
                </button>
            </header>

            {/* Content Area */}
            <div className="flex-1 overflow-auto p-4 md:p-8 relative">
                {renderContent()}
            </div>
        </main>

        {/* Global AI Chat Widget (Always present when logged in) */}
        <SentinelChat logs={filteredLogs} safeguarding={filteredCases} behavior={filteredBehaviour} />
    </div>
  );
}

interface NavItemProps {
    icon: React.ReactNode;
    label: string;
    active: boolean;
    onClick: () => void;
    alert?: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, active, onClick, alert }) => (
    <button 
        onClick={onClick}
        className={`w-full flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 group relative ${
            active 
            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/20' 
            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
        }`}
    >
        <span className={`mr-3 transition-colors ${active ? 'text-indigo-200' : 'text-slate-500 group-hover:text-white'}`}>
            {icon}
        </span>
        <span className="text-sm font-medium">{label}</span>
        {alert && (
            <span className="absolute right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
        )}
    </button>
);