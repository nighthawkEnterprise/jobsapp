'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Upload, ArrowRight, ArrowLeft, Check, X, Loader2,
  FileText, Target, Star, Building2, Sparkles, Lock,
  Plus, Briefcase, Globe, ShieldOff,
  Zap, CreditCard, Cloud, ShoppingBag, Server, Activity, BarChart3, Shield, ShoppingCart, Code2,
} from 'lucide-react';

// ─── Constants ─────────────────────────────────────────────────────────────────
const TARGET_COMPANY_PRESETS = [
  'Google', 'Meta', 'Apple', 'Amazon', 'Microsoft', 'Netflix',
  'OpenAI', 'Anthropic', 'Stripe', 'Figma', 'Notion', 'Linear',
  'Vercel', 'Databricks', 'Snowflake', 'Datadog', 'Atlassian', 'Salesforce',
];

const NS_STAGES = ['Seed / Series A', 'Series B–C', 'Series D+', 'Public / Big Tech', 'Any stage'];

const DOMAIN_OPTIONS: { label: string; icon: React.ElementType }[] = [
  { label: 'AI / ML',            icon: Zap },
  { label: 'Developer Tools',    icon: Code2 },
  { label: 'FinTech / Payments', icon: CreditCard },
  { label: 'Enterprise SaaS',    icon: Cloud },
  { label: 'Infrastructure',     icon: Server },
  { label: 'Data & Analytics',   icon: BarChart3 },
  { label: 'Healthcare / Bio',   icon: Activity },
  { label: 'Security',           icon: Shield },
  { label: 'Consumer',           icon: ShoppingBag },
  { label: 'E-commerce',         icon: ShoppingCart },
];

const NS_DOMAINS = DOMAIN_OPTIONS.map(d => d.label);

const NS_PRIORITIES = [
  'Scope & ownership', 'Strong eng culture', 'High compensation',
  'Mission & impact', '0→1 building', 'Leadership path',
  'Fast growth / trajectory', 'Work-life balance',
];

const NS_DEALBREAKERS = [
  'Pure B2C consumer', 'No product strategy influence', 'Sales-led org',
  'Big corp bureaucracy', 'Below-market comp', 'No remote option',
];

const SALARY_OPTIONS = [
  { label: 'No minimum', value: 0 },
  { label: '$100k+',     value: 100000 },
  { label: '$150k+',     value: 150000 },
  { label: '$200k+',     value: 200000 },
  { label: '$250k+',     value: 250000 },
];

const LOCATION_PRESETS = [
  'San Francisco', 'New York', 'Austin', 'Seattle',
  'Los Angeles', 'Boston', 'Chicago', 'London', 'Remote',
];

const STEPS = [
  {
    icon: FileText,  label: 'Resume',
    title: 'Executive Profile Ingestion',
    desc: 'The foundation of your ApplyOS workbench starts with your career history. Our AI models will parse your background to identify key strategic wins and core competencies.',
  },
  {
    icon: Target,    label: 'Preferences',
    title: 'Role Parameters',
    desc: 'Configure the parameters for your ideal role. These preferences drive job discovery and scoring across every platform we scan.',
  },
  {
    icon: Star,      label: 'North Star',
    title: 'Strategic Intent',
    desc: 'Define what matters most to you in your next move. This becomes the lens through which every opportunity is evaluated.',
  },
  {
    icon: Building2, label: 'Companies',
    title: 'Target Organizations',
    desc: 'Identify the companies you\'d most like to work for. ApplyOS will boost scores for opportunities at these organizations.',
  },
];

// ─── Tag input ─────────────────────────────────────────────────────────────────
function TagInput({ tags, onChange, placeholder }: { tags: string[]; onChange: (t: string[]) => void; placeholder: string }) {
  const [input, setInput] = useState('');
  const add = () => {
    const v = input.trim();
    if (v && !tags.includes(v)) onChange([...tags, v]);
    setInput('');
  };
  return (
    <div className="border border-gray-200 rounded-xl px-3 py-2.5 bg-white focus-within:ring-2 focus-within:ring-blue-200 focus-within:border-blue-400 transition-all">
      <div className="flex flex-wrap gap-1.5 mb-1.5">
        {tags.map(t => (
          <span key={t} className="flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 text-xs font-medium px-2.5 py-1 rounded-full">
            {t}
            <button type="button" onClick={() => onChange(tags.filter(x => x !== t))} className="hover:text-blue-900"><X className="w-3 h-3" /></button>
          </span>
        ))}
      </div>
      <div className="flex items-center gap-1.5">
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } if (e.key === ',' && input) { e.preventDefault(); add(); } }}
          placeholder={tags.length === 0 ? placeholder : 'Add another…'}
          className="flex-1 text-sm outline-none placeholder-gray-400" />
        {input.trim() && (
          <button type="button" onClick={add} className="text-[10px] font-semibold text-blue-500 bg-blue-50 px-2 py-0.5 rounded hover:bg-blue-100 transition-colors flex-shrink-0">Add ↵</button>
        )}
      </div>
    </div>
  );
}

// ─── Location input ─────────────────────────────────────────────────────────────
function LocationInput({ locations, onChange }: { locations: string[]; onChange: (l: string[]) => void }) {
  const [custom, setCustom] = useState('');
  const toggle = (loc: string) => {
    if (locations.includes(loc)) onChange(locations.filter(l => l !== loc));
    else onChange([...locations, loc]);
  };
  const addCustom = () => {
    const v = custom.trim();
    if (v && !locations.includes(v)) onChange([...locations, v]);
    setCustom('');
  };
  const customLocations = locations.filter(l => !LOCATION_PRESETS.includes(l));
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {LOCATION_PRESETS.map(loc => {
          const selected = locations.includes(loc);
          return (
            <button key={loc} type="button" onClick={() => toggle(loc)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${selected ? 'bg-[#3B5BDB] text-white border-[#3B5BDB]' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>
              {selected && <Check className="w-3 h-3 inline mr-1" />}{loc}
            </button>
          );
        })}
      </div>
      {customLocations.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {customLocations.map(loc => (
            <span key={loc} className="flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 text-xs font-medium px-2.5 py-1 rounded-full">
              {loc}<button type="button" onClick={() => toggle(loc)} className="hover:text-blue-900"><X className="w-3 h-3" /></button>
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input value={custom} onChange={e => setCustom(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustom(); } }}
          placeholder="Other city or region…"
          className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 placeholder-gray-400" />
        <button type="button" onClick={addCustom} disabled={!custom.trim()}
          className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg disabled:opacity-40 transition-all">Add</button>
      </div>
    </div>
  );
}

// ─── Chip button ───────────────────────────────────────────────────────────────
function Chip({ label, active, onClick, danger }: { label: string; active: boolean; onClick: () => void; danger?: boolean }) {
  return (
    <button type="button" onClick={onClick}
      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
        active
          ? danger ? 'bg-red-500 text-white border-red-500' : 'bg-[#3B5BDB] text-white border-[#3B5BDB]'
          : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
      }`}>
      {active && <Check className="w-3 h-3" />}{label}
    </button>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Step 1 — Resume
  const [resumeMode, setResumeMode] = useState<'upload' | 'paste'>('upload');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState('');
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 2 — Preferences
  const [jobTitles, setJobTitles] = useState<string[]>([]);
  const [suggestedTitles, setSuggestedTitles] = useState<string[]>([]);
  const [suggesting, setSuggesting] = useState(false);
  const [salaryFloor, setSalaryFloor] = useState(0);
  const [locations, setLocations] = useState<string[]>([]);
  const [workStyles, setWorkStyles] = useState<string[]>([]);

  // Step 3 — North Star
  const [northStar, setNorthStar] = useState('');
  const [nsStage, setNsStage] = useState('');
  const [nsDomains, setNsDomains] = useState<string[]>([]);
  const [nsPriorities, setNsPriorities] = useState<string[]>([]);
  const [nsDealbreakers, setNsDealbreakers] = useState<string[]>([]);
  const [nsCustomDealbreaker, setNsCustomDealbreaker] = useState('');
  const [nsGenerating, setNsGenerating] = useState(false);

  // Step 4 — Target companies
  const [targetCompanies, setTargetCompanies] = useState<string[]>([]);

  // Step 2 — Companies to exclude
  const [companiesToExclude, setCompaniesToExclude] = useState<string[]>([]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleFile = useCallback((file: File) => { setResumeFile(file); setUploadState('idle'); }, []);
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files[0]; if (file) handleFile(file);
  }, [handleFile]);

  const uploadResume = async (): Promise<boolean> => {
    if (resumeMode === 'paste') {
      if (!resumeText.trim()) return false;
      await fetch('/api/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ resume: resumeText.trim() }) });
      return true;
    }
    if (!resumeFile) return false;
    setUploadState('uploading');
    const form = new FormData();
    form.append('file', resumeFile);
    const res = await fetch('/api/resumes', { method: 'POST', body: form });
    if (res.ok) { setUploadState('done'); return true; }
    setUploadState('error'); return false;
  };

  const fetchSuggestions = async () => {
    setSuggesting(true);
    try {
      const res = await fetch('/api/onboarding/suggest-roles', { method: 'POST' });
      const { suggestions } = await res.json();
      if (suggestions?.length) setSuggestedTitles(suggestions);
    } catch { /* optional */ } finally { setSuggesting(false); }
  };

  const generateNorthStar = async () => {
    setNsGenerating(true);
    const allDealbreakers = nsCustomDealbreaker.trim() ? [...nsDealbreakers, nsCustomDealbreaker.trim()] : nsDealbreakers;
    try {
      const res = await fetch('/api/onboarding/suggest-north-star', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: nsStage, domains: nsDomains, priorities: nsPriorities, dealbreakers: allDealbreakers }),
      });
      const { northStar: draft } = await res.json();
      if (draft) setNorthStar(draft);
    } catch { /* fail silently */ } finally { setNsGenerating(false); }
  };

  const nextStep = async () => {
    if (step === 0) {
      const ok = await uploadResume();
      if (!ok) return;
      fetchSuggestions();
    }
    if (step < STEPS.length - 1) setStep(s => s + 1);
  };

  const prevStep = () => { if (step > 0) setStep(s => s - 1); };

  const handleFinish = async () => {
    setSaving(true);
    try {
      const allDealbreakers = nsCustomDealbreaker.trim() ? [...nsDealbreakers, nsCustomDealbreaker.trim()] : nsDealbreakers;
      const lines: string[] = ['# Career Profile — North Star Archetypes', ''];
      lines.push('## Who I Am', '', northStar.trim(), '');
      lines.push('## Target Archetypes', '');
      if (nsStage || nsDomains.length > 0 || nsPriorities.length > 0) {
        const archetypeName = [nsStage, ...nsDomains.slice(0, 2)].filter(Boolean).join(' / ') || 'Primary Target';
        lines.push(`### Archetype 1 — ${archetypeName} ${'⭐'.repeat(3)}`);
        lines.push(`**Companies:** ${targetCompanies.slice(0, 5).join(', ')}`, '');
        lines.push('**What makes a role a perfect fit:**');
        nsPriorities.forEach(p => lines.push(`- ${p}`));
        lines.push('', '**What I bring:** ', '', '---', '');
      }
      lines.push('## Anti-targets (roles that would be a step down or misalignment)');
      allDealbreakers.forEach(d => lines.push(`- ${d}`));
      lines.push('');
      lines.push('## Compensation Targets');
      if (salaryFloor > 0) lines.push(`- Base: $${salaryFloor.toLocaleString()}+`);
      lines.push('');
      const structuredProfile = lines.join('\n');

      const res = await fetch('/api/settings', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preferences: { jobTitles, salaryFloor, locationPreferences: locations, domainsOfInterest: nsDomains, companiesToExclude, targetCompanies, roleType: '', workStyle: workStyles.join(', ') },
          profile: structuredProfile,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      router.push('/relevant-jobs');
    } catch (err) {
      console.error('Failed to save onboarding:', err);
      alert('Something went wrong saving your profile. Please try again.');
      setSaving(false);
    }
  };

  const isLastStep = step === STEPS.length - 1;
  const step1Ready = resumeMode === 'upload' ? !!resumeFile : resumeText.trim().length > 50;
  const hasResumeContent = resumeFile || resumeText.length > 20;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-[200] bg-[#f8f9ff] flex overflow-hidden">

      {/* ── Sidebar ── */}
      <aside className="w-64 flex-none bg-white border-r border-gray-200 flex flex-col">
        <div className="px-8 py-8 pb-10">
          <a href="/" className="font-heading text-xl font-extrabold tracking-tight select-none">
            <span className="text-gray-900">Apply</span><span className="text-[#3B5BDB]">OS</span>
          </a>
          <p className="text-[11px] text-gray-400 font-medium mt-1 tracking-wide uppercase">Executive Workbench</p>
        </div>

        <nav className="flex-1 px-3">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const done = i < step;
            const active = i === step;
            return (
              <div key={i} className={`flex items-center gap-3 px-4 py-3 text-sm transition-all ${
                active ? 'text-[#3B5BDB] font-bold border-r-2 border-[#3B5BDB] bg-blue-50/60' : done ? 'text-gray-600 font-medium' : 'text-gray-400'
              }`}>
                <Icon className={`w-4 h-4 flex-none ${active ? 'text-[#3B5BDB]' : done ? 'text-gray-400' : 'text-gray-300'}`} />
                <span className="flex-1">{s.label}</span>
                {done && <Check className="w-3.5 h-3.5 text-green-500 flex-none" />}
              </div>
            );
          })}
        </nav>

        <div className="p-6 border-t border-gray-100">
          <p className="text-[11px] text-gray-400 leading-relaxed">
            All of this can be updated later in Settings.
          </p>
        </div>
      </aside>

      {/* ── Right panel ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Header */}
        <header className="h-16 flex-none bg-white border-b border-gray-200 flex items-center justify-end px-10 gap-5">
          <span className="text-xs text-gray-400 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" /> Data encrypted & private
          </span>
          <div className="w-px h-4 bg-gray-200" />
          <button
            onClick={handleFinish}
            disabled={saving}
            className="bg-[#3B5BDB] text-white text-sm font-bold px-6 py-2 rounded-xl hover:bg-[#3451c7] disabled:opacity-60 transition-all"
          >
            {saving ? 'Saving…' : 'Save & Exit'}
          </button>
        </header>

        {/* Main */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-10 py-10">

            {/* Stage header */}
            <div className="flex items-start justify-between mb-10">
              <div className="max-w-2xl">
                <span className="text-[11px] font-bold text-[#3B5BDB] tracking-widest uppercase mb-3 block">
                  Onboarding · Stage {step + 1}
                </span>
                <h2 className="text-[2.5rem] font-extrabold text-gray-900 leading-tight tracking-tight">
                  {STEPS[step].title}
                </h2>
                <p className="text-gray-500 mt-3 text-base leading-relaxed">
                  {STEPS[step].desc}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2 pt-2 flex-none ml-10">
                <div className="flex gap-2">
                  {STEPS.map((_, i) => (
                    <div key={i} className={`w-8 h-1 rounded-full transition-all ${i <= step ? 'bg-[#3B5BDB]' : 'bg-gray-200'}`} />
                  ))}
                </div>
                <span className="text-xs text-gray-400">Step {step + 1} of {STEPS.length}: {STEPS[step].label}</span>
              </div>
            </div>

            {/* ── Step 1: Resume ── */}
            {step === 0 && (
              <div className="grid grid-cols-12 gap-6">

                {/* Upload center */}
                <div className="col-span-7 space-y-5">
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between bg-white">
                      <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        <Upload className="w-4 h-4 text-[#3B5BDB]" /> Upload Center
                      </h3>
                      <div className="flex p-1 bg-gray-100 rounded-lg">
                        {(['upload', 'paste'] as const).map(m => (
                          <button key={m} onClick={() => setResumeMode(m)}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${resumeMode === m ? 'bg-white shadow-sm text-[#3B5BDB]' : 'text-gray-500 hover:text-gray-700'}`}>
                            {m === 'upload' ? 'Upload File' : 'Paste Text'}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="p-6">
                      {resumeMode === 'upload' ? (
                        <div
                          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                          onDragLeave={() => setDragOver(false)}
                          onDrop={onDrop}
                          onClick={() => fileInputRef.current?.click()}
                          className={`border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center transition-all cursor-pointer ${
                            dragOver ? 'border-[#3B5BDB] bg-blue-50'
                            : resumeFile ? 'border-green-400 bg-green-50'
                            : 'border-gray-200 hover:border-[#3B5BDB]/40 hover:bg-blue-50/20 group'
                          }`}
                        >
                          <input ref={fileInputRef} type="file" accept=".docx,.md,.txt" className="hidden"
                            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
                          {resumeFile ? (
                            <div className="flex flex-col items-center gap-3">
                              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
                                <Check className="w-7 h-7 text-green-600" />
                              </div>
                              <p className="font-semibold text-green-700">{resumeFile.name}</p>
                              <button onClick={e => { e.stopPropagation(); setResumeFile(null); setUploadState('idle'); }}
                                className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                                Choose a different file
                              </button>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-4">
                              <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center group-hover:scale-105 transition-transform">
                                <Upload className="w-7 h-7 text-[#3B5BDB]" />
                              </div>
                              <div className="text-center">
                                <p className="font-bold text-gray-900 text-lg">Drop your resume here</p>
                                <p className="text-sm text-gray-400 mt-1">Supports DOCX, Markdown, and plain text · max 10MB</p>
                              </div>
                              <button className="px-8 py-2.5 bg-white border border-gray-200 rounded-full text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                                Browse Files
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <textarea
                          value={resumeText} onChange={e => setResumeText(e.target.value)}
                          rows={14}
                          placeholder={`Paste your resume or professional bio text here...\n\n# Your Name\n\n## Experience\n\n**Company Name** — Title (2022–Present)\n- Achievement one\n- Achievement two`}
                          className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 font-mono resize-none focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 placeholder-gray-300"
                        />
                      )}
                      {uploadState === 'error' && (
                        <p className="text-sm text-red-500 mt-3">Upload failed — please try again.</p>
                      )}
                    </div>
                  </div>

                  {/* Tip */}
                  <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-5 flex gap-3">
                    <Sparkles className="w-5 h-5 text-[#3B5BDB] flex-none mt-0.5" />
                    <div>
                      <h5 className="text-sm font-bold text-[#3B5BDB] mb-1">Executive Tip</h5>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        Provide your most recent resume for accurate skill mapping. Our parsing engine identifies executive leadership competencies and surfaces key strategic wins.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Parsed content preview */}
                <div className="col-span-5">
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col" style={{ minHeight: 420 }}>
                    <div className="border-b border-gray-100 px-6 py-4">
                      <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-400" /> Parsed Content
                      </h3>
                    </div>
                    <div className="flex-1 p-6 flex flex-col items-center justify-center text-center">
                      {hasResumeContent ? (
                        <div className="w-full space-y-4">
                          <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl border border-green-100">
                            <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center flex-none">
                              <Check className="w-5 h-5 text-green-600" />
                            </div>
                            <div className="text-left min-w-0">
                              <p className="text-sm font-semibold text-green-800 truncate">
                                {resumeFile ? resumeFile.name : 'Pasted resume text'}
                              </p>
                              <p className="text-xs text-green-600 mt-0.5">
                                {resumeFile
                                  ? `${(resumeFile.size / 1024).toFixed(0)} KB · ready to ingest`
                                  : `${resumeText.trim().split(/\s+/).filter(Boolean).length} words detected`}
                              </p>
                            </div>
                          </div>
                          {uploadState === 'uploading' && (
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <Loader2 className="w-4 h-4 animate-spin" /> Processing…
                            </div>
                          )}
                          {uploadState === 'done' && (
                            <p className="text-xs text-green-600 font-medium">✓ Resume ingested successfully</p>
                          )}
                          <p className="text-xs text-gray-400 leading-relaxed pt-2">
                            AI will parse your background to identify key strategic wins, core competencies, and leadership signals once you continue.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4 max-w-[220px]">
                          <div className="relative mx-auto w-fit">
                            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                              <FileText className="w-8 h-8 text-gray-300" />
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center">
                              <Loader2 className="w-3.5 h-3.5 text-gray-300" />
                            </div>
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-400 text-lg">Awaiting Ingestion</h4>
                            <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                              Once you upload your document, we'll display the structural preview here for your verification.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Step 2: Preferences ── */}
            {step === 1 && (
              <div className="space-y-5 max-w-3xl">

                {/* Role & Compensation */}
                <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 space-y-7">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-none">
                      <Briefcase className="w-5 h-5 text-[#3B5BDB]" />
                    </div>
                    <h3 className="font-bold text-xl text-gray-900">Role &amp; Compensation</h3>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Job Titles</label>
                      <TagInput tags={jobTitles} onChange={setJobTitles} placeholder="Add title…" />
                      {suggesting ? (
                        <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-400">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Analyzing your resume…
                        </div>
                      ) : suggestedTitles.length > 0 && (
                        <div className="mt-2.5">
                          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> Suggested from your resume
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {suggestedTitles.map(title => {
                              const already = jobTitles.includes(title);
                              return (
                                <button key={title} type="button" onClick={() => { if (!already) setJobTitles(p => [...p, title]); }} disabled={already}
                                  className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border transition-all ${already ? 'bg-blue-50 text-blue-400 border-blue-200 cursor-default' : 'bg-white text-gray-600 border-gray-200 hover:border-[#3B5BDB]/50 hover:bg-blue-50 hover:text-[#3B5BDB]'}`}>
                                  {already ? <Check className="w-3 h-3" /> : '+'} {title}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Minimum Base Salary (Annual)</label>
                      <div className="relative">
                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg pointer-events-none">$</span>
                        <input
                          type="number"
                          value={salaryFloor || ''}
                          onChange={e => setSalaryFloor(Number(e.target.value) || 0)}
                          placeholder="250000"
                          className="w-full pl-10 pr-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:border-[#3B5BDB] focus:ring-4 focus:ring-[#3B5BDB]/5 outline-none text-2xl font-extrabold text-gray-900 placeholder-gray-300 transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </section>

                {/* Market Focus */}
                <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 space-y-7">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-none">
                      <Globe className="w-5 h-5 text-[#3B5BDB]" />
                    </div>
                    <h3 className="font-bold text-xl text-gray-900">Market Focus</h3>
                  </div>

                  <div className="space-y-8">
                    <div className="space-y-3">
                      <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Preferred Locations</label>
                      <div className="flex flex-wrap gap-2.5">
                        {LOCATION_PRESETS.map(loc => {
                          const selected = locations.includes(loc);
                          return (
                            <button key={loc} type="button"
                              onClick={() => setLocations(prev => selected ? prev.filter(l => l !== loc) : [...prev, loc])}
                              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold border transition-all ${
                                selected
                                  ? 'bg-[#3B5BDB] text-white border-[#3B5BDB] shadow-lg shadow-blue-200'
                                  : 'border-gray-200 text-gray-600 hover:border-[#3B5BDB]/40 hover:bg-blue-50/40'
                              }`}>
                              {selected ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                              {loc}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Domains of Interest</label>
                      <div className="grid grid-cols-5 gap-3">
                        {DOMAIN_OPTIONS.map(({ label, icon: Icon }) => {
                          const on = nsDomains.includes(label);
                          return (
                            <button key={label} type="button"
                              onClick={() => setNsDomains(prev => on ? prev.filter(x => x !== label) : [...prev, label])}
                              className={`p-5 rounded-2xl border-2 flex flex-col gap-3 text-left transition-all ${
                                on
                                  ? 'border-[#3B5BDB] bg-blue-50/60'
                                  : 'border-gray-200 bg-gray-50/40 hover:border-[#3B5BDB]/30 hover:bg-blue-50/20'
                              }`}>
                              <Icon className={`w-6 h-6 transition-colors ${on ? 'text-[#3B5BDB]' : 'text-gray-400'}`} />
                              <span className={`text-xs leading-snug transition-colors ${on ? 'font-bold text-gray-900' : 'font-medium text-gray-500'}`}>{label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </section>

                {/* Organizational Boundary */}
                <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 space-y-5">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-none">
                      <ShieldOff className="w-5 h-5 text-red-500" />
                    </div>
                    <h3 className="font-bold text-xl text-gray-900">Organizational Boundary</h3>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Companies to Exclude</label>
                    <p className="text-sm text-gray-500">Our AI will automatically filter these organizations from your search results.</p>
                    <div className="border border-red-200 rounded-2xl px-3 py-2.5 bg-red-50/40 focus-within:ring-2 focus-within:ring-red-200 transition-all">
                      <div className="flex flex-wrap gap-1.5 mb-1.5">
                        {companiesToExclude.map(c => (
                          <span key={c} className="flex items-center gap-1 bg-red-100 text-red-700 border border-red-200 text-xs font-bold px-2.5 py-1 rounded-lg">
                            {c}
                            <button type="button" onClick={() => setCompaniesToExclude(prev => prev.filter(x => x !== c))} className="hover:text-red-900"><X className="w-3 h-3" /></button>
                          </span>
                        ))}
                      </div>
                      <input
                        placeholder="Add company name to exclude…"
                        className="bg-transparent outline-none text-sm w-full placeholder-red-300 min-w-[200px]"
                        onKeyDown={e => {
                          if (e.key === 'Enter' || e.key === ',') {
                            e.preventDefault();
                            const v = (e.target as HTMLInputElement).value.trim();
                            if (v && !companiesToExclude.includes(v)) setCompaniesToExclude(prev => [...prev, v]);
                            (e.target as HTMLInputElement).value = '';
                          }
                        }}
                      />
                    </div>
                  </div>
                </section>

              </div>
            )}

            {/* ── Step 3: North Star ── */}
            {step === 2 && (
              <div className="grid grid-cols-12 gap-6">
                {/* Options panel */}
                <div className="col-span-6 space-y-6">
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
                    <div>
                      <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2.5">Company stage</p>
                      <div className="flex flex-wrap gap-2">
                        {NS_STAGES.map(s => <Chip key={s} label={s} active={nsStage === s} onClick={() => setNsStage(nsStage === s ? '' : s)} />)}
                      </div>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2.5">What I'm optimizing for</p>
                      <div className="flex flex-wrap gap-2">
                        {NS_PRIORITIES.map(p => <Chip key={p} label={p} active={nsPriorities.includes(p)} onClick={() => setNsPriorities(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])} />)}
                      </div>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2.5">Dealbreakers</p>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {NS_DEALBREAKERS.map(d => <Chip key={d} label={d} active={nsDealbreakers.includes(d)} onClick={() => setNsDealbreakers(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])} danger />)}
                      </div>
                      <input value={nsCustomDealbreaker} onChange={e => setNsCustomDealbreaker(e.target.value)}
                        placeholder="Add a custom dealbreaker…"
                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 placeholder-gray-400 mt-2" />
                    </div>
                  </div>
                </div>

                {/* North Star editor */}
                <div className="col-span-6 flex flex-col gap-4">
                  <button type="button" onClick={generateNorthStar}
                    disabled={nsGenerating || (!nsStage && !nsDomains.length && !nsPriorities.length)}
                    className="flex items-center gap-2 justify-center py-3 rounded-xl text-sm font-semibold border-2 border-dashed border-[#3B5BDB]/40 text-[#3B5BDB] hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                    {nsGenerating
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Drafting your North Star…</>
                      : <><Sparkles className="w-4 h-4" /> Draft my North Star from these selections</>}
                  </button>

                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                        {northStar ? 'Your North Star — edit freely' : 'Or write it yourself'}
                      </p>
                      {northStar && (
                        <button type="button" onClick={generateNorthStar} disabled={nsGenerating}
                          className="text-xs text-[#3B5BDB] hover:text-blue-800 flex items-center gap-1 disabled:opacity-40">
                          <Sparkles className="w-3 h-3" /> Regenerate
                        </button>
                      )}
                    </div>
                    <textarea value={northStar} onChange={e => setNorthStar(e.target.value)}
                      rows={12}
                      placeholder="Your North Star will appear here after drafting, or write it yourself…"
                      className="flex-1 w-full text-sm border border-gray-200 rounded-xl px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 placeholder-gray-300 leading-relaxed" />
                  </div>
                </div>
              </div>
            )}

            {/* ── Step 4: Companies ── */}
            {step === 3 && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 space-y-7 max-w-3xl">
                <div>
                  <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3">Popular targets</p>
                  <div className="flex flex-wrap gap-2">
                    {TARGET_COMPANY_PRESETS.map(company => {
                      const selected = targetCompanies.includes(company);
                      return (
                        <button key={company} type="button"
                          onClick={() => setTargetCompanies(prev => selected ? prev.filter(c => c !== company) : [...prev, company])}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${selected ? 'bg-[#3B5BDB] text-white border-[#3B5BDB]' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}>
                          {selected && <Check className="w-3 h-3" />}{company}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Add others</p>
                  <TagInput
                    tags={targetCompanies.filter(c => !TARGET_COMPANY_PRESETS.includes(c))}
                    onChange={custom => setTargetCompanies([...targetCompanies.filter(c => TARGET_COMPANY_PRESETS.includes(c)), ...custom])}
                    placeholder="Type a company name and press Enter…"
                  />
                </div>

                {targetCompanies.length > 0 && (
                  <p className="text-xs text-gray-400">{targetCompanies.length} {targetCompanies.length === 1 ? 'company' : 'companies'} selected</p>
                )}
              </div>
            )}

            {/* ── Footer action bar ── */}
            <div className="mt-10 flex items-center justify-between bg-white border border-gray-200 rounded-2xl px-8 py-5 shadow-sm">
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <Lock className="w-4 h-4" />
                <span>Data is encrypted and private.</span>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={prevStep} disabled={step === 0}
                  className="px-6 py-2.5 text-sm font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-0 transition-all">
                  <ArrowLeft className="w-4 h-4 inline mr-1" />Previous
                </button>

                {step > 0 && !isLastStep && (
                  <button onClick={() => setStep(s => s + 1)}
                    className="text-sm text-gray-400 hover:text-gray-600 transition-colors px-2">
                    Skip
                  </button>
                )}

                {isLastStep ? (
                  <button onClick={handleFinish} disabled={saving}
                    className="flex items-center gap-2 bg-[#3B5BDB] text-white px-10 py-2.5 rounded-xl text-sm font-bold hover:bg-[#3451c7] disabled:opacity-60 transition-all shadow-lg shadow-blue-200">
                    {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Setting up…</> : <>Launch ApplyOS <ArrowRight className="w-4 h-4" /></>}
                  </button>
                ) : (
                  <button onClick={nextStep} disabled={(step === 0 && !step1Ready) || uploadState === 'uploading'}
                    className="flex items-center gap-2 bg-[#1C1F2E] text-white px-10 py-2.5 rounded-xl text-sm font-bold hover:bg-black disabled:opacity-40 transition-all">
                    {uploadState === 'uploading' ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</> : <>Continue <ArrowRight className="w-4 h-4" /></>}
                  </button>
                )}
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
