import {
  UserProfile,
  JobFitAnalysis,
  TailoredMaterials,
  InterviewPrepPlan,
  FollowUpDraft
} from '../types';
import { auth } from '../lib/firebase';

const API_TIMEOUT_MS = 115 * 1000;

async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit = {},
  externalSignal?: AbortSignal,
  timeoutMs: number = API_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(new Error('Request timed out')), timeoutMs);
  const abortExternalRequest = () => controller.abort(externalSignal?.reason);

  if (externalSignal) {
    if (externalSignal.aborted) abortExternalRequest();
    else externalSignal.addEventListener('abort', abortExternalRequest, { once: true });
  }

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    window.clearTimeout(timeoutId);
    externalSignal?.removeEventListener('abort', abortExternalRequest);
  }
}

export async function checkServerHealth(): Promise<{ status: string; hasGeminiKey: boolean }> {
  try {
    const res = await fetchWithTimeout('/api/health', {}, undefined, 10000);
    if (!res.ok) throw new Error('Health check failed');
    return await res.json();
  } catch (err) {
    console.warn('Backend health check error, running in fallback mode', err);
    return { status: 'fallback', hasGeminiKey: false };
  }
}

/**
 * Retrieves a valid JWT ID Token only for authenticated users.
 * Guest sessions are intentionally not upgraded to anonymous API access.
 */
async function getAuthHeader(): Promise<Record<string, string>> {
  try {
    const user = auth.currentUser;
    if (!user || user.isAnonymous) {
      console.warn('No persistent authenticated Firebase user is available for API access.');
      return {};
    }

    const token = await user.getIdToken();
    return { Authorization: `Bearer ${token}` };
  } catch (err) {
    console.warn('Failed to retrieve authentication token for API request:', err);
    return {};
  }
}

export async function analyzeJobFit(
  jobDescription: string,
  jobTitle: string,
  company: string,
  userProfile: UserProfile,
  signal?: AbortSignal
): Promise<JobFitAnalysis> {
  const authHeader = await getAuthHeader();
  const res = await fetchWithTimeout('/api/analyze-job', {
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
  const res = await fetchWithTimeout('/api/generate-materials', {
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
  const res = await fetchWithTimeout('/api/interview-prep', {
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
  const res = await fetchWithTimeout('/api/followup-draft', {
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
