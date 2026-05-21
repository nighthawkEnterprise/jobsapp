import './globals.css';
import { auth0 } from "@/lib/auth0";
import { Bricolage_Grotesque, Outfit } from 'next/font/google';
import type { Metadata } from 'next';
import { FeedbackWidget } from '@/components/FeedbackWidget';
import { TokenUsageWidget } from '@/components/TokenUsageWidget';
import { NavLinks, NavLinksGuest } from '@/components/NavLinks';

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
          <div className="max-w-7xl mx-auto flex items-center h-16 px-6 md:px-12">

            {/* Logo */}
            <a href="/" className="mr-10 flex-shrink-0 flex items-center gap-2 select-none">
              <div className="w-6 h-6 rounded-md bg-[#3B5BDB] flex items-center justify-center flex-shrink-0">
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="1" y="1" width="5" height="5" rx="1" fill="white" fillOpacity="0.9"/>
                  <rect x="8" y="1" width="5" height="5" rx="1" fill="white" fillOpacity="0.5"/>
                  <rect x="1" y="8" width="5" height="5" rx="1" fill="white" fillOpacity="0.5"/>
                  <rect x="8" y="8" width="5" height="5" rx="1" fill="white" fillOpacity="0.9"/>
                </svg>
              </div>
              <span className="font-heading text-lg font-extrabold tracking-tight leading-none">
                <span className="text-gray-900">Apply</span><span className="text-[#3B5BDB]">OS</span>
              </span>
            </a>

            {session ? (
              <NavLinks email={session.user.email ?? ''} />
            ) : (
              <NavLinksGuest />
            )}

          </div>
        </nav>

        <main className="flex-grow py-10">
          {children}
        </main>

        <FeedbackWidget />
        <TokenUsageWidget />

      </body>
    </html>
  );
}
