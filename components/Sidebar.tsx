
import React, { useMemo } from 'react';
import { ViewState, UserProfile, RoleDefinition } from '../types';
import { 
  LayoutDashboard, 
  PlusCircle, 
  History, 
  Users, 
  Shield, 
  FileText, 
  LogOut, 
  BookOpen,
  BarChart2,
  Grid,
  Building2,
  BrainCircuit,
  Lock,
  Wrench,
  Briefcase,
  CreditCard,
  Boxes,
  Database,
  Library,
  Palette,
  MessageSquare,
  Monitor
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface SidebarProps {
  currentView: ViewState;
  onNavigate: (view: ViewState, studentName?: string) => void;
  onLogout: () => void;
  currentUser: UserProfile;
  roles?: RoleDefinition[];
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate, onLogout, currentUser, roles = [] }) => {
  const { t } = useLanguage();
  const isSuperAdmin = currentUser.role === 'Super Admin';
  
  // Determine access based on role permissions
  const canAccessAdminConfig = useMemo(() => {
      if (currentUser.role === 'Admin') return true; // Backward compatibility
      const userRoleDef = roles.find(r => r.name === currentUser.role);
      return userRoleDef?.permissions?.canManageUsers || false;
  }, [currentUser, roles]);

  const NavItem = ({ view, icon: Icon, label }: { view: ViewState; icon: any; label: string }) => (
    <button
      onClick={() => onNavigate(view)}
      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors mb-1 ${
        currentView === view 
          ? 'bg-indigo-600 text-white shadow-md' 
          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      }`}
    >
      <Icon size={20} />
      <span className="font-medium text-sm">{label}</span>
    </button>
  );

  return (
    <aside className="w-64 bg-slate-900 h-screen flex flex-col border-r border-slate-800 hidden md:flex flex-shrink-0">
      <div className="p-6 flex items-center space-x-3">
        <div className="bg-indigo-600 p-2 rounded-lg">
          <Shield className="text-white" size={24} />
        </div>
        <span className="text-xl font-bold text-white tracking-tight">Sentinel</span>
      </div>

      <nav className="flex-1 px-4 overflow-y-auto custom-scrollbar">
        <div className="mb-2 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider mt-4">
          {isSuperAdmin ? 'Global Command' : 'School Management'}
        </div>

        {isSuperAdmin ? (
          <>
            <NavItem view="SUPER_ADMIN_DASHBOARD" icon={LayoutDashboard} label="Command Center" />
            <NavItem view="SUPER_ADMIN_TENANTS" icon={Building2} label="Tenants" />
            <NavItem view="SUPER_ADMIN_AI" icon={BrainCircuit} label="AI Cortex" />
            <NavItem view="SUPER_ADMIN_SECURITY" icon={Lock} label="Security Audit" />
            <NavItem view="SUPER_ADMIN_SUBSCRIPTIONS" icon={CreditCard} label="Subscriptions" />
            <NavItem view="SUPER_ADMIN_OPS" icon={Briefcase} label="Operations" />
            <NavItem view="SUPER_ADMIN_TOOLS" icon={Wrench} label="Tools" />
            <NavItem view="SUPER_ADMIN_INTEGRATIONS" icon={Boxes} label="Integrations" />
            <NavItem view="SUPER_ADMIN_DATA" icon={Database} label="Data Governance" />
            <NavItem view="SUPER_ADMIN_RESOURCES" icon={Library} label="Resources" />
            <NavItem view="SUPER_ADMIN_BRANDING" icon={Palette} label="Branding" />
            <NavItem view="SUPER_ADMIN_FEEDBACK" icon={MessageSquare} label="Feedback" />
          </>
        ) : (
          <>
            <NavItem view="DASHBOARD" icon={LayoutDashboard} label={t('nav.dashboard')} />
            <NavItem view="NEW_LOG" icon={PlusCircle} label={t('nav.new_entry')} />
            <NavItem view="HISTORY" icon={History} label={t('nav.history')} />
            <NavItem view="STUDENTS_DIRECTORY" icon={Users} label={t('nav.students')} />
            <NavItem view="CLASS_OVERVIEW" icon={BookOpen} label={t('nav.class_overview')} />
            <NavItem view="SAFEGUARDING" icon={Shield} label={t('nav.safeguarding')} />
            <NavItem view="BEHAVIOUR" icon={BarChart2} label={t('nav.behaviour')} />
            <NavItem view="SEATING_PLAN" icon={Grid} label={t('nav.seating')} />
            <NavItem view="REPORTS" icon={FileText} label={t('nav.reports')} />
            {canAccessAdminConfig && (
               <>
                 <div className="mb-2 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider mt-6">
                    Admin Config
                 </div>
                 <NavItem view="ORG_SETTINGS" icon={Monitor} label="IT Console" />
               </>
            )}
          </>
        )}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center space-x-3 mb-4 px-2">
          <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold">
            {currentUser.initials}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-bold text-white truncate">{currentUser.name}</p>
            <p className="text-xs text-slate-400 truncate">{currentUser.role}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-lg transition-colors text-sm font-medium"
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
