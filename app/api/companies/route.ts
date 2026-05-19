import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim() ?? '';

  if (!q || q.length < 2) return NextResponse.json([]);

  const { data, error } = await supabase
    .from('company_directory')
    .select('name, slug, ats, careers_url')
    .ilike('name', `%${q}%`)
    .order('name')
    .limit(10);

  if (error) return NextResponse.json([], { status: 500 });
  return NextResponse.json(data ?? []);
}
