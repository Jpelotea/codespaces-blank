import {
  UserProfile,
  JobFitAnalysis,
  TailoredMaterials,
  InterviewPrepPlan,
  FollowUpDraft
} from '../types';
import { auth, loginAsGuest } from '../lib/firebase';

export async function checkServerHealth(): Promise<{ status: string; hasGeminiKey: boolean }> {
  try {
    const res = await fetch('/api/health');
    if (!res.ok) throw new Error('Health check failed');
    return await res.json();
  } catch (err) {
    console.warn('Backend health check error, running in fallback mode', err);
    return { status: 'fallback', hasGeminiKey: false };
  }
}

/**
 * Ensures user has an active Firebase Auth session (signing in anonymously if needed)
 * and retrieves a valid JWT ID Token for secure backend API calls.
 */
async function getAuthHeader(): Promise<Record<string, string>> {
  try {
    let user = auth.currentUser;
    if (!user) {
      try {
        user = await loginAsGuest();
      } catch (err) {
        console.warn('Could not establish guest auth session:', err);
      }
    }
    if (user) {
      const token = await user.getIdToken();
      return { Authorization: `Bearer ${token}` };
    }
  } catch (err) {
    console.warn('Failed to retrieve authentication token for API request:', err);
  }
  return {};
}

export async function analyzeJobFit(
  jobDescription: string,
  jobTitle: string,
  company: string,
  userProfile: UserProfile,
  signal?: AbortSignal
): Promise<JobFitAnalysis> {
  const authHeader = await getAuthHeader();
  const res = await fetch('/api/analyze-job', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader
    },
    body: JSON.stringify({
      jobDescription,
      jobTitle,
      company,
      userProfile
    }),
    signal
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to analyze job fit (${res.status})`);
  }
  return await res.json();
}

export async function generateTailoredMaterials(
  jobDescription: string,
  jobTitle: string,
  company: string,
  userProfile: UserProfile,
  pitchType: 'executive_formal' | 'conversational_modern' | 'upwork_proposal' | 'direct_inbound',
  signal?: AbortSignal
): Promise<TailoredMaterials> {
  const authHeader = await getAuthHeader();
  const res = await fetch('/api/generate-materials', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader
    },
    body: JSON.stringify({
      jobDescription,
      jobTitle,
      company,
      userProfile,
      pitchType
    }),
    signal
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to generate tailored materials (${res.status})`);
  }
  return await res.json();
}

export async function generateInterviewPrep(
  jobDescription: string,
  jobTitle: string,
  company: string,
  userProfile: UserProfile,
  fitAnalysis?: JobFitAnalysis,
  signal?: AbortSignal
): Promise<InterviewPrepPlan> {
  const authHeader = await getAuthHeader();
  const res = await fetch('/api/interview-prep', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader
    },
    body: JSON.stringify({
      jobDescription,
      jobTitle,
      company,
      userProfile,
      fitAnalysis
    }),
    signal
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to generate interview prep plan (${res.status})`);
  }
  return await res.json();
}

export async function generateFollowUpDraft(
  stage: string,
  jobTitle: string,
  company: string,
  recipientName: string,
  userProfile: UserProfile,
  customNotes?: string,
  signal?: AbortSignal
): Promise<FollowUpDraft> {
  const authHeader = await getAuthHeader();
  const res = await fetch('/api/followup-draft', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader
    },
    body: JSON.stringify({
      stage,
      jobTitle,
      company,
      recipientName,
      userProfile,
      customNotes
    }),
    signal
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to generate follow-up draft (${res.status})`);
  }
  return await res.json();
}
