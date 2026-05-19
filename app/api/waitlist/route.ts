import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  const { email, source = 'landing' } = await req.json() as { email?: string; source?: string };

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Valid email required.' }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from('waitlist')
    .select('id')
    .eq('email', email.toLowerCase())
    .single();

  if (existing) return NextResponse.json({ alreadyJoined: true });

  const { error } = await supabase.from('waitlist').insert({
    email: email.toLowerCase(),
    source,
  });

  if (error) return NextResponse.json({ error: 'Failed to join waitlist.' }, { status: 500 });

  const { count } = await supabase.from('waitlist').select('*', { count: 'exact', head: true });
  return NextResponse.json({ success: true, position: count ?? 1 });
}

export async function GET() {
  const { data, count } = await supabase
    .from('waitlist')
    .select('*', { count: 'exact' })
    .order('created_at');
  return NextResponse.json({ count: count ?? 0, entries: data ?? [] });
}
