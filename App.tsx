
import React, { useState, useEffect, useMemo } from 'react';
import { ViewState, MeetingLog, MeetingType, SafeguardingCase, UserProfile, BehaviourEntry, Organization, UserRole, SeatingLayout } from './types';
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
import ClassOverview from './components/ClassOverview';
import SentinelChat from './components/SentinelChat';
import Sidebar from './components/Sidebar';

// Super Admin Components
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

// Org Admin Components
import OrgAdminSettings from './components/OrgAdminSettings';

// Default Data
const DEFAULT_ORGS: Organization[] = [
    { 
        id: 'org-1', name: 'Springfield Academy', type: 'School', status: 'Active', licenseTier: 'Pro', 
        staffCount: 45, studentCount: 650, renewalDate: '2024-09-01',
        tokenUsageCurrentPeriod: 154000, tokenLimit: 1000000, aiCostEstimate: 1.54,
        features: { safeguarding: true, aiAssistant: true, parentPortal: true },
        churnRisk: 'Low'
    }
];

const DEFAULT_USERS: UserProfile[] = [
  { id: 'u0', name: 'System Owner', role: 'Super Admin', initials: 'SO', status: 'Active' },
  { id: 'u1', name: 'Jane Doe', role: 'Head of Year', initials: 'JD', orgId: 'org-1', status: 'Active', allowedYearGroups: ['07', '08'] },
  { id: 'u2', name: 'John Smith', role: 'Teacher', initials: 'JS', orgId: 'org-1', status: 'Active', allowedYearGroups: ['07B'] },
  { id: 'u3', name: 'Sarah Connor', role: 'DSL', initials: 'SC', orgId: 'org-1', status: 'Active' },
  { id: 'u4', name: 'Emily Blunt', role: 'Admin', initials: 'EB', orgId: 'org-1', status: 'Active' },
];

const App: React.FC = () => {
  // --- Global State ---
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>('DASHBOARD');
  const [selectedStudent, setSelectedStudent] = useState<string | undefined>(undefined);

  // --- Data Stores (Persisted) ---
  const [allUsers, setAllUsers] = useState<UserProfile[]>(() => {
      try {
          const saved = localStorage.getItem('sentinel_users');
          return saved ? JSON.parse(saved) : DEFAULT_USERS;
      } catch (e) { return DEFAULT_USERS; }
  });

  const [organizations, setOrganizations] = useState<Organization[]>(() => {
      try {
          const saved = localStorage.getItem('sentinel_orgs');
          return saved ? JSON.parse(saved) : DEFAULT_ORGS;
      } catch (e) { return DEFAULT_ORGS; }
  });

  const [allLogs, setAllLogs] = useState<MeetingLog[]>(() => {
      try {
          const saved = localStorage.getItem('sentinel_logs');
          return saved ? JSON.parse(saved) : [];
      } catch (e) { return []; }
  });

  const [allSafeguarding, setAllSafeguarding] = useState<SafeguardingCase[]>(() => {
      try {
          const saved = localStorage.getItem('sentinel_safeguarding');
          return saved ? JSON.parse(saved) : [];
      } catch (e) { return []; }
  });

  const [allBehavior, setAllBehavior] = useState<BehaviourEntry[]>(() => {
      try {
          const saved = localStorage.getItem('sentinel_behavior');
          return saved ? JSON.parse(saved) : [];
      } catch (e) { return []; }
  });

  // --- Persistence Effects ---
  useEffect(() => { localStorage.setItem('sentinel_users', JSON.stringify(allUsers)); }, [allUsers]);
  useEffect(() => { localStorage.setItem('sentinel_orgs', JSON.stringify(organizations)); }, [organizations]);
  useEffect(() => { localStorage.setItem('sentinel_logs', JSON.stringify(allLogs)); }, [allLogs]);
  useEffect(() => { localStorage.setItem('sentinel_safeguarding', JSON.stringify(allSafeguarding)); }, [allSafeguarding]);
  useEffect(() => { localStorage.setItem('sentinel_behavior', JSON.stringify(allBehavior)); }, [allBehavior]);

  // --- Multi-Tenancy Filtering ---
  // Filter data based on the logged-in user's Organization ID.
  // Super Admins see data if they impersonate, otherwise they see aggregate stats in their dashboard.
  const tenantData = useMemo(() => {
      if (!currentUser || currentUser.role === 'Super Admin') {
          // Super Admins usually view the Dashboard or Tenant Manager. 
          // If they need to see specific data, they should "Impersonate".
          // For safety, we return everything if they are Super Admin to prevent empty views in generic components,
          // but logically they operate on a higher level.
          return {
              logs: allLogs,
              safeguarding: allSafeguarding,
              behavior: allBehavior,
              users: allUsers
          };
      }

      const orgId = currentUser.orgId;
      return {
          logs: allLogs.filter(l => l.orgId === orgId),
          safeguarding: allSafeguarding.filter(s => s.orgId === orgId),
          behavior: allBehavior.filter(b => b.orgId === orgId),
          users: allUsers.filter(u => u.orgId === orgId)
      };
  }, [currentUser, allLogs, allSafeguarding, allBehavior, allUsers]);


  // --- Actions ---

  const handleLogin = (user: UserProfile) => {
    setCurrentUser(user);
    if (user.role === 'Super Admin') {
        setCurrentView('SUPER_ADMIN_DASHBOARD');
    } else {
        setCurrentView('DASHBOARD');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('DASHBOARD');
    setSelectedStudent(undefined);
  };

  const handleNavigate = (view: ViewState, studentName?: string) => {
    setCurrentView(view);
    if (studentName) setSelectedStudent(studentName);
  };

  // --- Data Modifiers ---

  const handleSaveLog = (newLog: MeetingLog) => {
    // Attach current Tenant ID to the record
    const logWithTenant = { ...newLog, orgId: currentUser?.orgId };
    setAllLogs(prev => [logWithTenant, ...prev]);
    handleNavigate('HISTORY');
  };

  const handleSaveSafeguarding = (newCase: SafeguardingCase) => {
    const caseWithTenant = { ...newCase, orgId: currentUser?.orgId };
    setAllSafeguarding(prev => [caseWithTenant, ...prev]);
  };

  const handleUpdateSafeguarding = (updatedCase: SafeguardingCase) => {
    setAllSafeguarding(prev => prev.map(c => c.id === updatedCase.id ? updatedCase : c));
  };

  const handleDeleteSafeguarding = (id: string) => {
    setAllSafeguarding(prev => prev.filter(c => c.id !== id));
  };

  const handleAddBehaviour = (newEntries: BehaviourEntry[]) => {
    const entriesWithTenant = newEntries.map(e => ({ ...e, orgId: currentUser?.orgId }));
    setAllBehavior(prev => [...entriesWithTenant, ...prev]);
  };

  const handleToggleActionItem = (logId: string, actionItemId: string) => {
    setAllLogs(prev => prev.map(log => {
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
      if(window.confirm(`Mark all pending actions for ${studentName} as completed?`)) {
          setAllLogs(prev => prev.map(log => {
              if(log.attendees.includes(studentName)) {
                  return {
                      ...log,
                      actionItems: log.actionItems.map(item => ({ ...item, status: 'Completed' }))
                  }
              }
              return log;
          }));
      }
  };

  // --- Tenant Management ---
  const handleAddOrg = (newOrg: Organization, initialAdmin?: UserProfile) => {
      setOrganizations(prev => [...prev, newOrg]);
      if (initialAdmin) {
          setAllUsers(prev => [...prev, initialAdmin]);
      }
  };

  const handleUpdateOrg = (updatedOrg: Organization) => {
      setOrganizations(prev => prev.map(o => o.id === updatedOrg.id ? updatedOrg : o));
  };

  const handleImpersonate = (orgId: string) => {
      const orgAdmin = allUsers.find(u => u.orgId === orgId && (u.role === 'Admin' || u.role === 'DSL'));
      if (orgAdmin) {
          setCurrentUser(orgAdmin);
          setCurrentView('DASHBOARD');
      } else {
          alert("No admin user found for this organization to impersonate.");
      }
  };

  // --- Render Logic ---

  if (!currentUser) {
    return (
        <LoginView 
            onLogin={handleLogin} 
            users={allUsers} 
            onUpdateUsers={setAllUsers}
            organizations={organizations}
            onDeleteUserRequest={(id) => setAllUsers(allUsers.filter(u => u.id !== id))}
            onResetSystemRequest={() => {
                localStorage.clear();
                window.location.reload();
            }}
        />
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar 
        currentView={currentView} 
        onNavigate={handleNavigate} 
        onLogout={handleLogout}
        currentUser={currentUser}
      />
      
      <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar relative">
        <div className="max-w-7xl mx-auto pb-20">
          
          {/* USER VIEW ROUTES */}
          {currentView === 'DASHBOARD' && (
            <Dashboard 
              logs={tenantData.logs} 
              safeguardingCases={tenantData.safeguarding}
              behaviourEntries={tenantData.behavior}
              onNavigate={handleNavigate}
              currentUser={currentUser}
            />
          )}
          
          {currentView === 'NEW_LOG' && (
            <MeetingForm 
              onSubmit={handleSaveLog} 
              onCancel={() => handleNavigate('DASHBOARD')}
              currentUser={currentUser}
              initialAttendees={selectedStudent ? [selectedStudent] : []}
              onEscalate={(data) => {
                  setSelectedStudent(data.studentName); // Pre-select for SB
                  // Pass initial data logic handled by SB viewing 'NEW' + props? 
                  // For simplicity, we navigate to SAFEGUARDING and could pass state, 
                  // but here we rely on the user to select 'New Case' or modify SB to accept props.
                  // Ideally: <SafeguardingBuilder initialData={data} ... /> 
                  // We'll set a temporary 'draft' state or just navigate for now.
                  handleNavigate('SAFEGUARDING');
              }}
            />
          )}
          
          {currentView === 'HISTORY' && (
            <HistoryView 
              logs={tenantData.logs} 
              onSelectStudent={(name) => handleNavigate('STUDENT_PROFILE', name)}
              currentUser={currentUser}
            />
          )}
          
          {currentView === 'STUDENTS_DIRECTORY' && (
            <StudentDirectory 
                onSelectStudent={(name) => handleNavigate('STUDENT_PROFILE', name)}
                onQuickLog={(name) => handleNavigate('NEW_LOG', name)}
                safeguardingCases={tenantData.safeguarding}
                userScope={currentUser.allowedYearGroups}
            />
          )}

          {currentView === 'CLASS_OVERVIEW' && (
            <ClassOverview 
                logs={tenantData.logs}
                behaviourEntries={tenantData.behavior}
                safeguardingCases={tenantData.safeguarding}
                onNavigateToStudent={(name) => handleNavigate('STUDENT_PROFILE', name)}
                currentUser={currentUser}
            />
          )}
          
          {currentView === 'STUDENT_PROFILE' && selectedStudent && (
            <StudentProfile 
              studentName={selectedStudent}
              logs={tenantData.logs}
              behaviourEntries={tenantData.behavior}
              safeguardingCases={tenantData.safeguarding}
              onBack={() => handleNavigate('STUDENTS_DIRECTORY')}
              onToggleActionItem={handleToggleActionItem}
              onMarkAllCompleted={handleMarkAllActionsCompleted}
              onQuickLog={(name) => handleNavigate('NEW_LOG', name)}
              onViewSafeguarding={() => handleNavigate('SAFEGUARDING')}
              currentUser={currentUser}
            />
          )}

          {currentView === 'SAFEGUARDING' && (
              <SafeguardingBuilder 
                  cases={tenantData.safeguarding}
                  logs={tenantData.logs}
                  onSave={handleSaveSafeguarding}
                  onUpdate={handleUpdateSafeguarding}
                  onDelete={handleDeleteSafeguarding}
                  onCancel={() => handleNavigate('DASHBOARD')}
                  currentUser={currentUser}
                  initialSearchTerm={selectedStudent}
              />
          )}

          {currentView === 'REPORTS' && (
              <ReportsView 
                  logs={tenantData.logs}
                  safeguardingCases={tenantData.safeguarding}
              />
          )}

          {currentView === 'BEHAVIOUR' && (
              <BehaviourManager 
                  currentUser={currentUser}
                  entries={tenantData.behavior}
                  onAddEntries={handleAddBehaviour}
              />
          )}

          {currentView === 'SEATING_PLAN' && (
              <SeatingPlanView 
                  behaviourEntries={tenantData.behavior}
                  safeguardingCases={tenantData.safeguarding}
              />
          )}

          {currentView === 'ORG_SETTINGS' && (
              <OrgAdminSettings 
                  currentUser={currentUser}
                  users={tenantData.users}
                  onUpdateUsers={(updated) => {
                      // Filter out updates for this org and merge with global
                      const otherUsers = allUsers.filter(u => u.orgId !== currentUser.orgId);
                      setAllUsers([...otherUsers, ...updated]);
                  }}
              />
          )}

          {/* SUPER ADMIN ROUTES */}
          {currentView === 'SUPER_ADMIN_DASHBOARD' && <SuperAdminDashboard organizations={organizations} />}
          {currentView === 'SUPER_ADMIN_TENANTS' && <SuperAdminTenants organizations={organizations} onAddOrg={handleAddOrg} onUpdateOrg={handleUpdateOrg} onImpersonate={handleImpersonate} />}
          {currentView === 'SUPER_ADMIN_AI' && <SuperAdminAIMonitor organizations={organizations} />}
          {currentView === 'SUPER_ADMIN_SECURITY' && <SuperAdminSecurity />}
          {currentView === 'SUPER_ADMIN_TOOLS' && <SuperAdminTools />}
          {currentView === 'SUPER_ADMIN_OPS' && <SuperAdminOperations allUsers={allUsers} onUpdateUsers={setAllUsers} />}
          {currentView === 'SUPER_ADMIN_SUBSCRIPTIONS' && <SuperAdminSubscriptions />}
          {currentView === 'SUPER_ADMIN_INTEGRATIONS' && <SuperAdminIntegrations />}
          {currentView === 'SUPER_ADMIN_DATA' && <SuperAdminData organizations={organizations} />}
          {currentView === 'SUPER_ADMIN_RESOURCES' && <SuperAdminResources />}
          {currentView === 'SUPER_ADMIN_BRANDING' && <SuperAdminBranding />}
          {currentView === 'SUPER_ADMIN_FEEDBACK' && <SuperAdminFeedback />}

        </div>

        {/* Floating Chat Assistant (Available in non-Super Admin views) */}
        {currentUser.role !== 'Super Admin' && (
            <SentinelChat 
                logs={tenantData.logs}
                safeguarding={tenantData.safeguarding}
                behavior={tenantData.behavior}
            />
        )}
      </main>
    </div>
  );
};

export default App;
