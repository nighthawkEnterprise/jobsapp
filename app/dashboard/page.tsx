import { auth0 } from "@/lib/auth0";
import { redirect } from "next/navigation";
import { getJobs, getStories, getScanCache, getMasterResume, getProfile } from "@/lib/store";
import Link from "next/link";
import { Zap, ChevronRight, Calendar, MessageSquare, MoreVertical } from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pct(score: number) { return Math.round((score / 5) * 100); }

function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}

function timeAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function formatMatchReason(reasons: string[]): string {
  const title = reasons.find(r => /title matches/i.test(r) || /title contains/i.test(r));
  const company = reasons.find(r => /target compan/i.test(r));
  const domain = reasons.find(r => /domain of interest/i.test(r));
  const loc = reasons.find(r => /location.*matches preference/i.test(r));
  const parts: string[] = [];
  if (company) {
    const m = company.match(/"([^"]+)"/);
    if (m) parts.push(`${m[1]} is one of your prioritized companies`);
  }
  if (title) {
    const m = title.match(/preferred role "([^"]+)"/i) || title.match(/role keyword "([^"]+)"/i);
    if (m) parts.push(`Matches your target role: ${m[1]}`);
  }
  if (domain) {
    const m = domain.match(/domain of interest "([^"]+)"/i);
    if (m) parts.push(`Aligns with your ${m[1]} focus`);
  }
  if (loc) {
    const m = loc.match(/Location "([^"]+)"/i);
    if (m) parts.push(`Located in ${m[1]}, matching your preferences`);
  }
  return parts.length > 0 ? parts.join('. ') + '.' : (reasons[0] ?? 'Strong alignment with your profile.');
}

const PALETTES = [
  'bg-blue-100 text-blue-700',    'bg-violet-100 text-violet-700',
  'bg-teal-100 text-teal-700',    'bg-orange-100 text-orange-700',
  'bg-rose-100 text-rose-700',    'bg-indigo-100 text-indigo-700',
  'bg-emerald-100 text-emerald-700', 'bg-amber-100 text-amber-700',
];
const palette = (name: string) => PALETTES[name.charCodeAt(0) % PALETTES.length];

const STATUS_BADGE: Record<string, string> = {
  interested:   'bg-gray-100 text-gray-600',
  applied:      'bg-blue-50 text-blue-700 border border-blue-200',
  screened:     'bg-indigo-50 text-indigo-700 border border-indigo-200',
  interviewing: 'bg-amber-50 text-amber-700 border border-amber-200',
  offer:        'bg-green-50 text-green-700 border border-green-200',
  rejected:     'bg-red-50 text-red-600 border border-red-200',
  withdrawn:    'bg-gray-50 text-gray-400',
};

const STATUS_LABEL: Record<string, string> = {
  interested: 'Interested', applied: 'Applied', screened: 'Screened',
  interviewing: 'Interviewing', offer: 'Offer', rejected: 'Rejected', withdrawn: 'Withdrawn',
};

const NEXT_STEP: Record<string, string> = {
  interested:   'Apply when ready',
  applied:      'Awaiting response',
  screened:     'Prep for phone screen',
  interviewing: 'Interview prep',
  offer:        'Review & negotiate',
  rejected:     'Post-mortem',
  withdrawn:    '—',
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const session = await auth0.getSession();
  if (!session) redirect('/auth/login?returnTo=/dashboard');

  const userId = session.user.sub as string;

  const profile = await getProfile(userId);
  if (!profile?.trim()) redirect('/onboarding');

  const [jobs, stories, scanCache] = await Promise.all([
    getJobs(userId),
    getStories(userId),
    getScanCache(userId),
  ]);

  const { user } = session;
  const firstName = (user.name || user.nickname || user.email?.split('@')[0] || 'there').split(' ')[0];

  // Pipeline counts
  const totalJobs      = jobs.length;
  const activeJobs     = jobs.filter(j => !['rejected', 'withdrawn'].includes(j.status));
  const interviewing   = jobs.filter(j => j.status === 'interviewing');
  const screened       = jobs.filter(j => ['screened', 'interviewing', 'offer'].includes(j.status));
  const offers         = jobs.filter(j => j.status === 'offer');
  const applied        = jobs.filter(j => j.status === 'applied');

  // Funnel data
  const funnelBase = Math.max(totalJobs, 1);
  const funnelStages = [
    {
      label: 'Applications',
      count: totalJobs,
      width: 100,
      tag: '100% BASE',
      color: 'bg-[#3B5BDB]/15',
      textColor: 'text-[#3B5BDB]',
    },
    {
      label: 'Screened',
      count: screened.length,
      width: Math.round((screened.length / funnelBase) * 100),
      tag: totalJobs > 0 ? `${Math.round((screened.length / totalJobs) * 100)}% CONV.` : '—',
      color: 'bg-[#3B5BDB]/40',
      textColor: 'text-[#3B5BDB]',
    },
    {
      label: 'Interviewing',
      count: interviewing.length,
      width: Math.round((interviewing.length / funnelBase) * 100),
      tag: screened.length > 0 ? `${Math.round((interviewing.length / screened.length) * 100)}% RET.` : '—',
      color: 'bg-[#3B5BDB]/70',
      textColor: 'text-[#3B5BDB]',
    },
    {
      label: 'Offer',
      count: offers.length,
      width: Math.round((offers.length / funnelBase) * 100),
      tag: interviewing.length > 0 ? `${Math.round((offers.length / interviewing.length) * 100)}% RET.` : '—',
      color: 'bg-[#3B5BDB]',
      textColor: 'text-white',
    },
  ];

  // Discoveries
  const discoveries    = scanCache?.discoveries ?? [];
  const newOpps        = discoveries.filter(d => !d.alreadyTracked && !d.dismissed);
  const topHeroMatches = newOpps.slice(0, 3);
  const topSideMatches = newOpps.slice(0, 3);
  const lastScan       = scanCache?.scannedAt;

  // Priority headline
  const hasOffers   = offers.length > 0;
  const hasInterviews = interviewing.length > 0;
  const heroTitle = hasOffers
    ? `${offers.length} Offer${offers.length > 1 ? 's' : ''} Require${offers.length === 1 ? 's' : ''} Your Attention`
    : hasInterviews
    ? `${interviewing.length} Interview${interviewing.length > 1 ? 's' : ''} In Progress`
    : newOpps.length > 0
    ? `${newOpps.length} Strategic Match${newOpps.length > 1 ? 'es' : ''} Found`
    : 'Your Search Dashboard';

  const heroSub = hasOffers
    ? `Review your offer${offers.length > 1 ? 's' : ''} — don't leave ${offers.length > 1 ? 'them' : 'it'} waiting.`
    : hasInterviews
    ? `Prep is your competitive edge. ${interviewing.map(j => j.company).slice(0, 2).join(', ')} ${interviewing.length > 2 ? `+${interviewing.length - 2} more` : ''} are active.`
    : newOpps.length > 0
    ? `AI has ranked ${newOpps.length} roles based on your profile, preferences, and North Star alignment.`
    : 'Run a scan to discover new opportunities across your target companies.';

  // Insight text for funnel
  const screenRate = totalJobs > 0 ? Math.round((screened.length / totalJobs) * 100) : 0;
  const insightText = screened.length === 0
    ? 'Keep applying — your pipeline is building. Screen rate improves with targeted, tailored applications.'
    : screenRate >= 15
    ? `Your screen rate of ${screenRate}% is above the executive benchmark. Focus on converting interviews to offers.`
    : screenRate >= 8
    ? `Your screen rate of ${screenRate}% is at market benchmark. Tailoring your CV per role can push this higher.`
    : `Your screen rate is ${screenRate}%. Tightening your title targeting and CV tailoring should move this metric.`;

  // Timeline — most recent active jobs
  const timeline = [...activeJobs]
    .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime())
    .slice(0, 6);

  // Stories readiness
  const storiesReady = Math.min(Math.round((stories.length / 5) * 100), 100);

  return (
    <div className="max-w-7xl mx-auto px-6 space-y-8">

      {/* ── Hero ── */}
      <section className="relative overflow-hidden rounded-2xl bg-[#1C1F2E] p-8 min-h-[280px] flex flex-col justify-center">
        {/* Background texture */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'radial-gradient(circle at 70% 50%, #3B5BDB 0%, transparent 60%), radial-gradient(circle at 30% 80%, #60a5fa 0%, transparent 50%)' }} />
        <div className="absolute top-0 right-0 bottom-0 w-1/3 opacity-10 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at right, #3B5BDB 0%, transparent 70%)' }} />

        <div className="relative z-10 space-y-5 max-w-3xl">
          <div className="space-y-2">
            <span className="inline-block bg-[#3B5BDB] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
              Priority Today
            </span>
            <h1 className="font-heading text-3xl lg:text-4xl font-extrabold text-white leading-tight tracking-tight">
              {heroTitle}
            </h1>
            <p className="text-blue-200/70 text-base leading-relaxed">{heroSub}</p>
          </div>

          {topHeroMatches.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {topHeroMatches.map((opp, i) => (
                <a
                  key={i}
                  href={opp.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white/10 backdrop-blur-sm border border-white/15 p-4 rounded-xl hover:bg-white/20 transition-all group"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[11px] font-bold text-blue-300 font-mono tracking-wide">{pct(opp.score)}% Match</span>
                    <Zap className="w-3.5 h-3.5 text-blue-300 group-hover:text-yellow-300 transition-colors" />
                  </div>
                  <p className="font-bold text-white text-sm truncate group-hover:text-blue-100 transition-colors">{opp.title}</p>
                  <p className="text-xs text-white/50 mt-0.5">{opp.company}{opp.location ? ` · ${opp.location.split(',')[0]}` : ''}</p>
                </a>
              ))}
            </div>
          )}

          {topHeroMatches.length === 0 && (
            <Link
              href="/relevant-jobs"
              className="inline-flex items-center gap-2 bg-[#3B5BDB] hover:bg-blue-500 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors"
            >
              Run your first scan <ChevronRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </section>

      {/* ── Stat Cards ── */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between hover:border-[#3B5BDB]/30 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[#3B5BDB] text-xl">🚀</span>
            <span className="text-[10px] font-bold text-[#3B5BDB] bg-blue-50 px-2 py-0.5 rounded-full">
              {applied.length} awaiting
            </span>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Active</p>
            <h3 className="text-3xl font-extrabold text-gray-900">{activeJobs.length}</h3>
          </div>
        </div>

        {/* Interviewing */}
        <div className={`p-6 rounded-2xl border shadow-sm flex flex-col justify-between transition-colors ${
          interviewing.length > 0
            ? 'bg-[#1C1F2E] border-[#2a2e42] hover:border-amber-500/30'
            : 'bg-white border-gray-100 hover:border-[#3B5BDB]/30'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xl">💬</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              interviewing.length > 0
                ? 'text-amber-400 bg-amber-400/10'
                : 'text-gray-400 bg-gray-100'
            }`}>
              {offers.length > 0 ? `${offers.length} offer!` : interviewing.length > 0 ? 'active now' : 'none yet'}
            </span>
          </div>
          <div>
            <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${interviewing.length > 0 ? 'text-gray-400' : 'text-gray-400'}`}>
              Interviewing
            </p>
            <h3 className={`text-3xl font-extrabold ${interviewing.length > 0 ? 'text-white' : 'text-gray-900'}`}>
              {interviewing.length}
            </h3>
          </div>
        </div>

        {/* New Matches */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between hover:border-[#3B5BDB]/30 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xl">🎯</span>
            <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
              {lastScan ? timeAgo(lastScan) : 'no scan'}
            </span>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">New Matches</p>
            <h3 className="text-3xl font-extrabold text-gray-900">{newOpps.length}</h3>
          </div>
        </div>

        {/* STAR Stories */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between hover:border-[#3B5BDB]/30 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xl">📖</span>
            <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
              {storiesReady}% ready
            </span>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">STAR Stories</p>
            <h3 className="text-3xl font-extrabold text-gray-900">{stories.length}</h3>
          </div>
        </div>
      </section>

      {/* ── Pipeline Velocity + Top Matches ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Pipeline Velocity */}
        <section className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-extrabold text-gray-900">Pipeline Velocity</h2>
              <p className="text-sm text-gray-500 mt-0.5">Conversion rates and funnel movement</p>
            </div>
            <Link href="/pipeline" className="flex items-center gap-1.5 text-[#3B5BDB] font-bold text-sm hover:underline">
              View Pipeline <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="space-y-4">
            {funnelStages.map((stage, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-28 text-right flex-none">
                  <span className="text-xs font-medium text-gray-500">{stage.label}</span>
                </div>
                <div className="relative flex-1 h-10 bg-gray-100 rounded-lg overflow-hidden flex items-center px-4 justify-between">
                  <div
                    className={`absolute inset-y-0 left-0 ${stage.color} rounded-lg transition-all duration-500`}
                    style={{ width: `${Math.max(stage.count > 0 ? 3 : 0, stage.width)}%` }}
                  />
                  <span className={`relative z-10 font-bold text-sm ${stage.count > 0 ? stage.textColor : 'text-gray-400'}`}>
                    {stage.count}
                  </span>
                  <span className="relative z-10 text-[10px] text-gray-500 font-bold tracking-wider">
                    {stage.tag}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100 flex gap-3">
            <span className="text-[#3B5BDB] text-lg flex-none">💡</span>
            <p className="text-sm text-gray-700 leading-relaxed">
              <strong className="text-gray-900">Insight: </strong>{insightText}
            </p>
          </div>
        </section>

        {/* Top Matches */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 flex flex-col">
          <div className="mb-6">
            <h2 className="text-xl font-extrabold text-gray-900">Top Matches</h2>
            <p className="text-sm text-gray-500 mt-0.5">High-precision AI alignment</p>
          </div>

          <div className="space-y-3 flex-grow">
            {topSideMatches.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center text-gray-400">
                <span className="text-4xl mb-3">🎯</span>
                <p className="text-sm">{lastScan ? 'All matches reviewed.' : 'No scan results yet.'}</p>
                <Link href="/relevant-jobs" className="text-sm font-bold text-[#3B5BDB] hover:underline mt-2">
                  {lastScan ? 'Run a fresh scan →' : 'Start scanning →'}
                </Link>
              </div>
            ) : (
              topSideMatches.map((opp, i) => (
                <a
                  key={i}
                  href={opp.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block p-4 rounded-xl hover:bg-gray-50 transition-all border border-transparent hover:border-gray-200"
                >
                  <div className="flex justify-between items-start mb-1">
                    <p className="font-bold text-gray-900 group-hover:text-[#3B5BDB] transition-colors text-sm leading-snug pr-2">
                      {opp.title}
                    </p>
                    <span className="font-bold text-[#3B5BDB] text-sm flex-none">{opp.score.toFixed(1)}</span>
                  </div>
                  <p className="text-xs text-gray-400 mb-2">{opp.company}{opp.location ? ` · ${opp.location.split(',')[0]}` : ''}</p>
                  {opp.scoreReasons.length > 0 && (
                    <div className="bg-blue-50 p-2 rounded-lg">
                      <p className="text-[11px] text-gray-600 leading-relaxed">
                        <span className="font-bold text-gray-700">Match: </span>
                        {formatMatchReason(opp.scoreReasons)}
                      </p>
                    </div>
                  )}
                </a>
              ))
            )}
          </div>

          {newOpps.length > 0 && (
            <Link
              href="/relevant-jobs"
              className="mt-6 w-full py-3 text-center text-[#3B5BDB] font-bold text-sm rounded-xl border border-[#3B5BDB]/20 bg-blue-50 hover:bg-[#3B5BDB] hover:text-white transition-all"
            >
              View All {newOpps.length} Matches
            </Link>
          )}
        </section>
      </div>

      {/* ── Application Timeline ── */}
      {timeline.length > 0 && (
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-xl font-extrabold text-gray-900">Application Timeline</h2>
            <Link href="/pipeline" className="flex items-center gap-1.5 text-[#3B5BDB] text-sm font-bold hover:underline">
              Full pipeline <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/80">
                  <th className="px-8 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Company</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Role</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Next Step</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {timeline.map((job) => {
                  const badge = STATUS_BADGE[job.status] ?? STATUS_BADGE.interested;
                  const label = STATUS_LABEL[job.status] ?? job.status;
                  const next  = NEXT_STEP[job.status] ?? '—';
                  const pal   = palette(job.company || '?');
                  return (
                    <tr key={job.id} className="hover:bg-blue-50/30 transition-colors group">
                      <td className="px-8 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-none ${pal}`}>
                            {(job.company || '?').slice(0, 2).toUpperCase()}
                          </div>
                          <span className="font-bold text-gray-900 text-sm">{job.company}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-[200px]">
                        <span className="truncate block">{job.title}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${badge}`}>
                          {label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-gray-500">
                          {job.status === 'interviewing' && <Calendar className="w-3.5 h-3.5 flex-none" />}
                          {job.status === 'screened' && <MessageSquare className="w-3.5 h-3.5 flex-none" />}
                          <span className="text-sm">{next}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/job/${job.id}`}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-[#3B5BDB] hover:bg-blue-50 transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
