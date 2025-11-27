
import React, { useState, useEffect } from 'react';
import { UserProfile, Device, SupportTicket, SyncLog, RoleDefinition } from '../types';
import { 
    Server, Wifi, Users, Monitor, Ticket, AlertCircle, CheckCircle2, 
    RefreshCw, Search, Plus, Edit2, Trash2, Lock, Laptop, Tablet, 
    Database, KeyRound, Activity, Mail, FileUp, Network, Shield,
    UserCog, ToggleLeft, ToggleRight, BookOpen, ClipboardList, Settings, Download, LayoutGrid
} from 'lucide-react';

interface OrgAdminSettingsProps {
  currentUser: UserProfile;
  users: UserProfile[];
  onUpdateUsers: (users: UserProfile[]) => void;
  roles: RoleDefinition[];
  onUpdateRoles: (roles: RoleDefinition[]) => void;
  initialTab?: 'OVERVIEW' | 'IAM' | 'ROLES' | 'ASSETS' | 'HELPDESK' | 'DATA';
}

// Mock Data
const MOCK_DEVICES: Device[] = [
    { id: '1', serialNumber: 'LPT-8821', type: 'Laptop', model: 'Dell Latitude', assignedTo: 'Jane Doe', status: 'Active', lastCheckIn: '2023-11-20' },
    { id: '2', serialNumber: 'TAB-9912', type: 'Tablet', model: 'iPad Air', assignedTo: 'Cart 1 (Library)', status: 'Active', lastCheckIn: '2023-11-19' },
    { id: '3', serialNumber: 'PNL-1102', type: 'Interactive Panel', model: 'Promethean', assignedTo: 'Room 3B', status: 'Repair', lastCheckIn: '2023-11-15' },
    { id: '4', serialNumber: 'LPT-8822', type: 'Laptop', model: 'Dell Latitude', assignedTo: 'John Smith', status: 'Active', lastCheckIn: '2023-11-20' },
];

const MOCK_TICKETS: SupportTicket[] = [
    { id: 't1', requester: 'Sarah Connor', role: 'DSL', subject: 'Unable to access safeguarding archive', priority: 'High', status: 'Open', date: '2023-11-21 09:30', category: 'Account' },
    { id: 't2', requester: 'John Smith', role: 'Teacher', subject: 'Projector in Room 4 not connecting', priority: 'Medium', status: 'In Progress', date: '2023-11-20 14:15', category: 'Hardware' },
    { id: 't3', requester: 'Jane Doe', role: 'Head of Year', subject: 'Need new student added to roster', priority: 'Low', status: 'Resolved', date: '2023-11-19 11:00', category: 'Software' },
];

const MOCK_SYNC_LOGS: SyncLog[] = [
    { id: 's1', system: 'Wonde', status: 'Success', recordsProcessed: 1240, timestamp: '2023-11-22 02:00:00', message: 'Daily roster sync completed' },
    { id: 's2', system: 'Google', status: 'Success', recordsProcessed: 45, timestamp: '2023-11-22 02:15:00', message: 'Classroom rosters updated' },
    { id: 's3', system: 'SIMS', status: 'Partial', recordsProcessed: 1238, timestamp: '2023-11-21 02:00:00', message: '2 records skipped due to missing UPN' },
    { id: 's4', system: 'Arbor', status: 'Failed', recordsProcessed: 0, timestamp: '2023-11-20 14:00:00', message: 'API Timeout' },
];

const OrgAdminSettings: React.FC<OrgAdminSettingsProps> = ({ currentUser, users, onUpdateUsers, roles, onUpdateRoles, initialTab = 'OVERVIEW' }) => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'IAM' | 'ROLES' | 'ASSETS' | 'HELPDESK' | 'DATA'>(initialTab);
  
  useEffect(() => {
      setActiveTab(initialTab);
  }, [initialTab]);

  // IAM State
  const [userSearch, setUserSearch] = useState('');
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);

  // Role Management State
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleDefinition | null>(null);

  // Asset State
  const [devices, setDevices] = useState<Device[]>(MOCK_DEVICES);
  const [deviceSearch, setDeviceSearch] = useState('');
  const [showDeviceModal, setShowDeviceModal] = useState(false);

  // Helpdesk State
  const [tickets, setTickets] = useState<SupportTicket[]>(MOCK_TICKETS);

  // Data State
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>(MOCK_SYNC_LOGS);
  const [isSyncing, setIsSyncing] = useState(false);

  const filteredUsers = users.filter(u => u.name.toLowerCase().includes(userSearch.toLowerCase()));
  const filteredDevices = devices.filter(d => d.serialNumber.toLowerCase().includes(deviceSearch.toLowerCase()) || d.assignedTo?.toLowerCase().includes(deviceSearch.toLowerCase()));

  // --- IAM Handlers ---
  const handleSaveUser = (e: React.FormEvent) => {
      e.preventDefault();
      const form = e.target as HTMLFormElement;
      const formData = new FormData(form);
      const name = formData.get('name') as string;
      const role = formData.get('role') as any;
      const email = formData.get('email') as string;

      if (editingUser) {
          onUpdateUsers(users.map(u => u.id === editingUser.id ? { ...u, name, role, email, initials: name.substring(0,2).toUpperCase() } : u));
      } else {
          const newUser: UserProfile = {
              id: crypto.randomUUID(),
              name,
              role,
              email,
              initials: name.substring(0,2).toUpperCase(),
              orgId: currentUser.orgId
          };
          onUpdateUsers([...users, newUser]);
      }
      setShowUserModal(false);
      setEditingUser(null);
  };

  // --- Role Handlers ---
  const handleSaveRole = (e: React.FormEvent) => {
      e.preventDefault();
      const form = e.target as HTMLFormElement;
      const formData = new FormData(form);
      const name = formData.get('name') as string;
      
      // Permissions Construction
      const permissions = {
          canViewSafeguarding: formData.get('perm_safeguarding_view') === 'on',
          canManageSafeguarding: formData.get('perm_safeguarding_manage') === 'on',
          canViewBehavior: formData.get('perm_behavior_view') === 'on',
          canEditBehavior: formData.get('perm_behavior_edit') === 'on',
          
          canManageSeating: formData.get('perm_seating') === 'on',
          canRunReports: formData.get('perm_reports') === 'on',
          canExportData: formData.get('perm_export') === 'on',
          
          canManageUsers: formData.get('perm_users') === 'on',
          canConfigureSystem: formData.get('perm_config') === 'on',

          classManager: {
              showRiskAnalysis: formData.get('cm_risk') === 'on',
              showBehaviorTrends: formData.get('cm_trends') === 'on',
              showStudentRoster: formData.get('cm_roster') === 'on',
              showActivityFeed: formData.get('cm_activity') === 'on',
          }
      };

      if (editingRole) {
          onUpdateRoles(roles.map(r => r.id === editingRole.id ? { ...r, name, permissions } : r));
      } else {
          const newRole: RoleDefinition = {
              id: crypto.randomUUID(),
              name,
              isSystem: false,
              permissions,
              orgId: currentUser.orgId
          };
          onUpdateRoles([...roles, newRole]);
      }
      setShowRoleModal(false);
      setEditingRole(null);
  };

  const handleDeleteRole = (roleId: string) => {
      if(window.confirm('Delete this role? Users assigned to this role will lose permissions.')) {
          onUpdateRoles(roles.filter(r => r.id !== roleId));
      }
  };

  const handleResetPassword = (userId: string) => {
      alert(`Password reset link sent to user ID: ${userId}`);
  };

  const handleBulkImport = () => {
      alert("Opening CSV import wizard...");
  };

  // --- Asset Handlers ---
  const handleAddDevice = (e: React.FormEvent) => {
      e.preventDefault();
      const form = e.target as HTMLFormElement;
      const formData = new FormData(form);
      
      const newDevice: Device = {
          id: crypto.randomUUID(),
          serialNumber: formData.get('serial') as string,
          type: formData.get('type') as any,
          model: formData.get('model') as string,
          assignedTo: formData.get('assigned') as string,
          status: 'Active',
          lastCheckIn: new Date().toISOString().split('T')[0]
      };
      setDevices([...devices, newDevice]);
      setShowDeviceModal(false);
  };

  // --- Data Handlers ---
  const handleManualSync = (system: SyncLog['system']) => {
      setIsSyncing(true);
      setTimeout(() => {
          const newLog: SyncLog = {
              id: crypto.randomUUID(),
              system,
              status: 'Success',
              recordsProcessed: Math.floor(Math.random() * 100),
              timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
              message: 'Manual sync completed successfully'
          };
          setSyncLogs([newLog, ...syncLogs]);
          setIsSyncing(false);
      }, 2000);
  };

  return (
    <div className="animate-fade-in space-y-6">
      <header className="flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-bold text-slate-800">IT Command Console</h1>
            <p className="text-slate-500">Infrastructure, Identity, and Data Management</p>
        </div>
        <div className="flex items-center space-x-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-full">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-50