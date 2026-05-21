import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';
import { getMasterResume, saveMasterResume, getTailoredResumes, getResumeHasDocx, setResumeHasDocx } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import mammoth from 'mammoth';
import TurndownService from 'turndown';

const turndownService = new TurndownService({ headingStyle: 'atx' });
const DOCX_BUCKET = 'resumes';

async function requireAuth() {
  const session = await auth0.getSession();
  if (!session) return null;
  return session.user.sub as string;
}

function docxPath(userId: string) {
  return `${userId}/master.docx`;
}

export async function GET() {
  const userId = await requireAuth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [master, tailored, hasDocx] = await Promise.all([
    getMasterResume(userId),
    getTailoredResumes(userId),
    getResumeHasDocx(userId),
  ]);
  return NextResponse.json({ master, tailored, hasDocx });
}

export async function POST(req: Request) {
  const userId = await requireAuth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

    let finalContent = '';

    if (file.name.endsWith('.docx')) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      await supabase.storage.from(DOCX_BUCKET).upload(docxPath(userId), buffer, {
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        upsert: true,
      });
      await setResumeHasDocx(userId, true);

      const { value: html } = await mammoth.convertToHtml({ buffer });
      finalContent = turndownService.turndown(html);
    } else {
      await setResumeHasDocx(userId, false);
      finalContent = await file.text();
    }

    await saveMasterResume(userId, finalContent);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing file upload:', error);
    return NextResponse.json({ error: 'Failed to process and save resume' }, { status: 500 });
  }
}
