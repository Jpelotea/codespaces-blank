import React, { useState, useEffect, useRef } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import {
  UserProfile,
  ApplicationRecord,
  ApplicationStatus,
  JobPosting,
  JobFitAnalysis,
  TailoredMaterials
} from './types';
import { SAMPLE_JOB_PRESETS } from './data/sampleJobs';
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
  saveUserProfileToFirestore,
  saveApplicationToFirestore,
  deleteApplicationFromFirestore,
  initializeUserWorkspace
} from './lib/firebase';
import {
  AUTH_PENDING_WORKSPACE_SESSION,
  canPersistAuthenticatedWorkspace,
  getWorkspaceSessionKey,
  isWorkspaceSessionCurrent,
  shouldApplyWorkspaceLoad,
} from './lib/workspaceSession';
import { createBlankUserProfile } from './lib/profileEvidence';
import { createWorkspaceBoundaryData } from './lib/workspaceData';
import { Cloud, ArrowRight } from 'lucide-react';

const getProfileStorageKey = (uid?: string | null) => `ai_job_copilot_profile_${uid ?? 'guest'}`;
const getAppsStorageKey = (uid?: string | null) => `ai_job_copilot_apps_${uid ?? 'guest'}`;

const clearSensitiveStorage = (uid?: string | null) => {
  localStorage.removeItem(getProfileStorageKey(uid));
  localStorage.removeItem(getAppsStorageKey(uid));
};

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<'analyzer' | 'pipeline' | 'interview' | 'vault'>('analyzer');

  // Firebase Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const currentUserRef = useRef<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Account-session boundary. A change here invalidates all callbacks and local
  // feature state that originated from the previous authenticated identity.
  const [workspaceSessionKey, setWorkspaceSessionKey] = useState(AUTH_PENDING_WORKSPACE_SESSION);
  const workspaceSessionRef = useRef(AUTH_PENDING_WORKSPACE_SESSION);
  const [workspaceOwnerUid, setWorkspaceOwnerUid] = useState<string | null>(null);
  const workspaceOwnerUidRef = useRef<string | null>(null);

  // Server health & Gemini status
  const [hasGeminiKey, setHasGeminiKey] = useState<boolean>(true);

  // User Profile state
  const [userProfile, setUserProfile] = useState<UserProfile>(() => createWorkspaceBoundaryData(null).profile);

  // Applications pipeline state
  const [applications, setApplications] = useState<ApplicationRecord[]>(() => createWorkspaceBoundaryData(null).applications);

  // Current active job & analysis selected for cross-tab workflows
  const [activeJob, setActiveJob] = useState<JobPosting | null>(SAMPLE_JOB_PRESETS[0]);
  const [activeAnalysis, setActiveAnalysis] = useState<JobFitAnalysis | null>(null);

  // Check backend Gemini API status on mount
  useEffect(() => {
    checkServerHealth().then(res => {
      setHasGeminiKey(res.hasGeminiKey);
    });
  }, []);

  // Listen to Firebase Auth state. Identity changes invalidate the previous
  // workspace before any Firestore data for the next account is loaded.
  useEffect(() => {
    let authChangeId = 0;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      const changeId = ++authChangeId;
      const nextSessionKey = getWorkspaceSessionKey(user);

      currentUserRef.current = user;
      workspaceSessionRef.current = nextSessionKey;
      workspaceOwnerUidRef.current = null;

      setCurrentUser(user);
      setWorkspaceSessionKey(nextSessionKey);
      setWorkspaceOwnerUid(null);
      setAuthLoading(true);
      setIsSyncing(false);
      setIsAuthModalOpen(false);

      // Clear all App-owned account-specific state immediately. Child feature
      // state is cleared by the workspaceSessionKey remount below.
      setActiveJob(null);
      setActiveAnalysis(null);
      const boundaryWorkspace = createWorkspaceBoundaryData(user);
      setUserProfile(boundaryWorkspace.profile);
      setApplications(boundaryWorkspace.applications);

      if (user && !user.isAnonymous) {
        setIsSyncing(true);
        try {
          const { profile, applications: userApps } = await initializeUserWorkspace(user);
          if (!shouldApplyWorkspaceLoad(
            changeId,
            authChangeId,
            user.uid,
            workspaceSessionRef.current,
          )) return;

          workspaceOwnerUidRef.current = user.uid;
          setWorkspaceOwnerUid(user.uid);
          setUserProfile(profile);
          setApplications(userApps);
          clearSensitiveStorage(user.uid);
        } catch (err) {
          if (changeId === authChangeId) {
            console.error('Error syncing user workspace from Firestore:', err);
          }
        } finally {
          if (changeId === authChangeId) {
            setIsSyncing(false);
            setAuthLoading(false);
          }
        }
      } else {
        // Guest sessions and logged-out state use only the non-persistent demo workspace.
        clearSensitiveStorage(user?.uid);
        setAuthLoading(false);
      }
    });

    return () => {
      authChangeId += 1;
      unsubscribe();
    };
  }, []);

  const isCurrentWorkspaceAction = (sourceSessionKey: string) =>
    isWorkspaceSessionCurrent(sourceSessionKey, workspaceSessionRef.current);

  const getPersistableUser = (sourceSessionKey: string): User | null => {
    const user = currentUserRef.current;
    return canPersistAuthenticatedWorkspace(
      user,
      workspaceOwnerUidRef.current,
      sourceSessionKey,
      workspaceSessionRef.current,
    ) ? user : null;
  };

  // Handler: Save role to tracker & Firestore
  const handleSaveToTracker = async (
    sourceSessionKey: string,
    job: JobPosting,
    analysis?: JobFitAnalysis,
    materials?: TailoredMaterials
  ) => {
    if (!isCurrentWorkspaceAction(sourceSessionKey)) return;

    const existingIndex = applications.findIndex(a => a.job.title === job.title && a.job.company === job.company);
    const recordToSave: ApplicationRecord = existingIndex >= 0
      ? {
          ...applications[existingIndex],
          fitScore: analysis?.overallScore || applications[existingIndex].fitScore,
          fitAnalysis: analysis || applications[existingIndex].fitAnalysis,
          materials: materials || applications[existingIndex].materials,
          updatedAt: new Date().toISOString()
        }
      : {
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

    setApplications(prev => {
      const currentIndex = prev.findIndex(a => a.id === recordToSave.id);
      if (currentIndex >= 0) {
        const updated = [...prev];
        updated[currentIndex] = recordToSave;
        return updated;
      }
      return [recordToSave, ...prev];
    });

    setActiveJob(job);
    if (analysis) setActiveAnalysis(analysis);

    const persistUser = getPersistableUser(sourceSessionKey);
    if (persistUser) {
      setIsSyncing(true);
      try {
        await saveApplicationToFirestore(persistUser.uid, recordToSave);
      } catch (e) {
        console.error('Failed to sync application to Firestore:', e);
      } finally {
        if (isCurrentWorkspaceAction(sourceSessionKey)) setIsSyncing(false);
      }
    }
  };

  // Handler: Update application status with dateApplied automation
  const handleUpdateApplicationStatus = async (
    sourceSessionKey: string,
    id: string,
    newStatus: ApplicationStatus,
  ) => {
    if (!isCurrentWorkspaceAction(sourceSessionKey)) return;

    const existing = applications.find(a => a.id === id);
    if (!existing) return;
    const updatedRecord: ApplicationRecord = {
      ...existing,
      status: newStatus,
      dateApplied: newStatus === 'Applied' && !existing.dateApplied ? new Date().toISOString().split('T')[0] : existing.dateApplied,
      updatedAt: new Date().toISOString()
    };
    setApplications(prev => prev.map(a => a.id === id ? updatedRecord : a));

    const persistUser = getPersistableUser(sourceSessionKey);
    if (persistUser) {
      setIsSyncing(true);
      try {
        await saveApplicationToFirestore(persistUser.uid, updatedRecord);
      } catch (e) {
        console.error('Failed to update status in Firestore:', e);
      } finally {
        if (isCurrentWorkspaceAction(sourceSessionKey)) setIsSyncing(false);
      }
    }
  };

  // Handler: Delete application
  const handleDeleteApplication = async (sourceSessionKey: string, id: string) => {
    if (!isCurrentWorkspaceAction(sourceSessionKey)) return;

    setApplications(prev => prev.filter(a => a.id !== id));

    const persistUser = getPersistableUser(sourceSessionKey);
    if (persistUser) {
      setIsSyncing(true);
      try {
        await deleteApplicationFromFirestore(persistUser.uid, id);
      } catch (e) {
        console.error('Failed to delete application in Firestore:', e);
      } finally {
        if (isCurrentWorkspaceAction(sourceSessionKey)) setIsSyncing(false);
      }
    }
  };

  // Handler: Open application in interview prep
  const handleSelectApplicationForInterview = (
    sourceSessionKey: string,
    app: ApplicationRecord,
  ) => {
    if (!isCurrentWorkspaceAction(sourceSessionKey)) return;
    setActiveJob(app.job);
    setActiveAnalysis(app.fitAnalysis || null);
    setActiveTab('interview');
  };

  // Handler: Update notes and next action
  const handleUpdateNotes = async (
    sourceSessionKey: string,
    id: string,
    notes: string,
    nextActionDate?: string,
    nextActionNote?: string,
  ) => {
    if (!isCurrentWorkspaceAction(sourceSessionKey)) return;

    const existing = applications.find(a => a.id === id);
    if (!existing) return;
    const modifiedRecord: ApplicationRecord = {
      ...existing,
      notes,
      nextFollowUpDate: nextActionDate || existing.nextFollowUpDate,
      nextActionNote: nextActionNote || existing.nextActionNote,
      updatedAt: new Date().toISOString()
    };
    setApplications(prev => prev.map(a => a.id === id ? modifiedRecord : a));

    const persistUser = getPersistableUser(sourceSessionKey);
    if (persistUser) {
      setIsSyncing(true);
      try {
        await saveApplicationToFirestore(persistUser.uid, modifiedRecord);
      } catch (e) {
        console.error('Failed to update notes in Firestore:', e);
      } finally {
        if (isCurrentWorkspaceAction(sourceSessionKey)) setIsSyncing(false);
      }
    }
  };

  // Handler: Full application record update (for interview dates, deadlines, and schedules)
  const handleUpdateApplication = async (
    sourceSessionKey: string,
    updatedApp: ApplicationRecord,
  ) => {
    if (!isCurrentWorkspaceAction(sourceSessionKey)) return;

    const recordToSave = { ...updatedApp, updatedAt: new Date().toISOString() };
    setApplications(prev => prev.map(a => a.id === updatedApp.id ? recordToSave : a));

    const persistUser = getPersistableUser(sourceSessionKey);
    if (persistUser) {
      setIsSyncing(true);
      try {
        await saveApplicationToFirestore(persistUser.uid, recordToSave);
      } catch (e) {
        console.error('Failed to update application in Firestore:', e);
      } finally {
        if (isCurrentWorkspaceAction(sourceSessionKey)) setIsSyncing(false);
      }
    }
  };

  // Handler: Update profile in state and Firestore
  const handleUpdateProfile = async (
    sourceSessionKey: string,
    updated: UserProfile,
  ) => {
    if (!isCurrentWorkspaceAction(sourceSessionKey)) return;

    setUserProfile(updated);

    const persistUser = getPersistableUser(sourceSessionKey);
    if (persistUser) {
      setIsSyncing(true);
      try {
        await saveUserProfileToFirestore(persistUser.uid, updated);
      } catch (e) {
        console.error('Failed to save profile in Firestore:', e);
      } finally {
        if (isCurrentWorkspaceAction(sourceSessionKey)) setIsSyncing(false);
      }
    }
  };

  // Handler: Logout. Invalidate the current workspace before the async sign-out
  // completes so no stale child callback can mutate or persist account data.
  const handleLogout = async () => {
    const pendingSessionKey = AUTH_PENDING_WORKSPACE_SESSION;
    workspaceSessionRef.current = pendingSessionKey;
    workspaceOwnerUidRef.current = null;
    setWorkspaceSessionKey(pendingSessionKey);
    setWorkspaceOwnerUid(null);
    setAuthLoading(true);
    setActiveJob(null);
    setActiveAnalysis(null);
    setUserProfile(createBlankUserProfile());
    setApplications([]);

    try {
      clearSensitiveStorage(currentUserRef.current?.uid);
      await logoutUser();
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  const openAuth = (mode: 'signin' | 'signup' = 'signin') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const isDemoWorkspace = !currentUser || currentUser.isAnonymous;

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
      {isDemoWorkspace && !authLoading && (
        <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white border-b border-indigo-800/40 py-2.5 px-4">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
              <span className="font-medium text-slate-200">
                <strong>Demo workspace — sample data, not part of your profile.</strong>{' '}
                Changes are temporary and are not saved to a personal workspace.
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

      {/* Main Content Area. Authenticated transitions render a safe loading state
          instead of the previous account while the next workspace is loading. */}
      <main
        key={workspaceSessionKey}
        className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6"
      >
        {authLoading ? (
          <div className="min-h-[45vh] flex items-center justify-center">
            <div className="text-center space-y-2" role="status" aria-live="polite">
              <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto" />
              <p className="text-sm font-medium text-slate-600">Loading secure workspace…</p>
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'analyzer' && (
              <JobAnalyzerView
                userProfile={userProfile}
                onSaveToTracker={(job, analysis, materials) =>
                  handleSaveToTracker(workspaceSessionKey, job, analysis, materials)
                }
                onOpenInterviewPrep={(job, analysis) => {
                  if (!isCurrentWorkspaceAction(workspaceSessionKey)) return;
                  setActiveJob(job);
                  if (analysis) setActiveAnalysis(analysis);
                  setActiveTab('interview');
                }}
              />
            )}

            {activeTab === 'pipeline' && (
              <ApplicationTrackerView
                applications={applications}
                onUpdateApplicationStatus={(id, status) =>
                  handleUpdateApplicationStatus(workspaceSessionKey, id, status)
                }
                onDeleteApplication={(id) =>
                  handleDeleteApplication(workspaceSessionKey, id)
                }
                onSelectApplicationForInterview={(app) =>
                  handleSelectApplicationForInterview(workspaceSessionKey, app)
                }
                onOpenNewJobAnalysis={() => {
                  if (isCurrentWorkspaceAction(workspaceSessionKey)) setActiveTab('analyzer');
                }}
                onUpdateNotes={(id, notes, nextActionDate, nextActionNote) =>
                  handleUpdateNotes(
                    workspaceSessionKey,
                    id,
                    notes,
                    nextActionDate,
                    nextActionNote,
                  )
                }
              />
            )}

            {activeTab === 'interview' && (
              <InterviewStudioView
                applications={applications}
                activeJob={activeJob}
                activeAnalysis={activeAnalysis}
                userProfile={userProfile}
                onUpdateApplication={(app) =>
                  handleUpdateApplication(workspaceSessionKey, app)
                }
                onSelectJob={(job, analysis) => {
                  if (!isCurrentWorkspaceAction(workspaceSessionKey)) return;
                  setActiveJob(job);
                  setActiveAnalysis(analysis || null);
                }}
              />
            )}

            {activeTab === 'vault' && (
              <VerifiedProfileVaultView
                userProfile={userProfile}
                onUpdateProfile={(updated) =>
                  handleUpdateProfile(workspaceSessionKey, updated)
                }
              />
            )}
          </>
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
            <span>Profile Evidence &amp; AI-Assisted Workflow</span>
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
