import React, { useState, useEffect, useCallback } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { 
  UserProfile, 
  ApplicationRecord, 
  ApplicationStatus, 
  JobPosting, 
  JobFitAnalysis, 
  TailoredMaterials 
} from './types';
import { INITIAL_USER_PROFILE } from './data/defaultProfile';
import { INITIAL_SAMPLE_APPLICATIONS, SAMPLE_JOB_PRESETS } from './data/sampleJobs';
import { Header } from './components/Header';
import { AuthModal } from './components/AuthModal';
import { JobAnalyzerView } from './components/JobAnalyzerView';
import { ApplicationTrackerView } from './components/ApplicationTrackerView';
import { VerifiedProfileVaultView } from './components/VerifiedProfileVaultView';
import { InterviewStudioView } from './components/InterviewStudioView';
import { checkServerHealth } from './services/api';
import { 
  auth, 
  logoutUser, 
  getUserProfileFromFirestore, 
  saveUserProfileToFirestore, 
  getApplicationsFromFirestore, 
  saveApplicationToFirestore, 
  deleteApplicationFromFirestore,
  initializeUserWorkspace
} from './lib/firebase';
import { ShieldCheck, Cloud, UserCheck, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';

const LOCAL_PROFILE_KEY = 'ai_job_copilot_profile_local';
const LOCAL_APPS_KEY = 'ai_job_copilot_apps_local';

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<'analyzer' | 'pipeline' | 'interview' | 'vault'>('analyzer');

  // Firebase Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Server health & Gemini status
  const [hasGeminiKey, setHasGeminiKey] = useState<boolean>(true);

  // User Profile state
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_PROFILE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load local profile', e);
    }
    return INITIAL_USER_PROFILE;
  });

  // Applications pipeline state
  const [applications, setApplications] = useState<ApplicationRecord[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_APPS_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load local applications', e);
    }
    return INITIAL_SAMPLE_APPLICATIONS;
  });

  // Current active job & analysis selected for cross-tab workflows
  const [activeJob, setActiveJob] = useState<JobPosting | null>(SAMPLE_JOB_PRESETS[0]);
  const [activeAnalysis, setActiveAnalysis] = useState<JobFitAnalysis | null>(null);

  // Check backend Gemini API status on mount
  useEffect(() => {
    checkServerHealth().then(res => {
      setHasGeminiKey(res.hasGeminiKey);
    });
  }, []);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setAuthLoading(false);

      if (user) {
        setIsSyncing(true);
        try {
          // Sync workspace from Firestore
          const { profile, applications: userApps } = await initializeUserWorkspace(user, true);
          setUserProfile(profile);
          setApplications(userApps.length > 0 ? userApps : INITIAL_SAMPLE_APPLICATIONS);
          localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(profile));
          localStorage.setItem(LOCAL_APPS_KEY, JSON.stringify(userApps));
        } catch (err) {
          console.error('Error syncing user workspace from Firestore:', err);
        } finally {
          setIsSyncing(false);
        }
      } else {
        // User logged out: reload default local state
        const savedProfile = localStorage.getItem(LOCAL_PROFILE_KEY);
        if (savedProfile) {
          try {
            setUserProfile(JSON.parse(savedProfile));
          } catch (e) {
            setUserProfile(INITIAL_USER_PROFILE);
          }
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Handler: Save role to tracker & Firestore
  const handleSaveToTracker = async (
    job: JobPosting, 
    analysis?: JobFitAnalysis, 
    materials?: TailoredMaterials
  ) => {
    const existingIndex = applications.findIndex(a => a.job.title === job.title && a.job.company === job.company);
    let recordToSave: ApplicationRecord;

    if (existingIndex >= 0) {
      const updated = [...applications];
      recordToSave = {
        ...updated[existingIndex],
        fitScore: analysis?.overallScore || updated[existingIndex].fitScore,
        fitAnalysis: analysis || updated[existingIndex].fitAnalysis,
        materials: materials || updated[existingIndex].materials
      };
      updated[existingIndex] = recordToSave;
      setApplications(updated);
      localStorage.setItem(LOCAL_APPS_KEY, JSON.stringify(updated));
    } else {
      recordToSave = {
        id: `app-${Date.now()}`,
        job,
        status: 'Ready to Apply',
        fitScore: analysis?.overallScore || 90,
        dateAdded: new Date().toISOString().split('T')[0],
        nextFollowUpDate: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
        nextActionNote: 'Review tailored materials and submit application.',
        fitAnalysis: analysis,
        materials,
        notes: `Analyzed with ${analysis?.overallScore || 90}% match score.`
      };
      const updated = [recordToSave, ...applications];
      setApplications(updated);
      localStorage.setItem(LOCAL_APPS_KEY, JSON.stringify(updated));
    }

    setActiveJob(job);
    if (analysis) setActiveAnalysis(analysis);

    // Persist to Firestore if user is authenticated
    if (currentUser) {
      setIsSyncing(true);
      try {
        await saveApplicationToFirestore(currentUser.uid, recordToSave);
      } catch (e) {
        console.error('Failed to sync application to Firestore:', e);
      } finally {
        setIsSyncing(false);
      }
    }
  };

  // Handler: Update application status
  const handleUpdateApplicationStatus = async (id: string, newStatus: ApplicationStatus) => {
    const updated = applications.map(a => a.id === id ? { ...a, status: newStatus } : a);
    setApplications(updated);
    localStorage.setItem(LOCAL_APPS_KEY, JSON.stringify(updated));

    if (currentUser) {
      const target = updated.find(a => a.id === id);
      if (target) {
        setIsSyncing(true);
        try {
          await saveApplicationToFirestore(currentUser.uid, target);
        } catch (e) {
          console.error('Failed to update status in Firestore:', e);
        } finally {
          setIsSyncing(false);
        }
      }
    }
  };

  // Handler: Delete application
  const handleDeleteApplication = async (id: string) => {
    const updated = applications.filter(a => a.id !== id);
    setApplications(updated);
    localStorage.setItem(LOCAL_APPS_KEY, JSON.stringify(updated));

    if (currentUser) {
      setIsSyncing(true);
      try {
        await deleteApplicationFromFirestore(currentUser.uid, id);
      } catch (e) {
        console.error('Failed to delete application in Firestore:', e);
      } finally {
        setIsSyncing(false);
      }
    }
  };

  // Handler: Open application in interview prep
  const handleSelectApplicationForInterview = (app: ApplicationRecord) => {
    setActiveJob(app.job);
    setActiveAnalysis(app.fitAnalysis || null);
    setActiveTab('interview');
  };

  // Handler: Update notes and next action
  const handleUpdateNotes = async (id: string, notes: string, nextActionDate?: string, nextActionNote?: string) => {
    let modifiedRecord: ApplicationRecord | null = null;
    const updated = applications.map(a => {
      if (a.id === id) {
        modifiedRecord = {
          ...a,
          notes,
          nextFollowUpDate: nextActionDate || a.nextFollowUpDate,
          nextActionNote: nextActionNote || a.nextActionNote
        };
        return modifiedRecord;
      }
      return a;
    });

    setApplications(updated);
    localStorage.setItem(LOCAL_APPS_KEY, JSON.stringify(updated));

    if (currentUser && modifiedRecord) {
      setIsSyncing(true);
      try {
        await saveApplicationToFirestore(currentUser.uid, modifiedRecord);
      } catch (e) {
        console.error('Failed to update notes in Firestore:', e);
      } finally {
        setIsSyncing(false);
      }
    }
  };

  // Handler: Full application record update (for interview dates, deadlines, and schedules)
  const handleUpdateApplication = async (updatedApp: ApplicationRecord) => {
    const updated = applications.map(a => a.id === updatedApp.id ? updatedApp : a);
    setApplications(updated);
    localStorage.setItem(LOCAL_APPS_KEY, JSON.stringify(updated));

    if (currentUser) {
      setIsSyncing(true);
      try {
        await saveApplicationToFirestore(currentUser.uid, updatedApp);
      } catch (e) {
        console.error('Failed to update application in Firestore:', e);
      } finally {
        setIsSyncing(false);
      }
    }
  };

  // Handler: Update profile in state and Firestore
  const handleUpdateProfile = async (updated: UserProfile) => {
    setUserProfile(updated);
    localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(updated));

    if (currentUser) {
      setIsSyncing(true);
      try {
        await saveUserProfileToFirestore(currentUser.uid, updated);
      } catch (e) {
        console.error('Failed to save profile in Firestore:', e);
      } finally {
        setIsSyncing(false);
      }
    }
  };

  // Handler: Logout
  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  const openAuth = (mode: 'signin' | 'signup' = 'signin') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-100/60 text-slate-900 flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-800">
      {/* Top Navigation Bar with Authentication Status */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userProfile={userProfile}
        hasGeminiKey={hasGeminiKey}
        applicationsCount={applications.length}
        currentUser={currentUser}
        onOpenAuth={openAuth}
        onLogout={handleLogout}
        isSyncing={isSyncing}
      />

      {/* Guest / Logged Out Onboarding Banner */}
      {!currentUser && !authLoading && (
        <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white border-b border-indigo-800/40 py-2.5 px-4">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
              <span className="font-medium text-slate-200">
                You're in preview mode. <strong>Sign in to your personal account</strong> to save and sync your verified profile, custom materials, and job pipeline securely in Firebase.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => openAuth('signin')}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium transition cursor-pointer"
              >
                Sign In
              </button>
              <button
                onClick={() => openAuth('signup')}
                className="px-3 py-1 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white font-semibold flex items-center gap-1 transition shadow-xs cursor-pointer"
              >
                <span>Create Personal Account</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'analyzer' && (
          <JobAnalyzerView
            userProfile={userProfile}
            onSaveToTracker={handleSaveToTracker}
            onOpenInterviewPrep={(job, analysis) => {
              setActiveJob(job);
              if (analysis) setActiveAnalysis(analysis);
              setActiveTab('interview');
            }}
          />
        )}

        {activeTab === 'pipeline' && (
          <ApplicationTrackerView
            applications={applications}
            onUpdateApplicationStatus={handleUpdateApplicationStatus}
            onDeleteApplication={handleDeleteApplication}
            onSelectApplicationForInterview={handleSelectApplicationForInterview}
            onOpenNewJobAnalysis={() => setActiveTab('analyzer')}
            onUpdateNotes={handleUpdateNotes}
          />
        )}

        {activeTab === 'interview' && (
          <InterviewStudioView
            applications={applications}
            activeJob={activeJob}
            activeAnalysis={activeAnalysis}
            userProfile={userProfile}
            onUpdateApplication={handleUpdateApplication}
            onSelectJob={(job, analysis) => {
              setActiveJob(job);
              if (analysis) setActiveAnalysis(analysis);
            }}
          />
        )}

        {activeTab === 'vault' && (
          <VerifiedProfileVaultView
            userProfile={userProfile}
            onUpdateProfile={handleUpdateProfile}
          />
        )}
      </main>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">AI Job Application Copilot</span>
            <span>•</span>
            <span>Zero-Hallucination Verified Truth Engine</span>
            <span>•</span>
            <span className="text-emerald-700 font-medium flex items-center gap-1">
              <Cloud className="w-3 h-3" />
              Firebase Cloud Auth & Storage
            </span>
          </div>
          <div className="flex items-center gap-4 text-slate-500">
            <span>Specialized for Remote VA, BizOps & Executive Assistant Roles</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
