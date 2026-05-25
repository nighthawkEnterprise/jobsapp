'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Wand2, Sparkles, Lightbulb, KeyRound, CheckCircle2, Download, Share2,
  Bold, Italic, List, ZoomIn, ZoomOut, FileText, AlertCircle, GitCompare,
} from 'lucide-react';

interface TailorResult {
  tailoredResume: string;
  explanation: string;
  storiesUsed: string[];
}

type SidebarTab = 'jd' | 'strategy' | 'gaps';

function extractResume(acc: string): string {
  const openIdx = acc.indexOf('<resume>');
  // Before <resume> arrives, show nothing yet (avoid flashing any preamble)
  if (openIdx < 0) return '';
  const afterOpen = acc.slice(openIdx + '<resume>'.length);
  const closeIdx = afterOpen.indexOf('</resume>');
  return (closeIdx >= 0 ? afterOpen.slice(0, closeIdx) : afterOpen).trim();
}

function parseFullOutput(acc: string): TailorResult {
  const tailoredResume = extractResume(acc);
  const explMatch = acc.match(/<explanation>([\s\S]*?)<\/explanation>/);
  const explanation = explMatch ? explMatch[1].trim() : '';
  const storiesMatch = acc.match(/<stories>([\s\S]*?)<\/stories>/);
  const storiesText = storiesMatch ? storiesMatch[1] : '';
  const storiesUsed = storiesText
    .split('\n')
    .map(l => l.replace(/^[-*]\s*/, '').trim())
    .filter(Boolean);
  return { tailoredResume, explanation, storiesUsed };
}

function ResumeRender({ markdown }: { markdown: string }) {
  return (
    <ReactMarkdown
      components={{
        h1: ({ children }) => (
          <h1 className="r-name text-[32px] font-bold tracking-tight mb-2 uppercase text-center font-headline">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-[14px] font-bold border-b border-[#cbd5e1] mb-3 pb-1 uppercase tracking-wider text-[#475569] mt-8 first:mt-0">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-[14px] font-bold mt-4 mb-0.5">{children}</h3>
        ),
        p: ({ children }) => (
          <p className="text-[13px] leading-relaxed mb-2">{children}</p>
        ),
        ul: ({ children }) => (
          <ul className="list-disc ml-5 text-[13px] space-y-2 mb-3">{children}</ul>
        ),
        li: ({ children }) => (
          <li className="text-[13px] leading-relaxed">{children}</li>
        ),
        strong: ({ children }) => <strong className="font-bold">{children}</strong>,
        em: ({ children }) => <em className="italic">{children}</em>,
        hr: () => <hr className="border-[#cbd5e1] my-4" />,
        a: ({ href, children }) => (
          <a href={href} className="text-[#003d9b] underline" target="_blank" rel="noopener noreferrer">{children}</a>
        ),
      }}
    >
      {markdown}
    </ReactMarkdown>
  );
}

function DiffRender({ master, tailored }: { master: string; tailored: string }) {
  const masterLineSet = new Set(master.split('\n').map(l => l.trim()).filter(Boolean));
  const tailoredLines = tailored.split('\n');
  return (
    <div className="font-mono text-[11px] leading-relaxed">
      <div className="mb-3 flex items-center gap-5 text-xs font-medium text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-green-100 border border-green-300 inline-block" /> Rewritten / new
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-white border border-gray-200 inline-block" /> Unchanged
        </span>
      </div>
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
  );
}

interface TailorTabProps {
  jobId: string;
  job?: { title: string; company: string; location?: string; status?: string; content?: string; overall?: number | null };
}

export default function TailorTab({ jobId, job }: TailorTabProps) {
  const [tailoring, setTailoring] = useState(false);
  const [result, setResult] = useState<TailorResult | null>(null);
  const [masterResume, setMasterResume] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloadingDocx, setDownloadingDocx] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('strategy');
  const [showDiff, setShowDiff] = useState(false);
  const [zoom, setZoom] = useState(85);

  const handleTailor = async () => {
    setTailoring(true);
    setError(null);
    setShowDiff(false);
    setResult({ tailoredResume: '', explanation: '', storiesUsed: [] });

    // Fetch master resume in parallel for the diff view
    fetch('/api/resumes').then(r => r.json()).then(d => setMasterResume(d.master ?? null)).catch(() => {});

    try {
      const tailorRes = await fetch('/api/tailor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId }),
      });

      if (!tailorRes.ok) {
        const data = await tailorRes.json().catch(() => ({}));
        const msg = data.detail
          ? `${data.error ?? 'Tailoring failed'} — ${data.detail}`
          : (data.error ?? `HTTP ${tailorRes.status}`);
        setError(msg);
        setResult(null);
        return;
      }
      if (!tailorRes.body) {
        setError('No response body from server.');
        setResult(null);
        return;
      }

      const reader = tailorRes.body.getReader();
      const decoder = new TextDecoder();
      let acc = '';

      // Stream loop — update preview on every chunk
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });

        const tailoredResume = extractResume(acc);
        setResult(prev => ({
          tailoredResume,
          explanation: prev?.explanation ?? '',
          storiesUsed: prev?.storiesUsed ?? [],
        }));
      }

      // Did the server stream an error marker?
      const errIdx = acc.indexOf('[[STREAM_ERROR]]');
      if (errIdx >= 0) {
        setError(`Tailoring failed — ${acc.slice(errIdx + '[[STREAM_ERROR]]'.length).trim()}`);
        setResult(null);
        return;
      }

      // Final parse for explanation + stories
      setResult(parseFullOutput(acc));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed — check your connection.');
      setResult(null);
    } finally {
      setTailoring(false);
    }
  };

  const download = async (format: 'docx' | 'pdf') => {
    if (!result?.tailoredResume) return;
    const setBusy = format === 'pdf' ? setDownloadingPdf : setDownloadingDocx;
    setBusy(true);
    try {
      const nameMatch = (masterResume ?? result.tailoredResume).match(/^#\s+(.+)$/m);
      const personName = nameMatch ? nameMatch[1].trim() : 'Resume';
      const company = job?.company ?? 'Company';
      const role = job?.title ?? 'Role';
      const slug = (s: string) => s.replace(/[^a-zA-Z0-9]+/g, ' ').trim();
      const filename = `${slug(personName)} - ${slug(company)} - ${slug(role)}.${format}`;

      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: result.tailoredResume, filename, format }),
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(false);
    }
  };

  const tab = (id: SidebarTab, label: string) => (
    <button
      key={id}
      onClick={() => setSidebarTab(id)}
      className={`flex-1 py-5 text-[11px] tracking-widest font-mono-label uppercase transition-colors ${
        sidebarTab === id
          ? 'font-bold text-[#003d9b] border-b-2 border-[#003d9b]'
          : 'text-[#434654] hover:bg-[#eef4ff]'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="tailor-screen">
      <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] border border-[#c3c6d6] rounded-xl overflow-hidden bg-white">

        {/* ── Left sidebar ───────────────────────────────────────────── */}
        <aside className="bg-white border-r border-[#c3c6d6] flex flex-col h-[calc(100vh-200px)] min-h-[720px]">
          <div className="flex border-b border-[#c3c6d6]">
            {tab('jd', 'Job Description')}
            {tab('strategy', 'Tailor Strategy')}
            {tab('gaps', 'Gaps')}
          </div>

          <div className="flex-grow overflow-y-auto px-7 py-8 space-y-10">
            {sidebarTab === 'jd' && (
              <section>
                <h3 className="text-[11px] font-mono-label font-bold text-[#011d35] mb-3 flex items-center gap-2 uppercase tracking-widest">
                  <FileText className="w-4 h-4 text-[#003d9b]" />
                  Job Description
                </h3>
                {job?.content ? (
                  <div className="prose text-[13px] text-[#434654] leading-relaxed whitespace-pre-wrap">
                    {job.content}
                  </div>
                ) : (
                  <p className="text-[13px] text-[#737685] italic">No description available for this role.</p>
                )}
              </section>
            )}

            {sidebarTab === 'strategy' && (
              <>
                <div>
                  <button
                    onClick={handleTailor}
                    disabled={tailoring}
                    className="w-full bg-[#003d9b] text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-[#0052cc] disabled:opacity-60 transition-all shadow-md"
                  >
                    {tailoring ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Generating…
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4" />
                        {result ? 'Regenerate' : 'Generate Tailored Resume'}
                      </>
                    )}
                  </button>
                  <p className="text-[13px] text-[#434654] mt-3 italic text-center">
                    Uses Claude to align your experience with job requirements.
                  </p>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 p-3 rounded-lg flex items-start gap-2 text-red-800">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-none mt-0.5" />
                    <div>
                      <strong className="block text-red-700 text-[13px] font-bold">Generation failed</strong>
                      <p className="text-[12px]">{error}</p>
                    </div>
                  </div>
                )}

                <section>
                  <h3 className="text-[11px] font-mono-label font-bold text-[#011d35] mb-4 flex items-center gap-2 uppercase tracking-widest">
                    <Lightbulb className="w-4 h-4 text-[#003d9b]" />
                    Strategy
                  </h3>
                  {result?.explanation ? (
                    <div className="bg-[#eef4ff] p-4 rounded-lg border-l-4 border-[#003d9b]">
                      <p className="text-[13px] text-[#011d35] leading-relaxed">{result.explanation}</p>
                      {result.storiesUsed.length > 0 && (
                        <ul className="mt-4 space-y-2">
                          {result.storiesUsed.map(s => (
                            <li key={s} className="flex gap-2 text-[13px] text-[#011d35]">
                              <CheckCircle2 className="w-4 h-4 text-[#003d9b] flex-none mt-0.5" />
                              <span>Wove in story: <span className="font-medium">{s}</span></span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ) : (
                    <div className="bg-[#eef4ff] p-4 rounded-lg border border-dashed border-[#c3c6d6] text-[13px] text-[#737685] italic">
                      Generate a tailored resume to see the strategy.
                    </div>
                  )}
                </section>

                <section>
                  <h3 className="text-[11px] font-mono-label font-bold text-[#011d35] mb-4 flex items-center gap-2 uppercase tracking-widest">
                    <KeyRound className="w-4 h-4 text-[#003d9b]" />
                    Stories Used
                  </h3>
                  {result?.storiesUsed.length ? (
                    <div className="flex flex-wrap gap-2">
                      {result.storiesUsed.map(s => (
                        <span key={s} className="px-2 py-1 bg-[#c4e0fe] text-[#48637d] rounded text-[11px] font-mono-label uppercase tracking-widest border border-[#c3c6d6]">
                          {s}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[13px] text-[#737685] italic">No stories surfaced yet.</p>
                  )}
                </section>

                {job?.overall != null && (
                  <div className="pt-6 border-t border-[#c3c6d6]">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[11px] font-mono-label text-[#434654] uppercase tracking-widest">Fit Score</span>
                      <span className="text-[11px] font-mono-label font-bold text-[#003d9b]">{job.overall.toFixed(1)} / 5</span>
                    </div>
                    <div className="w-full bg-[#d1e4ff] h-2 rounded-full overflow-hidden">
                      <div className="bg-[#003d9b] h-full" style={{ width: `${(job.overall / 5) * 100}%` }} />
                    </div>
                  </div>
                )}
              </>
            )}

            {sidebarTab === 'gaps' && (
              <section>
                <h3 className="text-[11px] font-mono-label font-bold text-[#011d35] mb-4 flex items-center gap-2 uppercase tracking-widest">
                  <Sparkles className="w-4 h-4 text-[#003d9b]" />
                  Competency Gaps
                </h3>
                <div className="bg-[#eef4ff] p-4 rounded-lg border border-dashed border-[#c3c6d6] text-[13px] text-[#737685] italic">
                  Coming soon — surface specific skills the JD asks for that aren&apos;t reflected in your resume.
                </div>
              </section>
            )}
          </div>

          <div className="px-7 py-5 bg-[#eef4ff] border-t border-[#c3c6d6] flex justify-between items-center">
            <button
              onClick={() => download('pdf')}
              disabled={!result?.tailoredResume || tailoring || downloadingPdf || downloadingDocx}
              className="flex items-center gap-1.5 text-[#434654] hover:text-[#003d9b] disabled:opacity-40 disabled:hover:text-[#434654] transition-colors text-[13px] font-medium"
            >
              <Download className="w-4 h-4" />
              {downloadingPdf ? 'Exporting…' : 'Export PDF'}
            </button>
            <button
              onClick={() => download('docx')}
              disabled={!result?.tailoredResume || tailoring || downloadingPdf || downloadingDocx}
              className="flex items-center gap-1.5 text-[#434654] hover:text-[#003d9b] disabled:opacity-40 disabled:hover:text-[#434654] transition-colors text-[13px] font-medium"
            >
              <Share2 className="w-4 h-4" />
              {downloadingDocx ? 'Exporting…' : 'Export DOCX'}
            </button>
          </div>
        </aside>

        {/* ── Right canvas ───────────────────────────────────────────── */}
        <section className="bg-[#eef4ff] editor-grid relative overflow-hidden flex flex-col h-[calc(100vh-200px)] min-h-[720px]">
          {/* Toolbar */}
          <div className="bg-white border-b border-[#c3c6d6] px-8 py-4 flex items-center justify-between shadow-sm sticky top-0 z-10">
            <div className="flex items-center gap-5">
              <div className="flex items-center bg-[#eef4ff] rounded-lg p-1 border border-[#c3c6d6] opacity-60 gap-0.5" title="Editing coming soon">
                <button className="p-1.5 rounded cursor-not-allowed" disabled><Bold className="w-4 h-4 text-[#434654]" /></button>
                <button className="p-1.5 rounded cursor-not-allowed" disabled><Italic className="w-4 h-4 text-[#434654]" /></button>
                <button className="p-1.5 rounded cursor-not-allowed" disabled><List className="w-4 h-4 text-[#434654]" /></button>
              </div>
              <div className="h-6 w-px bg-[#c3c6d6]" />
              <button
                onClick={() => setShowDiff(d => !d)}
                disabled={!result?.tailoredResume || !masterResume || tailoring}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-[#003d9b] text-[#003d9b] rounded-lg hover:bg-[#003d9b] hover:text-white disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-[#003d9b] transition-all text-[13px] font-medium"
              >
                <GitCompare className="w-4 h-4" />
                {showDiff ? 'Hide changes' : 'Show changes'}
              </button>
            </div>
            <div className="flex items-center gap-3">
              {tailoring ? (
                <span className="flex items-center gap-2 px-2.5 py-1 bg-[#003d9b]/10 text-[#003d9b] rounded-full text-[12px] font-medium mr-3">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-[#003d9b] opacity-75 animate-ping" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-[#003d9b]" />
                  </span>
                  Streaming…
                </span>
              ) : result?.tailoredResume ? (
                <span className="text-[13px] text-[#434654] italic mr-3">Saved</span>
              ) : null}
              <button
                onClick={() => setZoom(z => Math.max(50, z - 10))}
                disabled={zoom <= 50}
                className="p-1.5 text-[#434654] hover:text-[#003d9b] disabled:opacity-40"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-[11px] font-mono-label text-[#434654] w-10 text-center">{zoom}%</span>
              <button
                onClick={() => setZoom(z => Math.min(150, z + 10))}
                disabled={zoom >= 150}
                className="p-1.5 text-[#434654] hover:text-[#003d9b] disabled:opacity-40"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Content area */}
          <div className="flex-grow overflow-auto p-10 lg:p-16">
            <div
              style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
              className="transition-transform duration-200"
            >
              {result ? (
                <article className="resume-page">
                  {showDiff && masterResume && !tailoring
                    ? <DiffRender master={masterResume} tailored={result.tailoredResume} />
                    : (
                      <>
                        {result.tailoredResume
                          ? <ResumeRender markdown={result.tailoredResume} />
                          : (
                            <div className="flex flex-col items-center justify-center text-center text-[#737685] h-full min-h-[400px]">
                              <Wand2 className="w-8 h-8 mb-3 text-[#003d9b] animate-pulse" />
                              <p className="text-[13px] italic">Claude is thinking…</p>
                            </div>
                          )
                        }
                        {tailoring && result.tailoredResume && (
                          <span className="inline-block w-[2px] h-[14px] bg-[#003d9b] animate-pulse align-middle ml-0.5" />
                        )}
                      </>
                    )
                  }
                </article>
              ) : (
                <article className="resume-page flex flex-col items-center justify-center text-center text-[#737685]">
                  <FileText className="w-12 h-12 mb-4 text-[#c3c6d6]" />
                  <h3 className="font-headline text-[20px] font-bold text-[#011d35] mb-2">No tailored resume yet</h3>
                  <p className="text-[13px] max-w-sm">
                    Open <span className="font-medium text-[#003d9b]">Tailor Strategy</span> in the sidebar and click
                    {' '}<span className="font-medium text-[#003d9b]">Generate Tailored Resume</span> to rewrite your
                    master resume for this role.
                  </p>
                </article>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
