import React, { useState } from 'react';
import { 
  UserCheck, 
  ShieldCheck, 
  Plus, 
  Edit3, 
  Trash2, 
  Briefcase, 
  Sparkles, 
  FolderGit2, 
  MessageSquare, 
  Save, 
  Check,
  AlertCircle
} from 'lucide-react';
import { 
  UserProfile, 
  WorkExperience, 
  SkillCategory, 
  PortfolioProject, 
  ApplicationAnswerBankItem 
} from '../types';
import {
  addDraftSkillToCategories,
  applyMaterialProfileEdit,
  createDraftExperience,
  createDraftProject,
  createDraftSkill,
  parseOptionalYears
} from '../lib/vaultData';

interface VerifiedProfileVaultViewProps {
  userProfile: UserProfile;
  onUpdateProfile: (updated: UserProfile) => void;
}

export const VerifiedProfileVaultView: React.FC<VerifiedProfileVaultViewProps> = ({
  userProfile,
  onUpdateProfile
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'experience' | 'skills' | 'portfolio' | 'answerBank'>('experience');
  const [profileState, setProfileState] = useState<UserProfile>(userProfile);
  const [isSavedNotice, setIsSavedNotice] = useState(false);

  // New Experience Modal / Inline Form
  const [showAddExp, setShowAddExp] = useState(false);
  const [newRoleTitle, setNewRoleTitle] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newPeriod, setNewPeriod] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newAchievementsText, setNewAchievementsText] = useState('');
  const [newToolsText, setNewToolsText] = useState('');
  const [newIsRemote, setNewIsRemote] = useState<'' | 'remote' | 'onsite'>('');
  const [newRoleType, setNewRoleType] = useState<'' | WorkExperience['roleType']>('');

  // New Project Form
  const [showAddProject, setShowAddProject] = useState(false);
  const [newProjTitle, setNewProjTitle] = useState('');
  const [newProjDesc, setNewProjDesc] = useState('');
  const [newProjMetric, setNewProjMetric] = useState('');
  const [newProjTools, setNewProjTools] = useState('');
  const [newProjCategory, setNewProjCategory] = useState<'' | PortfolioProject['roleCategory']>('');
  const [newProjDeliverable, setNewProjDeliverable] = useState('');

  // New Skill Form
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillCategory, setNewSkillCategory] = useState('');
  const [newSkillCategoryName, setNewSkillCategoryName] = useState('');
  const [newSkillLevel, setNewSkillLevel] = useState<'' | 'Expert' | 'Proficient' | 'Familiar'>('');
  const [newSkillYears, setNewSkillYears] = useState('');

  // Trigger save to the authenticated workspace
  const handleSaveAll = () => {
    onUpdateProfile(profileState);
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 2500);
  };

  // Add new experience
  const handleAddExperience = () => {
    if (!newRoleTitle.trim() || !newCompany.trim() || !newPeriod.trim() || !newIsRemote || !newRoleType) return;
    const achievements = newAchievementsText
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);
    const tools = newToolsText
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const newExp = createDraftExperience({
      id: `exp-${Date.now()}`,
      title: newRoleTitle,
      company: newCompany,
      period: newPeriod,
      isRemote: newIsRemote === 'remote',
      roleType: newRoleType,
      description: newDescription,
      achievements,
      tools
    });

    const updated = {
      ...profileState,
      workExperiences: [newExp, ...profileState.workExperiences]
    };
    setProfileState(updated);
    onUpdateProfile(updated);
    setShowAddExp(false);
    setNewRoleTitle('');
    setNewCompany('');
    setNewPeriod('');
    setNewDescription('');
    setNewAchievementsText('');
    setNewToolsText('');
    setNewIsRemote('');
    setNewRoleType('');
  };

  // Remove experience
  const handleRemoveExp = (id: string) => {
    const updated = {
      ...profileState,
      workExperiences: profileState.workExperiences.filter(e => e.id !== id)
    };
    setProfileState(updated);
    onUpdateProfile(updated);
  };

  // Add new project
  const handleAddProject = () => {
    if (!newProjTitle.trim() || !newProjCategory) return;
    const tools = newProjTools.split(',').map(s => s.trim()).filter(Boolean);
    const newProj = createDraftProject({
      id: `proj-${Date.now()}`,
      title: newProjTitle,
      roleCategory: newProjCategory,
      description: newProjDesc,
      impactMetric: newProjMetric,
      tools,
      deliverable: newProjDeliverable
    });
    const updated = {
      ...profileState,
      portfolioProjects: [newProj, ...profileState.portfolioProjects]
    };
    setProfileState(updated);
    onUpdateProfile(updated);
    setShowAddProject(false);
    setNewProjTitle('');
    setNewProjDesc('');
    setNewProjMetric('');
    setNewProjTools('');
    setNewProjCategory('');
    setNewProjDeliverable('');
  };

  // Remove project
  const handleRemoveProject = (id: string) => {
    const updated = {
      ...profileState,
      portfolioProjects: profileState.portfolioProjects.filter(p => p.id !== id)
    };
    setProfileState(updated);
    onUpdateProfile(updated);
  };

  // Add new skill
  const handleAddSkill = () => {
    const isNewCategory = newSkillCategory === '__new__' || profileState.skillCategories.length === 0;
    if (!newSkillName.trim() || !newSkillLevel || (!isNewCategory && !newSkillCategory) || (isNewCategory && !newSkillCategoryName.trim())) return;
    const skill = createDraftSkill({
      name: newSkillName,
      level: newSkillLevel,
      yearsExperience: parseOptionalYears(newSkillYears)
    });
    const updatedCategories = addDraftSkillToCategories(profileState.skillCategories, skill, isNewCategory
      ? {
          newCategoryId: `cat-${Date.now()}`,
          newCategoryName: newSkillCategoryName
        }
      : { categoryId: newSkillCategory });
    const updated = { ...profileState, skillCategories: updatedCategories };
    setProfileState(updated);
    onUpdateProfile(updated);
    setNewSkillName('');
    setNewSkillCategory('');
    setNewSkillCategoryName('');
    setNewSkillLevel('');
    setNewSkillYears('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Strict Grounding Directive */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1 max-w-2xl">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Verified Professional Vault & Ground Truth
            </h2>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Anti-Hallucination Safe
            </span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            All AI tailoring, resume bullet generation, and interview guidance are strictly constrained to the items below. The Copilot will never fabricate experience, employers, or metrics you have not verified here.
          </p>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto">
          <button
            onClick={handleSaveAll}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-xs"
          >
            {isSavedNotice ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Saved!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4 text-slate-300" />
                <span>Save Vault</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto space-x-2">
        <button
          onClick={() => setActiveTab('experience')}
          className={`pb-3 px-3 text-xs font-semibold border-b-2 transition whitespace-nowrap cursor-pointer ${
            activeTab === 'experience'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Briefcase className="w-4 h-4" />
            Work Experience ({profileState.workExperiences.length})
          </span>
        </button>

        <button
          onClick={() => setActiveTab('skills')}
          className={`pb-3 px-3 text-xs font-semibold border-b-2 transition whitespace-nowrap cursor-pointer ${
            activeTab === 'skills'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" />
            Skills Library ({profileState.skillCategories.reduce((acc, c) => acc + c.skills.length, 0)})
          </span>
        </button>

        <button
          onClick={() => setActiveTab('portfolio')}
          className={`pb-3 px-3 text-xs font-semibold border-b-2 transition whitespace-nowrap cursor-pointer ${
            activeTab === 'portfolio'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <FolderGit2 className="w-4 h-4" />
            Portfolio Projects & Deliverables ({profileState.portfolioProjects.length})
          </span>
        </button>

        <button
          onClick={() => setActiveTab('answerBank')}
          className={`pb-3 px-3 text-xs font-semibold border-b-2 transition whitespace-nowrap cursor-pointer ${
            activeTab === 'answerBank'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4" />
            Application Answer Bank ({profileState.answerBank.length})
          </span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-3 px-3 text-xs font-semibold border-b-2 transition whitespace-nowrap cursor-pointer ${
            activeTab === 'profile'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <UserCheck className="w-4 h-4" />
            Candidate Bio & Targets
          </span>
        </button>
      </div>

      {/* Tab 1: Work Experience */}
      {activeTab === 'experience' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Roles, accomplishments, and tools you have added to your profile.
            </span>
            <button
              onClick={() => setShowAddExp(!showAddExp)}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Role</span>
            </button>
          </div>

          {showAddExp && (
            <div className="bg-white rounded-2xl border border-indigo-200 p-5 shadow-sm space-y-3">
              <h4 className="font-bold text-slate-900 text-sm">Add Experience</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Role Title</label>
                  <input
                    type="text"
                    value={newRoleTitle}
                    onChange={(e) => setNewRoleTitle(e.target.value)}
                    placeholder="e.g. Executive Assistant to Founder"
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Company / Organization</label>
                  <input
                    type="text"
                    value={newCompany}
                    onChange={(e) => setNewCompany(e.target.value)}
                    placeholder="e.g. Horizon Labs (Remote)"
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Period</label>
                  <input
                    type="text"
                    value={newPeriod}
                    onChange={(e) => setNewPeriod(e.target.value)}
                    placeholder="e.g. 2022 - Present"
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Work Arrangement</label>
                  <select
                    value={newIsRemote}
                    onChange={(e) => setNewIsRemote(e.target.value as '' | 'remote' | 'onsite')}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="">Select arrangement…</option>
                    <option value="remote">Remote</option>
                    <option value="onsite">On-site / hybrid</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Role Type</label>
                  <select
                    value={newRoleType}
                    onChange={(e) => setNewRoleType(e.target.value as '' | WorkExperience['roleType'])}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="">Select role type…</option>
                    <option value="Executive Assistant">Executive Assistant</option>
                    <option value="Business Operations">Business Operations</option>
                    <option value="Virtual Assistant">Virtual Assistant</option>
                    <option value="AI Workflow">AI Workflow</option>
                    <option value="General">General</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Short Description of Scope</label>
                <input
                  type="text"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Primary executive support or operations scope..."
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Achievements & Metrics (One per line, optional)
                </label>
                <textarea
                  rows={3}
                  value={newAchievementsText}
                  onChange={(e) => setNewAchievementsText(e.target.value)}
                  placeholder="• Managed dual executive calendars with 99% conflict-free rate...&#10;• Built Zapier automation saving 8 hours weekly..."
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Tools Used (Comma-separated)
                </label>
                <input
                  type="text"
                  value={newToolsText}
                  onChange={(e) => setNewToolsText(e.target.value)}
                  placeholder="Google Workspace, Notion, Slack, Zapier"
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => setShowAddExp(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddExperience}
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700"
                >
                  Add Experience
                </button>
              </div>
            </div>
          )}

          {/* List of existing experiences */}
          <div className="space-y-4">
            {profileState.workExperiences.length === 0 && (
              <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
                No experience added yet.
              </div>
            )}
            {profileState.workExperiences.map((exp) => (
              <div key={exp.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">{exp.title}</h3>
                    <div className="text-xs text-indigo-700 font-medium mt-0.5">
                      {exp.company} • <span className="text-slate-500 font-normal">{exp.period}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveExp(exp.id)}
                    className="p-1 text-slate-400 hover:text-red-600 rounded transition"
                    title="Remove experience"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">{exp.description}</p>

                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider block">
                    Accomplishments:
                  </span>
                  <ul className="space-y-1 text-xs text-slate-700 list-disc list-inside">
                    {exp.verifiedAchievements.map((ach, aIdx) => (
                      <li key={aIdx} className="leading-relaxed">{ach}</li>
                    ))}
                  </ul>
                </div>

                <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1.5">
                  {exp.toolsUsed.map((tool, tIdx) => (
                    <span key={tIdx} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium">
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Skills Library */}
      {activeTab === 'skills' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-center gap-3">
            <input
              type="text"
              value={newSkillName}
              onChange={(e) => setNewSkillName(e.target.value)}
              placeholder="Add a skill (e.g. Make.com, HubSpot CRM, Airtable)…"
              className="flex-1 text-xs px-3 py-2 rounded-xl border border-slate-300 w-full"
            />
            <select
              value={newSkillCategory}
              onChange={(e) => setNewSkillCategory(e.target.value)}
              className="text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-700"
            >
              <option value="">Select category…</option>
              {profileState.skillCategories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.categoryName}</option>
              ))}
              <option value="__new__">Create a new category…</option>
            </select>
            <select
              value={newSkillLevel}
              onChange={(e) => setNewSkillLevel(e.target.value as '' | 'Expert' | 'Proficient' | 'Familiar')}
              className="text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-700"
            >
              <option value="">Select level…</option>
              <option value="Expert">Expert</option>
              <option value="Proficient">Proficient</option>
              <option value="Familiar">Familiar</option>
            </select>
            <input
              type="number"
              min="0"
              step="0.5"
              value={newSkillYears}
              onChange={(e) => setNewSkillYears(e.target.value)}
              placeholder="Years (optional)"
              className="w-36 text-xs px-3 py-2 rounded-xl border border-slate-300"
            />
            <button
              onClick={handleAddSkill}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shrink-0"
            >
              Add Skill
            </button>
          </div>

          {(newSkillCategory === '__new__' || profileState.skillCategories.length === 0) && (
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
              <label className="block text-xs font-medium text-slate-700 mb-1">New Category Name</label>
              <input
                type="text"
                value={newSkillCategoryName}
                onChange={(e) => setNewSkillCategoryName(e.target.value)}
                placeholder="Enter a category that describes this skill"
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300"
              />
            </div>
          )}

          {profileState.skillCategories.length === 0 && (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
              No skills added yet. Enter a skill and choose its category and level.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profileState.skillCategories.map((cat) => (
              <div key={cat.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="font-bold text-slate-900 text-sm">{cat.categoryName}</h3>
                  <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
                    {cat.skills.length} skills
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {cat.skills.map((skill, sIdx) => (
                    <div
                      key={sIdx}
                      className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-medium text-slate-800">{skill.name}</span>
                      <span className="text-[10px] text-slate-400">({skill.level})</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Portfolio Projects */}
      {activeTab === 'portfolio' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Tangible systems, workflows, playbooks, and deliverables ready for application recommendations.
            </span>
            <button
              onClick={() => setShowAddProject(!showAddProject)}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Project</span>
            </button>
          </div>

          {showAddProject && (
            <div className="bg-white rounded-2xl border border-indigo-200 p-5 shadow-sm space-y-3">
              <h4 className="font-bold text-slate-900 text-sm">Add Portfolio Project</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Project / System Title</label>
                  <input
                    type="text"
                    value={newProjTitle}
                    onChange={(e) => setNewProjTitle(e.target.value)}
                    placeholder="e.g. Automated Client Onboarding Pipeline"
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Impact Metric (optional)</label>
                  <input
                    type="text"
                    value={newProjMetric}
                    onChange={(e) => setNewProjMetric(e.target.value)}
                    placeholder="e.g. Cut turnaround time by 60% and saved 10 hrs/wk"
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Role Category</label>
                  <select
                    value={newProjCategory}
                    onChange={(e) => setNewProjCategory(e.target.value as '' | PortfolioProject['roleCategory'])}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="">Select category…</option>
                    <option value="Executive Support">Executive Support</option>
                    <option value="Workflow Automation">Workflow Automation</option>
                    <option value="Business Operations">Business Operations</option>
                    <option value="Project Management">Project Management</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Deliverable or Link (optional)</label>
                  <input
                    type="text"
                    value={newProjDeliverable}
                    onChange={(e) => setNewProjDeliverable(e.target.value)}
                    placeholder="Add only if a deliverable exists"
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">System Description & Deliverables</label>
                <textarea
                  rows={3}
                  value={newProjDesc}
                  onChange={(e) => setNewProjDesc(e.target.value)}
                  placeholder="Describe how the system was built, problem solved, and how it works..."
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Tools Used (Comma-separated)</label>
                <input
                  type="text"
                  value={newProjTools}
                  onChange={(e) => setNewProjTools(e.target.value)}
                  placeholder="Notion, Zapier, Google Sheets"
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => setShowAddProject(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddProject}
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700"
                >
                  Add Project
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profileState.portfolioProjects.length === 0 && (
              <div className="md:col-span-2 bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
                No portfolio projects added yet.
              </div>
            )}
            {profileState.portfolioProjects.map((proj) => (
              <div key={proj.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase tracking-wide">
                      {proj.roleCategory}
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm mt-1">{proj.title}</h3>
                  </div>
                  <button
                    onClick={() => handleRemoveProject(proj.id)}
                    className="p-1 text-slate-400 hover:text-red-600 transition"
                    title="Remove project"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">{proj.description}</p>

                {proj.verifiedImpactMetric && (
                  <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100 text-xs text-emerald-950 font-medium">
                    <strong>Impact: </strong>{proj.verifiedImpactMetric}
                  </div>
                )}

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {proj.toolsUsed.map((tool, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-medium">
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Answer Bank */}
      {activeTab === 'answerBank' && (
        <div className="space-y-4">
          <div className="text-xs text-slate-500">
            Pre-verified answers to tough screening questions. The AI uses these authentic anecdotes when drafting application questions.
          </div>
          <div className="space-y-3">
            {profileState.answerBank.length === 0 && (
              <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
                No answer-bank entries added yet.
              </div>
            )}
            {profileState.answerBank.map((ans) => (
              <div key={ans.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm">{ans.prompt}</h4>
                  <div className="flex gap-1">
                    {ans.tags.map((tag, tIdx) => (
                      <span key={tIdx} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px]">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {ans.verifiedResponse}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Candidate Bio & Targets */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4 max-w-3xl">
          <h3 className="font-bold text-slate-900 text-base">Candidate Profile Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                value={profileState.name}
                onChange={(e) => setProfileState({ ...profileState, name: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Headline</label>
              <input
                type="text"
                value={profileState.headline}
                onChange={(e) => setProfileState(applyMaterialProfileEdit(profileState, 'headline', e.target.value))}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={profileState.email}
                onChange={(e) => setProfileState({ ...profileState, email: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Phone</label>
              <input
                type="text"
                value={profileState.phone}
                onChange={(e) => setProfileState({ ...profileState, phone: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Location / Coverage</label>
              <input
                type="text"
                value={profileState.location}
                onChange={(e) => setProfileState({ ...profileState, location: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Years of Experience</label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={profileState.yearsExperience ?? ''}
                onChange={(e) => setProfileState(applyMaterialProfileEdit(
                  profileState,
                  'yearsExperience',
                  parseOptionalYears(e.target.value)
                ))}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Executive Summary</label>
            <textarea
              rows={4}
              value={profileState.executiveSummary}
              onChange={(e) => setProfileState(applyMaterialProfileEdit(profileState, 'executiveSummary', e.target.value))}
              className="w-full text-xs p-3 rounded-lg border border-slate-300 leading-relaxed"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <button
              onClick={handleSaveAll}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs"
            >
              Update Profile Information
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
