
import React, { useState, useEffect } from 'react';
import { 
  UserProfile, ViewState, MeetingLog, BehaviourEntry, SafeguardingCase, 
  Organization, RoleDefinition, ActionItem 
} from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import MeetingForm from './components/MeetingForm';
import HistoryView from './components/HistoryView';
import StudentDirectory from './components/StudentDirectory';
import ClassOverview from './components/ClassOverview';
import SafeguardingBuilder from './components/SafeguardingBuilder';
import BehaviourManager from './components/BehaviourManager';
import SeatingPlanView from './components/SeatingPlanView';
import ReportsView from './components/ReportsView';
import StudentProfile from './components/StudentProfile';
import LoginView from './components/LoginView';
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

const App: React.FC = () => {
  // Auth State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  
  // Navigation State
  const [currentView, setCurrentView] = useState<ViewState>('DASHBOARD');
  const [selectedStudent, setSelectedStudent] = useState<string | undefined>(undefined);
  const [escalationData, setEscalationData] = useState<{ studentName: string; description: string; date: string } | null>(null);

  // Data State (Simulated Database)
  const [logs, setLogs] = useState<MeetingLog[]>([]);
  const [behavior, setBehavior] = useState<BehaviourEntry[]>([]);
  const [safeguarding, setSafeguarding] = useState<SafeguardingCase[]>([]);
  
  // Admin Data State
  const [users, setUsers] = useState<UserProfile[]>([
      { id: 'u1', name: 'Demo Teacher', role: 'Teacher', initials: 'DT', status: 'Active', orgId: 'org-1' },
      { id: 'u2', name: 'Head of Year', role: 'Head of Year', initials: 'HY', status: 'Active', orgId: 'org-1' },
      { id: 'u3', name: 'Safeguarding Lead', role: 'DSL', initials: 'SL', status: 'Active', orgId: 'org-1' },
      { id: 'u4', name: 'IT Admin', role: 'IT Admin', initials: 'IT', status: 'Active', orgId: 'org-1' },
      { id: 'u0', name: 'System Owner', role: 'Super Admin', initials: 'SO', status: 'Active' }
  ]);
  const [organizations, setOrganizations] = useState<Organization[]>([
      { 
          id: 'org-1', name: 'Springfield Academy', type: 'School', status: 'Active', licenseTier: 'Pro', 
          studentCount: 1200, staffCount: 85, renewalDate: '2024-12-31', 
          tokenUsageCurrentPeriod: 450000, tokenLimit: 1000000, aiCostEstimate: 4.50,
          features: { safeguarding: true, aiAssistant: true, parentPortal: false }
      }
  ]);
  const [roles, setRoles] = useState<RoleDefinition[]>([]);

  // Tenant Data Helper
  const tenantData = { logs, behavior, safeguarding };

  // Effects to load/save data
  useEffect(() => {
      const savedLogs = localStorage.getItem('sentinel_logs');
      if (savedLogs) setLogs(JSON.parse(savedLogs));
      
      const savedBehavior = localStorage.getItem('sentinel_behavior');
      if (savedBehavior) setBehavior(JSON.parse(savedBehavior));

      const savedSafeguarding = localStorage.getItem('sentinel_safeguarding');
      if (savedSafeguarding) setSafeguarding(JSON.parse(savedSafeguarding));
  }, []);

  useEffect(() => {
      localStorage.setItem('sentinel_logs', JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
      localStorage.setItem('sentinel_behavior', JSON.stringify(behavior));
  }, [behavior]);

  useEffect(() => {
      localStorage.setItem('sentinel_safeguarding', JSON.stringify(safeguarding));
  }, [safeguarding]);

  // Navigation Handlers
  const handleNavigate = (view: ViewState, studentName?: string) => {
      setCurrentView(view);
      if (studentName) setSelectedStudent(studentName);
  };

  const handleLogin = (user: UserProfile) => {
      setCurrentUser(user);
      setCurrentView(user.role === 'Super Admin' ? 'SUPER_ADMIN_DASHBOARD' : 'DASHBOARD');
  };

  const handleLogout = () => {
      setCurrentUser(null);
      setCurrentView('DASHBOARD');
      setSelectedStudent(undefined);
  };

  // Data Mutation Handlers
  const handleSaveLog = (newLog: MeetingLog) => {
      setLogs([newLog, ...logs]);
      handleNavigate('HISTORY');
  };

  const handleAddBehavior = (entries: BehaviourEntry[]) => {
      setBehavior([...entries, ...behavior]);
  };

  const handleSaveSafeguarding = (newCase: SafeguardingCase) => {
      setSafeguarding([newCase, ...safeguarding]);
  };

  const handleUpdateSafeguarding = (updatedCase: SafeguardingCase) => {
      setSafeguarding(safeguarding.map(c => c.id === updatedCase.id ? updatedCase : c));
  };

  const handleDeleteSafeguarding = (id: string) => {
      setSafeguarding(safeguarding.filter(c => c.id !== id));
  };

  const handleToggleActionItem = (logId: string, actionItemId: string) => {
      setLogs(logs.map(log => {
          if (log.id === logId) {
              return {
                  ...log,
                  actionItems: log.actionItems?.map(item => 
                      item.id === actionItemId 
                          ? { ...item, status: item.status === 'Pending' ? 'Completed' : 'Pending' } as ActionItem
                          : item
                  )
              };
          }
          return log;
      }));
  };

  const handleMarkAllActionsCompleted = (studentName: string) => {
      setLogs(logs.map(log => {
          if (log.attendees.includes(studentName)) {
              return {
                  ...log,
                  actionItems: log.actionItems?.map(item => ({ ...item, status: 'Completed' } as ActionItem))
              };
          }
          return log;
      }));
  };

  const handleEscalateToSafeguarding = (data: { studentName: string; description: string; date: string }) => {
      setEscalationData(data);
      handleNavigate('SAFEGUARDING');
  };

  // Super Admin Handlers
  const handleAddOrg = (org: Organization, admin: UserProfile) => {
      setOrganizations([...organizations, org]);
      setUsers([...users, admin]);
  };

  if (!currentUser) {
      return (
          <LoginView 
              onLogin={handleLogin} 
              users={users} 
              onUpdateUsers={setUsers} 
              organizations={organizations}
              roles={roles}
          />
      );
  }

  return (
      <div className="flex h-screen bg-slate-100 font-sans text-slate-900">
          <Sidebar 
              currentView={currentView} 
              onNavigate={handleNavigate} 
              onLogout={handleLogout} 
              currentUser={currentUser}
              roles={roles}
          />
          
          <main className="flex-1 overflow-auto p-4 md:p-8 relative">
              {/* Views */}
              {currentView === 'DASHBOARD' && (
                  <Dashboard 
                      logs={logs} 
                      safeguardingCases={safeguarding}
                      behaviourEntries={behavior}
                      onNavigate={handleNavigate}
                      currentUser={currentUser}
                  />
              )}

              {currentView === 'NEW_LOG' && (
                  <MeetingForm 
                      onSubmit={handleSaveLog} 
                      onCancel={() => handleNavigate('DASHBOARD')}
                      initialAttendees={selectedStudent ? [selectedStudent] : []}
                      currentUser={currentUser}
                      onEscalate={handleEscalateToSafeguarding}
                  />
              )}

              {currentView === 'HISTORY' && (
                  <HistoryView 
                      logs={logs} 
                      onSelectStudent={(name) => handleNavigate('STUDENT_PROFILE', name)} 
                      currentUser={currentUser}
                  />
              )}

              {currentView === 'STUDENTS_DIRECTORY' && (
                  <StudentDirectory 
                      onSelectStudent={(name) => handleNavigate('STUDENT_PROFILE', name)}
                      onQuickLog={(name) => handleNavigate('NEW_LOG', name)}
                      safeguardingCases={safeguarding}
                  />
              )}

              {currentView === 'CLASS_OVERVIEW' && (
                  <ClassOverview 
                      logs={logs}
                      behaviourEntries={behavior}
                      safeguardingCases={safeguarding}
                      onNavigateToStudent={(name) => handleNavigate('STUDENT_PROFILE', name)}
                      currentUser={currentUser}
                      roles={roles}
                  />
              )}

              {currentView === 'BEHAVIOUR' && (
                  <BehaviourManager 
                      currentUser={currentUser}
                      entries={behavior}
                      onAddEntries={handleAddBehavior}
                      onNavigateToStudent={(name) => handleNavigate('STUDENT_PROFILE', name)}
                  />
              )}

              {currentView === 'SEATING_PLAN' && (
                  <SeatingPlanView 
                      behaviourEntries={behavior}
                      safeguardingCases={safeguarding}
                      onNavigateToStudent={(name) => handleNavigate('STUDENT_PROFILE', name)}
                  />
              )}

              {currentView === 'REPORTS' && (
                  <ReportsView 
                      logs={logs}
                      safeguardingCases={safeguarding}
                  />
              )}

              {currentView === 'STUDENT_PROFILE' && selectedStudent && (
                <StudentProfile 
                  studentName={selectedStudent}
                  logs={logs}
                  behaviourEntries={behavior}
                  safeguardingCases={safeguarding}
                  onBack={() => handleNavigate('STUDENTS_DIRECTORY')}
                  onToggleActionItem={handleToggleActionItem}
                  onMarkAllCompleted={handleMarkAllActionsCompleted}
                  onQuickLog={(name) => handleNavigate('NEW_LOG', name)}
                  onViewSafeguarding={(name) => handleNavigate('SAFEGUARDING', name)}
                  currentUser={currentUser}
                />
              )}

              {currentView === 'SAFEGUARDING' && (
                  <SafeguardingBuilder 
                      cases={safeguarding}
                      logs={logs}
                      onSave={(c) => {
                          handleSaveSafeguarding(c);
                          handleNavigate('SAFEGUARDING'); 
                      }}
                      onUpdate={handleUpdateSafeguarding}
                      onDelete={handleDeleteSafeguarding}
                      onCancel={() => {
                          setEscalationData(null);
                          handleNavigate('DASHBOARD');
                      }}
                      onNavigateToStudent={(name) => handleNavigate('STUDENT_PROFILE', name)}
                      currentUser={currentUser}
                      initialSearchTerm={selectedStudent}
                      initialData={escalationData}
                  />
              )}

              {currentView === 'ORG_SETTINGS' && (
                  <OrgAdminSettings 
                      currentUser={currentUser}
                      users={users}
                      onUpdateUsers={setUsers}
                      roles={roles}
                      onUpdateRoles={setRoles}
                  />
              )}

              {/* SUPER ADMIN VIEWS */}
              {currentView === 'SUPER_ADMIN_DASHBOARD' && <SuperAdminDashboard organizations={organizations} />}
              {currentView === 'SUPER_ADMIN_TENANTS' && <SuperAdminTenants organizations={organizations} onAddOrg={handleAddOrg} onUpdateOrg={(o) => setOrganizations(organizations.map(org => org.id === o.id ? o : org))} onImpersonate={(id) => { const admin = users.find(u => u.orgId === id && u.role === 'IT Admin'); if(admin) handleLogin(admin); }} />}
              {currentView === 'SUPER_ADMIN_AI' && <SuperAdminAIMonitor organizations={organizations} />}
              {currentView === 'SUPER_ADMIN_SECURITY' && <SuperAdminSecurity />}
              {currentView === 'SUPER_ADMIN_TOOLS' && <SuperAdminTools />}
              {currentView === 'SUPER_ADMIN_OPS' && <SuperAdminOperations allUsers={users} onUpdateUsers={setUsers} roles={roles} />}
              {currentView === 'SUPER_ADMIN_SUBSCRIPTIONS' && <SuperAdminSubscriptions />}
              {currentView === 'SUPER_ADMIN_INTEGRATIONS' && <SuperAdminIntegrations />}
              {currentView === 'SUPER_ADMIN_DATA' && <SuperAdminData organizations={organizations} />}
              {currentView === 'SUPER_ADMIN_RESOURCES' && <SuperAdminResources />}
              {currentView === 'SUPER_ADMIN_BRANDING' && <SuperAdminBranding />}
              {currentView === 'SUPER_ADMIN_FEEDBACK' && <SuperAdminFeedback />}

              <SentinelChat logs={logs} safeguarding={safeguarding} behavior={behavior} />
          </main>
      </div>
  );
};

export default App;
