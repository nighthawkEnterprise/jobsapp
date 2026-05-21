import { auth0 } from '@/lib/auth0';
import { getMasterResume, getResumeHasDocx } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { BorderStyle, Document, ExternalHyperlink, HeadingLevel, Packer, Paragraph, TextRun } from 'docx';
import { NextResponse } from 'next/server';

const DOCX_BUCKET = 'resumes';

function docxPath(userId: string) {
  return `${userId}/master.docx`;
}

function parseInlineRuns(text: string): (TextRun | ExternalHyperlink)[] {
  const result: (TextRun | ExternalHyperlink)[] = [];
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g);
  for (const part of parts) {
    if (!part) continue;
    if (part.startsWith('**') && part.endsWith('**')) {
      result.push(new TextRun({ text: part.slice(2, -2), bold: true }));
    } else if (part.startsWith('*') && part.endsWith('*')) {
      result.push(new TextRun({ text: part.slice(1, -1), italics: true }));
    } else {
      const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch) {
        result.push(new ExternalHyperlink({
          link: linkMatch[2],
          children: [new TextRun({ text: linkMatch[1], style: 'Hyperlink' })],
        }));
      } else {
        result.push(new TextRun({ text: part }));
      }
    }
  }
  return result;
}

function mdToDocxChildren(md: string): Paragraph[] {
  const paragraphs: Paragraph[] = [];
  for (const line of md.split('\n')) {
    if (line.startsWith('# '))   { paragraphs.push(new Paragraph({ text: line.slice(2),  heading: HeadingLevel.HEADING_1 })); continue; }
    if (line.startsWith('## '))  { paragraphs.push(new Paragraph({ text: line.slice(3),  heading: HeadingLevel.HEADING_2 })); continue; }
    if (line.startsWith('### ')) { paragraphs.push(new Paragraph({ text: line.slice(4),  heading: HeadingLevel.HEADING_3 })); continue; }
    if (line.trim() === '---') {
      paragraphs.push(new Paragraph({
        border: { bottom: { color: 'auto', space: 1, style: BorderStyle.SINGLE, size: 6 } },
      }));
      continue;
    }
    if (line.startsWith('- ') || line.startsWith('* ')) {
      paragraphs.push(new Paragraph({ children: parseInlineRuns(line.slice(2)), bullet: { level: 0 } }));
      continue;
    }
    paragraphs.push(new Paragraph({ children: parseInlineRuns(line) }));
  }
  return paragraphs;
}

export async function POST(req: Request) {
  const session = await auth0.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.sub as string;

  const body = await req.json() as { content?: string; filename?: string };
  const filename = body.filename ?? 'resume.docx';

  if (!body.content && await getResumeHasDocx(userId)) {
    const { data } = await supabase.storage.from(DOCX_BUCKET).download(docxPath(userId));
    if (data) {
      const buffer = Buffer.from(await data.arrayBuffer());
      return new Response(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }
  }

  const md = body.content ?? await getMasterResume(userId);
  const doc = new Document({ sections: [{ properties: {}, children: mdToDocxChildren(md) }] });
  const buffer = Buffer.from(await Packer.toBuffer(doc));

  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
