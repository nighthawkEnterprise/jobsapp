'use client';

import { useState, useEffect, useRef } from 'react';
import { Target, RefreshCw, ExternalLink, Plus, Check, ChevronDown, ChevronUp, EyeOff, RotateCcw, Search, X, Trash2 } from 'lucide-react';
import { Toast } from '@/components/Toast';
import { Skeleton } from '@/components/Skeleton';
import type { Portal } from '@/lib/scanner';

interface CompanyEntry { name: string; slug: string; ats: string; careers_url: string; }

interface JobSalary { min?: number; max?: number; currency?: string }

interface Discovery {
  company: string;
  title: string;
  url: string;
  location: string;
  score: number;
  scoreReasons: string[];
  alreadyTracked: boolean;
  salary?: JobSalary;
  postedAt?: string;
  dismissed?: boolean;
}

interface ScanCache {
  scannedAt: string;
  discoveries: Discovery[];
  errors: Array<{ company: string; error: string }>;
}

function timeAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function relativeDate(iso?: string): string | null {
  if (!iso) return null;
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

const NEW_THRESHOLD_MS = 24 * 60 * 60 * 1000;

function isNewJob(iso?: string): boolean {
  if (!iso) return false;
  return Date.now() - new Date(iso).getTime() < NEW_THRESHOLD_MS;
}

function ageInDays(iso?: string): number | null {
  if (!iso) return null;
  return (Date.now() - new Date(iso).getTime()) / 86400000;
}

function formatSalary(salary?: JobSalary): string | null {
  if (!salary || (!salary.min && !salary.max)) return null;
  const k = (n: number) => `$${Math.round(n / 1000)}k`;
  if (salary.min && salary.max) return `${k(salary.min)}–${k(salary.max)}`;
  if (salary.min) return `${k(salary.min)}+`;
  if (salary.max) return `up to ${k(salary.max)}`;
  return null;
}

function getJobTags(job: Discovery): string[] {
  const tags: string[] = [];
  for (const reason of job.scoreReasons) {
    const m = reason.match(/domain of interest "([^"]+)"/i);
    if (m) tags.push(m[1]);
  }
  if (job.location?.toLowerCase().includes('remote') && !tags.includes('Remote')) {
    tags.push('Remote');
  }
  return tags.slice(0, 4);
}

function scoreStyle(score: number): { bg: string; text: string; border: string } {
  if (score >= 4.5) return { bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200' };
  if (score >= 4.0) return { bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200' };
  if (score >= 3.5) return { bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200' };
  return               { bg: 'bg-red-50',    text: 'text-red-600',    border: 'border-red-200' };
}

function CompanyAvatar({ name }: { name: string }) {
  const palettes = [
    'bg-blue-100 text-blue-700',
    'bg-violet-100 text-violet-700',
    'bg-teal-100 text-teal-700',
    'bg-orange-100 text-orange-700',
    'bg-rose-100 text-rose-700',
    'bg-indigo-100 text-indigo-700',
    'bg-emerald-100 text-emerald-700',
    'bg-amber-100 text-amber-700',
  ];
  const idx = name.charCodeAt(0) % palettes.length;
  return (
    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-none ${palettes[idx]}`}>
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}

function FilterSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <p className="text-xs font-semibold text-gray-500 mb-2">{label}</p>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function RadioOption({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-2.5 w-full text-left group">
      <span className={`w-4 h-4 rounded-full border-2 flex-none flex items-center justify-center transition-colors ${
        active ? 'border-[#3B5BDB] bg-[#3B5BDB]' : 'border-gray-300 group-hover:border-gray-400'
      }`}>
        {active && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
      </span>
      <span className={`text-sm transition-colors ${active ? 'text-gray-900 font-semibold' : 'text-gray-500 group-hover:text-gray-700'}`}>
        {label}
      </span>
    </button>
  );
}

function CheckOption({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!checked)} className="flex items-center gap-2.5 w-full text-left group">
      <span className={`w-4 h-4 rounded border-2 flex-none flex items-center justify-center transition-colors ${
        checked ? 'border-[#3B5BDB] bg-[#3B5BDB]' : 'border-gray-300 group-hover:border-gray-400'
      }`}>
        {checked && (
          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </span>
      <span className={`text-sm transition-colors ${checked ? 'text-gray-900 font-semibold' : 'text-gray-500 group-hover:text-gray-700'}`}>
        {label}
      </span>
    </button>
  );
}

function JobCard({
  job, onAdd, isAdding, onDismiss, isDismissing, onRestore, isRestoring,
}: {
  job: Discovery;
  onAdd: (job: Discovery) => void;
  isAdding: boolean;
  onDismiss?: (job: Discovery) => void;
  isDismissing?: boolean;
  onRestore?: (job: Discovery) => void;
  isRestoring?: boolean;
}) {
  const [showReasons, setShowReasons] = useState(false);
  const tags = getJobTags(job);
  const pay = formatSalary(job.salary);
  const posted = relativeDate(job.postedAt);
  const isNew = isNewJob(job.postedAt);
  const { bg, text, border } = scoreStyle(job.score);

  return (
    <div className={`bg-white border rounded-2xl overflow-hidden transition-all ${
      job.alreadyTracked
        ? 'border-gray-100 opacity-70'
        : 'border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300'
    }`}>
      {/* Main body */}
      <div className="p-5">
        <div className="flex gap-4 items-start">

          {/* Score badge */}
          <div className={`w-16 h-16 rounded-xl flex-none flex flex-col items-center justify-center border-2 ${bg} ${border}`}>
            <span className={`text-2xl font-black leading-none ${text}`}>{job.score.toFixed(1)}</span>
            <span className="text-[9px] text-gray-400 font-medium mt-0.5">/ 5</span>
          </div>

          {/* Info */}
          <div className="flex-grow min-w-0">
            <div className="flex items-start gap-2.5">
              <CompanyAvatar name={job.company} />
              <h3 className="font-bold text-gray-900 text-[15px] leading-snug">{job.title}</h3>
            </div>
            <div className="flex items-center gap-1.5 mt-1.5 pl-[42px] text-sm flex-wrap">
              <span className="font-medium text-gray-700">{job.company}</span>
              {job.location && (
                <>
                  <span className="text-gray-300">·</span>
                  <span className="text-gray-500">{job.location}</span>
                </>
              )}
              {pay && (
                <>
                  <span className="text-gray-300">·</span>
                  <span className="text-emerald-600 font-semibold">{pay}</span>
                </>
              )}
            </div>
            {tags.length > 0 && (
              <div className="flex gap-1.5 mt-2 pl-[42px] flex-wrap">
                {tags.map(tag => (
                  <span key={tag} className="px-2.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Right column: time + dismiss */}
          <div className="flex-none flex flex-col items-end gap-1.5">
            {isNew ? (
              <span className="text-[10px] font-bold tracking-wider bg-green-100 text-green-700 px-2 py-0.5 rounded-full whitespace-nowrap">
                NEW
              </span>
            ) : posted ? (
              <span className="text-xs text-gray-400 whitespace-nowrap">{posted}</span>
            ) : null}
            <div className="flex items-center gap-0.5">
              <a
                href={job.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 text-gray-300 hover:text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                title="Open on job site"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              {onDismiss && (
                <button
                  onClick={() => onDismiss(job)}
                  disabled={isDismissing}
                  className="p-1.5 text-gray-300 hover:text-gray-500 disabled:opacity-50 rounded-lg hover:bg-gray-50 transition-colors"
                  title="Not interested"
                >
                  <EyeOff className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Score reasons */}
      {showReasons && (
        <div className="px-5 pb-4 bg-gray-50 border-t border-gray-100">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider pt-3 mb-2">
            Score breakdown
            <span className="ml-1 normal-case font-normal text-gray-300">(rule-based · AI analysis runs after you add to pipeline)</span>
          </p>
          {job.scoreReasons.length > 0 ? (
            <ul className="space-y-1">
              {job.scoreReasons.map((r, i) => (
                <li key={i} className="text-xs text-gray-500 flex items-start gap-1.5">
                  <span className="text-gray-300 mt-0.5 flex-none">·</span>
                  {r}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-gray-400">No scoring detail available.</p>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-gray-100 px-5 py-3 flex items-center justify-between">
        <button
          onClick={() => setShowReasons(v => !v)}
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          {showReasons ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          Score breakdown
        </button>

        <div className="flex items-center gap-2">
          {onRestore && (
            <button
              onClick={() => onRestore(job)}
              disabled={isRestoring}
              className="flex items-center gap-1 text-xs font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg disabled:opacity-50 transition-all"
            >
              <RotateCcw className="w-3 h-3" />
              {isRestoring ? 'Restoring…' : 'Restore'}
            </button>
          )}
          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-gray-500 hover:text-gray-700 transition-colors"
          >
            View Original
          </a>
          {job.alreadyTracked ? (
            <span className="flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg">
              <Check className="w-3 h-3" /> In Pipeline
            </span>
          ) : (
            <button
              onClick={() => onAdd(job)}
              disabled={isAdding}
              className="flex items-center gap-1.5 text-sm font-semibold bg-[#1C1F2E] text-white px-4 py-2 rounded-lg hover:bg-black disabled:opacity-50 transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              {isAdding ? 'Adding…' : 'Add to Pipeline'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function RelevantJobsPage() {
  const [cache, setCache] = useState<ScanCache | null>(null);
  const [scanning, setScanning] = useState(false);
  const [adding, setAdding] = useState<Set<string>>(new Set());
  const [dismissing, setDismissing] = useState<Set<string>>(new Set());
  const [restoring, setRestoring] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'relevant' | 'not-interested'>('relevant');

  // Filters
  const [search, setSearch] = useState('');
  const [minScore, setMinScore] = useState(0);
  const [minSalary, setMinSalary] = useState(0);
  const [maxAgeDays, setMaxAgeDays] = useState<number | null>(null);
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [myLocationsOnly, setMyLocationsOnly] = useState(false);
  const [prefLocations, setPrefLocations] = useState<string[]>([]);

  // Undated group toggle (only meaningful when a time filter is active)
  const [showUndated, setShowUndated] = useState(false);

  // Pagination
  const [visibleCount, setVisibleCount] = useState(20);

  // Portal management
  const [pageLoading, setPageLoading] = useState(true);
  const [portals, setPortals] = useState<Portal[]>([]);
  const [portalQuery, setPortalQuery] = useState('');
  const [portalResults, setPortalResults] = useState<CompanyEntry[]>([]);
  const [addingPortal, setAddingPortal] = useState<string | null>(null);
  const [removingPortal, setRemovingPortal] = useState<string | null>(null);
  const [customCompany, setCustomCompany] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [showCustomAdd, setShowCustomAdd] = useState(false);
  const portalInputRef = useRef<HTMLInputElement>(null);

  const loadPortals = () =>
    fetch('/api/scan').then(r => r.json()).then(setPortals);

  const handlePortalSearch = (q: string) => {
    setPortalQuery(q);
    if (!q.trim() || q.length < 2) { setPortalResults([]); return; }
    fetch(`/api/companies?q=${encodeURIComponent(q)}`)
      .then(r => r.json())
      .then(setPortalResults)
      .catch(() => {});
  };

  const addPortalFromDirectory = async (entry: CompanyEntry) => {
    setAddingPortal(entry.name);
    await fetch('/api/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'add', portal: { company: entry.name, careersUrl: entry.careers_url } }),
    });
    await loadPortals();
    setPortalQuery('');
    setPortalResults([]);
    setAddingPortal(null);
    setToast(`${entry.name} added to scan list`);
  };

  const addCustomPortal = async () => {
    const company = customCompany.trim();
    const careersUrl = customUrl.trim();
    if (!company || !careersUrl) return;
    setAddingPortal(company);
    await fetch('/api/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'add', portal: { company, careersUrl } }),
    });
    await loadPortals();
    setCustomCompany('');
    setCustomUrl('');
    setShowCustomAdd(false);
    setAddingPortal(null);
    setToast(`${company} added to scan list`);
  };

  const removePortal = async (company: string) => {
    setRemovingPortal(company);
    await fetch('/api/scan', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ company }),
    });
    setPortals(prev => prev.filter(p => p.company !== company));
    setRemovingPortal(null);
  };

  useEffect(() => {
    Promise.all([
      fetch('/api/scan').then(r => r.json()).then(setPortals),
      fetch('/api/scan?cache=true').then(r => r.json()).then(data => { if (data) setCache(data); }),
    ]).finally(() => setPageLoading(false));
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => { if (data?.preferences?.locationPreferences?.length) setPrefLocations(data.preferences.locationPreferences); });
  }, []);

  type StreamMsg =
    | { type: 'job'; job: Discovery }
    | { type: 'error'; company: string; error: string }
    | { type: 'done'; scannedAt: string }
    | { type: 'portals-seeded'; count: number };

  const runScan = async () => {
    setScanning(true);
    setActiveTab('relevant');
    setVisibleCount(20);
    setCache({ scannedAt: new Date().toISOString(), discoveries: [], errors: [] });
    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'discover' }),
      });
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const msg = JSON.parse(line) as StreamMsg;
            if (msg.type === 'portals-seeded') {
              loadPortals();
            } else if (msg.type === 'job') {
              setCache(prev => {
                if (!prev) return prev;
                const discoveries = [...prev.discoveries];
                const insertAt = discoveries.findIndex(d => d.score <= msg.job.score);
                if (insertAt === -1) discoveries.push(msg.job);
                else discoveries.splice(insertAt, 0, msg.job);
                return { ...prev, discoveries };
              });
            } else if (msg.type === 'error') {
              setCache(prev => prev
                ? { ...prev, errors: [...prev.errors, { company: msg.company, error: msg.error }] }
                : prev);
            } else if (msg.type === 'done') {
              setCache(prev => prev ? { ...prev, scannedAt: msg.scannedAt } : prev);
            }
          } catch { /* malformed line — skip */ }
        }
      }
    } finally {
      setScanning(false);
    }
  };

  const addToPipeline = async (job: Discovery) => {
    setAdding(prev => new Set([...prev, job.url]));
    await fetch('/api/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        company: job.company, title: job.title, location: job.location, sourceUrl: job.url,
        salary: job.salary?.max ?? job.salary?.min ?? 0,
        discoverScore: job.score,
      }),
    });
    setCache(prev => prev ? {
      ...prev,
      discoveries: prev.discoveries.map(d => d.url === job.url ? { ...d, alreadyTracked: true } : d),
    } : null);
    setAdding(prev => { const s = new Set(prev); s.delete(job.url); return s; });
    setToast(`${job.title} at ${job.company} added to pipeline`);
  };

  const dismissJob = async (job: Discovery) => {
    setDismissing(prev => new Set([...prev, job.url]));
    await fetch('/api/dismissed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: job.url }),
    });
    setCache(prev => prev ? {
      ...prev,
      discoveries: prev.discoveries.map(d => d.url === job.url ? { ...d, dismissed: true } : d),
    } : null);
    setDismissing(prev => { const s = new Set(prev); s.delete(job.url); return s; });
    setToast(`${job.title} at ${job.company} marked as not interested`);
  };

  const restoreJob = async (job: Discovery) => {
    setRestoring(prev => new Set([...prev, job.url]));
    await fetch('/api/dismissed', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: job.url }),
    });
    setCache(prev => prev ? {
      ...prev,
      discoveries: prev.discoveries.map(d => d.url === job.url ? { ...d, dismissed: false } : d),
    } : null);
    setRestoring(prev => { const s = new Set(prev); s.delete(job.url); return s; });
    setToast(`${job.title} at ${job.company} restored to relevant jobs`);
  };

  const allDiscoveries = cache?.discoveries ?? [];
  const relevantJobs = allDiscoveries.filter(j => !j.dismissed);
  const dismissedJobs = allDiscoveries.filter(j => j.dismissed);

  const filtered = relevantJobs.filter(job => {
    if (job.score < minScore) return false;
    if (minSalary > 0) {
      const top = job.salary?.max ?? job.salary?.min ?? 0;
      if (top < minSalary) return false;
    }
    if (remoteOnly && !job.location?.toLowerCase().includes('remote')) return false;
    if (myLocationsOnly && job.location && prefLocations.length > 0) {
      const loc = job.location.toLowerCase();
      const matches = prefLocations.some(p =>
        loc.includes(p.toLowerCase()) || (p.toLowerCase() === 'remote' && loc.includes('remote'))
      );
      if (!matches) return false;
    }
    if (search) {
      const q = search.toLowerCase();
      if (!job.title.toLowerCase().includes(q) && !job.company.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const hasActiveFilters = search || minScore > 0 || minSalary > 0 || maxAgeDays !== null || remoteOnly || myLocationsOnly;
  const clearFilters = () => {
    setSearch(''); setMinScore(0); setMinSalary(0); setMaxAgeDays(null); setRemoteOnly(false); setMyLocationsOnly(false);
  };

  // Partition by posted date when a time filter is active.
  // Jobs without postedAt land in `undated` (shown in a collapsible group);
  // jobs with postedAt older than the window are dropped entirely.
  const { dated, undated } = (() => {
    if (maxAgeDays === null) return { dated: filtered, undated: [] as Discovery[] };
    const d: Discovery[] = [];
    const u: Discovery[] = [];
    for (const job of filtered) {
      const age = ageInDays(job.postedAt);
      if (age === null) u.push(job);
      else if (age <= maxAgeDays) d.push(job);
    }
    return { dated: d, undated: u };
  })();

  const visibleDated = dated.slice(0, visibleCount);

  // Companies visible in current results (for highlighting in sidebar) —
  // include undated so the sidebar doesn't go dark when a freshness filter is active.
  const visibleCompanies = new Set([...dated, ...undated].map(j => j.company));

  if (pageLoading) return (
    <div className="max-w-7xl mx-auto px-6">
      <div className="mb-8 flex items-center justify-between border-b border-gray-100 pb-6">
        <div className="flex items-center gap-4">
          <Skeleton className="w-16 h-16 rounded-2xl" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <Skeleton className="h-10 w-28 rounded-xl" />
      </div>
      <div className="flex gap-8">
        <div className="w-60 flex-none space-y-4">
          <Skeleton className="h-9 w-full rounded-lg" />
          {[0,1,2,3,4].map(i => <Skeleton key={i} className="h-4 w-full" />)}
        </div>
        <div className="flex-1 space-y-3">
          {[0,1,2,3,4].map(i => (
            <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5 flex gap-4">
              <Skeleton className="w-16 h-16 rounded-xl flex-none" />
              <div className="flex-grow space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="w-8 h-8 rounded-lg flex-none" />
                  <Skeleton className="h-4 w-56" />
                </div>
                <Skeleton className="h-3 w-40 ml-10" />
                <Skeleton className="h-5 w-24 ml-10 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-6">
      {/* ── Header ── */}
      <div className="mb-6 flex items-center justify-between border-b border-gray-200 pb-5">
        <div className="flex items-center gap-4">
          <div className="bg-blue-50 text-[#3B5BDB] p-3.5 rounded-2xl">
            <Target className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 leading-tight">
              Discover <span className="text-[#3B5BDB]">Jobs</span>
            </h1>
            {cache ? (
              <p className="text-gray-500 text-sm mt-0.5">
                Last scanned {timeAgo(cache.scannedAt)}
                {' · '}
                <span className="font-medium text-gray-700">{relevantJobs.length} roles</span>
                {' across target companies'}
              </p>
            ) : (
              <p className="text-gray-500 text-sm mt-0.5">Scan your target companies for PM roles</p>
            )}
          </div>
        </div>
        <button
          onClick={runScan}
          disabled={scanning}
          className="flex items-center gap-2 bg-[#1C1F2E] text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${scanning ? 'animate-spin' : ''}`} />
          {scanning ? 'Scanning…' : cache ? 'Refresh' : 'Scan now'}
        </button>
      </div>

      <div className="flex gap-8 items-start">
        {/* ── Sidebar ── */}
        <aside className="w-60 flex-none sticky top-24 space-y-6">

          {/* Advanced Filters */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4">Advanced Filters</p>

            {/* Search */}
            <div className="relative mb-5">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search title or company…"
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 placeholder-gray-400"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <FilterSection label="Min Score">
              <RadioOption label="Any"  active={minScore === 0}   onClick={() => setMinScore(0)} />
              <RadioOption label="3.5+" active={minScore === 3.5} onClick={() => setMinScore(3.5)} />
              <RadioOption label="4.0+" active={minScore === 4.0} onClick={() => setMinScore(4.0)} />
              <RadioOption label="4.5+" active={minScore === 4.5} onClick={() => setMinScore(4.5)} />
            </FilterSection>

            <FilterSection label="Salary">
              <RadioOption label="Any"    active={minSalary === 0}      onClick={() => setMinSalary(0)} />
              <RadioOption label="$150k+" active={minSalary === 150000} onClick={() => setMinSalary(150000)} />
              <RadioOption label="$200k+" active={minSalary === 200000} onClick={() => setMinSalary(200000)} />
              <RadioOption label="$250k+" active={minSalary === 250000} onClick={() => setMinSalary(250000)} />
            </FilterSection>

            <FilterSection label="Posted">
              <RadioOption label="Any"      active={maxAgeDays === null} onClick={() => { setMaxAgeDays(null); setVisibleCount(20); }} />
              <RadioOption label="Last 24h" active={maxAgeDays === 1}    onClick={() => { setMaxAgeDays(1);    setVisibleCount(20); }} />
              <RadioOption label="3 days"   active={maxAgeDays === 3}    onClick={() => { setMaxAgeDays(3);    setVisibleCount(20); }} />
              <RadioOption label="7 days"   active={maxAgeDays === 7}    onClick={() => { setMaxAgeDays(7);    setVisibleCount(20); }} />
              <RadioOption label="14 days"  active={maxAgeDays === 14}   onClick={() => { setMaxAgeDays(14);   setVisibleCount(20); }} />
            </FilterSection>

            <div className="space-y-2">
              <CheckOption label="Remote only"     checked={remoteOnly}      onChange={setRemoteOnly} />
              {prefLocations.length > 0 && (
                <CheckOption label="My locations only" checked={myLocationsOnly} onChange={setMyLocationsOnly} />
              )}
            </div>

            {hasActiveFilters && (
              <button onClick={clearFilters} className="mt-4 text-xs text-[#3B5BDB] hover:text-blue-700 font-medium">
                Clear filters
              </button>
            )}
          </div>

          <div className="h-px bg-gray-100" />

          {/* Watching list */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
              Watching ({portals.length})
            </p>

            {/* Portal list */}
            {portals.length > 0 && (
              <div className="space-y-0.5 max-h-64 overflow-y-auto -mx-2">
                {portals.map(p => {
                  const active = visibleCompanies.has(p.company);
                  return (
                    <div
                      key={p.company}
                      className={`flex items-center justify-between group px-2 py-1.5 rounded-lg transition-colors ${
                        active ? 'bg-blue-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <span className={`text-sm truncate ${active ? 'text-[#3B5BDB] font-semibold' : 'text-gray-600'}`}>
                        {p.company}
                      </span>
                      <button
                        onClick={() => removePortal(p.company)}
                        disabled={removingPortal === p.company}
                        className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all disabled:opacity-50 flex-none ml-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Add company */}
            <div className="relative mt-3">
              <div className="flex items-center gap-1.5 border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white focus-within:ring-2 focus-within:ring-blue-200 focus-within:border-blue-400 transition-all">
                <Search className="w-3.5 h-3.5 text-gray-400 flex-none" />
                <input
                  ref={portalInputRef}
                  value={portalQuery}
                  onChange={e => handlePortalSearch(e.target.value)}
                  placeholder="Find a company…"
                  className="flex-1 text-sm outline-none placeholder-gray-400 min-w-0 bg-transparent"
                />
                {portalQuery && (
                  <button onClick={() => { setPortalQuery(''); setPortalResults([]); }} className="text-gray-300 hover:text-gray-500">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              {portalResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
                  {portalResults.map(entry => {
                    const alreadyAdded = portals.some(p => p.company === entry.name);
                    return (
                      <button
                        key={entry.name}
                        onClick={() => !alreadyAdded && addPortalFromDirectory(entry)}
                        disabled={alreadyAdded || addingPortal === entry.name}
                        className={`w-full flex items-center justify-between px-3 py-2 text-left transition-colors ${
                          alreadyAdded ? 'opacity-50 cursor-default' : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{entry.name}</p>
                          <p className="text-[10px] text-gray-400 uppercase tracking-wide">{entry.ats}</p>
                        </div>
                        {alreadyAdded
                          ? <Check className="w-3.5 h-3.5 text-green-500 flex-none" />
                          : addingPortal === entry.name
                            ? <RefreshCw className="w-3.5 h-3.5 text-blue-400 animate-spin flex-none" />
                            : <Plus className="w-3.5 h-3.5 text-gray-400 flex-none" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              onClick={() => setShowCustomAdd(v => !v)}
              className="mt-2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showCustomAdd ? '− Cancel' : '+ Custom URL'}
            </button>
            {showCustomAdd && (
              <div className="space-y-2 mt-2">
                <input value={customCompany} onChange={e => setCustomCompany(e.target.value)}
                  placeholder="Company name"
                  className="w-full text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-200 placeholder-gray-400" />
                <input value={customUrl} onChange={e => setCustomUrl(e.target.value)}
                  placeholder="Greenhouse / Ashby / Lever URL"
                  className="w-full text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-200 placeholder-gray-400"
                  onKeyDown={e => { if (e.key === 'Enter') addCustomPortal(); }} />
                <button onClick={addCustomPortal} disabled={!customCompany.trim() || !customUrl.trim() || !!addingPortal}
                  className="w-full py-1.5 bg-gray-900 text-white rounded-lg text-xs font-semibold hover:bg-black disabled:opacity-40 transition-all">
                  {addingPortal ? 'Adding…' : 'Add'}
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* ── Main content ── */}
        <div className="flex-1 min-w-0">

          {/* Streaming banner */}
          {scanning && (
            <div className="mb-4 flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-700">
              <RefreshCw className="w-4 h-4 animate-spin flex-none" />
              <span>Scanning job boards… results appearing as they come in</span>
              {cache && cache.discoveries.length > 0 && (
                <span className="ml-auto font-semibold">{cache.discoveries.length} found so far</span>
              )}
            </div>
          )}

          {/* Empty state */}
          {!cache && !scanning && (
            <div className="p-16 border border-dashed rounded-2xl text-center text-gray-400 bg-white">
              <Target className="w-10 h-10 mx-auto mb-3 text-gray-300" />
              <p className="font-semibold text-gray-500">No scan results yet</p>
              <p className="text-sm mt-1">Click &ldquo;Scan now&rdquo; to check all target companies for PM roles.</p>
            </div>
          )}

          {/* Tabs */}
          {cache && (
            <div className="flex items-center gap-1 mb-4 border-b border-gray-200">
              <button
                onClick={() => { setActiveTab('relevant'); setVisibleCount(20); }}
                className={`px-4 py-2.5 text-sm font-semibold transition-colors border-b-2 -mb-px ${
                  activeTab === 'relevant'
                    ? 'border-[#3B5BDB] text-[#3B5BDB]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Relevant
                <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                  activeTab === 'relevant' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'
                }`}>
                  {dated.length + undated.length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('not-interested')}
                className={`px-4 py-2.5 text-sm font-semibold transition-colors border-b-2 -mb-px ${
                  activeTab === 'not-interested'
                    ? 'border-gray-500 text-gray-700'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Not Interested
                {dismissedJobs.length > 0 && (
                  <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                    activeTab === 'not-interested' ? 'bg-gray-200 text-gray-600' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {dismissedJobs.length}
                  </span>
                )}
              </button>
            </div>
          )}

          {/* Relevant tab */}
          {cache && activeTab === 'relevant' && (
            <>
              <div className="space-y-3">
                {!scanning && dated.length === 0 && (
                  <div className="p-10 border border-dashed rounded-2xl text-center text-gray-400 bg-white">
                    {undated.length > 0
                      ? `No jobs match the freshness filter — ${undated.length} undated job${undated.length === 1 ? '' : 's'} available below.`
                      : hasActiveFilters
                        ? 'No jobs match your current filters — try relaxing the score, salary, or freshness threshold.'
                        : 'All relevant PM roles are already in your pipeline.'}
                  </div>
                )}
                {visibleDated.map(job => (
                  <JobCard
                    key={job.url}
                    job={job}
                    onAdd={addToPipeline}
                    isAdding={adding.has(job.url)}
                    onDismiss={dismissJob}
                    isDismissing={dismissing.has(job.url)}
                  />
                ))}
              </div>

              {/* Load More */}
              {dated.length > visibleCount && (
                <div className="mt-6 flex justify-center">
                  <button
                    onClick={() => setVisibleCount(n => n + 20)}
                    className="px-8 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:border-gray-300 hover:bg-white bg-gray-50 transition-all"
                  >
                    Load More Jobs
                    <span className="ml-2 text-gray-400 font-normal">({dated.length - visibleCount} remaining)</span>
                  </button>
                </div>
              )}

              {/* Undated group — only meaningful when a time filter is active */}
              {undated.length > 0 && (
                <div className="mt-8 border-t border-gray-200 pt-5">
                  <button
                    onClick={() => setShowUndated(v => !v)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-700 mb-3"
                  >
                    {showUndated ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    Undated · {undated.length} job{undated.length === 1 ? '' : 's'}
                    <span className="text-gray-400 font-normal ml-1">(date not reported by source)</span>
                  </button>
                  {showUndated && (
                    <div className="space-y-3">
                      {undated.map(job => (
                        <JobCard
                          key={job.url}
                          job={job}
                          onAdd={addToPipeline}
                          isAdding={adding.has(job.url)}
                          onDismiss={dismissJob}
                          isDismissing={dismissing.has(job.url)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Not Interested tab */}
          {cache && activeTab === 'not-interested' && (
            <>
              {dismissedJobs.length === 0 ? (
                <div className="p-12 border border-dashed rounded-2xl text-center text-gray-400 bg-white">
                  <EyeOff className="w-8 h-8 mx-auto mb-3 text-gray-300" />
                  <p className="font-semibold text-gray-500">No dismissed jobs</p>
                  <p className="text-sm mt-1">
                    Click the <EyeOff className="w-3 h-3 inline" /> icon on any job to mark it as not interested.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {dismissedJobs.map(job => (
                    <JobCard
                      key={job.url}
                      job={job}
                      onAdd={addToPipeline}
                      isAdding={adding.has(job.url)}
                      onRestore={restoreJob}
                      isRestoring={restoring.has(job.url)}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </div>
  );
}
