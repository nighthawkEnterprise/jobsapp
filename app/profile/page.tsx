import { auth0 } from "@/lib/auth0";
import { redirect } from "next/navigation";
import { LogIn, Settings, FileText, BookOpen, Briefcase, Target, ChevronRight, CheckCircle2, AlertCircle } from "lucide-react";
import ResetProfileButton from "./ResetProfileButton";
import { getPreferences, getJobs, getStories, getMasterResume, getScanCache, getTailoredResumes, getProfile } from "@/lib/store";

function getInitials(email: string): string {
  const name = email.split('@')[0];
  const parts = name.split(/[.\-_]/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-none text-blue-600">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-2xl font-extrabold text-gray-900 leading-none">{value}</div>
        <div className="text-xs text-gray-500 font-medium mt-0.5">{label}</div>
        {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

function SetupRow({ label, value, ok, href }: { label: string; value: string; ok: boolean; href: string }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0">
      {ok
        ? <CheckCircle2 className="w-4 h-4 text-green-500 flex-none mt-0.5" />
        : <AlertCircle className="w-4 h-4 text-amber-400 flex-none mt-0.5" />
      }
      <div className="flex-grow min-w-0">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</span>
        <p className={`text-sm mt-0.5 ${ok ? 'text-gray-700' : 'text-amber-600 font-medium'}`}>{value}</p>
      </div>
      <a href={href} className="flex-none text-xs text-blue-500 hover:text-blue-700 font-medium flex items-center gap-0.5 mt-0.5">
        Edit <ChevronRight className="w-3 h-3" />
      </a>
    </div>
  );
}

export default async function ProfilePage() {
  const session = await auth0.getSession();

  if (!session) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12 text-center">
        <div className="bg-white border border-gray-200 rounded-2xl p-12 shadow-sm max-w-lg mx-auto">
          <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
            <LogIn className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 mb-3">Sign in required</h1>
          <p className="text-gray-500 mb-8">You need to be signed in to view your profile.</p>
          <a href="/auth/login" className="inline-block bg-[#3B5BDB] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#3451c7] transition-colors shadow-sm">
            Sign in
          </a>
        </div>
      </div>
    );
  }

  const { user } = session;
  const userId = user.sub as string;

  const profile = await getProfile(userId);
  if (!profile?.trim()) redirect('/onboarding');

  const [prefs, jobs, stories, resume, scanCache, tailoredResumes] = await Promise.all([
    getPreferences(userId),
    getJobs(userId),
    getStories(userId),
    getMasterResume(userId),
    getScanCache(userId),
    getTailoredResumes(userId),
  ]);

  const activeJobs = jobs.filter(j => !['rejected', 'withdrawn'].includes(j.status));
  const resumeWordCount = resume.trim().split(/\s+/).filter(Boolean).length;
  const hasResume = resume.trim().length > 50;
  const initials = getInitials(user.email ?? 'U');

  const lastScan = scanCache?.scannedAt
    ? (() => {
        const mins = Math.floor((Date.now() - new Date(scanCache.scannedAt).getTime()) / 60000);
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        return `${Math.floor(hrs / 24)}d ago`;
      })()
    : null;

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">

      {/* Identity card */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-8 flex items-center gap-6">
          {user.picture ? (
            <img src={user.picture} alt={user.name ?? ''} className="w-20 h-20 rounded-full border-4 border-gray-50 shadow-sm flex-none" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-[#3B5BDB] flex items-center justify-center flex-none shadow-sm">
              <span className="text-white text-2xl font-extrabold">{initials}</span>
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-2xl font-extrabold text-gray-900 leading-tight truncate">
              {user.name || user.nickname || user.email?.split('@')[0] || 'Your Profile'}
            </h1>
            <p className="text-gray-500 text-sm mt-0.5">{user.email}</p>
            <span className="inline-flex items-center gap-1.5 mt-2 bg-green-50 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-green-200">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              Signed in
            </span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={<Briefcase className="w-5 h-5" />} label="Active pipeline" value={activeJobs.length} />
        <StatCard icon={<BookOpen className="w-5 h-5" />} label="STAR stories" value={stories.length} />
        <StatCard icon={<FileText className="w-5 h-5" />} label="Tailored CVs" value={tailoredResumes.length} />
        <StatCard
          icon={<Target className="w-5 h-5" />}
          label="Last scan"
          value={lastScan ?? '—'}
          sub={lastScan ? `${scanCache!.discoveries.length} roles found` : 'never scanned'}
        />
      </div>

      {/* Setup health */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm">
        <div className="px-6 pt-6 pb-2 flex items-center justify-between">
          <h2 className="font-bold text-gray-900">Setup</h2>
          <a href="/settings" className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 font-medium">
            <Settings className="w-3.5 h-3.5" /> All settings
          </a>
        </div>
        <div className="px-6 pb-4">
          <SetupRow
            label="Master resume"
            value={hasResume ? `Ready · ${resumeWordCount} words` : 'Not uploaded yet — needed for CV tailoring'}
            ok={hasResume}
            href="/settings"
          />
          <SetupRow
            label="Job titles"
            value={prefs.jobTitles.length > 0 ? prefs.jobTitles.join(', ') : 'Not set — scan won\'t filter by role'}
            ok={prefs.jobTitles.length > 0}
            href="/settings"
          />
          <SetupRow
            label="Locations"
            value={prefs.locationPreferences.length > 0 ? prefs.locationPreferences.join(', ') : 'Not set'}
            ok={prefs.locationPreferences.length > 0}
            href="/settings"
          />
          <SetupRow
            label="Salary floor"
            value={prefs.salaryFloor > 0 ? `$${(prefs.salaryFloor / 1000).toFixed(0)}k+` : 'Not set'}
            ok={prefs.salaryFloor > 0}
            href="/settings"
          />
          {prefs.targetCompanies.length > 0 && (
            <SetupRow
              label="Target companies"
              value={prefs.targetCompanies.slice(0, 5).join(', ') + (prefs.targetCompanies.length > 5 ? ` +${prefs.targetCompanies.length - 5} more` : '')}
              ok={true}
              href="/settings"
            />
          )}
          {prefs.domainsOfInterest.length > 0 && (
            <SetupRow
              label="Domains"
              value={prefs.domainsOfInterest.join(', ')}
              ok={true}
              href="/settings"
            />
          )}
        </div>
      </div>

      {/* Account actions */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 space-y-4">
        <h2 className="font-bold text-gray-900">Account</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <ResetProfileButton />
          <a
            href="/auth/logout"
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Sign out
          </a>
        </div>
        <p className="text-xs text-gray-400">
          Resetting clears your resume, preferences, and profile narrative — jobs and stories are preserved.
        </p>
      </div>

    </div>
  );
}
