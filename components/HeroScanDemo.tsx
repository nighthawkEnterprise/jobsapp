'use client';

import { useEffect, useState } from 'react';

type Phase = 'scanning' | 'revealing' | 'jobs' | 'pipeline' | 'generating' | 'exporting' | 'applying';

const SCAN_JOBS = [
  { initials: "St", bg: "bg-violet-100 text-violet-700", company: "Stripe",   title: "PM, Payments Core",      score: "4.9", sc: "bg-green-50 text-green-700 border border-green-200",  salary: "$180–220k", portal: "Greenhouse" },
  { initials: "Li", bg: "bg-blue-100 text-blue-700",     company: "Linear",   title: "Senior Product Manager", score: "4.3", sc: "bg-blue-50 text-blue-700 border border-blue-200",    salary: "$165–195k", portal: "Ashby"      },
  { initials: "Nt", bg: "bg-teal-100 text-teal-700",     company: "Notion",   title: "Product Lead, AI",       score: "3.7", sc: "bg-amber-50 text-amber-700 border border-amber-200", salary: "$155–190k", portal: "Lever"      },
  { initials: "Rp", bg: "bg-orange-100 text-orange-700", company: "Rippling", title: "Group PM",               score: "3.2", sc: "bg-red-50 text-red-600 border border-red-200",       salary: "$170–210k", portal: "Ashby"      },
];

const SCANNED = ["Greenhouse (312 new)", "Ashby (187 new)", "Lever (94 new)", "Workday (421 new)", "Rippling (58 new)", "SmartRecruiters (203 new)", "Jobvite (76 new)"];

const PIPELINE_STAGES = ["Interested", "Applied", "Screened", "Interviewing", "Offer"];

const JD_KEYWORDS = ["Payments infrastructure", "API platform", "Merchant tooling", "Cross-functional DRI"];

const CV_BULLETS = [
  { text: "Redesigned Payments API end-to-end — cut merchant integration time by 60%",          story: "API Redesign"  },
  { text: "Grew payments volume 40% YoY through data-driven feature prioritisation and testing", story: "40% Growth"    },
  { text: "Launched across 12 markets, coordinating eng, design, legal and compliance",          story: "Global Launch"  },
  { text: "Built 0→1 merchant dashboard from discovery to GA in 4 months, zero P0s at launch",  story: "0→1 Launch"    },
];

const APPLY_FIELDS = [
  { label: "Full name",         value: "Jordan Avery" },
  { label: "Email",             value: "jordan.avery@gmail.com" },
  { label: "Years experience",  value: "6 years"       },
];

const STEPS: { label: string; phases: Phase[] }[] = [
  { label: "Scan",     phases: ['scanning', 'revealing', 'jobs'] },
  { label: "Track",    phases: ['pipeline']                       },
  { label: "Tailor",   phases: ['generating']                     },
  { label: "Export",   phases: ['exporting']                      },
  { label: "Apply",    phases: ['applying']                       },
];

const URL: Record<Phase, string> = {
  scanning:   'applyos.app/scan',
  revealing:  'applyos.app/scan',
  jobs:       'applyos.app/scan',
  pipeline:   'applyos.app/pipeline',
  generating: 'applyos.app/job/stripe-pm/tailor',
  exporting:  'applyos.app/job/stripe-pm/export',
  applying:   'applyos.app/job/stripe-pm/apply',
};

export function HeroScanDemo() {
  const [phase,          setPhase]    = useState<Phase>('scanning');
  const [scanPct,        setScanPct]  = useState(0);
  const [visibleJobs,    setVJobs]    = useState(0);
  const [pipelineIdx,    setPipeline] = useState(0);
  const [visibleBullets,   setVBullets]   = useState(0);
  const [visibleKeywords,  setVKeywords]  = useState(0);
  const [exportStage,    setExport]   = useState<'idle' | 'loading' | 'done'>('idle');
  const [applyStep,      setApply]    = useState(0);

  useEffect(() => {
    const tids: ReturnType<typeof setTimeout>[]  = [];
    const iids: ReturnType<typeof setInterval>[] = [];
    const t  = (fn: () => void, ms: number) => { const id = setTimeout(fn, ms);  tids.push(id); };
    const iv = (fn: () => void, ms: number) => { const id = setInterval(fn, ms); iids.push(id); return id; };

    if (phase === 'scanning') {
      // Touch slower: 55 ms tick → ~2.75 s to fill; longer pause at 100% to let the portal count land
      let p = 0;
      const id = iv(() => {
        p += 2; setScanPct(p);
        if (p >= 100) { clearInterval(id); t(() => setPhase('revealing'), 700); }
      }, 55);
    }

    if (phase === 'revealing') {
      // Touch slower: 480 ms between cards so each result registers
      setVJobs(0);
      let n = 0;
      const id = iv(() => {
        n++; setVJobs(n);
        if (n >= SCAN_JOBS.length) { clearInterval(id); t(() => setPhase('jobs'), 500); }
      }, 480);
    }

    if (phase === 'jobs') {
      // Extra beat to let the highlighted "Stripe" + "+ Track" badge read
      t(() => { setPipeline(0); setPhase('pipeline'); }, 2200);
    }

    if (phase === 'pipeline') {
      // Bit more slower: linger on "Interested" before snapping to "Applied", then hold the view
      t(() => setPipeline(1), 1200);
      t(() => { setVBullets(0); setPhase('generating'); }, 5000);
    }

    if (phase === 'generating') {
      setVKeywords(0); setVBullets(0);
      // Phase 1: JD keywords appear fast — matching feel (~350ms each)
      t(() => setVKeywords(1),  350);
      t(() => setVKeywords(2),  700);
      t(() => setVKeywords(3), 1050);
      t(() => setVKeywords(4), 1400);
      // Phase 2: bullets appear after keywords — deliberate generation feel (~1100ms each)
      t(() => setVBullets(1), 2500);
      t(() => setVBullets(2), 3600);
      t(() => setVBullets(3), 4700);
      t(() => setVBullets(4), 5800);
      t(() => { setExport('idle'); setPhase('exporting'); }, 7000);
    }

    if (phase === 'exporting') {
      // Small bump — let the ✓ sit before moving to apply
      setExport('idle');
      t(() => setExport('loading'), 800);
      t(() => setExport('done'),    2200);
      t(() => { setApply(0); setPhase('applying'); }, 5200);
    }

    if (phase === 'applying') {
      // Fields fill with deliberate pauses — feels like real auto-fill reading the form
      setApply(0);
      let a = 0;
      const id = iv(() => {
        a++; setApply(a);
        if (a > APPLY_FIELDS.length) {
          clearInterval(id);
          t(() => {
            setPhase('scanning'); setScanPct(0); setVJobs(0);
            setPipeline(0); setVKeywords(0); setVBullets(0); setExport('idle'); setApply(0);
          }, 3800);
        }
      }, 750);
    }

    return () => { tids.forEach(clearTimeout); iids.forEach(clearInterval); };
  }, [phase]);

  const stepIdx    = STEPS.findIndex(s => s.phases.includes(phase));
  const checked    = Math.floor((scanPct / 100) * SCANNED.length);
  const isScanning = phase === 'scanning';

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.6)]">

      {/* ── Browser chrome ── */}
      <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b border-gray-100">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
          <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
          <div className="w-3 h-3 rounded-full bg-[#28C840]" />
        </div>
        <div className="flex-1 bg-white rounded-md px-3 py-1 text-xs text-gray-400 border border-gray-200 text-center mx-2 transition-all duration-500">
          {URL[phase]}
        </div>
      </div>

      {/* ── Step indicator ── */}
      <div className="px-3 py-2 border-b border-gray-100 flex items-center">
        {STEPS.map((step, i) => (
          <div key={step.label} className="flex items-center flex-1 last:flex-none">
            <div className={`flex items-center gap-1 transition-all duration-300 ${
              i === stepIdx ? 'text-[#3B5BDB]' : i < stepIdx ? 'text-green-500' : 'text-gray-300'
            }`}>
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold border flex-shrink-0 transition-all duration-300 ${
                i === stepIdx   ? 'border-[#3B5BDB] bg-blue-50 text-[#3B5BDB]'
                : i < stepIdx  ? 'border-green-400 bg-green-50 text-green-600'
                : 'border-gray-200 text-gray-300'
              }`}>
                {i < stepIdx ? '✓' : i + 1}
              </span>
              <span className="text-[10px] font-semibold">{step.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-px mx-1.5 transition-all duration-500 ${i < stepIdx ? 'bg-green-300' : 'bg-gray-100'}`} />
            )}
          </div>
        ))}
      </div>

      {/* ── Phase content ── */}
      <div className="h-[348px] overflow-hidden">

        {/* ════ SCAN ════ */}
        {(phase === 'scanning' || phase === 'revealing' || phase === 'jobs') && (
          <div className="flex flex-col h-full">
            <div className="px-5 pt-3.5 pb-3 flex items-center justify-between border-b border-gray-100 flex-shrink-0">
              <div>
                <p className="text-sm font-semibold text-gray-900">Relevant Jobs</p>
                <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1.5">
                  {isScanning
                    ? <><span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse inline-block" /> Scanning {SCANNED[Math.min(checked, SCANNED.length - 1)]}…</>
                    : <><span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" /> {SCAN_JOBS.length} new matches · 2 duplicates skipped</>
                  }
                </p>
              </div>
              <button className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${isScanning ? 'bg-gray-100 text-gray-400' : 'bg-[#3B5BDB] text-white'}`}>
                {isScanning ? 'Scanning…' : 'Scan now'}
              </button>
            </div>

            {isScanning && (
              <div className="px-5 py-2.5 border-b border-gray-100 flex-shrink-0">
                <div className="flex justify-between mb-1.5">
                  <span className="text-[10px] text-gray-400">Scanning ATS portals</span>
                  <span className="text-[10px] text-gray-500 font-medium">{scanPct}%</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#3B5BDB] rounded-full transition-all duration-75" style={{ width: `${scanPct}%` }} />
                </div>
                <div className="mt-2 flex flex-wrap gap-1 min-h-[18px]">
                  {SCANNED.slice(0, checked).map((c, i) => (
                    <span key={i} className="text-[9px] bg-green-50 text-green-600 border border-green-200 px-1.5 py-0.5 rounded font-medium">{c} ✓</span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex-1 p-3 space-y-2 overflow-hidden">
              {isScanning ? (
                <div className="flex flex-col items-center justify-center h-full gap-2">
                  <div className="w-5 h-5 border-2 border-[#3B5BDB] border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-gray-400">Scanning job boards…</p>
                </div>
              ) : SCAN_JOBS.slice(0, visibleJobs).map((job, i) => (
                <div key={job.company}
                  className={`flex items-center justify-between px-4 py-2.5 rounded-xl border transition-all duration-300 ${
                    phase === 'jobs' && i === 0 ? 'border-[#3B5BDB] bg-blue-50/40 ring-1 ring-[#3B5BDB]/20' : 'border-gray-100 bg-white'
                  }`}
                  style={{ animation: 'heroCardIn 0.3s ease-out both' }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${job.bg}`}>{job.initials}</div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{job.company}</p>
                      <p className="text-xs text-gray-400 truncate">{job.title}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${job.sc}`}>{job.score}</span>
                    {phase === 'jobs' && i === 0 && (
                      <span className="text-[10px] font-semibold bg-[#3B5BDB] text-white px-2 py-0.5 rounded-lg" style={{ animation: 'heroCardIn 0.3s ease-out 0.15s both' }}>
                        + Track
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ════ PIPELINE ════ */}
        {phase === 'pipeline' && (
          <div className="flex flex-col h-full" style={{ animation: 'heroCardIn 0.38s ease-out both' }}>
            <div className="px-5 pt-3.5 pb-3 border-b border-gray-100 flex-shrink-0">
              <p className="text-sm font-semibold text-gray-900">Pipeline</p>
              <p className="text-xs text-gray-400 mt-0.5">Added to pipeline · just now</p>
            </div>
            <div className="flex-1 px-5 py-4 flex flex-col gap-4">
              <div className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl">
                <div className="w-9 h-9 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center text-[10px] font-bold flex-shrink-0">St</div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900">Stripe — PM, Payments Core</p>
                  <p className="text-xs text-gray-400">$180–220k · Greenhouse · Remote</p>
                </div>
                <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-lg bg-green-50 text-green-700 border border-green-200 flex-shrink-0">4.9</span>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-medium mb-2 uppercase tracking-wide">Status</p>
                <div className="flex gap-1">
                  {PIPELINE_STAGES.map((stage, i) => (
                    <div key={stage} className={`flex-1 text-center text-[9px] font-semibold py-1.5 rounded-lg transition-all duration-500 ${
                      i < pipelineIdx ? 'bg-blue-50 text-blue-400'
                      : i === pipelineIdx ? 'bg-[#3B5BDB] text-white shadow-sm'
                      : 'bg-gray-50 text-gray-300'
                    }`}>{stage}</div>
                  ))}
                </div>
              </div>
              <div className="flex-1 bg-gray-50 rounded-xl p-3.5 border border-gray-100 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Follow-up</p>
                  <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">Due in 5 days</span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">Applied via Greenhouse. Strong match for API redesign story. Follow up with recruiter by May 23.</p>
              </div>
            </div>
          </div>
        )}

        {/* ════ GENERATING ════ */}
        {phase === 'generating' && (
          <div className="flex flex-col h-full" style={{ animation: 'heroCardIn 0.38s ease-out both' }}>
            <div className="px-5 pt-3.5 pb-3 border-b border-gray-100 flex-shrink-0">
              <p className="text-sm font-semibold text-gray-900">Tailor CV</p>
              <p className="text-xs text-gray-400 mt-0.5">Stripe · PM, Payments Core · ATS-optimised</p>
            </div>
            <div className="flex-1 px-5 py-3 flex flex-col gap-3 overflow-hidden">

              {/* JD keywords matched */}
              <div className="flex-shrink-0">
                <p className="text-[10px] text-gray-400 font-medium mb-1.5 uppercase tracking-wide">JD Requirements matched</p>
                <div className="flex flex-wrap gap-1.5 min-h-[22px]">
                  {JD_KEYWORDS.slice(0, visibleKeywords).map((kw, i) => (
                    <span key={i} className="text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full" style={{ animation: 'heroCardIn 0.2s ease-out both' }}>
                      {kw}
                    </span>
                  ))}
                  {visibleKeywords < JD_KEYWORDS.length && (
                    <span className="text-[10px] text-gray-300 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-full">matching…</span>
                  )}
                </div>
              </div>

              {/* Stories matched — appear once keywords done */}
              <div className="flex-shrink-0">
                <p className="text-[10px] text-gray-400 font-medium mb-1.5 uppercase tracking-wide">Stories woven in</p>
                <div className="flex flex-wrap gap-1.5 min-h-[22px]">
                  {CV_BULLETS.slice(0, visibleBullets).map((b, i) => (
                    <span key={i} className="text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full" style={{ animation: 'heroCardIn 0.25s ease-out both' }}>
                      ✓ {b.story}
                    </span>
                  ))}
                  {visibleBullets < CV_BULLETS.length && visibleKeywords >= JD_KEYWORDS.length && (
                    <span className="text-[10px] text-gray-300 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-full">generating…</span>
                  )}
                </div>
              </div>

              {/* Generated bullets */}
              <div className="flex-1 overflow-hidden">
                <p className="text-[10px] text-gray-400 font-medium mb-1.5 uppercase tracking-wide">Generated bullets</p>
                <div className="space-y-2">
                  {CV_BULLETS.slice(0, visibleBullets).map((b, i) => (
                    <div key={i} className="flex gap-2" style={{ animation: 'heroCardIn 0.3s ease-out both' }}>
                      <span className="text-[#3B5BDB] text-xs mt-0.5 flex-shrink-0">•</span>
                      <p className="text-[11px] text-gray-700 leading-relaxed">{b.text}</p>
                    </div>
                  ))}
                  {visibleBullets < CV_BULLETS.length && visibleKeywords >= JD_KEYWORDS.length && (
                    <div className="flex gap-2 items-center opacity-40">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#3B5BDB] animate-pulse flex-shrink-0 mt-0.5" />
                      <div className="h-2 bg-gray-100 rounded animate-pulse w-48" />
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ════ EXPORT ════ */}
        {phase === 'exporting' && (
          <div className="flex flex-col h-full" style={{ animation: 'heroCardIn 0.38s ease-out both' }}>
            <div className="px-5 pt-3.5 pb-3 border-b border-gray-100 flex-shrink-0">
              <p className="text-sm font-semibold text-gray-900">Export Resume</p>
              <p className="text-xs text-gray-400 mt-0.5">Stripe · PM, Payments Core</p>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center gap-5 px-5 py-4">
              {exportStage === 'done' ? (
                <div className="text-center" style={{ animation: 'heroCardIn 0.4s ease-out both' }}>
                  <div className="w-14 h-14 rounded-2xl bg-green-50 border border-green-200 flex items-center justify-center mx-auto mb-3">
                    <svg className="w-7 h-7 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">Resume ready</p>
                  <p className="text-xs text-gray-400 mt-1">Resume_Stripe_PM_Tailored.docx</p>
                  <div className="flex gap-2 mt-4 justify-center">
                    <span className="text-[11px] bg-[#3B5BDB] text-white px-4 py-1.5 rounded-lg font-semibold">Open .docx</span>
                    <span className="text-[11px] bg-gray-100 text-gray-600 px-4 py-1.5 rounded-lg font-semibold">Export .pdf</span>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-xs text-gray-400">Export your tailored resume as</p>
                  <div className="flex gap-4">
                    {[
                      { fmt: '.docx', icon: '📄', active: exportStage === 'loading' },
                      { fmt: '.pdf',  icon: '📋', active: false },
                    ].map(({ fmt, icon, active }) => (
                      <div key={fmt} className={`flex flex-col items-center gap-2 px-6 py-4 rounded-2xl border transition-all duration-300 ${active ? 'border-[#3B5BDB] bg-blue-50 shadow-sm' : 'border-gray-200 bg-white'}`}>
                        <span className="text-2xl">{icon}</span>
                        <span className="text-xs font-bold text-gray-700">{fmt}</span>
                        {active
                          ? <div className="w-3.5 h-3.5 border-2 border-[#3B5BDB] border-t-transparent rounded-full animate-spin" />
                          : <span className="text-[10px] text-gray-400">Export</span>}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ════ APPLY ════ */}
        {phase === 'applying' && (
          <div className="flex flex-col h-full" style={{ animation: 'heroCardIn 0.38s ease-out both' }}>
            <div className="px-5 pt-3.5 pb-3 border-b border-gray-100 flex-shrink-0">
              <p className="text-sm font-semibold text-gray-900">Apply</p>
              <p className="text-xs text-gray-400 mt-0.5">Stripe · PM, Payments Core · via Greenhouse</p>
            </div>
            <div className="flex-1 px-5 py-4 flex flex-col gap-2.5 overflow-hidden">

              {/* Auto-fill status */}
              <div className="flex items-center gap-1.5 mb-0.5">
                {applyStep <= APPLY_FIELDS.length ? (
                  <><div className="w-3 h-3 border-2 border-[#3B5BDB] border-t-transparent rounded-full animate-spin flex-shrink-0" /><span className="text-[10px] text-gray-400">Auto-filling application…</span></>
                ) : (
                  <><span className="w-3 h-3 rounded-full bg-green-400 flex-shrink-0 inline-block" /><span className="text-[10px] text-green-600 font-medium">Form complete — review before submitting</span></>
                )}
              </div>

              {/* Fields */}
              {APPLY_FIELDS.map((field, i) => (
                <div key={field.label} className={`transition-all duration-400 ${applyStep > i ? 'opacity-100' : 'opacity-0'}`} style={{ animation: applyStep > i ? 'heroCardIn 0.3s ease-out both' : undefined }}>
                  <p className="text-[10px] text-gray-400 mb-0.5">{field.label}</p>
                  <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                    <span className="text-xs text-gray-700 flex-1">{field.value}</span>
                    <svg className="w-3 h-3 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </div>
                </div>
              ))}

              {/* Resume attached */}
              {applyStep > APPLY_FIELDS.length && (
                <div style={{ animation: 'heroCardIn 0.3s ease-out both' }}>
                  <p className="text-[10px] text-gray-400 mb-0.5">Resume</p>
                  <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                    <span className="text-sm flex-shrink-0">📄</span>
                    <span className="text-xs text-blue-700 font-medium flex-1 truncate">Resume_Stripe_PM_Tailored.docx</span>
                    <span className="text-[10px] font-semibold text-green-600 flex-shrink-0">✓ Attached</span>
                  </div>
                </div>
              )}

              {/* Review gate */}
              {applyStep > APPLY_FIELDS.length && (
                <div className="mt-auto flex flex-col gap-2" style={{ animation: 'heroCardIn 0.3s ease-out 0.15s both' }}>
                  <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
                    <svg className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                    <p className="text-[10px] text-amber-700 leading-relaxed">Nothing submits without your review — you stay in control of every application.</p>
                  </div>
                  <button className="w-full bg-[#3B5BDB] text-white text-xs font-semibold py-2.5 rounded-xl">
                    Review &amp; Submit →
                  </button>
                </div>
              )}

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
