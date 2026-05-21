'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Plus, Sparkles, Loader2, Check, Shield, FileText, Target, BarChart2, Star } from 'lucide-react';
import { NorthStarEditor } from '@/components/NorthStarEditor';
import { Skeleton, SkeletonFormSection } from '@/components/Skeleton';
import { useOnboardingGuard } from '@/hooks/useOnboardingGuard';

const LOCATION_PRESETS = [
  'San Francisco', 'New York', 'Austin', 'Seattle',
  'Los Angeles', 'Boston', 'Chicago', 'London', 'Remote',
];

const COMPANY_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700',
  'bg-violet-100 text-violet-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-cyan-100 text-cyan-700',
  'bg-orange-100 text-orange-700',
  'bg-indigo-100 text-indigo-700',
];

function companyColor(name: string) {
  return COMPANY_COLORS[name.toLowerCase().charCodeAt(0) % COMPANY_COLORS.length];
}

function companyInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

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
    <div className="space-y-2">
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map(t => (
            <span key={t} className="flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 text-xs font-medium px-2.5 py-1 rounded-full">
              {t}
              <button type="button" onClick={() => onChange(tags.filter(x => x !== t))} className="hover:text-blue-900 flex-none">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex items-center gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') { e.preventDefault(); add(); }
            if (e.key === ',' && input) { e.preventDefault(); add(); }
          }}
          placeholder={placeholder}
          className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 placeholder-gray-400 bg-white"
        />
        {input.trim() && (
          <button type="button" onClick={add}
            className="text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 px-3 py-2.5 rounded-xl transition-colors flex-shrink-0">
            Add
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Location chips ───────────────────────────────────────────────────────────
function LocationChips({ locations, onChange }: {
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
      <div className="flex flex-wrap gap-2">
        {LOCATION_PRESETS.map(loc => {
          const selected = locations.includes(loc);
          return (
            <button key={loc} type="button" onClick={() => toggle(loc)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                selected
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:bg-blue-50'
              }`}>
              {selected && <Check className="w-3 h-3" />}
              {loc}
            </button>
          );
        })}
      </div>
      {customLocations.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {customLocations.map(loc => (
            <span key={loc} className="flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 text-xs font-medium px-2.5 py-1 rounded-full">
              {loc}
              <button type="button" onClick={() => toggle(loc)} className="hover:text-blue-900 flex-none"><X className="w-3 h-3" /></button>
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input
          value={custom}
          onChange={e => setCustom(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustom(); } }}
          placeholder="Other city or region…"
          className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 placeholder-gray-400"
        />
        <button type="button" onClick={addCustom} disabled={!custom.trim()}
          className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-xl disabled:opacity-40 transition-all">
          Add
        </button>
      </div>
    </div>
  );
}

// ─── Inline exclude input ─────────────────────────────────────────────────────
function ExcludeInput({ onAdd }: { onAdd: (c: string) => void }) {
  const [val, setVal] = useState('');
  const [open, setOpen] = useState(false);
  const submit = () => {
    if (val.trim()) onAdd(val.trim());
    setVal('');
    setOpen(false);
  };
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)}
        className="flex items-center gap-1 text-xs font-medium text-gray-400 border border-dashed border-gray-200 hover:border-gray-300 hover:text-gray-600 px-2.5 py-1 rounded-full transition-colors">
        <Plus className="w-3 h-3" /> Add
      </button>
    );
  }
  return (
    <input
      autoFocus
      value={val}
      onChange={e => setVal(e.target.value)}
      onKeyDown={e => {
        if (e.key === 'Enter') { e.preventDefault(); submit(); }
        if (e.key === 'Escape') { setOpen(false); setVal(''); }
      }}
      onBlur={submit}
      placeholder="Company name…"
      className="text-xs border border-red-200 rounded-full px-2.5 py-1 w-28 focus:outline-none focus:ring-1 focus:ring-red-200 bg-red-50/50"
    />
  );
}

// ─── Company avatar grid ──────────────────────────────────────────────────────
function CompanyGrid({ companies, domains, onChange }: {
  companies: string[];
  domains: string[];
  onChange: (c: string[]) => void;
}) {
  const [newCompany, setNewCompany] = useState('');
  const [adding, setAdding] = useState(false);
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

  useEffect(() => {
    const key = domains.slice().sort().join('|');
    if (key === lastDomainsRef.current) return;
    lastDomainsRef.current = key;
    if (!domains.length) { setSuggestions([]); return; }
    const t = setTimeout(() => fetchSuggestions(domains), 800);
    return () => clearTimeout(t);
  }, [domains, fetchSuggestions]);

  const add = (c: string) => {
    const v = c.trim();
    if (v && !companies.includes(v)) onChange([...companies, v]);
    setNewCompany('');
    setAdding(false);
  };

  const remove = (c: string) => onChange(companies.filter(x => x !== c));
  const available = suggestions.filter(s => !companies.includes(s));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        {companies.map(c => (
          <div key={c} className="flex flex-col items-center gap-1.5 relative group cursor-default">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm select-none ${companyColor(c)}`}>
              {companyInitials(c)}
            </div>
            <span className="text-[10px] text-gray-500 font-medium max-w-[52px] truncate text-center leading-tight">{c}</span>
            <button type="button" onClick={() => remove(c)}
              className="absolute -top-1 -right-1 w-4 h-4 bg-white border border-gray-200 hover:bg-red-50 hover:border-red-200 hover:text-red-500 rounded-full hidden group-hover:flex items-center justify-center shadow-sm transition-colors">
              <X className="w-2.5 h-2.5" />
            </button>
          </div>
        ))}

        {adding ? (
          <div className="flex flex-col items-center gap-1.5">
            <input
              autoFocus
              value={newCompany}
              onChange={e => setNewCompany(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') { e.preventDefault(); add(newCompany); }
                if (e.key === 'Escape') { setAdding(false); setNewCompany(''); }
              }}
              onBlur={() => { if (newCompany.trim()) add(newCompany); else setAdding(false); }}
              placeholder="Name…"
              className="w-16 h-12 rounded-xl border-2 border-blue-300 bg-blue-50 text-xs text-center focus:outline-none focus:border-blue-500"
            />
            <span className="text-[10px] text-blue-500 font-medium">↵ to add</span>
          </div>
        ) : (
          <button type="button" onClick={() => setAdding(true)} className="flex flex-col items-center gap-1.5 group">
            <div className="w-12 h-12 rounded-xl border-2 border-dashed border-gray-200 hover:border-blue-300 hover:bg-blue-50 flex items-center justify-center transition-all">
              <Plus className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition-colors" />
            </div>
            <span className="text-[10px] text-gray-400 group-hover:text-blue-500 font-medium">Add</span>
          </button>
        )}
      </div>

      {(loadingSuggestions || available.length > 0) && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Sparkles className="w-3 h-3 text-violet-500" />
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Suggested from your domains</p>
            {loadingSuggestions && <Loader2 className="w-3 h-3 animate-spin text-gray-300" />}
          </div>
          <div className="flex flex-wrap gap-2">
            {loadingSuggestions && !available.length
              ? Array.from({ length: 5 }).map((_, i) => <span key={i} className="h-6 w-16 bg-gray-100 rounded-full animate-pulse" />)
              : available.map(c => (
                  <button key={c} type="button" onClick={() => onChange([...companies, c])}
                    className="flex items-center gap-1 text-xs font-medium bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200 px-2.5 py-1 rounded-full transition-colors">
                    <Plus className="w-3 h-3" /> {c}
                  </button>
                ))}
          </div>
        </div>
      )}

      {!loadingSuggestions && !available.length && !suggestions.length && domains.length > 0 && (
        <button type="button" onClick={() => fetchSuggestions(domains)}
          className="flex items-center gap-1.5 text-xs text-violet-600 hover:text-violet-800 font-medium">
          <Sparkles className="w-3 h-3" /> Suggest companies from your domains
        </button>
      )}
    </div>
  );
}

// ─── Sidebar nav ──────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: 'career-profile', label: 'Career Profile', icon: Target },
  { id: 'market-preferences', label: 'Market Preferences', icon: BarChart2 },
  { id: 'north-star', label: 'North Star', icon: Star },
  { id: 'resume', label: 'Master Resume', icon: FileText },
];

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  useOnboardingGuard();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeSection, setActiveSection] = useState('career-profile');

  const [jobTitles, setJobTitles] = useState<string[]>([]);
  const [locationPrefs, setLocationPrefs] = useState<string[]>([]);
  const [domains, setDomains] = useState<string[]>([]);
  const [excludedCompanies, setExcludedCompanies] = useState<string[]>([]);
  const [targetCompanies, setTargetCompanies] = useState<string[]>([]);
  const [salaryFloor, setSalaryFloor] = useState(0);
  const [roleType, setRoleType] = useState('');
  const [workStyle, setWorkStyle] = useState('');
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
    setTimeout(() => setSaved(false), 2500);
  };

  const completionItems = [
    jobTitles.length > 0,
    salaryFloor > 0,
    locationPrefs.length > 0,
    domains.length > 0,
    targetCompanies.length > 0,
    profile.trim().length > 50,
    resume.trim().length > 100,
  ];
  const completion = Math.round((completionItems.filter(Boolean).length / completionItems.length) * 100);

  if (loading) return (
    <div className="max-w-5xl mx-auto px-6 space-y-8">
      <div className="flex justify-between items-center py-8 border-b border-gray-100">
        <div className="space-y-2">
          <Skeleton className="h-8 w-44" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-10 w-32 rounded-xl" />
      </div>
      <div className="grid grid-cols-[220px_1fr] gap-8">
        <Skeleton className="h-64 rounded-2xl" />
        <div className="space-y-6">
          <SkeletonFormSection />
          <SkeletonFormSection />
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-6 pb-16">

      {/* Header */}
      <div className="flex items-center justify-between py-8 mb-2 border-b border-gray-100">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Setup Profile</h1>
          <p className="text-sm text-gray-500 mt-0.5">Configure your target criteria and base resume material</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm ${
            saved
              ? 'bg-green-600 text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60'
          }`}
        >
          {saving
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
            : saved
            ? <><Check className="w-4 h-4" /> Saved</>
            : 'Save All Changes'
          }
        </button>
      </div>

      <div className="grid grid-cols-[220px_1fr] gap-8 items-start pt-6">

        {/* Sidebar */}
        <aside className="sticky top-24 space-y-4">

          {/* Progress */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-500">Profile complete</span>
              <span className="text-sm font-extrabold text-gray-900">{completion}%</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${completion}%`,
                  background: completion === 100 ? '#16a34a' : '#3B5BDB',
                }}
              />
            </div>
          </div>

          {/* Nav */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <nav className="py-1">
              {NAV_ITEMS.map(item => {
                const Icon = item.icon;
                const active = activeSection === item.id;
                return (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    onClick={() => setActiveSection(item.id)}
                    className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors border-l-2 ${
                      active
                        ? 'bg-blue-50 text-blue-700 border-blue-600'
                        : 'text-gray-600 hover:bg-gray-50 border-transparent'
                    }`}
                  >
                    <Icon className={`w-4 h-4 flex-none ${active ? 'text-blue-600' : 'text-gray-400'}`} />
                    {item.label}
                  </a>
                );
              })}
            </nav>
            <div className="px-4 pb-4 pt-2 border-t border-gray-50">
              <button
                type="button"
                className="w-full py-2 text-xs font-semibold text-gray-500 border border-gray-200 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all"
              >
                Verify Profile
              </button>
            </div>
          </div>

          {/* Privacy */}
          <div className="flex items-start gap-2 px-1">
            <Shield className="w-3.5 h-3.5 text-gray-300 flex-none mt-0.5" />
            <p className="text-xs text-gray-400 leading-relaxed">
              Your data is encrypted at rest and never shared with third parties.
            </p>
          </div>
        </aside>

        {/* Main content */}
        <main className="space-y-6 min-w-0">

          {/* Career Profile */}
          <section id="career-profile" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 space-y-7 scroll-mt-28">
            <div className="pb-4 border-b border-gray-50">
              <h2 className="text-base font-bold text-gray-900">Target Career Profile</h2>
              <p className="text-sm text-gray-500 mt-0.5">The roles and criteria you're actively targeting</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Job Titles</label>
              <TagInput
                tags={jobTitles}
                onChange={setJobTitles}
                placeholder="e.g. Senior PM, Staff Product Manager — press Enter to add"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Min Salary</label>
              <div className="relative max-w-[200px]">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium select-none">$</span>
                <input
                  type="number"
                  value={salaryFloor || ''}
                  onChange={e => setSalaryFloor(Number(e.target.value))}
                  placeholder="200000"
                  className="w-full pl-7 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Preferred Locations</label>
              <LocationChips locations={locationPrefs} onChange={setLocationPrefs} />
            </div>
          </section>

          {/* Market Preferences */}
          <section id="market-preferences" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 space-y-7 scroll-mt-28">
            <div className="pb-4 border-b border-gray-50">
              <h2 className="text-base font-bold text-gray-900">Market Preferences</h2>
              <p className="text-sm text-gray-500 mt-0.5">Industries, companies, and organizations you care about</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Domains of Interest</label>
              <TagInput
                tags={domains}
                onChange={setDomains}
                placeholder="e.g. AI/ML, Developer Tools, FinTech — press Enter"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Prioritized Companies</label>
              <p className="text-xs text-gray-400 mb-4">
                Adds a score bonus during scanning.{domains.length > 0 && (
                  <span className="text-violet-600"> Suggestions auto-update as you change your domains.</span>
                )}
              </p>
              <CompanyGrid companies={targetCompanies} domains={domains} onChange={setTargetCompanies} />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Exclude Companies</label>
              <p className="text-xs text-gray-400 mb-3">Skipped during scanning entirely</p>
              <div className="flex flex-wrap gap-2">
                {excludedCompanies.map(c => (
                  <span key={c} className="flex items-center gap-1 bg-red-50 text-red-700 border border-red-200 text-xs font-medium px-2.5 py-1 rounded-full">
                    {c}
                    <button type="button" onClick={() => setExcludedCompanies(excludedCompanies.filter(x => x !== c))} className="hover:text-red-900 flex-none">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                <ExcludeInput onAdd={c => setExcludedCompanies(prev => [...prev, c])} />
              </div>
            </div>
          </section>

          {/* North Star */}
          <section id="north-star" className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm scroll-mt-28">
            <div className="bg-gradient-to-r from-[#0D1B3E] to-[#162550] px-6 py-5">
              <h2 className="text-xs font-extrabold text-white uppercase tracking-widest">The North Star</h2>
              <p className="text-sm text-blue-200/60 mt-1">Your career narrative, target archetypes, and anti-targets</p>
            </div>
            <div className="bg-white p-8">
              <NorthStarEditor value={profile} onChange={setProfile} />
            </div>
          </section>

          {/* Resume */}
          <section id="resume" className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden scroll-mt-28">
            <div className="px-8 py-6 border-b border-gray-50">
              <h2 className="text-base font-bold text-gray-900">Master Resume</h2>
              <p className="text-sm text-gray-500 mt-0.5">Your base resume in Markdown. Used for CV tailoring and role scoring.</p>
            </div>
            <div className="p-8">
              <textarea
                value={resume}
                onChange={e => setResume(e.target.value)}
                className="w-full h-96 border border-gray-200 rounded-xl p-4 font-mono text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none bg-white"
                placeholder={'# Your Name\n\n## Experience…'}
              />
            </div>
          </section>

        </main>
      </div>
    </div>
  );
}
