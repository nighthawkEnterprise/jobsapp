'use client';

import { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { FileText, CheckCircle2, AlertCircle, Download } from 'lucide-react';

interface TailorResult {
  tailoredResume: string;
  explanation: string;
  storiesUsed: string[];
}

type StepStatus = 'pending' | 'active' | 'done';
interface Step { label: string; status: StepStatus }

const STEP_LABELS = [
  'Loading resume & profile',
  'Analyzing job description',
  'Rewriting with Claude',
  'Saving tailored version',
];

function StepRow({ step }: { step: Step }) {
  if (step.status === 'done') {
    return (
      <div className="flex items-center gap-4 py-1.5">
        <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-none">
          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <span className="text-sm text-gray-500">{step.label}</span>
      </div>
    );
  }
  if (step.status === 'active') {
    return (
      <div className="flex items-center gap-4 py-1.5">
        <div className="relative flex-none w-6 h-6">
          <div className="absolute inset-0 rounded-full bg-blue-100 animate-ping opacity-75" />
          <div className="relative w-6 h-6 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
        </div>
        <span className="text-sm font-semibold text-blue-600">{step.label}</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-4 py-1.5 opacity-30">
      <div className="w-6 h-6 rounded-full border-2 border-gray-300 flex-none" />
      <span className="text-sm text-gray-400">{step.label}</span>
    </div>
  );
}

function GeneratingPanel({ steps }: { steps: Step[] }) {
  const doneCount = steps.filter(s => s.status === 'done').length;
  const pct = Math.round((doneCount / steps.length) * 100);

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm h-[750px] flex flex-col items-center justify-center p-12">
      <div className="w-full max-w-xs">
        <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-6">Generating tailored resume</p>

        <div className="space-y-1 mb-8">
          {steps.map((step, i) => <StepRow key={i} step={step} />)}
        </div>

        <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-right text-[11px] text-gray-400 mt-1.5">{pct}%</p>
      </div>
    </div>
  );
}

function DocumentPreview({ markdown }: { markdown: string }) {
  return (
    <div className="bg-white overflow-auto h-[750px] border border-gray-200 rounded-xl shadow-sm">
      <div className="max-w-[660px] mx-auto px-12 py-10 font-serif text-gray-900">
        <ReactMarkdown
          components={{
            h1: ({ children }) => (
              <h1 className="text-[22px] font-bold text-center tracking-tight mb-0.5 font-sans">{children}</h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-[10px] font-bold uppercase tracking-widest border-b border-gray-400 pb-0.5 mt-5 mb-2 text-gray-600 font-sans">{children}</h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-[13px] font-bold mb-0 font-sans">{children}</h3>
            ),
            p: ({ children }) => (
              <p className="text-[12px] mb-2 leading-relaxed">{children}</p>
            ),
            ul: ({ children }) => (
              <ul className="list-disc list-outside ml-4 mb-2 space-y-0.5">{children}</ul>
            ),
            li: ({ children }) => (
              <li className="text-[12px] leading-relaxed">{children}</li>
            ),
            strong: ({ children }) => <strong className="font-bold">{children}</strong>,
            em: ({ children }) => <em className="italic">{children}</em>,
            hr: () => <hr className="border-gray-300 my-3" />,
            a: ({ href, children }) => (
              <a href={href} className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">{children}</a>
            ),
          }}
        >
          {markdown}
        </ReactMarkdown>
      </div>
    </div>
  );
}

function DiffPreview({ master, tailored }: { master: string; tailored: string }) {
  const masterLineSet = new Set(
    master.split('\n').map(l => l.trim()).filter(Boolean)
  );
  const tailoredLines = tailored.split('\n');

  return (
    <div className="bg-white overflow-auto h-[750px] border border-gray-200 rounded-xl shadow-sm">
      <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center gap-5 text-xs font-medium text-gray-500 sticky top-0">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-green-100 border border-green-300 inline-block" />
          Rewritten / new
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-white border border-gray-200 inline-block" />
          Unchanged
        </span>
      </div>
      <div className="font-mono text-[11px] leading-relaxed p-5">
        {tailoredLines.map((line, i) => {
          const trimmed = line.trim();
          const isChanged = trimmed.length > 0 && !masterLineSet.has(trimmed);
          return (
            <div
              key={i}
              className={`px-2 py-px rounded ${isChanged ? 'bg-green-50 border-l-2 border-green-400 text-gray-800' : 'text-gray-500'}`}
            >
              {line || ' '}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function TailorTab({ jobId, job }: { jobId: string; job?: { title: string; company: string } }) {
  const [tailoring, setTailoring] = useState(false);
  const [steps, setSteps] = useState<Step[]>(STEP_LABELS.map(label => ({ label, status: 'pending' })));
  const [result, setResult] = useState<TailorResult | null>(null);
  const [masterResume, setMasterResume] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [view, setView] = useState<'document' | 'diff'>('document');
  const timeouts = useRef<ReturnType<typeof setTimeout>[]>([]);

  const setStep = (index: number, status: StepStatus) =>
    setSteps(prev => prev.map((s, i) => i === index ? { ...s, status } : s));

  const handleTailor = async () => {
    timeouts.current.forEach(clearTimeout);
    timeouts.current = [];
    setSteps(STEP_LABELS.map(label => ({ label, status: 'pending' })));
    setTailoring(true);
    setError(null);
    setResult(null);

    // Step 0: active immediately
    setStep(0, 'active');

    timeouts.current.push(setTimeout(() => {
      setStep(0, 'done');
      setStep(1, 'active');
    }, 700));

    timeouts.current.push(setTimeout(() => {
      setStep(1, 'done');
      setStep(2, 'active');
    }, 1500));

    try {
      const [tailorRes, resumeRes] = await Promise.all([
        fetch('/api/tailor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jobId }),
        }),
        fetch('/api/resumes'),
      ]);
      const data = await tailorRes.json();
      const resumeData = await resumeRes.json();

      if (!tailorRes.ok || data.error) {
        setSteps(STEP_LABELS.map(label => ({ label, status: 'pending' })));
        setError(data.error ?? 'Tailoring failed');
      } else {
        setStep(2, 'done');
        setStep(3, 'active');
        setMasterResume(resumeData.master ?? null);

        await new Promise(r => { timeouts.current.push(setTimeout(r, 500)); });
        setStep(3, 'done');

        await new Promise(r => { timeouts.current.push(setTimeout(r, 300)); });
        setResult(data as TailorResult);
      }
    } catch {
      setSteps(STEP_LABELS.map(label => ({ label, status: 'pending' })));
      setError('Request failed — check your connection.');
    } finally {
      setTailoring(false);
    }
  };

  const downloadDocx = async () => {
    if (!result?.tailoredResume) return;
    setDownloading(true);
    try {
      const nameMatch = masterResume?.match(/^#\s+(.+)$/m);
      const personName = nameMatch ? nameMatch[1].trim() : 'Resume';
      const company = job?.company ?? 'Company';
      const role = job?.title ?? 'Role';
      const slug = (s: string) => s.replace(/[^a-zA-Z0-9]+/g, ' ').trim();
      const filename = `${slug(personName)} - ${slug(company)} - ${slug(role)}.docx`;

      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: result.tailoredResume, filename }),
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Tailor Resume</h2>
        <p className="text-gray-600 mb-8 text-sm leading-relaxed">
          Generate a targeted version of your master resume for this specific role. The LLM rewrites bullets to emphasize matching experience and weaves in your STAR stories.
        </p>
        <button
          onClick={handleTailor}
          disabled={tailoring}
          className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg shadow hover:bg-blue-700 disabled:opacity-50 transition-all mb-8 flex justify-center items-center gap-2"
        >
          {tailoring
            ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Generating…</>
            : 'Generate Tailored Resume'}
        </button>

        {error && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-start gap-3 text-red-800">
            <AlertCircle className="w-5 h-5 text-red-500 flex-none mt-0.5" />
            <div>
              <strong className="block mb-1 text-red-700 text-sm font-bold">Generation failed</strong>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        {result && (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 p-5 rounded-xl text-green-900 flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-green-600 flex-none" />
              <div>
                <strong className="block mb-1 text-green-800">Generated!</strong>
                <p className="text-sm text-green-700">Saved to <code className="bg-green-100 px-1 py-0.5 rounded text-xs font-mono">output/</code></p>
              </div>
            </div>

            <button
              onClick={downloadDocx}
              disabled={downloading}
              className="w-full flex items-center justify-center gap-2 border border-blue-200 bg-blue-50 text-blue-700 py-2.5 rounded-xl font-semibold text-sm hover:bg-blue-100 disabled:opacity-50 transition-all"
            >
              <Download className="w-4 h-4" />
              {downloading ? 'Downloading…' : 'Download as .docx'}
            </button>

            {result.explanation && (
              <div className="bg-gray-50 border border-gray-200 p-5 rounded-xl">
                <h3 className="font-bold text-xs text-gray-500 uppercase tracking-wider mb-3">Strategy</h3>
                <p className="text-sm text-gray-800 leading-relaxed italic border-l-4 border-blue-500 pl-3">
                  {result.explanation}
                </p>
                {result.storiesUsed.length > 0 && (
                  <div className="mt-4 text-xs font-medium text-gray-500 flex flex-wrap gap-2 items-center">
                    <span>Stories used:</span>
                    {result.storiesUsed.map(s => (
                      <span key={s} className="bg-white border border-gray-200 px-2 py-1 rounded shadow-sm">{s}</span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div>
        {tailoring ? (
          <GeneratingPanel steps={steps} />
        ) : result?.tailoredResume ? (
          <div className="space-y-3">
            <div className="flex gap-2">
              <button
                onClick={() => setView('document')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  view === 'document' ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <FileText className="w-3.5 h-3.5" /> Document
              </button>
              {masterResume && (
                <button
                  onClick={() => setView('diff')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    view === 'diff' ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Changes
                </button>
              )}
            </div>
            {view === 'document'
              ? <DocumentPreview markdown={result.tailoredResume} />
              : masterResume && <DiffPreview master={masterResume} tailored={result.tailoredResume} />
            }
          </div>
        ) : (
          <div className="bg-gray-100 border border-gray-200 border-dashed rounded-2xl h-[750px] flex flex-col items-center justify-center text-gray-400 p-8 text-center">
            <FileText className="w-12 h-12 mb-4 text-gray-300" />
            <p>Generated resume will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
