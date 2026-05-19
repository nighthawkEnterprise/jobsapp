import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  const { message, email = '' } = await req.json() as { message?: string; email?: string };
  if (!message?.trim()) return NextResponse.json({ error: 'message required' }, { status: 400 });

  const { error } = await supabase.from('feedback').insert({
    message: message.trim(),
    email: email.trim(),
  });

  if (error) return NextResponse.json({ error: 'Failed to save feedback.' }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function GET() {
  const { data } = await supabase.from('feedback').select('*').order('created_at', { ascending: false });
  return NextResponse.json({ entries: data ?? [] });
}
