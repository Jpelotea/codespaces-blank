import React, { useState } from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  Send, 
  ExternalLink, 
  RotateCw, 
  PlusCircle, 
  ArrowRight, 
  Percent, 
  Target, 
  Cpu, 
  Globe2, 
  ShieldAlert, 
  Copy, 
  Check, 
  BookOpen, 
  Wand2,
  FolderGit2
} from 'lucide-react';
import { 
  JobPosting, 
  JobFitAnalysis, 
  TailoredMaterials, 
  UserProfile, 
  ApplicationRecord 
} from '../types';
import { SAMPLE_JOB_PRESETS } from '../data/sampleJobs';
import { analyzeJobFit, generateTailoredMaterials } from '../services/api';

interface JobAnalyzerViewProps {
  userProfile: UserProfile;
  onSaveToTracker: (job: JobPosting, analysis?: JobFitAnalysis, materials?: TailoredMaterials) => void;
  onOpenInterviewPrep: (job: JobPosting, analysis?: JobFitAnalysis) => void;
}

export const JobAnalyzerView: React.FC<JobAnalyzerViewProps> = ({
  userProfile,
  onSaveToTracker,
  onOpenInterviewPrep
}) => {
  // Input form states
  const [jobTitle, setJobTitle] = useState(SAMPLE_JOB_PRESETS[0].title);
  const [company, setCompany] = useState(SAMPLE_JOB_PRESETS[0].company);
  const [location, setLocation] = useState(SAMPLE_JOB_PRESETS[0].location);
  const [salaryOrRate, setSalaryOrRate] = useState(SAMPLE_JOB_PRESETS[0].salaryOrRate);
  const [sourceUrl, setSourceUrl] = useState(SAMPLE_JOB_PRESETS[0].sourceUrl || '');
  const [roleType, setRoleType] = useState<JobPosting['roleType']>(SAMPLE_JOB_PRESETS[0].roleType);
  const [description, setDescription] = useState(SAMPLE_JOB_PRESETS[0].description);

  // Analysis & Materials states
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingMaterials, setIsGeneratingMaterials] = useState(false);
  const [pitchType, setPitchType] = useState<'executive_formal' | 'conversational_modern' | 'upwork_proposal' | 'direct_inbound'>('executive_formal');
  const [analysis, setAnalysis] = useState<JobFitAnalysis | null>(null);
  const [materials, setMaterials] = useState<TailoredMaterials | null>(null);
  const [activeMaterialTab, setActiveMaterialTab] = useState<'resume' | 'coverLetter' | 'screeningAnswers'>('resume');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Load a preset
  const handleLoadPreset = (presetId: string) => {
    const preset = SAMPLE_JOB_PRESETS.find(p => p.id === presetId);
    if (preset) {
      setJobTitle(preset.title);
      setCompany(preset.company);
      setLocation(preset.location);
      setSalaryOrRate(preset.salaryOrRate);
      setSourceUrl(preset.sourceUrl || '');
      setRoleType(preset.roleType);
      setDescription(preset.description);
      setAnalysis(null);
      setMaterials(null);
      setErrorNotice(null);
      setSavedSuccess(false);
    }
  };

  // Run job fit analysis
  const handleRunAnalysis = async () => {
    if (!description.trim()) {
      setErrorNotice('Please provide a job description to analyze.');
      return;
    }
    setErrorNotice(null);
    setIsAnalyzing(true);
    try {
      const result = await analyzeJobFit(description, jobTitle, company, userProfile);
      setAnalysis(result);
    } catch (err: any) {
      console.error(err);
      setErrorNotice(err.message || 'Failed to analyze job fit. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Generate tailored materials
  const handleGenerateMaterials = async () => {
    setIsGeneratingMaterials(true);
    setErrorNotice(null);
    try {
      const result = await generateTailoredMaterials(
        description,
        jobTitle,
        company,
        userProfile,
        pitchType
      );
      setMaterials(result);
    } catch (err: any) {
      console.error(err);
      setErrorNotice(err.message || 'Failed to generate tailored materials.');
    } finally {
      setIsGeneratingMaterials(false);
    }
  };

  // Copy helper
  const copyToClipboard = (text: string, sectionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    setTimeout(() => setCopiedSection(null), 2500);
  };

  // Save to application tracker
  const handleSave = () => {
    const currentJob: JobPosting = {
      id: `job-${Date.now()}`,
      title: jobTitle || 'Target Role',
      company: company || 'Company',
      location: location || 'Remote',
      roleType,
      employmentType: 'Full-time',
      salaryOrRate,
      sourceUrl,
      description,
      parsedRequirements: analysis?.strengths.map(s => s.requirement) || [],
      detectedTechStack: []
    };

    onSaveToTracker(currentJob, analysis || undefined, materials || undefined);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Role presets */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-sm relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            Verified Job-Fit Match & AI Tailor Engine
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
            Target Job Analysis & Tailored Application Hub
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-4">
            Paste any job description or select a role template. The copilot cross-references your verified experience vault, calculates a factual match score, identifies gaps with honest bridge strategies, and crafts tailored resume bullets, cover letters, and screening answers—without ever inventing qualifications.
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs font-medium text-slate-400 mr-1">Quick Role Presets:</span>
            {SAMPLE_JOB_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handleLoadPreset(preset.id)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>{preset.title.split(' to ')[0]}</span>
                <span className="text-[10px] text-slate-400">({preset.company})</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {errorNotice && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{errorNotice}</span>
          </div>
          <button onClick={() => setErrorNotice(null)} className="text-xs text-red-600 hover:underline">Dismiss</button>
        </div>
      )}

      {/* Main Grid: Input Card vs Analysis/Tailor Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Job Description & Posting Details (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              <h2 className="font-semibold text-slate-900 text-base">Job Posting Details</h2>
            </div>
            <span className="text-xs text-slate-500">Inputs & Description</span>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Job Title *</label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g. Executive Assistant to CEO"
                  className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Company *</label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. Aura Health AI"
                  className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Role Track</label>
                <select
                  value={roleType}
                  onChange={(e) => setRoleType(e.target.value as any)}
                  className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="Executive Assistant">Executive Assistant</option>
                  <option value="Business Operations">Business Operations</option>
                  <option value="Virtual Assistant">Virtual Assistant</option>
                  <option value="AI Workflow">AI Workflow Specialist</option>
                  <option value="Other">General / Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Salary or Hourly Rate</label>
                <input
                  type="text"
                  value={salaryOrRate}
                  onChange={(e) => setSalaryOrRate(e.target.value)}
                  placeholder="e.g. $75k - $85k or $40/hr"
                  className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Location / Timezone</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Remote (PST/EST overlap)"
                  className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Posting URL (Optional)</label>
                <input
                  type="text"
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-slate-700">
                  Full Job Description / Requirements *
                </label>
                <span className="text-[11px] text-slate-400">{description.length} characters</span>
              </div>
              <textarea
                rows={10}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Paste the full job posting requirements, responsibilities, and qualifications here..."
                className="w-full text-xs font-mono px-3 py-2.5 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 leading-relaxed bg-slate-50/50"
              />
            </div>
          </div>

          {/* Action Trigger Buttons */}
          <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
            <button
              id="run-analysis-btn"
              onClick={handleRunAnalysis}
              disabled={isAnalyzing}
              className="w-full py-2.5 px-4 rounded-xl font-medium text-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              {isAnalyzing ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin text-white" />
                  <span>Evaluating Fit Against Verified Vault...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-indigo-200" />
                  <span>Analyze Job Fit & Strengths</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-between text-xs text-slate-500 px-1">
              <span className="flex items-center gap-1 text-emerald-700 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Vault: {userProfile.workExperiences.length} verified roles, {userProfile.portfolioProjects.length} projects
              </span>
              <span>Zero Hallucination</span>
            </div>
          </div>
        </div>

        {/* Right Column: Analysis Verdict, Match Breakdown & Tailored Materials (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {!analysis && !isAnalyzing ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
                <Target className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">Ready for Job Fit Analysis</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
                Click <strong>"Analyze Job Fit & Strengths"</strong> to calculate your match score, map exact verified achievements to the job requirements, and detect any gaps with an honest bridge strategy.
              </p>
              <button
                onClick={handleRunAnalysis}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 transition cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-indigo-400" />
                Analyze This Role
              </button>
            </div>
          ) : null}

          {isAnalyzing && (
            <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-4">
              <div className="w-12 h-12 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin mx-auto" />
              <div className="space-y-1">
                <h4 className="font-semibold text-slate-900 text-base">Running Ground-Truth Match Engine</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Cross-referencing {userProfile.workExperiences.length} work histories, {userProfile.portfolioProjects.length} portfolio items, and verified operational skills against job requirements...
                </p>
              </div>
            </div>
          )}

          {/* Analysis Results View */}
          {analysis && !isAnalyzing && (
            <div className="space-y-5">
              {/* Overall Score Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                        Match Score
                      </span>
                      <span className="text-xs font-medium text-slate-500">
                        {analysis.overallScore >= 85 ? 'High Probability Match' : 'Moderate Alignment'}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-3xl font-extrabold text-slate-900">
                        {analysis.overallScore}
                      </span>
                      <span className="text-slate-400 font-medium">/ 100</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSave}
                      id="save-to-tracker-btn"
                      className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      {savedSuccess ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Saved to Tracker!</span>
                        </>
                      ) : (
                        <>
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>Track Application</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => {
                        const currentJob: JobPosting = {
                          id: `job-${Date.now()}`,
                          title: jobTitle,
                          company,
                          location,
                          roleType,
                          employmentType: 'Full-time',
                          salaryOrRate,
                          sourceUrl,
                          description,
                          parsedRequirements: [],
                          detectedTechStack: []
                        };
                        onOpenInterviewPrep(currentJob, analysis);
                      }}
                      className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Prep for Interview</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Score Breakdown Bars */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 border-b border-slate-100">
                  <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                    <div className="text-[11px] text-slate-500 font-medium">Experience</div>
                    <div className="text-sm font-bold text-slate-900">{analysis.scores.experienceAlignment}%</div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 mt-1.5">
                      <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: `${analysis.scores.experienceAlignment}%` }} />
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                    <div className="text-[11px] text-slate-500 font-medium">Skill Relevance</div>
                    <div className="text-sm font-bold text-slate-900">{analysis.scores.skillRelevance}%</div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 mt-1.5">
                      <div className="bg-emerald-600 h-1.5 rounded-full" style={{ width: `${analysis.scores.skillRelevance}%` }} />
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                    <div className="text-[11px] text-slate-500 font-medium">Tools & AI Ops</div>
                    <div className="text-sm font-bold text-slate-900">{analysis.scores.toolCompetency}%</div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 mt-1.5">
                      <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${analysis.scores.toolCompetency}%` }} />
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                    <div className="text-[11px] text-slate-500 font-medium">Remote Readiness</div>
                    <div className="text-sm font-bold text-slate-900">{analysis.scores.remoteReadiness}%</div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 mt-1.5">
                      <div className="bg-purple-600 h-1.5 rounded-full" style={{ width: `${analysis.scores.remoteReadiness}%` }} />
                    </div>
                  </div>
                </div>

                {/* Verdict Summary */}
                <div className="pt-3 text-xs text-slate-700 leading-relaxed">
                  <p className="font-medium text-slate-900 mb-1">Copilot Verdict:</p>
                  <p>{analysis.verdictSummary}</p>
                </div>
              </div>

              {/* Strengths & Gap Analysis Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Verified Strengths */}
                <div className="bg-white rounded-2xl border border-emerald-200 p-4 shadow-xs">
                  <div className="flex items-center gap-2 text-emerald-800 font-semibold text-sm mb-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Verified Strengths ({analysis.strengths.length})</span>
                  </div>
                  <div className="space-y-3">
                    {analysis.strengths.map((s, idx) => (
                      <div key={idx} className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-3 text-xs space-y-1">
                        <div className="font-semibold text-slate-900">
                          Role Need: "{s.requirement}"
                        </div>
                        <div className="text-emerald-900 font-medium">
                          ✓ {s.matchingExperience}
                        </div>
                        <div className="text-[10px] text-emerald-700 pt-0.5">
                          Source: {s.sourceContext}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Gaps & Honest Bridge Strategies */}
                <div className="bg-white rounded-2xl border border-amber-200 p-4 shadow-xs">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-amber-800 font-semibold text-sm">
                      <ShieldAlert className="w-4 h-4 text-amber-600" />
                      <span>Identified Gaps ({analysis.gaps.length})</span>
                    </div>
                    <span className="text-[10px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                      Zero-Hallucination Policy
                    </span>
                  </div>
                  <div className="space-y-3">
                    {analysis.gaps.map((g, idx) => (
                      <div key={idx} className="bg-amber-50/60 border border-amber-100 rounded-xl p-3 text-xs space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-900">{g.gap}</span>
                          <span className={`text-[10px] font-medium px-1.5 py-0.2 rounded-full ${
                            g.severity === 'High' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {g.severity} Gap
                          </span>
                        </div>
                        <div className="text-slate-700 bg-white/80 p-2 rounded-lg border border-amber-200/60">
                          <strong className="text-amber-900">Honest Bridge Strategy: </strong>
                          {g.honestBridgeStrategy}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recommended Portfolio Deliverables */}
              {analysis.recommendedProjects && analysis.recommendedProjects.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
                  <div className="flex items-center gap-2 font-semibold text-slate-900 text-sm mb-3">
                    <FolderGit2 className="w-4 h-4 text-indigo-600" />
                    <span>Recommended Portfolio Projects to Attach</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {analysis.recommendedProjects.map((p, idx) => (
                      <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-1">
                        <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                          {p.projectTitle}
                        </div>
                        <div className="text-slate-600 leading-relaxed">
                          {p.whyRelevant}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Strategic Advice */}
              {analysis.strategicAdvice && analysis.strategicAdvice.length > 0 && (
                <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 text-xs space-y-2">
                  <div className="font-semibold text-indigo-900 text-sm flex items-center gap-1.5">
                    <Wand2 className="w-4 h-4 text-indigo-600" />
                    Strategic Next Steps For This Application
                  </div>
                  <ul className="space-y-1 text-indigo-950 list-disc list-inside">
                    {analysis.strategicAdvice.map((adv, idx) => (
                      <li key={idx} className="leading-relaxed">{adv}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Tailored Materials Generator Bar */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">Tailored Application Materials</h3>
                    <p className="text-xs text-slate-500">
                      Craft role-tailored resume bullets, cover letters, and screening answers using verified proof points.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={pitchType}
                      onChange={(e) => setPitchType(e.target.value as any)}
                      className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-medium text-slate-700"
                    >
                      <option value="executive_formal">Executive Formal Pitch</option>
                      <option value="conversational_modern">Modern Tech Startup</option>
                      <option value="upwork_proposal">Upwork / Freelance Proposal</option>
                      <option value="direct_inbound">Direct LinkedIn Outreach</option>
                    </select>

                    <button
                      id="generate-materials-btn"
                      onClick={handleGenerateMaterials}
                      disabled={isGeneratingMaterials}
                      className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white transition flex items-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap"
                    >
                      {isGeneratingMaterials ? (
                        <>
                          <RotateCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Generating...</span>
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-3.5 h-3.5 text-indigo-200" />
                          <span>{materials ? 'Regenerate Materials' : 'Generate Tailored Materials'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Materials Viewer Tabs */}
                {materials && (
                  <div className="space-y-4 pt-1">
                    <div className="flex border-b border-slate-200 text-xs font-medium">
                      <button
                        onClick={() => setActiveMaterialTab('resume')}
                        className={`pb-2 px-3 border-b-2 font-semibold cursor-pointer transition ${
                          activeMaterialTab === 'resume'
                            ? 'border-indigo-600 text-indigo-700'
                            : 'border-transparent text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        Targeted Resume Content
                      </button>
                      <button
                        onClick={() => setActiveMaterialTab('coverLetter')}
                        className={`pb-2 px-3 border-b-2 font-semibold cursor-pointer transition ${
                          activeMaterialTab === 'coverLetter'
                            ? 'border-indigo-600 text-indigo-700'
                            : 'border-transparent text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        Cover Letter / Pitch
                      </button>
                      <button
                        onClick={() => setActiveMaterialTab('screeningAnswers')}
                        className={`pb-2 px-3 border-b-2 font-semibold cursor-pointer transition ${
                          activeMaterialTab === 'screeningAnswers'
                            ? 'border-indigo-600 text-indigo-700'
                            : 'border-transparent text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        Application Screening Answers ({materials.screeningAnswers.length})
                      </button>
                    </div>

                    {/* Tab 1: Resume */}
                    {activeMaterialTab === 'resume' && (
                      <div className="space-y-4 text-xs">
                        <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
                          <div>
                            <span className="font-semibold text-slate-900 block">Targeted Professional Summary</span>
                            <p className="text-slate-700 mt-1 leading-relaxed">
                              {materials.resume.targetedSummary}
                            </p>
                          </div>
                          <button
                            onClick={() => copyToClipboard(materials.resume.targetedSummary, 'summary')}
                            className="ml-3 p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-200/60 transition"
                            title="Copy summary"
                          >
                            {copiedSection === 'summary' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>

                        <div>
                          <span className="font-semibold text-slate-900 block mb-1.5">Top Core Competencies for this Role</span>
                          <div className="flex flex-wrap gap-1.5">
                            {materials.resume.highlightedCoreSkills.map((sk, idx) => (
                              <span key={idx} className="px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100 font-medium">
                                {sk}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div>
                          <span className="font-semibold text-slate-900 block mb-2">Role-Aligned Verified Bullet Points</span>
                          <div className="space-y-3">
                            {materials.resume.alignedRoleBullets.map((item, idx) => (
                              <div key={idx} className="border border-slate-200 rounded-xl p-3 bg-white space-y-1.5">
                                <div className="flex items-center justify-between font-semibold text-slate-800">
                                  <span>{item.roleTitle} — {item.company}</span>
                                  <button
                                    onClick={() => copyToClipboard(item.bullets.map(b => `• ${b}`).join('\n'), `role-${idx}`)}
                                    className="text-slate-400 hover:text-slate-700 p-1"
                                    title="Copy role bullets"
                                  >
                                    {copiedSection === `role-${idx}` ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                  </button>
                                </div>
                                <ul className="space-y-1 text-slate-600 list-disc list-inside">
                                  {item.bullets.map((b, bIdx) => (
                                    <li key={bIdx} className="leading-relaxed">{b}</li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                          </div>
                        </div>

                        {materials.resume.atsKeywords && (
                          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                            <strong>ATS Keywords Detected: </strong>
                            {materials.resume.atsKeywords.join(', ')}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Tab 2: Cover Letter */}
                    {activeMaterialTab === 'coverLetter' && (
                      <div className="space-y-3 text-xs">
                        <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                          <div className="font-semibold text-slate-800 truncate">
                            Subject: {materials.coverLetter.subjectLine}
                          </div>
                          <button
                            onClick={() => copyToClipboard(`${materials.coverLetter.subjectLine}\n\n${materials.coverLetter.letterBody}`, 'coverletter')}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium text-xs shadow-2xs"
                          >
                            {copiedSection === 'coverletter' ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy Full Letter</span>
                              </>
                            )}
                          </button>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 font-sans whitespace-pre-wrap leading-relaxed">
                          {materials.coverLetter.letterBody}
                        </div>
                      </div>
                    )}

                    {/* Tab 3: Screening Answers */}
                    {activeMaterialTab === 'screeningAnswers' && (
                      <div className="space-y-3 text-xs">
                        {materials.screeningAnswers.map((ans, idx) => (
                          <div key={idx} className="border border-slate-200 rounded-xl p-3.5 bg-white space-y-2">
                            <div className="flex items-start justify-between gap-3">
                              <span className="font-bold text-slate-900 text-xs">
                                Q: {ans.question}
                              </span>
                              <button
                                onClick={() => copyToClipboard(ans.tailoredAnswer, `ans-${idx}`)}
                                className="text-slate-400 hover:text-slate-700 p-1 shrink-0"
                                title="Copy answer"
                              >
                                {copiedSection === `ans-${idx}` ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                            <div className="p-2.5 rounded-lg bg-slate-50 text-slate-800 leading-relaxed border border-slate-100">
                              {ans.tailoredAnswer}
                            </div>
                            <div className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Verified Basis: {ans.verifiedBackingDetail}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
