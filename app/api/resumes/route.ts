import { NextResponse } from 'next/server';
import { getMasterResume, saveMasterResume, getTailoredResumes, getResumeHasDocx, setResumeHasDocx } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import mammoth from 'mammoth';
import TurndownService from 'turndown';

const turndownService = new TurndownService({ headingStyle: 'atx' });
const DOCX_STORAGE_PATH = 'master.docx';
const DOCX_BUCKET = 'resumes';

export async function GET() {
  const [master, tailored, hasDocx] = await Promise.all([
    getMasterResume(),
    getTailoredResumes(),
    getResumeHasDocx(),
  ]);
  return NextResponse.json({ master, tailored, hasDocx });
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

    let finalContent = '';

    if (file.name.endsWith('.docx')) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Upload DOCX to Supabase Storage
      await supabase.storage.from(DOCX_BUCKET).upload(DOCX_STORAGE_PATH, buffer, {
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        upsert: true,
      });
      await setResumeHasDocx(true);

      // Convert to markdown for LLM use
      const { value: html } = await mammoth.convertToHtml({ buffer });
      finalContent = turndownService.turndown(html);
    } else {
      await setResumeHasDocx(false);
      finalContent = await file.text();
    }

    await saveMasterResume(finalContent);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing file upload:', error);
    return NextResponse.json({ error: 'Failed to process and save resume' }, { status: 500 });
  }
}
