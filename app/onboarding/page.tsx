'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Upload, ArrowRight, ArrowLeft, Check, X, Loader2,
  FileText, Target, Star, Building2, ChevronRight, Sparkles,
} from 'lucide-react';

// ─── Target company presets ───────────────────────────────────────────────────
const TARGET_COMPANY_PRESETS = [
  'Google', 'Meta', 'Apple', 'Amazon', 'Microsoft', 'Netflix',
  'OpenAI', 'Anthropic', 'Stripe', 'Figma', 'Notion', 'Linear',
  'Vercel', 'Databricks', 'Snowflake', 'Datadog', 'Atlassian', 'Salesforce',
];

// ─── North Star options ───────────────────────────────────────────────────────
const NS_STAGES = ['Seed / Series A', 'Series B–C', 'Series D+', 'Public / Big Tech', 'Any stage'];

const NS_DOMAINS = [
  'Developer Tools', 'AI / ML', 'FinTech / Payments', 'Enterprise SaaS',
  'Consumer', 'Infrastructure', 'Healthcare / Bio', 'Data & Analytics',
  'Security', 'E-commerce',
];

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
  { label: '$100k+', value: 100000 },
  { label: '$150k+', value: 150000 },
  { label: '$200k+', value: 200000 },
  { label: '$250k+', value: 250000 },
];

const LOCATION_PRESETS = [
  'San Francisco', 'New York', 'Austin', 'Seattle',
  'Los Angeles', 'Boston', 'Chicago', 'London', 'Remote',
];

const STEPS = [
  { icon: FileText,  label: 'Resume',      desc: 'The foundation for everything'  },
  { icon: Target,    label: 'Preferences', desc: 'What you\'re looking for'        },
  { icon: Star,      label: 'North Star',  desc: 'What matters most to you'        },
  { icon: Building2, label: 'Companies',   desc: 'Where you want to work'          },
];

// ─── Tag input ────────────────────────────────────────────────────────────────
function TagInput({ tags, onChange, placeholder }: {
  tags: string[];
  onChange: (t: string[]) => void;
  placeholder: string;
}) {
  const [input, setInput] = useState('');
  const add = () => {
    const v = input.trim();
    if (v && !tags.includes(v)) onChange([...tags, v]);
    setInput('');
  };
  return (
    <div className="border border-gray-200 rounded-xl px-3 py-2 bg-white focus-within:ring-2 focus-within:ring-blue-200 focus-within:border-blue-400 transition-all">
      <div className="flex flex-wrap gap-1.5 mb-1.5">
        {tags.map(t => (
          <span key={t} className="flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 text-xs font-medium px-2 py-0.5 rounded-full">
            {t}
            <button type="button" onClick={() => onChange(tags.filter(x => x !== t))} className="hover:text-blue-900">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex items-center gap-1.5">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') { e.preventDefault(); add(); }
            if (e.key === ',' && input) { e.preventDefault(); add(); }
          }}
          placeholder={tags.length === 0 ? placeholder : 'Add another…'}
          className="flex-1 text-sm outline-none placeholder-gray-400"
        />
        {input.trim() && (
          <button
            type="button"
            onClick={add}
            className="text-[10px] font-semibold text-blue-500 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded transition-colors flex-shrink-0"
          >
            Add ↵
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Location input ───────────────────────────────────────────────────────────
function LocationInput({ locations, onChange }: {
  locations: string[];
  onChange: (l: string[]) => void;
}) {
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
      {/* Preset chips */}
      <div className="flex flex-wrap gap-2">
        {LOCATION_PRESETS.map(loc => {
          const selected = locations.includes(loc);
          return (
            <button
              key={loc}
              type="button"
              onClick={() => toggle(loc)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                selected
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              {selected && <Check className="w-3 h-3 inline mr-1" />}
              {loc}
            </button>
          );
        })}
      </div>

      {/* Custom locations */}
      {customLocations.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {customLocations.map(loc => (
            <span key={loc} className="flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 text-xs font-medium px-2 py-0.5 rounded-full">
              {loc}
              <button type="button" onClick={() => toggle(loc)} className="hover:text-blue-900">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Custom input */}
      <div className="flex gap-2">
        <input
          value={custom}
          onChange={e => setCustom(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustom(); } }}
          placeholder="Other city or region…"
          className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 placeholder-gray-400"
        />
        <button
          type="button"
          onClick={addCustom}
          disabled={!custom.trim()}
          className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg disabled:opacity-40 transition-all"
        >
          Add
        </button>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
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

  // ── Resume handlers ─────────────────────────────────────────────────────────
  const handleFile = useCallback((file: File) => {
    setResumeFile(file);
    setUploadState('idle');
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const uploadResume = async (): Promise<boolean> => {
    if (resumeMode === 'paste') {
      if (!resumeText.trim()) return false;
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume: resumeText.trim() }),
      });
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
    } catch {
      // suggestions are optional — fail silently
    } finally {
      setSuggesting(false);
    }
  };

  const generateNorthStar = async () => {
    setNsGenerating(true);
    const allDealbreakers = nsCustomDealbreaker.trim()
      ? [...nsDealbreakers, nsCustomDealbreaker.trim()]
      : nsDealbreakers;
    try {
      const res = await fetch('/api/onboarding/suggest-north-star', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: nsStage, domains: nsDomains, priorities: nsPriorities, dealbreakers: allDealbreakers }),
      });
      const { northStar: draft } = await res.json();
      if (draft) setNorthStar(draft);
    } catch {
      // fail silently
    } finally {
      setNsGenerating(false);
    }
  };

  // ── Navigation ──────────────────────────────────────────────────────────────
  const nextStep = async () => {
    if (step === 0) {
      const ok = await uploadResume();
      if (!ok) return;
      // Kick off role suggestions in background — don't block navigation
      fetchSuggestions();
    }
    if (step < STEPS.length - 1) setStep(s => s + 1);
  };

  const prevStep = () => { if (step > 0) setStep(s => s - 1); };

  const addSuggestion = (title: string) => {
    if (!jobTitles.includes(title)) setJobTitles(prev => [...prev, title]);
  };

  // ── Finish ──────────────────────────────────────────────────────────────────
  const handleFinish = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preferences: {
            jobTitles,
            salaryFloor,
            locationPreferences: locations,
            domainsOfInterest: nsDomains,
            companiesToExclude: [],
            targetCompanies,
            roleType: '',
            workStyle: workStyles.join(', '),
          },
          profile: northStar,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      router.push('/dashboard');
    } catch (err) {
      console.error('Failed to save onboarding:', err);
      alert('Something went wrong saving your profile. Please try again.');
      setSaving(false);
    }
  };

  const isLastStep = step === STEPS.length - 1;
  const step1Ready = resumeMode === 'upload' ? !!resumeFile : resumeText.trim().length > 50;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-12">

      {/* Logo */}
      <a href="/" className="mb-10 font-heading text-2xl font-extrabold tracking-tight select-none">
        <span className="text-gray-900">Apply</span><span className="text-[#3B5BDB]">OS</span>
      </a>

      {/* Progress */}
      <div className="flex items-center gap-0 mb-10">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const done = i < step;
          const active = i === step;
          return (
            <div key={i} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  done    ? 'bg-blue-600 text-white'
                  : active ? 'bg-white border-2 border-blue-600 text-blue-600'
                  : 'bg-white border-2 border-gray-200 text-gray-400'
                }`}>
                  {done ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                </div>
                <span className={`text-xs mt-1.5 font-medium ${active ? 'text-blue-600' : done ? 'text-gray-600' : 'text-gray-400'}`}>
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-16 h-0.5 mb-5 mx-1 transition-all ${i < step ? 'bg-blue-600' : 'bg-gray-200'}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 w-full max-w-2xl overflow-hidden">

        {/* Step header */}
        <div className="px-8 pt-8 pb-6 border-b border-gray-100">
          <p className="text-xs font-bold uppercase tracking-widest text-blue-500 mb-1">Step {step + 1} of {STEPS.length}</p>
          <h1 className="text-2xl font-extrabold text-gray-900">{STEPS[step].label}</h1>
          <p className="text-gray-500 text-sm mt-1">{STEPS[step].desc}</p>
        </div>

        {/* Step content */}
        <div className="px-8 py-7">

          {/* ── Step 1: Resume ── */}
          {step === 0 && (
            <div className="space-y-5">
              <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
                {(['upload', 'paste'] as const).map(m => (
                  <button key={m} onClick={() => setResumeMode(m)}
                    className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${resumeMode === m ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
                    {m === 'upload' ? 'Upload file' : 'Paste text'}
                  </button>
                ))}
              </div>

              {resumeMode === 'upload' ? (
                <div
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={onDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${
                    dragOver ? 'border-blue-400 bg-blue-50'
                    : resumeFile ? 'border-green-400 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <input ref={fileInputRef} type="file" accept=".docx,.md,.txt" className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
                  {resumeFile ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                        <Check className="w-6 h-6 text-green-600" />
                      </div>
                      <p className="font-semibold text-green-700">{resumeFile.name}</p>
                      <button onClick={e => { e.stopPropagation(); setResumeFile(null); setUploadState('idle'); }}
                        className="text-xs text-gray-400 hover:text-gray-600">
                        Choose a different file
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <Upload className="w-10 h-10 text-gray-300" />
                      <div>
                        <p className="font-semibold text-gray-700">Drop your resume here</p>
                        <p className="text-sm text-gray-400 mt-0.5">.docx, .md, or .txt · or click to browse</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <textarea
                  value={resumeText}
                  onChange={e => setResumeText(e.target.value)}
                  rows={12}
                  placeholder={`Paste your resume here in markdown or plain text...\n\n# Your Name\n\n## Experience\n\n**Company Name** — Title (2022–Present)\n- Achievement one\n- Achievement two`}
                  className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 font-mono resize-none focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 placeholder-gray-300"
                />
              )}

              {uploadState === 'error' && (
                <p className="text-sm text-red-500">Upload failed — please try again.</p>
              )}
            </div>
          )}

          {/* ── Step 2: Preferences ── */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Job titles you're targeting
                </label>
                <TagInput
                  tags={jobTitles}
                  onChange={setJobTitles}
                  placeholder="Type a title and press Enter…"
                />

                {/* AI suggestions */}
                {suggesting ? (
                  <div className="mt-2.5 flex items-center gap-1.5 text-xs text-gray-400">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Analyzing your resume…
                  </div>
                ) : suggestedTitles.length > 0 && (
                  <div className="mt-2.5">
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Suggested from your resume
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {suggestedTitles.map(title => {
                        const already = jobTitles.includes(title);
                        return (
                          <button
                            key={title}
                            type="button"
                            onClick={() => addSuggestion(title)}
                            disabled={already}
                            className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border transition-all ${
                              already
                                ? 'bg-blue-50 text-blue-400 border-blue-200 cursor-default'
                                : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700'
                            }`}
                          >
                            {already ? <Check className="w-3 h-3" /> : '+'}
                            {title}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Minimum salary</label>
                <div className="flex gap-2 flex-wrap">
                  {SALARY_OPTIONS.map(opt => (
                    <button key={opt.value} onClick={() => setSalaryFloor(opt.value)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                        salaryFloor === opt.value
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                      }`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Preferred locations
                  <span className="ml-1.5 font-normal text-gray-400 text-xs">optional</span>
                </label>
                <LocationInput locations={locations} onChange={setLocations} />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Work style
                  <span className="ml-1.5 font-normal text-gray-400 text-xs">select all that apply</span>
                </label>
                <div className="flex gap-2">
                  {['Remote', 'Hybrid', 'On-site'].map(style => {
                    const active = workStyles.includes(style);
                    return (
                      <button key={style} onClick={() => setWorkStyles(prev => active ? prev.filter(s => s !== style) : [...prev, style])}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                          active
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                        }`}>
                        {active && <Check className="w-3.5 h-3.5 inline mr-1" />}
                        {style}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── Step 3: North Star ── */}
          {step === 2 && (
            <div className="space-y-5">
              <p className="text-sm text-gray-500 leading-relaxed">
                Your North Star is how applyOS scores every role against what actually matters to you.
                Answer a few prompts below and we'll draft it — or write it yourself.
              </p>

              {/* Company stage */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Company stage</p>
                <div className="flex flex-wrap gap-2">
                  {NS_STAGES.map(s => (
                    <button key={s} type="button" onClick={() => setNsStage(nsStage === s ? '' : s)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                        nsStage === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                      }`}>
                      {nsStage === s && <Check className="w-3 h-3 inline mr-1" />}{s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Domains */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Domains I want to work in</p>
                <div className="flex flex-wrap gap-2">
                  {NS_DOMAINS.map(d => {
                    const on = nsDomains.includes(d);
                    return (
                      <button key={d} type="button" onClick={() => setNsDomains(prev => on ? prev.filter(x => x !== d) : [...prev, d])}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                          on ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                        }`}>
                        {on && <Check className="w-3 h-3 inline mr-1" />}{d}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Priorities */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">What I'm optimizing for</p>
                <div className="flex flex-wrap gap-2">
                  {NS_PRIORITIES.map(p => {
                    const on = nsPriorities.includes(p);
                    return (
                      <button key={p} type="button" onClick={() => setNsPriorities(prev => on ? prev.filter(x => x !== p) : [...prev, p])}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                          on ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                        }`}>
                        {on && <Check className="w-3 h-3 inline mr-1" />}{p}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dealbreakers */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Dealbreakers</p>
                <div className="flex flex-wrap gap-2 mb-2">
                  {NS_DEALBREAKERS.map(d => {
                    const on = nsDealbreakers.includes(d);
                    return (
                      <button key={d} type="button" onClick={() => setNsDealbreakers(prev => on ? prev.filter(x => x !== d) : [...prev, d])}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                          on ? 'bg-red-500 text-white border-red-500' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                        }`}>
                        {on && <Check className="w-3 h-3 inline mr-1" />}{d}
                      </button>
                    );
                  })}
                </div>
                <input
                  value={nsCustomDealbreaker}
                  onChange={e => setNsCustomDealbreaker(e.target.value)}
                  placeholder="Add a custom dealbreaker…"
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 placeholder-gray-400"
                />
              </div>

              {/* Generate button */}
              <button
                type="button"
                onClick={generateNorthStar}
                disabled={nsGenerating || (!nsStage && !nsDomains.length && !nsPriorities.length)}
                className="flex items-center gap-2 w-full justify-center py-2.5 rounded-xl text-sm font-semibold border-2 border-dashed border-blue-300 text-blue-600 hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {nsGenerating
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Drafting your North Star…</>
                  : <><Sparkles className="w-4 h-4" /> Draft my North Star from these selections</>}
              </button>

              {/* Editable textarea */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {northStar ? 'Your North Star — edit freely' : 'Or write it yourself'}
                  </p>
                  {northStar && (
                    <button type="button" onClick={generateNorthStar} disabled={nsGenerating}
                      className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1 disabled:opacity-40">
                      <Sparkles className="w-3 h-3" /> Regenerate
                    </button>
                  )}
                </div>
                <textarea
                  value={northStar}
                  onChange={e => setNorthStar(e.target.value)}
                  rows={7}
                  placeholder="Your North Star will appear here after drafting, or write it yourself…"
                  className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 placeholder-gray-300 leading-relaxed"
                />
              </div>
            </div>
          )}

          {/* ── Step 4: Target companies ── */}
          {step === 3 && (
            <div className="space-y-5">
              <p className="text-sm text-gray-500 leading-relaxed">
                Which companies are on your shortlist? This helps applyOS boost scores for roles at these companies.
                You'll set up scanning portals separately from the Discover page.
              </p>

              {/* Preset chips */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Popular targets</p>
                <div className="flex flex-wrap gap-2">
                  {TARGET_COMPANY_PRESETS.map(company => {
                    const selected = targetCompanies.includes(company);
                    return (
                      <button key={company} type="button"
                        onClick={() => setTargetCompanies(prev => selected ? prev.filter(c => c !== company) : [...prev, company])}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                          selected
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                        }`}>
                        {selected && <Check className="w-3 h-3" />}
                        {company}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom input */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Add others</p>
                <TagInput
                  tags={targetCompanies.filter(c => !TARGET_COMPANY_PRESETS.includes(c))}
                  onChange={custom => setTargetCompanies([
                    ...targetCompanies.filter(c => TARGET_COMPANY_PRESETS.includes(c)),
                    ...custom,
                  ])}
                  placeholder="Type a company name and press Enter…"
                />
              </div>

              {targetCompanies.length > 0 && (
                <p className="text-xs text-gray-400">
                  {targetCompanies.length} {targetCompanies.length === 1 ? 'company' : 'companies'} selected
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer nav */}
        <div className="px-8 py-5 border-t border-gray-100 flex items-center justify-between bg-gray-50">
          <button onClick={prevStep} disabled={step === 0}
            className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 disabled:opacity-0 transition-all">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          <div className="flex items-center gap-3">
            {step > 0 && !isLastStep && (
              <button onClick={() => setStep(s => s + 1)}
                className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
                Skip for now
              </button>
            )}

            {isLastStep ? (
              <button onClick={handleFinish} disabled={saving}
                className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 transition-all shadow-sm">
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Setting up…</> : <>Get started <ChevronRight className="w-4 h-4" /></>}
              </button>
            ) : (
              <button onClick={nextStep}
                disabled={step === 0 && !step1Ready}
                className="flex items-center gap-2 bg-gray-900 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-black disabled:opacity-40 transition-all">
                {uploadState === 'uploading' ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</> : <>Next <ArrowRight className="w-4 h-4" /></>}
              </button>
            )}
          </div>
        </div>
      </div>

      <p className="mt-6 text-xs text-gray-400">You can update all of this later in Settings.</p>
    </div>
  );
}
