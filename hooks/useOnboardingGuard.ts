'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function useOnboardingGuard() {
  const router = useRouter();
  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(({ profile }) => {
        if (!profile?.trim()) router.replace('/onboarding');
      })
      .catch(() => {});
  }, []);
}
