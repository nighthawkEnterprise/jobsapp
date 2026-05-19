'use client';

import { useState } from 'react';

interface Dimension { score: number; reasoning: string }
interface Dimensions {
  cv_match: Dimension;
  north_star: Dimension;
  comp: Dimension;
  cultural: Dimension;
  red_flags: Array<{ flag: string; deduction: number }>;
  summary: string;
  overall: number;
}

function ScoreBar({ score }: { score: number }) {
  const pct = ((score - 1) / 4) * 100;
  const color = score >= 4 ? 'bg-green-500' : score === 3 ? 'bg-amber-400' : 'bg-red-400';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-grow h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-bold text-gray-700 w-4 text-right">{score}</span>
    </div>
  );
}

const DIMENSION_LABELS: Record<string, string> = {
  cv_match:   'CV Match',
  north_star: 'North Star',
  comp:       'Comp',
  cultural:   'Culture',
};

function scoreLabel(overall: number): { label: string; color: string } {
  if (overall >= 4.5) return { label: 'Apply immediately', color: 'text-green-700 bg-green-50 border-green-200' };
  if (overall >= 4.0) return { label: 'Worth applying', color: 'text-blue-700 bg-blue-50 border-blue-200' };
  if (overall >= 3.5) return { label: 'Apply if specific reason', color: 'text-amber-700 bg-amber-50 border-amber-200' };
  return { label: 'Not recommended', color: 'text-red-700 bg-red-50 border-red-200' };
}

function Scorecard({ d }: { d: Dimensions }) {
  const dims = ['cv_match', 'north_star', 'comp', 'cultural'] as const;
  const { label, color } = scoreLabel(d.overall);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-gray-900 text-sm">Fit Scorecard</h3>
        <div className="text-right">
          <div className="text-2xl font-black text-blue-600">{d.overall.toFixed(1)}<span className="text-sm font-medium text-gray-400">/5</span></div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${color}`}>{label}</span>
        </div>
      </div>

      {d.summary && (
        <p className="text-xs text-gray-500 italic mb-4 leading-relaxed border-b border-gray-100 pb-3">{d.summary}</p>
      )}

      <div className="space-y-4">
        {dims.map(key => (
          <div key={key}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-gray-700">{DIMENSION_LABELS[key]}</span>
            </div>
            <ScoreBar score={d[key].score} />
            {d[key].reasoning && (
              <p className="mt-1.5 text-xs text-gray-500 leading-relaxed">{d[key].reasoning}</p>
            )}
          </div>
        ))}
      </div>

      {d.red_flags.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-[10px] font-bold uppercase tracking-wider text-red-600 mb-2">Red Flags</p>
          <ul className="space-y-1.5">
            {d.red_flags.map((rf, i) => (
              <li key={i} className="flex items-start gap-1.5 text-xs text-red-700">
                <span className="font-bold shrink-0 mt-0.5">−{rf.deduction}</span>
                <span>{rf.flag}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function DetailsTab({ job }: { job: any }) {
  const [notes, setNotes] = useState(job.notes || '');
  const [savingNotes, setSavingNotes] = useState(false);
  const [fetchingJD, setFetchingJD] = useState(false);
  const [fetchJDError, setFetchJDError] = useState<string | null>(null);

  const handleRefetchJD = async () => {
    setFetchingJD(true);
    setFetchJDError(null);
    try {
      const res = await fetch('/api/fetch-jd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: job.sourceUrl }),
      });
      const data = await res.json() as { description?: string; unsupported?: boolean };
      if (data.description) {
        await fetch('/api/jobs', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: job.id, updates: { content: data.description } }),
        });
        window.location.reload();
      } else {
        setFetchJDError(data.unsupported ? 'This job site isn\'t supported for automatic fetching.' : 'Could not retrieve a job description from this URL.');
      }
    } catch {
      setFetchJDError('Request failed.');
    } finally {
      setFetchingJD(false);
    }
  };

  const saveNotes = async () => {
    setSavingNotes(true);
    await fetch('/api/jobs', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: job.id, updates: { notes } }),
    });
    setSavingNotes(false);
  };

  const jdReady = job.content && job.content !== job.title && job.content.length > 100;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      <div className="lg:col-span-2">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Job Description</h2>
        {jdReady ? (
          <div className="prose prose-sm max-w-none bg-white p-8 rounded-xl border border-gray-200 shadow-sm whitespace-pre-wrap text-gray-700 font-serif">
            {job.content}
          </div>
        ) : (
          <div className="bg-white border border-dashed border-gray-200 rounded-xl p-8 text-center text-gray-400">
            <p className="font-medium text-gray-500 mb-1">Job description not loaded</p>
            <p className="text-sm mb-4">This usually takes a few seconds after adding. Refresh the page to check.</p>
            {job.sourceUrl && (
              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={handleRefetchJD}
                  disabled={fetchingJD}
                  className="px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-black disabled:opacity-50 transition-colors"
                >
                  {fetchingJD ? 'Fetching…' : 'Fetch Job Description'}
                </button>
                {fetchJDError && <p className="text-xs text-red-500">{fetchJDError}</p>}
                <a href={job.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                  View on job site ↗
                </a>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="space-y-4 sticky top-24">
        {job.dimensions ? (
          <>
            <Scorecard d={job.dimensions} />
            {!jdReady && (
              <p className="text-[11px] text-gray-400 text-center px-2">
                Score will update once the job description finishes loading.
              </p>
            )}
          </>
        ) : (
          <div className="bg-white border border-dashed border-gray-200 rounded-xl p-5 text-center text-xs text-gray-400">
            Scoring in progress…
          </div>
        )}

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <h2 className="text-sm font-bold text-gray-900 mb-3">Tracking Notes</h2>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="w-full h-48 border border-gray-300 rounded-lg p-3 text-sm mb-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
            placeholder="Log dates, interviewers, and next steps here..."
          />
          <button
            onClick={saveNotes}
            disabled={savingNotes}
            className="w-full bg-gray-900 text-white py-2.5 rounded-lg font-bold text-sm hover:bg-black transition-colors disabled:opacity-50"
          >
            {savingNotes ? 'Saving…' : 'Save Notes'}
          </button>
        </div>
      </div>
    </div>
  );
}
