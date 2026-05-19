'use client';

import { useState, useEffect } from 'react';
import { Target, RefreshCw, ExternalLink, Plus, Check, AlertCircle, ChevronDown, ChevronUp, EyeOff, RotateCcw } from 'lucide-react';
import { Toast } from '@/components/Toast';

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
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

function formatSalary(salary?: JobSalary): string | null {
  if (!salary || (!salary.min && !salary.max)) return null;
  const k = (n: number) => `$${Math.round(n / 1000)}k`;
  if (salary.min && salary.max) return `${k(salary.min)}–${k(salary.max)}`;
  if (salary.min) return `${k(salary.min)}+`;
  if (salary.max) return `up to ${k(salary.max)}`;
  return null;
}

function platformFromUrl(url: string): string {
  if (url.includes('greenhouse.io')) return 'greenhouse';
  if (url.includes('ashbyhq.com'))   return 'ashby';
  if (url.includes('lever.co'))      return 'lever';
  return 'other';
}

function scoreColor(score: number) {
  if (score >= 4.5) return { bg: 'bg-green-50 border-green-200', text: 'text-green-700', ring: 'hover:ring-green-300' };
  if (score >= 4.0) return { bg: 'bg-blue-50 border-blue-100',   text: 'text-blue-600',  ring: 'hover:ring-blue-300' };
  if (score >= 3.5) return { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', ring: 'hover:ring-amber-300' };
  return             { bg: 'bg-red-50 border-red-200',           text: 'text-red-600',   ring: 'hover:ring-red-300' };
}

function JobCard({
  job,
  onAdd,
  isAdding,
  onDismiss,
  isDismissing,
  onRestore,
  isRestoring,
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
  const [expanded, setExpanded] = useState(false);
  const [description, setDescription] = useState<string | null>(null);
  const [loadingDesc, setLoadingDesc] = useState(false);
  const canFetchJD = platformFromUrl(job.url) !== 'other';

  const toggleDescription = async () => {
    if (!expanded && description === null) {
      setLoadingDesc(true);
      try {
        const res = await fetch('/api/fetch-jd', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: job.url }),
        });
        const data = await res.json() as { description: string; unsupported: boolean };
        if (data.description) {
          setDescription(data.description);
        } else if (data.unsupported) {
          setLoadingDesc(false);
          window.open(job.url, '_blank', 'noopener,noreferrer');
          return;
        } else {
          setDescription('(Could not load description — the job page may require login or the URL may have changed.)');
        }
      } catch {
        setDescription('(Failed to load description — check your connection.)');
      } finally {
        setLoadingDesc(false);
      }
    }
    setExpanded(v => !v);
  };

  const { bg, text, ring } = scoreColor(job.score);
  const pay = formatSalary(job.salary);
  const posted = relativeDate(job.postedAt);

  return (
    <div className={`bg-white border rounded-xl ${job.alreadyTracked ? 'opacity-50' : 'shadow-sm hover:shadow-md transition-shadow'}`}>
      {/* Main row */}
      <div className="px-5 py-4 flex items-center gap-4">

        {/* Clickable score badge */}
        <button
          onClick={() => setShowReasons(v => !v)}
          title="Click to see score breakdown"
          className={`flex-none flex flex-col items-center justify-center h-14 w-14 rounded-lg border transition-all ring-2 ring-transparent ${bg} ${ring} ${showReasons ? 'ring-opacity-100' : 'ring-opacity-0'}`}
        >
          <div className={`text-lg font-black leading-none ${text}`}>{job.score.toFixed(1)}</div>
          <div className="text-[8px] font-bold uppercase tracking-wider text-gray-400 mt-0.5">/ 5</div>
        </button>

        {/* Title + meta */}
        <div className="flex-grow min-w-0">
          <div className="font-semibold text-gray-900 truncate">{job.title}</div>
          <div className="flex items-center gap-2 flex-wrap mt-0.5">
            <span className="text-sm text-gray-500">
              {job.company}{job.location ? <> &middot; {job.location}</> : null}
            </span>
            {pay && (
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                {pay}
              </span>
            )}
            {posted && (
              <span className="text-xs text-gray-400">{posted}</span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex-none flex items-center gap-1.5">
          <button
            onClick={canFetchJD ? toggleDescription : () => window.open(job.url, '_blank', 'noopener,noreferrer')}
            className="p-2 text-gray-400 hover:text-gray-700 transition-colors"
            title={canFetchJD ? (expanded ? 'Hide description' : 'Show description') : 'Open on job site'}
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-gray-400 hover:text-gray-700 transition-colors"
            title="Open job posting"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
          {onDismiss && (
            <button
              onClick={() => onDismiss(job)}
              disabled={isDismissing}
              className="p-2 text-gray-300 hover:text-gray-500 disabled:opacity-50 transition-colors"
              title="Not interested"
            >
              <EyeOff className="w-4 h-4" />
            </button>
          )}
          {onRestore && (
            <button
              onClick={() => onRestore(job)}
              disabled={isRestoring}
              className="flex items-center gap-1 text-xs font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200 border border-gray-200 px-3 py-1.5 rounded-lg disabled:opacity-50 transition-all"
              title="Restore to relevant jobs"
            >
              <RotateCcw className="w-3 h-3" />
              {isRestoring ? 'Restoring…' : 'Restore'}
            </button>
          )}
          {job.alreadyTracked ? (
            <span className="flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg">
              <Check className="w-3 h-3" /> Tracked
            </span>
          ) : (
            <button
              onClick={() => onAdd(job)}
              disabled={isAdding}
              className="flex items-center gap-1.5 text-xs font-semibold bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all"
            >
              <Plus className="w-3 h-3" />
              {isAdding ? 'Adding…' : 'Add to Pipeline'}
            </button>
          )}
        </div>
      </div>

      {/* Score reasons panel */}
      {showReasons && (
        <div className="px-5 pb-4 border-t border-gray-50">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider pt-3 mb-2">
            Discover Score Breakdown
            <span className="ml-1 normal-case font-normal text-gray-300">(rule-based — add JD for full LLM analysis)</span>
          </p>
          {job.scoreReasons.length > 0 ? (
            <ul className="space-y-1">
              {job.scoreReasons.map((r, i) => (
                <li key={i} className="text-xs text-gray-500 flex items-start gap-1.5">
                  <span className="text-gray-300 mt-0.5">•</span>
                  {r}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-gray-400">No scoring detail available.</p>
          )}
        </div>
      )}

      {/* Description panel */}
      {expanded && (
        <div className="px-5 pb-5 border-t border-gray-100">
          {loadingDesc ? (
            <div className="pt-4 text-xs text-gray-400 flex items-center gap-2">
              <RefreshCw className="w-3 h-3 animate-spin" /> Loading description…
            </div>
          ) : (
            <p className="pt-4 text-sm text-gray-700 leading-relaxed whitespace-pre-line">
              {description}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function FilterSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">{label}</p>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function RadioOption({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-2.5 w-full text-left group">
      <span className={`w-3.5 h-3.5 rounded-full border-2 flex-none transition-colors ${
        active ? 'border-blue-500 bg-blue-500' : 'border-gray-300 group-hover:border-gray-400'
      }`}>
        {active && <span className="block w-1 h-1 rounded-full bg-white mx-auto mt-[2px]" />}
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
      <span className={`w-3.5 h-3.5 rounded border-2 flex-none flex items-center justify-center transition-colors ${
        checked ? 'border-blue-500 bg-blue-500' : 'border-gray-300 group-hover:border-gray-400'
      }`}>
        {checked && (
          <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
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

export default function RelevantJobsPage() {
  const [cache, setCache] = useState<ScanCache | null>(null);
  const [scanning, setScanning] = useState(false);
  const [adding, setAdding] = useState<Set<string>>(new Set());
  const [dismissing, setDismissing] = useState<Set<string>>(new Set());
  const [restoring, setRestoring] = useState<Set<string>>(new Set());
  const [showErrors, setShowErrors] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'relevant' | 'not-interested'>('relevant');

  // Filters
  const [search, setSearch] = useState('');
  const [minScore, setMinScore] = useState(0);
  const [minSalary, setMinSalary] = useState(0);
  const [postedWithin, setPostedWithin] = useState(0);
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [hideTracked, setHideTracked] = useState(false);

  useEffect(() => {
    fetch('/api/scan?cache=true')
      .then(res => res.json())
      .then(data => { if (data) setCache(data); });
  }, []);

  type StreamMsg =
    | { type: 'job'; job: Discovery }
    | { type: 'error'; company: string; error: string }
    | { type: 'done'; scannedAt: string };

  const runScan = async () => {
    setScanning(true);
    setActiveTab('relevant');
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
            if (msg.type === 'job') {
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
    if (hideTracked && job.alreadyTracked) return false;
    if (job.score < minScore) return false;
    if (minSalary > 0) {
      const top = job.salary?.max ?? job.salary?.min ?? 0;
      if (top < minSalary) return false;
    }
    if (postedWithin > 0) {
      if (!job.postedAt) return false;
      const days = (Date.now() - new Date(job.postedAt).getTime()) / 86400000;
      if (days > postedWithin) return false;
    }
    if (remoteOnly && !job.location?.toLowerCase().includes('remote')) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!job.title.toLowerCase().includes(q) && !job.company.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const hasActiveFilters = search || minScore > 0 || minSalary > 0 || postedWithin > 0 || remoteOnly || hideTracked;

  const clearFilters = () => {
    setSearch('');
    setMinScore(0);
    setMinSalary(0);
    setPostedWithin(0);
    setRemoteOnly(false);
    setHideTracked(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-6">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between border-b border-gray-200 pb-6">
        <div className="flex items-center gap-4">
          <div className="bg-blue-100 text-blue-600 p-4 rounded-2xl">
            <Target className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 mb-1">Discover Jobs</h1>
            {cache ? (
              <p className="text-gray-500 text-sm">
                Last scanned {timeAgo(cache.scannedAt)} &middot; {relevantJobs.length} roles across target companies
                {cache.errors.length > 0 && (
                  <button onClick={() => setShowErrors(v => !v)} className="ml-2 text-amber-600 hover:underline">
                    {cache.errors.length} portals errored
                  </button>
                )}
              </p>
            ) : (
              <p className="text-gray-500 text-sm">Scan 40 target companies for PM roles</p>
            )}
          </div>
        </div>
        <button
          onClick={runScan}
          disabled={scanning}
          className="flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-all shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${scanning ? 'animate-spin' : ''}`} />
          {scanning ? 'Scanning...' : cache ? 'Refresh' : 'Scan now'}
        </button>
      </div>

      <div className="flex gap-8 items-start">
        {/* ── Sidebar filters (relevant tab only) ── */}
        {activeTab === 'relevant' && (
          <aside className="w-52 flex-none sticky top-24 space-y-6">
            <div>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search title or company…"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>

            <div className="h-px bg-gray-100" />

            <FilterSection label="Min Score">
              <RadioOption label="Any"  active={minScore === 0}   onClick={() => setMinScore(0)} />
              <RadioOption label="3.5+" active={minScore === 3.5} onClick={() => setMinScore(3.5)} />
              <RadioOption label="4.0+" active={minScore === 4.0} onClick={() => setMinScore(4.0)} />
              <RadioOption label="4.5+" active={minScore === 4.5} onClick={() => setMinScore(4.5)} />
            </FilterSection>

            <div className="h-px bg-gray-100" />

            <FilterSection label="Salary">
              <RadioOption label="Any"    active={minSalary === 0}      onClick={() => setMinSalary(0)} />
              <RadioOption label="$150k+" active={minSalary === 150000} onClick={() => setMinSalary(150000)} />
              <RadioOption label="$200k+" active={minSalary === 200000} onClick={() => setMinSalary(200000)} />
              <RadioOption label="$250k+" active={minSalary === 250000} onClick={() => setMinSalary(250000)} />
            </FilterSection>

            <div className="h-px bg-gray-100" />

            <FilterSection label="Posted">
              <RadioOption label="Any time"   active={postedWithin === 0}  onClick={() => setPostedWithin(0)} />
              <RadioOption label="This week"  active={postedWithin === 7}  onClick={() => setPostedWithin(7)} />
              <RadioOption label="This month" active={postedWithin === 30} onClick={() => setPostedWithin(30)} />
            </FilterSection>

            <div className="h-px bg-gray-100" />

            <FilterSection label="Options">
              <CheckOption label="Remote only"  checked={remoteOnly}  onChange={setRemoteOnly} />
              <CheckOption label="Hide tracked" checked={hideTracked} onChange={setHideTracked} />
            </FilterSection>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-xs text-blue-500 hover:text-blue-700 font-medium"
              >
                Clear all filters
              </button>
            )}
          </aside>
        )}

        {/* ── Main content ── */}
        <div className="flex-1 min-w-0">
          {/* Error details */}
          {showErrors && cache && cache.errors.length > 0 && (
            <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-center gap-2 text-amber-800 font-semibold text-sm mb-2">
                <AlertCircle className="w-4 h-4" /> Portals that errored
              </div>
              <ul className="text-xs text-amber-700 space-y-1">
                {cache.errors.map(e => (
                  <li key={e.company}><span className="font-medium">{e.company}:</span> {e.error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Tabs */}
          {cache && (
            <div className="flex items-center gap-1 mb-4 border-b border-gray-200">
              <button
                onClick={() => setActiveTab('relevant')}
                className={`px-4 py-2.5 text-sm font-semibold transition-colors border-b-2 -mb-px ${
                  activeTab === 'relevant'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Relevant
                <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                  activeTab === 'relevant' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'
                }`}>
                  {relevantJobs.length}
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

          {/* Empty state (no scan yet) */}
          {!cache && !scanning && (
            <div className="p-16 border border-dashed rounded-xl text-center text-gray-400 bg-white">
              <Target className="w-10 h-10 mx-auto mb-3 text-gray-300" />
              <p className="font-medium text-gray-500">No scan results yet</p>
              <p className="text-sm mt-1">Click &ldquo;Scan now&rdquo; to check all target companies for PM roles.</p>
            </div>
          )}

          {/* Streaming banner */}
          {scanning && (
            <div className="mb-4 flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-700">
              <RefreshCw className="w-4 h-4 animate-spin flex-none" />
              <span>Scanning job boards&hellip; results appearing as they come in</span>
              {cache && cache.discoveries.length > 0 && (
                <span className="ml-auto font-semibold">{cache.discoveries.length} found so far</span>
              )}
            </div>
          )}

          {/* Relevant tab */}
          {cache && activeTab === 'relevant' && (
            <>
              <p className="text-xs text-gray-400 mb-3">
                {filtered.length} of {relevantJobs.length} jobs
              </p>
              <div className="space-y-2">
                {!scanning && filtered.length === 0 && (
                  <div className="p-8 border border-dashed rounded-xl text-center text-gray-400 bg-white">
                    {hasActiveFilters
                      ? 'No jobs match your current filters.'
                      : 'All PM roles from target companies are already in your pipeline.'}
                  </div>
                )}
                {filtered.map(job => (
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
            </>
          )}

          {/* Not Interested tab */}
          {cache && activeTab === 'not-interested' && (
            <>
              {dismissedJobs.length === 0 ? (
                <div className="p-12 border border-dashed rounded-xl text-center text-gray-400 bg-white">
                  <EyeOff className="w-8 h-8 mx-auto mb-3 text-gray-300" />
                  <p className="font-medium text-gray-500">No dismissed jobs</p>
                  <p className="text-sm mt-1">
                    Click the <EyeOff className="w-3 h-3 inline" /> icon on any job to mark it as not interested.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
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
