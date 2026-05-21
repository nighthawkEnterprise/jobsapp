import { auth0 } from "@/lib/auth0";
import { ArrowRight } from "lucide-react";
import { WaitlistForm } from "@/components/WaitlistForm";
import { HeroScanDemo } from "@/components/HeroScanDemo";

/* ── Data ─────────────────────────────────────────────── */

const mockJobs = [
  { company: "Meta",      title: "Product Manager E5",           initials: "M",  iconBg: "bg-blue-100 text-blue-600",    score: "4.8", scoreBg: "bg-green-50 text-green-700 border border-green-200",  status: "Interviewing", statusBg: "bg-amber-100 text-amber-700"  },
  { company: "LangSmith", title: "Product Manager",              initials: "L",  iconBg: "bg-violet-100 text-violet-600",score: "4.2", scoreBg: "bg-blue-50 text-blue-700 border border-blue-200",    status: "Screened",     statusBg: "bg-blue-100 text-blue-700"    },
  { company: "Microsoft", title: "Technical Program Manager II", initials: "MS", iconBg: "bg-teal-100 text-teal-600",    score: "3.6", scoreBg: "bg-amber-50 text-amber-700 border border-amber-200", status: "Applied",      statusBg: "bg-slate-100 text-slate-600"  },
  { company: "Okta",      title: "Senior Product Manager",       initials: "O",  iconBg: "bg-rose-100 text-rose-600",    score: "2.9", scoreBg: "bg-red-50 text-red-600 border border-red-200",       status: "Interested",   statusBg: "bg-gray-100 text-gray-500"    },
];

const companyLogos = [
  { name: "Stripe",     domain: "stripe.com" },
  { name: "Google",     domain: "google.com" },
  { name: "Meta",       domain: "meta.com" },
  { name: "Anthropic",  domain: "anthropic.com" },
  { name: "OpenAI",     domain: "openai.com" },
  { name: "Microsoft",  domain: "microsoft.com" },
  { name: "Linear",     domain: "linear.app" },
  { name: "Notion",     domain: "notion.so" },
  { name: "Figma",      domain: "figma.com" },
  { name: "GitHub",     domain: "github.com" },
  { name: "Airbnb",     domain: "airbnb.com" },
  { name: "Netflix",    domain: "netflix.com" },
  { name: "Apple",      domain: "apple.com" },
  { name: "Vercel",     domain: "vercel.com" },
  { name: "Databricks", domain: "databricks.com" },
  { name: "Salesforce", domain: "salesforce.com" },
  { name: "Shopify",    domain: "shopify.com" },
  { name: "Atlassian",  domain: "atlassian.com" },
];

const oldWay = [
  "Scroll 40 browser tabs looking for roles that might fit",
  "Copy-paste the same CV and hope for the best",
  "Lose track of where you applied and what happened next",
  "Walk into interviews with generic answers to generic questions",
  "Evaluate the same duplicate posting from three different sources",
  "Miss follow-ups because nothing in your workflow reminds you",
];

const newWay = [
  "Scan your target companies' ATS pages — zero LLM cost for discovery",
  "Score every role 1–5 across CV Match, North Star, Comp, and Culture",
  "One pipeline — 7 status stages, notes per role, nothing falls through",
  "Dismiss roles you're not interested in — they move out of your feed",
  "Tailor your CV per role — Claude weaves in your matching proof points",
  "Surface your top STAR stories, ranked by relevance to each JD",
];

const scanJobs = [
  { initials: "St", bg: "bg-violet-100 text-violet-700", company: "Stripe",   title: "PM, Payments Core",      score: "4.9", sc: "bg-green-50 text-green-700 border border-green-200",  salary: "$180–220k", portal: "Greenhouse" },
  { initials: "Li", bg: "bg-blue-100 text-blue-700",     company: "Linear",   title: "Senior Product Manager", score: "4.3", sc: "bg-blue-50 text-blue-700 border border-blue-200",    salary: "$165–195k", portal: "Ashby"      },
  { initials: "Nt", bg: "bg-teal-100 text-teal-700",     company: "Notion",   title: "Product Lead, AI",       score: "3.7", sc: "bg-amber-50 text-amber-700 border border-amber-200", salary: "$155–190k", portal: "Lever"      },
  { initials: "Rp", bg: "bg-orange-100 text-orange-700", company: "Rippling", title: "Group PM",               score: "3.2", sc: "bg-amber-50 text-amber-700 border border-amber-200", salary: "$170–210k", portal: "Ashby"      },
];

const prepStories = [
  { rank: 1, reasoning: "JD weights cross-functional influence heavily — this story is your strongest direct match", title: "Marketplace launch across 40 markets", tag: "Cross-functional leadership" },
  { rank: 2, reasoning: "Role calls for data-driven prioritization — cohort analysis story shows quantified impact", title: "Reduced churn 18% via cohort analysis", tag: "Data-driven decisions" },
  { rank: 3, reasoning: "Stage requires 0→1 credibility — team build shows you can operate without a playbook", title: "Built PM team 0→8 at Series B", tag: "0→1 product building" },
];

const metrics = [
  { value: "1–5",  label: "structured scoring rubric" },
  { value: "4",    label: "named scoring dimensions" },
  { value: "0",    label: "LLM calls for discovery" },
  { value: "7",    label: "pipeline status stages" },
];

/* ── Page ─────────────────────────────────────────────── */

export default async function LandingPage() {
  const session = await auth0.getSession();
  const ctaHref  = session ? "/relevant-jobs" : "/auth/login?returnTo=/relevant-jobs";
  const ctaLabel = session ? "Go to scan" : "Get started free";

  return (
    <div className="-mt-8 -mb-8">

      {/* ════════ HERO */}
      <section className="bg-[#1C1F2E] px-6 md:px-12 pt-28 pb-32 lg:pt-32 lg:pb-40 relative overflow-hidden">
        {/* Subtle grid texture */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }} />
        {/* Blue glow upper-right */}
        <div className="absolute -top-40 right-0 w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(59,91,219,0.12) 0%, transparent 70%)' }} />

        <div className="max-w-7xl mx-auto relative">
          <div className="grid lg:grid-cols-2 gap-16 xl:gap-20 items-center">

            {/* Left: Copy */}
            <div>
              <div className="inline-flex items-center gap-2 bg-white/[0.08] border border-white/10 text-blue-300 text-xs font-semibold px-4 py-2 rounded-full mb-8 backdrop-blur-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3B5BDB] animate-pulse inline-block" />
                Greenhouse · Ashby · Lever — zero LLM cost for discovery
              </div>

              <div className="hero-hed mb-10">
                <p className="font-heading font-semibold text-gray-400 text-2xl lg:text-3xl xl:text-3xl mb-2 leading-snug">The job search</p>
                <h1 className="font-heading font-extrabold text-white text-5xl lg:text-6xl xl:text-7xl 2xl:text-8xl leading-[1.02] tracking-tight">
                  Operating<br />System.
                </h1>
              </div>

              <p className="hero-sub text-gray-300 text-lg xl:text-xl leading-relaxed mb-14 max-w-lg">
                Every PM role at your target companies — scored 1–5 across four dimensions before you read them. Tailored CVs from your real proof points. One pipeline, first click to offer.
              </p>

              <div className="hero-cta">
                {session ? (
                  <div className="flex items-center gap-5 flex-wrap">
                    <a href="/relevant-jobs" className="inline-flex items-center gap-2.5 bg-[#3B5BDB] text-white px-7 py-4 rounded-xl text-sm font-bold hover:bg-[#3451c7] transition-all shadow-lg shadow-blue-900/50 hover:shadow-blue-900/70 hover:-translate-y-px">
                      Go to scan <ArrowRight className="w-4 h-4" />
                    </a>
                    <a href="#how-it-works" className="text-sm font-medium text-gray-300 hover:text-white transition-colors flex items-center gap-1">
                      See how it works <ArrowRight className="w-3.5 h-3.5 opacity-60" />
                    </a>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <WaitlistForm source="hero" variant="dark" />
                    <a href="#how-it-works" className="flex items-center gap-1.5 text-sm font-medium text-gray-300 hover:text-white transition-colors">
                      See how it works <ArrowRight className="w-3.5 h-3.5 opacity-70" />
                    </a>
                  </div>
                )}
              </div>

              {/* Trust line */}
              <div className="mt-10 flex items-center gap-3">
                <div className="flex -space-x-2">
                  {['bg-violet-500','bg-blue-500','bg-teal-500','bg-rose-500'].map((c,i) => (
                    <div key={i} className={`w-7 h-7 rounded-full border-2 border-[#1C1F2E] ${c} flex items-center justify-center text-[9px] font-bold text-white`}>
                      {['J','K','M','A'][i]}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500">PMs at Stripe, Google, Linear, and more actively searching</p>
              </div>
            </div>

            {/* Right: Animated scan demo */}
            <div className="hero-terminal relative hidden lg:block">
              {/* Multi-layer glow */}
              <div className="absolute pointer-events-none"
                style={{ inset: '-40px', background: 'radial-gradient(ellipse at 50% 55%, rgba(59,91,219,0.45) 0%, rgba(59,91,219,0.1) 45%, transparent 70%)', filter: 'blur(32px)' }} />
              <div className="absolute pointer-events-none"
                style={{ inset: '-10px', background: 'radial-gradient(ellipse at 50% 40%, rgba(120,140,255,0.15) 0%, transparent 60%)', filter: 'blur(16px)' }} />
              <div className="relative">
                <HeroScanDemo />
              </div>
            </div>
            {/* Mobile: no glow */}
            <div className="hero-terminal lg:hidden">
              <HeroScanDemo />
            </div>

          </div>
        </div>
      </section>

      {/* ════════ COMPANY STRIP */}
      <section className="bg-white border-b border-gray-100 py-8 overflow-hidden">
        <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase text-center mb-6 px-6">
          Used by PMs targeting roles at
        </p>
        <div className="overflow-hidden relative">
          {/* Fade edges */}
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
          <div className="marquee-track flex items-center w-max gap-3">
            {[...companyLogos, ...companyLogos].map((co, i) => (
              <span
                key={i}
                className="logo-strip-item text-xs font-semibold text-gray-500 bg-gray-50 border border-gray-100 px-4 py-2 rounded-full shrink-0 whitespace-nowrap"
              >
                {co.name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ COMPARISON */}
      <section id="how-it-works" className="bg-[#F7F6F3] py-24 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-[#3B5BDB] tracking-widest uppercase mb-4">Why applyOS</p>
            <h2 className="font-heading font-bold text-3xl md:text-5xl text-gray-900">
              The old grind vs <span className="text-[#3B5BDB]">the smart way</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl p-8 border border-gray-200">
              <div className="flex items-center gap-2.5 mb-7">
                <div className="w-6 h-6 rounded-full bg-red-50 border border-red-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-red-400 text-[11px] font-bold leading-none">✕</span>
                </div>
                <p className="font-heading font-semibold text-gray-400 text-sm tracking-wide">The manual grind</p>
              </div>
              <ul className="space-y-4">
                {oldWay.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="text-red-300 mt-0.5 flex-shrink-0 text-sm leading-none">✕</span>
                    <span className="text-gray-500 text-sm leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-[#1C1F2E] rounded-2xl p-8">
              <div className="flex items-center gap-2.5 mb-7">
                <div className="w-6 h-6 rounded-full bg-[#3B5BDB]/20 border border-[#3B5BDB]/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-[#3B5BDB] text-[11px] font-bold leading-none">✓</span>
                </div>
                <p className="font-heading font-semibold text-blue-300 text-sm tracking-wide">With applyOS</p>
              </div>
              <ul className="space-y-4">
                {newWay.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="text-green-400 mt-0.5 flex-shrink-0 text-sm leading-none">✓</span>
                    <span className="text-gray-300 text-sm leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ════════ FEATURE 1 — SCAN & SCORE */}
      <section className="bg-white py-24 px-6 md:px-12">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 xl:gap-24 items-center">

          <div>
            <p className="text-xs font-semibold text-[#3B5BDB] tracking-widest uppercase mb-4">01 — Scan & Score</p>
            <h2 className="font-heading font-bold text-3xl md:text-4xl text-gray-900 leading-tight mb-6">
              Every role at your target companies, scored before you read it.
            </h2>
            <p className="text-gray-500 leading-relaxed mb-8">
              applyOS scrapes your target companies directly via Greenhouse, Ashby, and Lever — zero LLM cost for discovery. Each role is scored 1–5 across four dimensions the moment it's found.
            </p>
            <ul className="space-y-3.5">
              {[
                "CV Match · North Star · Comp · Culture — four named dimensions, not a black box",
                "Red flag detection deducts from the score automatically",
                "Duplicate detection built in — see each posting exactly once",
              ].map((b, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-[#3B5BDB]/10 text-[#3B5BDB] text-[11px] flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">✓</span>
                  <span className="text-gray-600 text-sm leading-relaxed">{b}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Scan results mockup */}
          <div>
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-lg">
              <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex gap-3 text-xs font-semibold">
                    <span className="text-gray-900 border-b-2 border-[#3B5BDB] pb-1">Relevant</span>
                    <span className="text-gray-400 pb-1">Not Interested</span>
                  </div>
                  <p className="text-xs text-gray-400">47 roles · streaming live</p>
                </div>
                <div className="flex gap-1.5">
                  {[["Any", true], ["4.5+", false], ["4.0+", false], ["Remote", false]].map(([label, active]) => (
                    <span key={label as string} className={`text-xs px-2.5 py-1 rounded-lg font-medium ${active ? "bg-[#3B5BDB] text-white" : "bg-gray-100 text-gray-500"}`}>{label}</span>
                  ))}
                </div>
              </div>
              <div className="divide-y divide-gray-50">
                {scanJobs.map((job, i) => (
                  <div key={i} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${job.bg}`}>{job.initials}</div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{job.company}</p>
                        <p className="text-xs text-gray-400">{job.title}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                      <span className="text-[10px] text-gray-300 hidden sm:block">{job.portal}</span>
                      <span className="text-xs text-gray-400 hidden sm:block">{job.salary}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${job.sc}`}>{job.score}</span>
                      <span className="text-[10px] text-gray-300 hover:text-gray-500 cursor-pointer" title="Not interested">✕</span>
                    </div>
                  </div>
                ))}
              </div>
              {/* Score breakdown expansion */}
              <div className="border-t border-gray-100 px-5 py-3 bg-gray-50/50">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Score breakdown · Stripe PM</p>
                <div className="flex gap-2 flex-wrap">
                  {[["CV Match", "4/5", "bg-green-50 text-green-700 border-green-200"], ["North Star", "5/5", "bg-green-50 text-green-700 border-green-200"], ["Comp", "5/5", "bg-green-50 text-green-700 border-green-200"], ["Culture", "4/5", "bg-green-50 text-green-700 border-green-200"]].map(([label, score, cls]) => (
                    <span key={label} className={`text-[10px] font-semibold px-2 py-1 rounded-md border ${cls}`}>{label} {score}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ════════ FEATURE 2 — CV TAILORING */}
      <section className="bg-[#F7F6F3] py-24 px-6 md:px-12">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 xl:gap-24 items-center">

          {/* CV tailoring mockup */}
          <div className="order-2 lg:order-1">
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-lg">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Tailor Resume</p>
                  <p className="text-xs text-gray-400 mt-0.5">Stripe · PM, Payments Core</p>
                </div>
                <span className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-lg font-medium">Generated</span>
              </div>
              {/* Progress steps */}
              <div className="p-5 border-b border-gray-100 space-y-2.5">
                {[
                  ["Loading resume & profile", true, false],
                  ["Analyzing job description", true, false],
                  ["Rewriting with Claude", true, false],
                  ["Saving tailored version", true, false],
                ].map(([label, done]) => (
                  <div key={label as string} className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${done ? "bg-green-500" : "border-2 border-gray-200"}`}>
                      {done && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                    </div>
                    <span className={`text-xs ${done ? "text-gray-600" : "text-gray-300"}`}>{label as string}</span>
                  </div>
                ))}
              </div>
              {/* Diff preview */}
              <div className="p-5">
                <div className="flex items-center gap-4 text-[10px] font-medium text-gray-400 mb-3">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-green-100 border border-green-300 inline-block" /> Rewritten / new</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-white border border-gray-200 inline-block" /> Unchanged</span>
                  <span className="ml-auto text-[#3B5BDB] font-semibold">2 stories woven in</span>
                </div>
                <div className="font-mono text-[10px] leading-relaxed space-y-0.5">
                  <div className="px-2 py-0.5 text-gray-400">## Experience</div>
                  <div className="px-2 py-0.5 text-gray-400">### Senior Product Manager, Acme Corp</div>
                  <div className="px-2 py-0.5 rounded bg-green-50 border-l-2 border-green-400 text-gray-700">- Led cross-functional launch across payments and identity, shipping to 40 markets in 6 months</div>
                  <div className="px-2 py-0.5 text-gray-400">- Managed roadmap for 3 product lines across EU and US</div>
                  <div className="px-2 py-0.5 rounded bg-green-50 border-l-2 border-green-400 text-gray-700">- Reduced payment failure rate 18% via cohort analysis and A/B testing of checkout flows</div>
                  <div className="px-2 py-0.5 text-gray-400">- Collaborated with engineering leads on quarterly planning</div>
                </div>
                <div className="flex gap-2 mt-4">
                  <span className="text-xs bg-[#3B5BDB] text-white px-3 py-1.5 rounded-lg font-medium">Download .docx</span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg font-medium">View diff</span>
                </div>
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <p className="text-xs font-semibold text-[#3B5BDB] tracking-widest uppercase mb-4">02 — Apply & Track</p>
            <h2 className="font-heading font-bold text-3xl md:text-4xl text-gray-900 leading-tight mb-6">
              A CV that actually fits the role. Generated in seconds.
            </h2>
            <p className="text-gray-500 leading-relaxed mb-8">
              Claude rewrites your resume bullets to match the JD — using your real proof points, not invented ones. It weaves in the STAR stories most relevant to this specific role and shows you exactly what changed.
            </p>
            <ul className="space-y-3.5">
              {[
                "Bullets rewritten to match JD language and requirements",
                "Your STAR stories woven in where they strengthen the case",
                "Diff view shows every changed line — no surprises",
                "Log notes per role — interviewers, dates, next steps",
              ].map((b, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-[#3B5BDB]/10 text-[#3B5BDB] text-[11px] flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">✓</span>
                  <span className="text-gray-600 text-sm leading-relaxed">{b}</span>
                </li>
              ))}
            </ul>
          </div>

        </div>
      </section>

      {/* ════════ FEATURE 3 — INTERVIEW PREP */}
      <section className="bg-white py-24 px-6 md:px-12">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 xl:gap-24 items-center">

          <div>
            <p className="text-xs font-semibold text-[#3B5BDB] tracking-widest uppercase mb-4">03 — Prepare & Win</p>
            <h2 className="font-heading font-bold text-3xl md:text-4xl text-gray-900 leading-tight mb-6">
              Your best stories, surfaced for every interview.
            </h2>
            <p className="text-gray-500 leading-relaxed mb-8">
              Build a STAR story bank once. Before every interview, applyOS reads the JD and surfaces your three most relevant stories — with reasoning for why each one fits.
            </p>
            <ul className="space-y-3.5">
              {[
                "Stories tagged by competency and domain — write once, reuse everywhere",
                "Claude reads the JD and ranks your bank by relevance",
                "Each story surfaces with a clear reason it fits this specific role",
              ].map((b, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-[#3B5BDB]/10 text-[#3B5BDB] text-[11px] flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">✓</span>
                  <span className="text-gray-600 text-sm leading-relaxed">{b}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* STAR story surfacing mockup */}
          <div>
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-lg">
              <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Interview Prep</p>
                  <p className="text-xs text-gray-400 mt-0.5">Stripe · PM, Payments Core</p>
                </div>
                <span className="text-xs bg-purple-100 text-purple-700 px-2.5 py-1 rounded-lg font-medium">3 stories matched</span>
              </div>
              <div className="divide-y divide-gray-50">
                {prepStories.map((s, i) => (
                  <div key={i} className="flex gap-0 overflow-hidden">
                    {/* Purple reasoning column */}
                    <div className="bg-purple-50 border-r border-purple-100 p-4 w-2/5 flex-shrink-0 flex flex-col justify-center">
                      <div className="flex items-center gap-1.5 mb-2">
                        <span className="w-5 h-5 rounded-full bg-purple-600 text-white text-[10px] font-black flex items-center justify-center flex-shrink-0">{s.rank}</span>
                        <span className="text-[9px] font-bold text-purple-500 uppercase tracking-wider">Why it fits</span>
                      </div>
                      <p className="text-[10px] text-purple-800 leading-relaxed">{s.reasoning}</p>
                    </div>
                    {/* Story details */}
                    <div className="p-4 flex-1 min-w-0">
                      <span className="text-[9px] font-bold text-[#3B5BDB] uppercase tracking-wider">{s.tag}</span>
                      <p className="text-xs font-semibold text-gray-900 mt-1 leading-snug">{s.title}</p>
                      <div className="flex gap-1 mt-2.5">
                        {["S", "T", "A", "R"].map(letter => (
                          <span key={letter} className="text-[9px] font-bold bg-gray-100 text-gray-500 w-5 h-5 rounded flex items-center justify-center">{letter}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 text-center">
                <p className="text-[10px] text-gray-400">Ranked from your story bank by JD relevance</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ════════ METRICS */}
      <section className="bg-[#1C1F2E] py-16 px-6 md:px-12">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {metrics.map(({ value, label }) => (
            <div key={value}>
              <p className="font-heading font-extrabold text-4xl md:text-5xl text-white mb-2">{value}</p>
              <p className="text-sm text-gray-400">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ════════ CTA FOOTER */}
      <section className="bg-[#1C1F2E] border-t border-white/5 py-24 px-6 md:px-12 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-heading font-extrabold text-white text-4xl md:text-5xl leading-tight mb-4">
            Stop managing your<br />job search.
          </h2>
          <p className="text-gray-400 text-xl mb-10">Start running it.</p>
          {session ? (
            <a href={ctaHref} className="inline-flex items-center gap-2 bg-[#3B5BDB] text-white px-8 py-4 rounded-xl text-base font-semibold hover:bg-[#3451c7] transition-colors shadow-lg shadow-blue-900/40">
              {ctaLabel} <ArrowRight className="w-5 h-5" />
            </a>
          ) : (
            <div className="max-w-sm mx-auto">
              <WaitlistForm source="footer" variant="dark" />
            </div>
          )}
        </div>
      </section>

    </div>
  );
}
