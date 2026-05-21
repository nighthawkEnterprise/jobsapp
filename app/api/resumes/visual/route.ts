import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';
import { supabase } from '@/lib/supabase';
import { getResumeHasDocx } from '@/lib/store';
import mammoth from 'mammoth';

const DOCX_BUCKET = 'resumes';

function docxPath(userId: string) {
  return `${userId}/master.docx`;
}

export async function GET() {
  const session = await auth0.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.sub as string;

  const hasDocx = await getResumeHasDocx(userId);
  if (!hasDocx) return NextResponse.json({ error: 'No docx source on file' }, { status: 404 });

  const { data, error } = await supabase.storage.from(DOCX_BUCKET).download(docxPath(userId));
  if (error || !data) return NextResponse.json({ error: 'Failed to load docx' }, { status: 500 });

  const buffer = Buffer.from(await data.arrayBuffer());
  const { value: html } = await mammoth.convertToHtml({ buffer });
  return NextResponse.json({ html });
}
