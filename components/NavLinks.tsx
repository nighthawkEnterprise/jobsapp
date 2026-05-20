'use client';

import { usePathname } from 'next/navigation';
import { LogOut } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/dashboard',     label: 'Pipeline'  },
  { href: '/relevant-jobs', label: 'Scan'      },
  { href: '/resumes',       label: 'Resumes'   },
  { href: '/stories',       label: 'Stories'   },
  { href: '/settings',      label: 'Settings'  },
];

function getInitials(email: string): string {
  const name = email.split('@')[0];
  const parts = name.split(/[.\-_]/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export function NavLinks({ email }: { email: string }) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === '/dashboard'
      ? pathname === '/dashboard'
      : pathname.startsWith(href);

  const initials = getInitials(email);

  return (
    <div className="flex-1 flex items-center justify-between">
      {/* Primary nav */}
      <nav className="flex items-center gap-6">
        {NAV_ITEMS.map(({ href, label }) => {
          const active = isActive(href);
          return (
            <a
              key={href}
              href={href}
              className={`relative text-sm transition-colors py-1 ${
                active
                  ? 'text-gray-900 font-semibold'
                  : 'text-gray-500 hover:text-gray-800 font-medium'
              }`}
            >
              {label}
              {active && (
                <span className="absolute -bottom-[1px] left-0 right-0 h-0.5 rounded-full bg-[#3B5BDB]" />
              )}
            </a>
          );
        })}
      </nav>

      {/* Utility actions */}
      <div className="flex items-center gap-1.5">
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
    </div>
  );
}

export function NavLinksGuest() {
  return (
    <div className="ml-auto flex items-center gap-4">
      {process.env.NODE_ENV === 'development' && (
        <a
          href="/api/dev-login?returnTo=/dashboard"
          className="text-xs font-mono text-amber-600 bg-amber-50 border border-amber-200 px-2 py-1 rounded hover:bg-amber-100 transition-colors"
        >
          Dev login
        </a>
      )}
      <a
        href="/auth/login?returnTo=/dashboard"
        className="text-sm font-semibold text-[#3B5BDB] hover:text-[#3451c7] transition-colors"
      >
        Sign in
      </a>
    </div>
  );
}
