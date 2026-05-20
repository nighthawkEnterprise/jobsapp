'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Plus, Sparkles, Loader2 } from 'lucide-react';
import { NorthStarEditor } from '@/components/NorthStarEditor';
import { Skeleton, SkeletonFormSection } from '@/components/Skeleton';

// ─── Tag input ────────────────────────────────────────────────────────────────
function TagInput({
  tags, onChange, placeholder, className,
}: { tags: string[]; onChange: (t: string[]) => void; placeholder: string; className?: string }) {
  const [input, setInput] = useState('');
  const add = () => {
    const v = input.trim();
    if (v && !tags.includes(v)) onChange([...tags, v]);
    setInput('');
  };
  const remove = (t: string) => onChange(tags.filter(x => x !== t));

  return (
    <div className={`border border-gray-200 rounded-xl px-3 py-2 bg-white focus-within:ring-2 focus-within:ring-blue-200 focus-within:border-blue-400 transition-all ${className ?? ''}`}>
      <div className="flex flex-wrap gap-1.5 mb-1.5">
        {tags.map(t => (
          <span key={t} className="flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 text-xs font-medium px-2 py-0.5 rounded-full">
            {t}
            <button type="button" onClick={() => remove(t)} className="hover:text-blue-900 flex-none">
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
          className="flex-1 text-sm outline-none placeholder-gray-400 bg-transparent min-w-0"
        />
        {input.trim() && (
          <button type="button" onClick={add}
            className="text-[10px] font-semibold text-blue-500 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded transition-colors flex-shrink-0">
            Add ↵
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Target companies section ─────────────────────────────────────────────────
function TargetCompaniesSection({
  companies, domains, onChange,
}: { companies: string[]; domains: string[]; onChange: (c: string[]) => void }) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const lastDomainsRef = useRef<string>('');

  const fetchSuggestions = useCallback(async (d: string[]) => {
    if (!d.length) { setSuggestions([]); return; }
    setLoadingSuggestions(true);
    try {
      const res = await fetch('/api/companies/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domains: d }),
      });
      const data = await res.json() as { companies: string[] };
      setSuggestions(data.companies ?? []);
    } finally {
      setLoadingSuggestions(false);
    }
  }, []);

  // Auto-fetch when domains change (debounced 800 ms)
  useEffect(() => {
    const key = domains.slice().sort().join('|');
    if (key === lastDomainsRef.current) return;
    lastDomainsRef.current = key;
    if (!domains.length) { setSuggestions([]); return; }
    const t = setTimeout(() => fetchSuggestions(domains), 800);
    return () => clearTimeout(t);
  }, [domains, fetchSuggestions]);

  const add = (c: string) => { if (!companies.includes(c)) onChange([...companies, c]); };
  const remove = (c: string) => onChange(companies.filter(x => x !== c));

  // Suggestions not already in the list
  const available = suggestions.filter(s => !companies.includes(s));

  return (
    <div className="space-y-3">
      {/* Current list */}
      {companies.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {companies.map(c => (
            <span key={c} className="flex items-center gap-1 bg-gray-900 text-white text-xs font-medium px-2.5 py-1 rounded-full">
              {c}
              <button type="button" onClick={() => remove(c)} className="hover:text-gray-300 flex-none ml-0.5">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Manual add input */}
      <ManualCompanyInput onAdd={add} />

      {/* Suggestions */}
      {(loadingSuggestions || available.length > 0) && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Sparkles className="w-3 h-3 text-purple-500" />
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Suggested from your domains
            </p>
            {loadingSuggestions && <Loader2 className="w-3 h-3 animate-spin text-gray-300" />}
          </div>
          <div className="flex flex-wrap gap-2">
            {loadingSuggestions && !available.length
              ? Array.from({ length: 6 }).map((_, i) => (
                  <span key={i} className="h-6 w-20 bg-gray-100 rounded-full animate-pulse" />
                ))
              : available.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => add(c)}
                    className="flex items-center gap-1 text-xs font-medium bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 px-2.5 py-1 rounded-full transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    {c}
                  </button>
                ))}
          </div>
        </div>
      )}

      {!loadingSuggestions && !available.length && !suggestions.length && domains.length > 0 && (
        <button
          type="button"
          onClick={() => fetchSuggestions(domains)}
          className="flex items-center gap-1.5 text-xs text-purple-600 hover:text-purple-800 font-medium"
        >
          <Sparkles className="w-3 h-3" /> Suggest companies from your domains
        </button>
      )}
    </div>
  );
}

function ManualCompanyInput({ onAdd }: { onAdd: (c: string) => void }) {
  const [val, setVal] = useState('');
  const submit = () => {
    const v = val.trim();
    if (v) { onAdd(v); setVal(''); }
  };
  return (
    <div className="flex items-center gap-2">
      <input
        value={val}
        onChange={e => setVal(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); submit(); } }}
        placeholder="Add a company…"
        className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-200 placeholder-gray-400"
      />
      {val.trim() && (
        <button type="button" onClick={submit}
          className="text-xs font-semibold text-white bg-gray-900 hover:bg-black px-3 py-1.5 rounded-lg transition-colors">
          Add
        </button>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Tag-based fields
  const [jobTitles, setJobTitles] = useState<string[]>([]);
  const [locationPrefs, setLocationPrefs] = useState<string[]>([]);
  const [domains, setDomains] = useState<string[]>([]);
  const [excludedCompanies, setExcludedCompanies] = useState<string[]>([]);
  const [targetCompanies, setTargetCompanies] = useState<string[]>([]);

  // Scalar fields
  const [salaryFloor, setSalaryFloor] = useState(0);
  const [roleType, setRoleType] = useState('');
  const [workStyle, setWorkStyle] = useState('');

  // Long-form
  const [resume, setResume] = useState('');
  const [profile, setProfile] = useState('');

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(data => {
        const p = data.preferences;
        setJobTitles(p.jobTitles ?? []);
        setLocationPrefs(p.locationPreferences ?? []);
        setDomains(p.domainsOfInterest ?? []);
        setExcludedCompanies(p.companiesToExclude ?? []);
        setTargetCompanies(p.targetCompanies ?? []);
        setSalaryFloor(p.salaryFloor ?? 0);
        setRoleType(p.roleType ?? '');
        setWorkStyle(p.workStyle ?? '');
        setResume(data.resume ?? '');
        setProfile(data.profile ?? '');
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        preferences: {
          jobTitles,
          salaryFloor,
          locationPreferences: locationPrefs,
          domainsOfInterest: domains,
          companiesToExclude: excludedCompanies,
          targetCompanies,
          roleType,
          workStyle,
        },
        resume,
        profile,
      }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (loading) return (
    <div className="max-w-4xl mx-auto px-6 space-y-8">
      <div className="flex justify-between items-center pb-4 border-b border-gray-100">
        <div className="space-y-2">
          <Skeleton className="h-8 w-44" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-10 w-24 rounded-xl" />
      </div>
      <SkeletonFormSection />
      <SkeletonFormSection />
      <SkeletonFormSection />
      <SkeletonFormSection />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-6 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center pb-4 border-b">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Setup Profile</h1>
          <p className="text-gray-500 text-sm mt-1">Configure your target criteria and base resume material.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-sm"
        >
          {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save All Changes'}
        </button>
      </div>

      {/* Target Preferences */}
      <section className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 space-y-6">
        <h2 className="text-lg font-bold text-gray-800">Target Preferences</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Job Titles</label>
            <p className="text-xs text-gray-400 mb-2">Press Enter or comma to add each title</p>
            <TagInput tags={jobTitles} onChange={setJobTitles} placeholder="e.g. Senior PM, Staff PM…" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Minimum Base Salary</label>
            <p className="text-xs text-gray-400 mb-2">Numeric value in USD</p>
            <input
              type="number"
              value={salaryFloor}
              onChange={e => setSalaryFloor(Number(e.target.value))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Preferred Locations</label>
            <p className="text-xs text-gray-400 mb-2">Press Enter or comma to add each</p>
            <TagInput tags={locationPrefs} onChange={setLocationPrefs} placeholder="e.g. San Francisco, Remote…" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Domains of Interest</label>
            <p className="text-xs text-gray-400 mb-2">Adding a domain auto-suggests target companies</p>
            <TagInput tags={domains} onChange={setDomains} placeholder="e.g. Identity & Access Management, AI…" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Companies to Exclude</label>
          <p className="text-xs text-gray-400 mb-2">These companies will be skipped during scanning</p>
          <TagInput tags={excludedCompanies} onChange={setExcludedCompanies} placeholder="e.g. Uber, Lyft…" />
        </div>
      </section>

      {/* Target Companies */}
      <section className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 space-y-4">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Target Companies</h2>
          <p className="text-sm text-gray-500 mt-1">
            Companies you specifically want to work at. Adds a score bonus during scanning.
            {domains.length > 0 && (
              <span className="text-purple-600"> Suggestions update automatically as you change your domains.</span>
            )}
          </p>
        </div>
        <TargetCompaniesSection
          companies={targetCompanies}
          domains={domains}
          onChange={setTargetCompanies}
        />
      </section>

      {/* North Star */}
      <section className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold mb-2 text-gray-800">North Star Profile</h2>
        <p className="text-sm text-gray-500 mb-6">
          Define your target archetypes, career goals, and anti-targets. The LLM uses this to score <strong>North Star alignment</strong> on every job.
        </p>
        <NorthStarEditor value={profile} onChange={setProfile} />
      </section>

      {/* Resume */}
      <section className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold mb-2 text-gray-800">Master Resume</h2>
        <p className="text-sm text-gray-500 mb-6">Paste your base resume in Markdown format. The LLM uses this for CV Match scoring and resume tailoring.</p>
        <textarea
          value={resume}
          onChange={e => setResume(e.target.value)}
          className="w-full h-[500px] border border-gray-200 rounded-xl p-4 font-mono text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-200"
          placeholder={'# Your Name\n\n## Experience…'}
        />
      </section>
    </div>
  );
}
