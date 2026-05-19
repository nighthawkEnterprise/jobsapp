import './globals.css';
import { auth0 } from "@/lib/auth0";
import { Bricolage_Grotesque, Outfit } from 'next/font/google';
import Image from 'next/image';
import type { Metadata } from 'next';
import { FeedbackWidget } from '@/components/FeedbackWidget';

export const metadata: Metadata = {
  title: 'ApplyOS',
  description: 'Your job search, systematized. Score roles A–F, generate tailored CVs, track your pipeline, and prep for every interview — one system, end to end.',
};

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-bricolage',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-outfit',
  display: 'swap',
});

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth0.getSession();

  return (
    <html lang="en">
      <body className={`${bricolage.variable} ${outfit.variable} bg-gray-50 text-gray-900 min-h-screen flex flex-col`}>

        <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto flex items-center h-14 px-6 md:px-12">

            <a href="/" className="mr-10 flex-shrink-0">
              <Image src="/apply_os_logo.png" alt="ApplyOS" width={200} height={54} className="h-11 w-auto" priority />
            </a>

            <div className="flex gap-6 text-sm text-gray-500">
              {session && (
                <>
                  <a href="/dashboard"     className="hover:text-gray-900 transition-colors">Pipeline</a>
                  <a href="/relevant-jobs" className="hover:text-gray-900 transition-colors">Scan</a>
                  <a href="/resumes"       className="hover:text-gray-900 transition-colors">Resumes</a>
                  <a href="/stories"       className="hover:text-gray-900 transition-colors">Stories</a>
                  <a href="/settings"      className="hover:text-gray-900 transition-colors">Settings</a>
                </>
              )}
            </div>

            <div className="ml-auto flex items-center gap-5">
              {session ? (
                <>
                  <a href="/export"      className="text-xs text-gray-400 hover:text-gray-700 transition-colors hidden md:block">Export</a>
                  <a href="/profile"     className="text-xs text-gray-500 hover:text-gray-800 transition-colors truncate max-w-[180px]">{session.user.email}</a>
                  <a href="/auth/logout" className="text-xs text-gray-400 hover:text-gray-700 transition-colors">Logout</a>
                </>
              ) : null}
            </div>

          </div>
        </nav>

        <main className="flex-grow py-8">
          {children}
        </main>

        <FeedbackWidget />

      </body>
    </html>
  );
}
