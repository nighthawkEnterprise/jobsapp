import './globals.css';
import { auth0 } from "@/lib/auth0";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth0.getSession();

  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 min-h-screen flex flex-col">
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto flex items-center h-16 px-6">
            <a href="/" className="font-extrabold text-xl mr-8 tracking-tight text-blue-600 flex items-center gap-2 hover:opacity-80 transition-opacity">
              <span className="text-2xl">✈️</span> Job Pilot
            </a>
            
            <div className="flex gap-6 text-sm font-medium text-gray-600">
              {session && (
                <>
                  <a href="/dashboard" className="hover:text-blue-600 transition-colors">Dashboard</a>
                  <a href="/relevant-jobs" className="hover:text-blue-600 transition-colors">Relevant Jobs</a>
                  <a href="/resumes" className="hover:text-blue-600 transition-colors">Resumes</a>
                  <a href="/stories" className="hover:text-blue-600 transition-colors">Story Bank</a>
                  <a href="/settings" className="hover:text-blue-600 transition-colors">Settings & Setup</a>
                </>
              )}
            </div>

            <div className="ml-auto flex items-center gap-4">
              {session ? (
                <>
                  <a href="/export" className="text-sm font-medium text-gray-600 hover:text-blue-600 border border-gray-200 px-4 py-2 rounded-md hover:border-blue-600 transition-all mr-2 hidden md:block">
                    Export Resume
                  </a>
                  <div className="flex items-center gap-4">
                    <a href="/profile" className="text-xs text-gray-700 font-bold hover:text-blue-600 transition-colors">Profile ({session.user.email})</a>
                    <a href="/auth/logout" className="text-sm font-bold text-red-600 hover:text-red-700 transition-colors">Logout</a>
                  </div>
                </>
              ) : (
                <a href="/auth/login?returnTo=/dashboard" className="text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors">Sign In</a>
              )}
            </div>
          </div>
        </nav>
        <main className="flex-grow py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
