
import React, { useState } from 'react';
import { UserProfile, Organization, RoleDefinition } from '../types';
import { Shield, Lock, LogIn, AlertCircle, CheckCircle2, Server, KeyRound, HelpCircle } from 'lucide-react';
import { authService } from '../services/authService';

interface LoginViewProps {
  onLogin: (user: UserProfile) => void;
  users: UserProfile[]; 
  onUpdateUsers: (users: UserProfile[]) => void;
  organizations?: Organization[];
  onDeleteUserRequest?: (id: string) => void;
  onResetSystemRequest?: () => void;
  roles?: RoleDefinition[];
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin, onResetSystemRequest }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
        if (!password) throw new Error("Password is required");
        // In this free IDP mock, we accept any non-empty password for demo ease
        // But we validate the email against the authorized directory
        const user = await authService.login(email);
        onLogin(user);
    } catch (err: any) {
        setError(err.message || "Authentication Failed");
    } finally {
        setIsLoading(false);
    }
  };

  const handleSystemReset = () => {
      if (window.confirm("WARNING: This will clear local application data caches. Continue?")) {
          if (onResetSystemRequest) {
              onResetSystemRequest();
          } else {
              localStorage.clear();
              window.location.reload();
          }
      }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      
      {/* Background Decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[100px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600/10 rounded-full blur-[100px]"></div>
      </div>

      <div className="mb-8 text-center animate-fade-in z-10">
        <div className="inline-flex items-center justify-center p-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl mb-5 ring-1 ring-white/10">
          <Shield size={48} className="text-emerald-400" />
        </div>
        <h1 className="text-4xl font-black text-white tracking-tight">Sentinel</h1>
        <p className="text-slate-400 mt-2 font-medium text-lg">Safeguarding Intelligence Platform</p>
      </div>

      <div className="bg-white rounded-2xl shadow-2xl border border-slate-800 w-full max-w-md animate-slide-up relative overflow-hidden z-10 flex flex-col">
        
        {/* IDP Header */}
        <div className="bg-slate-50 border-b border-slate-100 p-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
                <Server size={16} className="text-indigo-600" />
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Secure Identity Provider</span>
            </div>
            <div className="flex items-center space-x-1">
                <Lock size={12} className="text-emerald-500" />
                <span className="text-[10px] font-bold text-emerald-600">TLS 1.3 Encrypted</span>
            </div>
        </div>

        <div className="p-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">Sign In</h2>

            {error && (
                <div className="mb-6 p-3 bg-red-50 border border-red-100 rounded-lg flex items-center text-left animate-fade-in">
                    <AlertCircle size={20} className="text-red-500 mr-3 flex-shrink-0" />
                    <p className="text-sm text-red-700 font-medium">{error}</p>
                </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">School Email</label>
                    <input 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                        placeholder="name@school.edu"
                        required
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Password</label>
                    <input 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                        placeholder="••••••••"
                        required
                    />
                </div>

                <button 
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-indigo-200 transition-all flex items-center justify-center group disabled:opacity-70 disabled:cursor-not-allowed mt-2"
                >
                    {isLoading ? (
                        <span className="animate-pulse">Verifying Identity...</span>
                    ) : (
                        <>
                            <LogIn size={20} className="mr-2 group-hover:translate-x-1 transition-transform" />
                            Access Dashboard
                        </>
                    )}
                </button>
            </form>

            <div className="mt-6 flex flex-col items-center space-y-4">
                <button 
                    onClick={() => setShowHint(!showHint)}
                    className="text-xs text-slate-400 hover:text-indigo-500 flex items-center transition-colors"
                >
                    <HelpCircle size={12} className="mr-1" /> Need credentials?
                </button>

                {showHint && (
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs w-full animate-fade-in">
                        <p className="font-bold text-slate-700 mb-2 border-b border-slate-200 pb-1">Demo Accounts (Password: any)</p>
                        <div className="space-y-1 font-mono text-slate-600">
                            <div className="flex justify-between"><span>Super Admin:</span> <span className="text-indigo-600 select-all cursor-pointer" onClick={() => setEmail('super@sentinel.edu')}>super@sentinel.edu</span></div>
                            <div className="flex justify-between"><span>IT Admin:</span> <span className="text-indigo-600 select-all cursor-pointer" onClick={() => setEmail('admin@sentinel.edu')}>admin@sentinel.edu</span></div>
                            <div className="flex justify-between"><span>DSL:</span> <span className="text-indigo-600 select-all cursor-pointer" onClick={() => setEmail('sarah.connor@sentinel.edu')}>sarah.connor@sentinel.edu</span></div>
                            <div className="flex justify-between"><span>Teacher:</span> <span className="text-indigo-600 select-all cursor-pointer" onClick={() => setEmail('john.smith@sentinel.edu')}>john.smith@sentinel.edu</span></div>
                        </div>
                    </div>
                )}
            </div>
        </div>
      </div>

      <button 
        onClick={handleSystemReset}
        className="fixed bottom-4 right-4 text-xs font-medium text-slate-500 hover:text-red-400 flex items-center opacity-30 hover:opacity-100 transition-all z-50"
        title="Clear local cache"
      >
        Reset Local Cache
      </button>
    </div>
  );
};

export default LoginView;
