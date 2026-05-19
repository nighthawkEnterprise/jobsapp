import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getResumeHasDocx } from '@/lib/store';
import mammoth from 'mammoth';

const DOCX_BUCKET = 'resumes';
const DOCX_STORAGE_PATH = 'master.docx';

export async function GET() {
  const hasDocx = await getResumeHasDocx();
  if (!hasDocx) return NextResponse.json({ error: 'No docx source on file' }, { status: 404 });

  const { data, error } = await supabase.storage.from(DOCX_BUCKET).download(DOCX_STORAGE_PATH);
  if (error || !data) return NextResponse.json({ error: 'Failed to load docx' }, { status: 500 });

  const buffer = Buffer.from(await data.arrayBuffer());
  const { value: html } = await mammoth.convertToHtml({ buffer });
  return NextResponse.json({ html });
}
