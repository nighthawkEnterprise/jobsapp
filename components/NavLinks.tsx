'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { LogOut, Menu, X } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/dashboard',     label: 'Dashboard', exact: true  },
  { href: '/relevant-jobs', label: 'Scan',      exact: false },
  { href: '/pipeline',      label: 'Pipeline',  exact: true  },
  { href: '/resumes',       label: 'Resumes',   exact: false },
  { href: '/stories',       label: 'Stories',   exact: false },
  { href: '/settings',      label: 'Settings',  exact: false },
];

function getInitials(email: string): string {
  const name = email.split('@')[0];
  const parts = name.split(/[.\-_]/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export function NavLinks({ email }: { email: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = ({ href, exact }: { href: string; exact: boolean }) =>
    exact ? pathname === href : pathname.startsWith(href);

  const initials = getInitials(email);

  return (
    <>
      <div className="flex-1 flex items-center justify-between">

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item);
            return (
              <a
                key={item.href}
                href={item.href}
                className={`relative text-sm transition-colors py-1 ${
                  active
                    ? 'text-gray-900 font-semibold'
                    : 'text-gray-500 hover:text-gray-800 font-medium'
                }`}
              >
                {item.label}
                {active && (
                  <span className="absolute -bottom-[1px] left-0 right-0 h-0.5 rounded-full bg-[#3B5BDB]" />
                )}
              </a>
            );
          })}
        </nav>

        {/* Desktop right */}
        <div className="hidden md:flex items-center gap-1.5">
          <a
            href="/profile"
            title={email}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-[#3B5BDB] text-white text-xs font-bold hover:bg-[#3451c7] transition-colors shrink-0"
          >
            {initials}
          </a>
          <a
            href="/auth/logout"
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
          </a>
        </div>

        {/* Mobile: avatar + hamburger */}
        <div className="flex md:hidden items-center gap-2 ml-auto">
          <a
            href="/profile"
            title={email}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-[#3B5BDB] text-white text-xs font-bold shrink-0"
          >
            {initials}
          </a>
          <button
            onClick={() => setOpen(v => !v)}
            className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Toggle navigation"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="fixed inset-x-0 top-16 z-50 bg-white border-b border-gray-200 shadow-xl md:hidden">
          <nav className="px-4 py-3 space-y-0.5">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item);
              return (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
                    active
                      ? 'bg-blue-50 text-[#3B5BDB]'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  {item.label}
                </a>
              );
            })}
            <div className="pt-1 mt-1 border-t border-gray-100">
              <a
                href="/auth/logout"
                className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors"
              >
                <LogOut className="w-4 h-4" /> Log out
              </a>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}

export function NavLinksGuest() {
  return (
    <div className="ml-auto flex items-center gap-4">
      {process.env.NODE_ENV === 'development' && (
        <a
          href="/api/dev-login?returnTo=/relevant-jobs"
          className="text-xs font-mono text-amber-600 bg-amber-50 border border-amber-200 px-2 py-1 rounded hover:bg-amber-100 transition-colors"
        >
          Dev login
        </a>
      )}
      <a
        href="/auth/login?returnTo=/relevant-jobs"
        className="text-sm font-semibold text-[#3B5BDB] hover:text-[#3451c7] transition-colors"
      >
        Sign in
      </a>
    </div>
  );
}
