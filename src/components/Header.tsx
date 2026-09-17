import React, { useState, useRef, useEffect } from 'react';
import { 
  Briefcase, 
  Sparkles, 
  ShieldCheck, 
  CheckCircle2, 
  Layers, 
  UserCheck, 
  CalendarClock,
  LogIn,
  LogOut,
  User as UserIcon,
  Cloud,
  ChevronDown,
  CloudCheck
} from 'lucide-react';
import { User } from 'firebase/auth';
import { UserProfile } from '../types';

interface HeaderProps {
  activeTab: 'analyzer' | 'pipeline' | 'interview' | 'vault';
  setActiveTab: (tab: 'analyzer' | 'pipeline' | 'interview' | 'vault') => void;
  userProfile: UserProfile;
  hasGeminiKey: boolean;
  applicationsCount: number;
  currentUser: User | null;
  onOpenAuth: (mode?: 'signin' | 'signup') => void;
  onLogout: () => void;
  isSyncing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  userProfile,
  hasGeminiKey,
  applicationsCount,
  currentUser,
  onOpenAuth,
  onLogout,
  isSyncing = false
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isGuest = currentUser?.isAnonymous;
  const userDisplayName = currentUser?.displayName || userProfile.name || 'Account';
  const userInitial = userDisplayName.charAt(0).toUpperCase();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
              <Briefcase className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-lg tracking-tight">
                  Job Application Copilot
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                  <Sparkles className="w-3 h-3 text-indigo-500" />
                  Remote VA & Ops
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden md:block">
                Personal account sync, AI-assisted job-fit & interview prep
              </p>
            </div>
          </div>

          {/* Status Indicators & Auth Controls */}
          <div className="flex items-center gap-3">
            {/* Cloud Sync Indicator */}
            {currentUser && !isGuest && (
              <div 
                className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-50 text-slate-600 border border-slate-200"
                title={isSyncing ? "Saving to your cloud database..." : "All your data is saved in Firebase cloud"}
              >
                <Cloud className={`w-3.5 h-3.5 ${isSyncing ? 'text-amber-500 animate-pulse' : 'text-emerald-600'}`} />
                <span>{isSyncing ? 'Syncing...' : 'Cloud Synced'}</span>
              </div>
            )}

            {/* Professional evidence status badge */}
            <div 
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200/80"
              title="Track Draft, User Confirmed, and Source Backed professional information."
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Profile Evidence</span>
            </div>

            {/* AI Engine Status */}
            <div 
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200"
              title={hasGeminiKey ? "Connected to Gemini AI Engine server-side" : "Intelligent local semantic matcher active"}
            >
              <span className={`w-2 h-2 rounded-full ${hasGeminiKey ? 'bg-emerald-500 animate-pulse' : 'bg-blue-500'}`} />
              <span>{hasGeminiKey ? 'Gemini AI Engine' : 'Smart Engine'}</span>
            </div>

            {/* Authentication Action Pill / Dropdown */}
            {currentUser ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  id="header-user-menu-btn"
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition text-left cursor-pointer shadow-2xs"
                >
                  <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold ring-2 ring-indigo-100">
                    {userInitial}
                  </div>
                  <div className="hidden sm:block text-xs">
                    <div className="font-semibold text-slate-900 leading-tight flex items-center gap-1">
                      <span>{userDisplayName}</span>
                      {isGuest && (
                        <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-medium">
                          Guest
                        </span>
                      )}
                    </div>
                    <div className="text-slate-500 text-[10px] truncate max-w-[120px]">
                      {currentUser.email || 'Cloud Account'}
                    </div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <div className="text-xs font-bold text-slate-900">{userDisplayName}</div>
                      <div className="text-[11px] text-slate-500 truncate">{currentUser.email || 'Signed in via Guest ID'}</div>
                      <div className={`mt-1 flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md w-fit ${isGuest ? 'text-amber-800 bg-amber-50' : 'text-emerald-700 bg-emerald-50'}`}>
                        <CheckCircle2 className={`w-3 h-3 ${isGuest ? 'text-amber-600' : 'text-emerald-600'}`} />
                        <span>{isGuest ? 'Temporary preview only' : 'Firebase Cloud Active'}</span>
                      </div>
                    </div>

                    {isGuest && (
                      <div className="p-2 border-b border-slate-100 bg-amber-50/70 m-2 rounded-xl">
                        <p className="text-[11px] text-amber-900 leading-tight mb-1.5">
                          You're using a guest session. Link a permanent account to keep your data safe.
                        </p>
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            onOpenAuth('signup');
                          }}
                          className="w-full py-1 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition"
                        >
                          Save Account
                        </button>
                      </div>
                    )}

                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        setActiveTab('vault');
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                    >
                      <UserCheck className="w-4 h-4 text-indigo-600" />
                      <span>Edit Profile &amp; Evidence</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onLogout();
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer border-t border-slate-100 mt-1"
                    >
                      <LogOut className="w-4 h-4 text-red-500" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenAuth('signin')}
                  id="header-signin-btn"
                  className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5 text-slate-500" />
                  <span>Sign In</span>
                </button>
                <button
                  onClick={() => onOpenAuth('signup')}
                  id="header-signup-btn"
                  className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-white transition shadow-2xs cursor-pointer"
                >
                  Create Account
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Primary Navigation Tabs */}
        <div className="flex space-x-1 sm:space-x-4 border-t border-slate-100 pt-1 overflow-x-auto scrollbar-none">
          <button
            id="nav-tab-analyzer"
            onClick={() => setActiveTab('analyzer')}
            className={`flex items-center gap-2 py-2.5 px-3 text-sm font-medium border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'analyzer'
                ? 'border-indigo-600 text-indigo-700 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Job Analysis & Tailor</span>
          </button>

          <button
            id="nav-tab-pipeline"
            onClick={() => setActiveTab('pipeline')}
            className={`flex items-center gap-2 py-2.5 px-3 text-sm font-medium border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'pipeline'
                ? 'border-indigo-600 text-indigo-700 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Application Pipeline</span>
            {applicationsCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[11px] font-medium ${
                activeTab === 'pipeline' ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-600'
              }`}>
                {applicationsCount}
              </span>
            )}
          </button>

          <button
            id="nav-tab-interview"
            onClick={() => setActiveTab('interview')}
            className={`flex items-center gap-2 py-2.5 px-3 text-sm font-medium border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'interview'
                ? 'border-indigo-600 text-indigo-700 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <CalendarClock className="w-4 h-4" />
            <span>Interview & Follow-Ups</span>
          </button>

          <button
            id="nav-tab-vault"
            onClick={() => setActiveTab('vault')}
            className={`flex items-center gap-2 py-2.5 px-3 text-sm font-medium border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'vault'
                ? 'border-indigo-600 text-indigo-700 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Profile &amp; Evidence</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </button>
        </div>
      </div>
    </header>
  );
};
