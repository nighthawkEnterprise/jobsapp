import { auth0 } from "@/lib/auth0";
import { ArrowRight, Zap, BarChart3, FileText, LayoutList, Search, Globe } from "lucide-react";

/* ── Data ─────────────────────────────────────────────── */

const mockJobs = [
  { company: "Meta",      title: "Product Manager E5",           initials: "M",  iconClass: "bg-blue-100 text-blue-600",    grade: "A", gradeClass: "bg-green-100 text-green-700", status: "Interviewing", statusClass: "bg-amber-100 text-amber-700"  },
  { company: "LangSmith", title: "Product Manager",              initials: "L",  iconClass: "bg-violet-100 text-violet-600",grade: "A", gradeClass: "bg-green-100 text-green-700", status: "Screened",     statusClass: "bg-blue-100 text-blue-700"    },
  { company: "Microsoft", title: "Technical Program Manager II", initials: "MS", iconClass: "bg-teal-100 text-teal-600",    grade: "B", gradeClass: "bg-blue-100 text-blue-700",  status: "Applied",      statusClass: "bg-slate-100 text-slate-600"  },
  { company: "Okta",      title: "Senior Product Manager",       initials: "O",  iconClass: "bg-rose-100 text-rose-600",    grade: "C", gradeClass: "bg-amber-100 text-amber-700", status: "Interested",   statusClass: "bg-gray-100 text-gray-500"    },
];

const features = [
  { Icon: Zap,        title: "Volume without burnout",       body: "Batch-scan multiple job URLs in parallel. Deduplication means you never evaluate the same role twice, no matter how many portals you cover." },
  { Icon: BarChart3,  title: "Intelligent scoring",          body: "Every role graded A–F before you read a word. Structured evaluation across compensation, fit, role quality, and posting legitimacy." },
  { Icon: FileText,   title: "Tailored CVs, instantly",      body: "ATS-optimized CVs built from your actual proof points — not fabricated. Output as HTML, PDF via Playwright, or LaTeX/Overleaf-ready." },
  { Icon: LayoutList, title: "Pipeline that tracks itself",  body: "Canonical status states from interested through offer. Rejection pattern detection helps you adjust targeting over time." },
  { Icon: Search,     title: "Research & outreach built in", body: "Deep company research, LinkedIn outreach drafts, and STAR+R stories ranked by competency match. Walk in overprepared." },
  { Icon: Globe,      title: "Multi-market, natively",       body: "English, German (DACH), French, and Japanese — with market-specific vocabulary for comp structures, labor law, and contract types." },
];

const metrics = [
  { value: "45+", label: "job portals scanned" },
  { value: "A–F", label: "scoring rubric" },
  { value: "4",   label: "markets supported" },
  { value: "0",   label: "LLM tokens for discovery" },
];

const loopSteps = [
  { label: "Your profile",     desc: "Preferences, archetypes, proof points" },
  { label: "Evaluate a role",  desc: "Scored against your unique criteria" },
  { label: "Score + feedback", desc: "Learn what fits and why" },
  { label: "Sharper profile",  desc: "Better targeting next time" },
];

const chaosRows = [
  ["Acme Corp",  "PM Lead",           "???",         "——"          ],
  ["Acme Corp",  "(duplicate)",       "???",         "——"          ],
  ["TechCo",    "Sr. PM",            "applied?",    "follow up?"  ],
  ["StartupX",  "Head of Product",   "rejected",    "——"          ],
  ["Globex",    "PM II",             "...",         "check email" ],
  ["Initech",   "TPM",               "no response", "give up?"    ],
];

const cellColor = (c: string) =>
  ["???", "(duplicate)", "give up?"].includes(c) ? "text-red-500" :
  ["——", "..."].includes(c) ? "text-gray-300" : "text-gray-600";

/* ── Page ─────────────────────────────────────────────── */

export default async function LandingPage() {
  const session = await auth0.getSession();
  const ctaHref  = session ? "/dashboard" : "/auth/login?returnTo=/dashboard";
  const ctaLabel = session ? "Go to dashboard" : "Get started free";

  return (
    <div className="-mt-8 -mb-8">

      {/* ════════ HERO */}
      <section className="bg-[#1C1F2E] px-6 md:px-12 pt-20 pb-24">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 xl:gap-20 items-center">

            {/* ── Left: Copy ── */}
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 text-blue-300 text-xs font-medium px-3 py-1.5 rounded-full mb-8">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3B5BDB] inline-block" />
                Now in beta — scanning 45+ portals
              </div>

              <div className="hero-hed mb-6">
                <p className="font-heading font-semibold text-gray-400 text-2xl md:text-3xl mb-1 leading-snug">
                  Your job search,
                </p>
                <h1 className="font-heading font-extrabold text-white text-5xl md:text-6xl xl:text-7xl leading-[1.02] tracking-tight">
                  Systematized.
                </h1>
              </div>

              <p className="hero-sub text-gray-400 text-lg leading-relaxed mb-10 max-w-md">
                Score hundreds of roles A–F. Generate tailored CVs. Track your pipeline. Prep for every interview. One system, end to end.
              </p>

              <div className="hero-cta flex items-center gap-4 flex-wrap">
                <a href={ctaHref} className="inline-flex items-center gap-2 bg-[#3B5BDB] text-white px-6 py-3.5 rounded-xl text-sm font-semibold hover:bg-[#3451c7] transition-colors shadow-lg shadow-blue-900/40">
                  {ctaLabel} <ArrowRight className="w-4 h-4" />
                </a>
                <a href="#how-it-works" className="text-sm text-gray-400 hover:text-white transition-colors">
                  See how it works
                </a>
              </div>
            </div>

            {/* ── Right: Product mockup ── */}
            <div className="hero-terminal">
              <div className="bg-white rounded-2xl overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.6)]">

                {/* Browser chrome */}
                <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b border-gray-100">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
                    <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
                    <div className="w-3 h-3 rounded-full bg-[#28C840]" />
                  </div>
                  <div className="flex-1 bg-white rounded-md px-3 py-1 text-xs text-gray-400 border border-gray-200 text-center mx-2">
                    jobpilot.app/pipeline
                  </div>
                </div>

                {/* App header */}
                <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-gray-100">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Pipeline</p>
                    <p className="text-xs text-gray-400 mt-0.5">4 roles tracked · sorted by fit</p>
                  </div>
                  <button className="text-xs bg-[#3B5BDB] text-white px-3 py-1.5 rounded-lg font-medium">
                    + Add role
                  </button>
                </div>

                {/* Score legend */}
                <div className="px-5 py-2 flex items-center gap-3 border-b border-gray-50 bg-gray-50/50">
                  <span className="text-[10px] text-gray-400 font-medium">Grade:</span>
                  {[["A", "bg-green-100 text-green-700"], ["B", "bg-blue-100 text-blue-700"], ["C", "bg-amber-100 text-amber-700"]].map(([g, c]) => (
                    <span key={g} className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${c}`}>{g}</span>
                  ))}
                </div>

                {/* Job cards */}
                <div className="p-3 space-y-2">
                  {mockJobs.map((job, i) => (
                    <div key={i} className="flex items-center justify-between px-4 py-3.5 bg-white rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-[11px] font-bold flex-shrink-0 ${job.iconClass}`}>
                          {job.initials}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{job.company}</p>
                          <p className="text-xs text-gray-400 truncate">{job.title}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                        <span className={`text-xs font-bold px-2 py-1 rounded-lg ${job.gradeClass}`}>{job.grade}</span>
                        <span className={`text-xs px-2 py-1 rounded-lg ${job.statusClass}`}>{job.status}</span>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ════════ PROBLEM */}
      <section className="bg-white py-24 px-6 md:px-12">
        <div className="max-w-7xl mx-auto grid md:grid-cols-[1fr_1.1fr] gap-16 items-center">
          <div>
            <p className="text-xs font-semibold text-[#3B5BDB] tracking-widest uppercase mb-4">The problem</p>
            <h2 className="font-heading font-bold text-3xl md:text-4xl text-gray-900 leading-tight mb-6">
              Job searching is a full-time job nobody optimized.
            </h2>
            <p className="text-gray-500 leading-relaxed mb-4">
              You&apos;re juggling 40 browser tabs, a spreadsheet that&apos;s already out of date, and copy-pasted CVs that don&apos;t quite fit.
            </p>
            <p className="text-gray-500 leading-relaxed">
              Job Pilot fixes this — not with motivation, but with structure.
            </p>
          </div>

          <div className="rounded-xl overflow-hidden border border-gray-200 font-mono text-xs shadow-sm">
            <div className="grid grid-cols-4 gap-px bg-gray-200">
              {["Company", "Role", "Status", "Next step"].map(h => (
                <div key={h} className="bg-gray-100 px-3 py-2.5 font-semibold text-gray-500 text-[10px] uppercase tracking-wider">{h}</div>
              ))}
              {chaosRows.flatMap((row, ri) =>
                row.map((cell, ci) => (
                  <div key={`${ri}-${ci}`} className={`bg-white px-3 py-2.5 ${cellColor(cell)}`}>{cell}</div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ════════ HOW IT WORKS */}
      <section id="how-it-works" className="bg-[#F7F6F3] py-24 px-6 md:px-12 border-t border-gray-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-[#3B5BDB] tracking-widest uppercase mb-4">How it works</p>
            <h2 className="font-heading font-bold text-3xl md:text-4xl text-gray-900">
              From discovery to offer, one workflow.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { n: "1", title: "Scan & score",  body: "Pull roles from 45+ portals via Greenhouse, Ashby, and Lever — zero LLM cost for discovery. Every role scored A–F across structured criteria." },
              { n: "2", title: "Apply & track", body: "Generate ATS-optimized CVs tailored to each JD, built from your real experience. Track every application with canonical status states." },
              { n: "3", title: "Prepare & win", body: "Deep company research, LinkedIn outreach drafts, and STAR+R stories ranked by role relevance. Walk into every interview overprepared." },
            ].map((step, i) => (
              <div key={i} className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
                <div className="w-10 h-10 rounded-full bg-[#3B5BDB]/10 text-[#3B5BDB] font-heading font-bold text-lg flex items-center justify-center mb-6">
                  {step.n}
                </div>
                <h3 className="font-heading font-semibold text-gray-900 text-lg mb-3">{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ FEATURES */}
      <section className="bg-white py-24 px-6 md:px-12 border-t border-gray-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-[#3B5BDB] tracking-widest uppercase mb-4">Capabilities</p>
            <h2 className="font-heading font-bold text-3xl md:text-4xl text-gray-900">
              Everything a serious job search demands.
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map(({ Icon, title, body }, i) => (
              <div key={i} className="bg-[#F7F6F3] rounded-2xl p-7 hover:bg-white hover:shadow-md border border-transparent hover:border-gray-100 transition-all">
                <div className="w-10 h-10 rounded-xl bg-[#3B5BDB]/10 text-[#3B5BDB] flex items-center justify-center mb-5">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-heading font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ LEARNING LOOP */}
      <section className="bg-[#F7F6F3] py-24 px-6 md:px-12 border-t border-gray-100">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-xs font-semibold text-[#3B5BDB] tracking-widest uppercase mb-4">The compounding advantage</p>
            <h2 className="font-heading font-bold text-3xl md:text-4xl text-gray-900 leading-tight mb-6">
              It gets smarter as you use it.
            </h2>
            <p className="text-gray-500 leading-relaxed">
              Every evaluation updates your profile. Your archetypes sharpen. Proof points refine. Scoring improves to reflect what actually fits you — not just what looked good on paper.
            </p>
          </div>

          <div>
            <div className="space-y-0">
              {loopSteps.map((step, i, arr) => (
                <div key={i}>
                  <div className="flex items-start gap-4 bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                    <div className="w-7 h-7 rounded-full bg-[#3B5BDB]/10 text-[#3B5BDB] text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {i + 1}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{step.label}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{step.desc}</p>
                    </div>
                  </div>
                  {i < arr.length - 1 && (
                    <div className="flex justify-center py-1.5">
                      <span className="text-gray-300 text-sm">↓</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <p className="text-center text-xs text-[#3B5BDB]/50 font-medium mt-3">↺ repeats with every use</p>
          </div>
        </div>
      </section>

      {/* ════════ METRICS */}
      <section className="bg-white border-t border-gray-100 py-16 px-6 md:px-12">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {metrics.map(({ value, label }) => (
            <div key={value}>
              <p className="font-heading font-extrabold text-4xl md:text-5xl text-gray-900 mb-2">{value}</p>
              <p className="text-sm text-gray-400">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ════════ CTA FOOTER */}
      <section className="bg-[#1C1F2E] py-24 px-6 md:px-12 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-heading font-extrabold text-white text-4xl md:text-5xl leading-tight mb-4">
            Stop managing your<br />job search.
          </h2>
          <p className="text-gray-400 text-xl mb-10">Start running it.</p>
          <a href={ctaHref} className="inline-flex items-center gap-2 bg-[#3B5BDB] text-white px-8 py-4 rounded-xl text-base font-semibold hover:bg-[#3451c7] transition-colors shadow-lg shadow-blue-900/40">
            {ctaLabel} <ArrowRight className="w-5 h-5" />
          </a>
          <p className="mt-10 text-xs text-gray-500">
            Built for senior candidates who treat their career like a craft.
          </p>
        </div>
      </section>

    </div>
  );
}
