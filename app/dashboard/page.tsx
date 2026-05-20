'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Trash2, FileText, ChevronRight } from 'lucide-react';
import { Toast } from '@/components/Toast';
import { SkeletonPipelineCard } from '@/components/Skeleton';

const STATUS_CONFIG: Record<string, { label: string; dot: string; badge: string }> = {
  interested:   { label: 'Interested',   dot: 'bg-gray-400',   badge: 'bg-gray-100 text-gray-600' },
  applied:      { label: 'Applied',      dot: 'bg-blue-400',   badge: 'bg-blue-50 text-blue-700' },
  screened:     { label: 'Screened',     dot: 'bg-indigo-400', badge: 'bg-indigo-50 text-indigo-700' },
  interviewing: { label: 'Interviewing', dot: 'bg-amber-400',  badge: 'bg-amber-50 text-amber-700' },
  offer:        { label: 'Offer',        dot: 'bg-green-400',  badge: 'bg-green-50 text-green-700' },
  rejected:     { label: 'Rejected',     dot: 'bg-red-400',    badge: 'bg-red-50 text-red-600' },
  withdrawn:    { label: 'Withdrawn',    dot: 'bg-gray-300',   badge: 'bg-gray-50 text-gray-400' },
};

function scoreStyle(score: number) {
  if (score >= 4.5) return { bg: 'bg-green-50 border-green-200',  text: 'text-green-700', bar: 'bg-green-400' };
  if (score >= 4.0) return { bg: 'bg-blue-50 border-blue-100',    text: 'text-blue-600',  bar: 'bg-blue-400' };
  if (score >= 3.0) return { bg: 'bg-amber-50 border-amber-200',  text: 'text-amber-700', bar: 'bg-amber-400' };
  return              { bg: 'bg-red-50 border-red-200',           text: 'text-red-600',   bar: 'bg-red-400' };
}

function dimStyle(score: number) {
  if (score >= 4) return 'bg-green-50 border-green-200 text-green-700';
  if (score === 3) return 'bg-amber-50 border-amber-200 text-amber-700';
  return 'bg-red-50 border-red-200 text-red-600';
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
  const initials = name.slice(0, 2).toUpperCase();
  return (
    <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold flex-none ${palettes[idx]}`}>
      {initials}
    </div>
  );
}

export default function PipelinePage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [rawJD, setRawJD] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const fetchJobs = () => {
    fetch('/api/jobs')
      .then(res => res.json())
      .then(data => {
        setJobs(data.sort((a: any, b: any) => (b.score || 0) - (a.score || 0)));
        setLoading(false);
      });
  };

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(({ preferences }) => {
        if (!preferences?.jobTitles?.length) {
          router.replace('/onboarding');
        } else {
          fetchJobs();
        }
      })
      .catch(() => fetchJobs());
  }, []);

  const handleAddJob = async () => {
    if (!rawJD) return;
    setAdding(true);
    await fetch('/api/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rawText: rawJD })
    });
    setRawJD('');
    setAdding(false);
    fetchJobs();
    setToast('Job added to pipeline');
  };

  const handleDelete = async (id: string) => {
    await fetch('/api/jobs', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setConfirmDelete(null);
    setJobs(prev => prev.filter(j => j.id !== id));
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    setJobs(prev => prev.map(j => j.id === id ? { ...j, status: newStatus } : j));
    await fetch('/api/jobs', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, updates: { status: newStatus } })
    });
  };

  const activeJobs = jobs.filter(j => !['rejected', 'withdrawn'].includes(j.status));
  const archivedJobs = jobs.filter(j => ['rejected', 'withdrawn'].includes(j.status));

  if (loading) return (
    <div className="max-w-6xl mx-auto px-6">
      <div className="mb-8">
        <div className="animate-pulse h-8 w-48 bg-gray-100 rounded-lg mb-2" />
        <div className="animate-pulse h-4 w-32 bg-gray-100 rounded" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-3">
          <SkeletonPipelineCard />
          <SkeletonPipelineCard />
          <SkeletonPipelineCard />
        </div>
        <div className="animate-pulse bg-gray-100 rounded-2xl h-80" />
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-6">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Active Pipeline</h1>
          <p className="text-gray-500 text-sm mt-1">
            {activeJobs.length} active role{activeJobs.length !== 1 ? 's' : ''}
            {archivedJobs.length > 0 && <span className="text-gray-400"> · {archivedJobs.length} archived</span>}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        {/* Job list */}
        <div className="md:col-span-2 space-y-3">
          {jobs.length === 0 ? (
            <div className="p-16 border border-dashed border-gray-200 rounded-2xl text-center bg-white">
              <div className="text-4xl mb-3">📥</div>
              <p className="font-semibold text-gray-600 mb-1">Your pipeline is empty</p>
              <p className="text-sm text-gray-400">Paste a job description on the right, or scan your target companies to discover roles.</p>
              <a href="/relevant-jobs" className="inline-flex items-center gap-1.5 mt-4 text-sm font-semibold text-blue-600 hover:text-blue-700">
                Scan target companies <ChevronRight className="w-3.5 h-3.5" />
              </a>
            </div>
          ) : (
            <>
              {activeJobs.map(job => <JobCard key={job.id} job={job} onStatusChange={handleStatusChange} onDelete={handleDelete} confirmDelete={confirmDelete} setConfirmDelete={setConfirmDelete} />)}
              {archivedJobs.length > 0 && (
                <>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 pt-2">Archived</p>
                  {archivedJobs.map(job => <JobCard key={job.id} job={job} onStatusChange={handleStatusChange} onDelete={handleDelete} confirmDelete={confirmDelete} setConfirmDelete={setConfirmDelete} dimmed />)}
                </>
              )}
            </>
          )}
        </div>

        {/* Add job panel */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 sticky top-24">
          <h2 className="font-bold text-gray-900 mb-1">Add Job Manually</h2>
          <p className="text-xs text-gray-400 mb-4">Paste the full JD — the AI will extract title, company, location, and salary.</p>
          <textarea
            value={rawJD}
            onChange={(e) => setRawJD(e.target.value)}
            className="w-full h-56 border border-gray-200 rounded-xl p-3 mb-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none placeholder-gray-400"
            placeholder="Paste full Job Description text here..."
          />
          <button
            onClick={handleAddJob}
            disabled={adding || !rawJD}
            className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold text-sm hover:bg-black disabled:opacity-40 disabled:cursor-not-allowed transition-all flex justify-center items-center gap-2"
          >
            {adding ? <span className="animate-pulse">Parsing with AI...</span> : 'Parse & Add to Pipeline'}
          </button>
          <p className="text-center text-xs text-gray-400 mt-3">
            or <a href="/relevant-jobs" className="text-blue-600 hover:underline font-medium">scan your target companies →</a>
          </p>
        </div>
      </div>

      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </div>
  );
}

function JobCard({
  job,
  onStatusChange,
  onDelete,
  confirmDelete,
  setConfirmDelete,
  dimmed,
}: {
  job: any;
  onStatusChange: (id: string, status: string) => void;
  onDelete: (id: string) => void;
  confirmDelete: string | null;
  setConfirmDelete: (id: string | null) => void;
  dimmed?: boolean;
}) {
  const d = job.dimensions;
  const score = d?.overall ?? job.score;
  const ss = score != null ? scoreStyle(score) : null;
  const statusCfg = STATUS_CONFIG[job.status] ?? STATUS_CONFIG.interested;

  return (
    <div className={`bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-all group ${dimmed ? 'opacity-60' : ''}`}>
      <div className="p-5">
        <div className="flex gap-4 items-start">
          {/* Score badge */}
          <div className={`flex-none flex flex-col items-center justify-center h-16 w-16 rounded-xl border ${ss ? `${ss.bg} ${ss.text}` : 'bg-gray-50 border-gray-200 text-gray-400'} relative`}>
            <div className="text-xl font-black leading-none">
              {score != null ? score.toFixed(1) : '—'}
            </div>
            <div className="text-[9px] font-bold uppercase tracking-wider opacity-60 mt-0.5">/ 5.0</div>
            {!d && score != null && (
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full border-2 border-white" title="Discovery score — open job for full AI analysis" />
            )}
          </div>

          {/* Main info */}
          <div className="flex-grow min-w-0">
            <div className="flex items-start gap-2">
              <CompanyAvatar name={job.company || '?'} />
              <div className="min-w-0">
                <Link href={`/job/${job.id}`} className="font-bold text-gray-900 hover:text-blue-600 transition-colors leading-tight line-clamp-1">
                  {job.title}
                </Link>
                <div className="text-sm text-gray-500 mt-0.5">{job.company}{job.location ? <> · {job.location}</> : null}</div>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2 flex-wrap">
              {job.salary > 0 && (
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  ${job.salary.toLocaleString()}
                </span>
              )}
              <span className="text-xs text-gray-400">Updated {new Date(job.updatedAt).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Right: status + actions */}
          <div className="flex-none flex flex-col items-end gap-2">
            {/* Status selector with colored dot */}
            <div className="relative flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full flex-none ${statusCfg.dot}`} />
              <select
                value={job.status}
                onChange={(e) => onStatusChange(job.id, e.target.value)}
                className="text-xs font-semibold border-0 bg-transparent cursor-pointer focus:ring-0 text-gray-700 pr-1 appearance-none"
              >
                {Object.entries(STATUS_CONFIG).map(([val, cfg]) => (
                  <option key={val} value={val}>{cfg.label}</option>
                ))}
              </select>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Link
                href={`/job/${job.id}?tab=tailor`}
                className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg transition-colors"
                title="Tailor resume for this role"
              >
                <FileText className="w-3 h-3" /> Tailor
              </Link>
              {confirmDelete === job.id ? (
                <div className="flex items-center gap-1">
                  <button onClick={() => onDelete(job.id)} className="text-xs font-bold text-red-600 hover:text-red-800 px-2 py-1.5 rounded hover:bg-red-50 transition-colors">Yes</button>
                  <button onClick={() => setConfirmDelete(null)} className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1.5 rounded hover:bg-gray-100 transition-colors">No</button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDelete(job.id)}
                  className="p-1.5 text-gray-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                  title="Remove from pipeline"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Dimension scores */}
        {d && (
          <div className="mt-4 pt-3 border-t border-gray-50">
            {d.summary && (
              <p className="text-xs text-gray-400 italic mb-2 leading-relaxed">{d.summary}</p>
            )}
            <div className="flex flex-wrap gap-1.5 text-[11px] font-semibold">
              {([
                ['CV Match', d.cv_match],
                ['North Star', d.north_star],
                ['Comp', d.comp],
                ['Culture', d.cultural],
              ] as [string, { score: number; reasoning: string }][]).map(([label, dim]) => (
                <span
                  key={label}
                  title={dim.reasoning}
                  className={`px-2 py-0.5 rounded-full border cursor-help ${dimStyle(dim.score)}`}
                >
                  {label} {dim.score}/5
                </span>
              ))}
              {d.red_flags?.length > 0 && (
                <span
                  title={d.red_flags.map((r: { flag: string; deduction: number }) => `−${r.deduction} ${r.flag}`).join('\n')}
                  className="px-2 py-0.5 rounded-full border bg-red-50 border-red-200 text-red-600 cursor-help"
                >
                  ⚠ {d.red_flags.length} flag{d.red_flags.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom CTA bar — visible when no dimensions yet */}
      {!d && (
        <Link
          href={`/job/${job.id}`}
          className="flex items-center justify-between px-5 py-3 border-t border-gray-100 text-xs text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors rounded-b-2xl group/cta"
        >
          <span>Open for full AI scoring, tailored resume & prep</span>
          <ChevronRight className="w-3.5 h-3.5 group-hover/cta:translate-x-0.5 transition-transform" />
        </Link>
      )}
    </div>
  );
}
