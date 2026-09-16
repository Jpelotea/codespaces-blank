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

const getProfileStorageKey = (uid?: string | null) => uid ? `ai_job_copilot_profile_${uid}` : 'ai_job_copilot_profile_guest';
const getAppsStorageKey = (uid?: string | null) => uid ? `ai_job_copilot_apps_${uid}` : 'ai_job_copilot_apps_guest';

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
      const saved = localStorage.getItem(getProfileStorageKey(null));
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load local profile', e);
    }
    return INITIAL_USER_PROFILE;
  });

  // Applications pipeline state
  const [applications, setApplications] = useState<ApplicationRecord[]>(() => {
    try {
      const saved = localStorage.getItem(getAppsStorageKey(null));
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
          localStorage.setItem(getProfileStorageKey(user.uid), JSON.stringify(profile));
          localStorage.setItem(getAppsStorageKey(user.uid), JSON.stringify(userApps));
        } catch (err) {
          console.error('Error syncing user workspace from Firestore:', err);
        } finally {
          setIsSyncing(false);
        }
      } else {
        // User logged out: restore guest sandbox defaults, isolating prior user data
        setUserProfile(INITIAL_USER_PROFILE);
        setApplications(INITIAL_SAMPLE_APPLICATIONS);
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
    let recordToSave: ApplicationRecord;

    setApplications(prev => {
      const existingIndex = prev.findIndex(a => a.job.title === job.title && a.job.company === job.company);
      let updated: ApplicationRecord[];

      if (existingIndex >= 0) {
        recordToSave = {
          ...prev[existingIndex],
          fitScore: analysis?.overallScore || prev[existingIndex].fitScore,
          fitAnalysis: analysis || prev[existingIndex].fitAnalysis,
          materials: materials || prev[existingIndex].materials,
          updatedAt: new Date().toISOString()
        };
        updated = [...prev];
        updated[existingIndex] = recordToSave;
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
          notes: `Analyzed with ${analysis?.overallScore || 90}% match score.`,
          updatedAt: new Date().toISOString()
        };
        updated = [recordToSave, ...prev];
      }

      localStorage.setItem(getAppsStorageKey(currentUser?.uid), JSON.stringify(updated));
      return updated;
    });

    setActiveJob(job);
    if (analysis) setActiveAnalysis(analysis);

    // Persist to Firestore if user is authenticated
    if (currentUser) {
      setIsSyncing(true);
      try {
        await saveApplicationToFirestore(currentUser.uid, recordToSave!);
      } catch (e) {
        console.error('Failed to sync application to Firestore:', e);
      } finally {
        setIsSyncing(false);
      }
    }
  };

  // Handler: Update application status with dateApplied automation
  const handleUpdateApplicationStatus = async (id: string, newStatus: ApplicationStatus) => {
    let updatedRecord: ApplicationRecord | null = null;

    setApplications(prev => {
      const updated = prev.map(a => {
        if (a.id !== id) return a;
        updatedRecord = {
          ...a,
          status: newStatus,
          dateApplied: newStatus === 'Applied' && !a.dateApplied ? new Date().toISOString().split('T')[0] : a.dateApplied,
          updatedAt: new Date().toISOString()
        };
        return updatedRecord;
      });
      localStorage.setItem(getAppsStorageKey(currentUser?.uid), JSON.stringify(updated));
      return updated;
    });

    if (currentUser && updatedRecord) {
      setIsSyncing(true);
      try {
        await saveApplicationToFirestore(currentUser.uid, updatedRecord);
      } catch (e) {
        console.error('Failed to update status in Firestore:', e);
      } finally {
        setIsSyncing(false);
      }
    }
  };

  // Handler: Delete application
  const handleDeleteApplication = async (id: string) => {
    setApplications(prev => {
      const updated = prev.filter(a => a.id !== id);
      localStorage.setItem(getAppsStorageKey(currentUser?.uid), JSON.stringify(updated));
      return updated;
    });

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

    setApplications(prev => {
      const updated = prev.map(a => {
        if (a.id === id) {
          modifiedRecord = {
            ...a,
            notes,
            nextFollowUpDate: nextActionDate || a.nextFollowUpDate,
            nextActionNote: nextActionNote || a.nextActionNote,
            updatedAt: new Date().toISOString()
          };
          return modifiedRecord;
        }
        return a;
      });
      localStorage.setItem(getAppsStorageKey(currentUser?.uid), JSON.stringify(updated));
      return updated;
    });

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
    setApplications(prev => {
      const updated = prev.map(a => a.id === updatedApp.id ? { ...updatedApp, updatedAt: new Date().toISOString() } : a);
      localStorage.setItem(getAppsStorageKey(currentUser?.uid), JSON.stringify(updated));
      return updated;
    });

    if (currentUser) {
      setIsSyncing(true);
      try {
        await saveApplicationToFirestore(currentUser.uid, { ...updatedApp, updatedAt: new Date().toISOString() });
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
    localStorage.setItem(getProfileStorageKey(currentUser?.uid), JSON.stringify(updated));

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
