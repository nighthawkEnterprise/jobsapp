import { auth0 } from '@/lib/auth0';
import { getMasterResume, getResumeHasDocx } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { BorderStyle, Document, ExternalHyperlink, HeadingLevel, Packer, Paragraph, TextRun } from 'docx';
import { mdToPdf } from 'md-to-pdf';
import { NextResponse } from 'next/server';

const DOCX_BUCKET = 'resumes';

const PDF_CSS = `
  @page { size: Letter; margin: 0.6in 0.7in; }
  body { font-family: 'Georgia', 'Times New Roman', serif; color: #111827; font-size: 11pt; line-height: 1.45; margin: 0; }
  h1, h2, h3 { font-family: 'Helvetica', 'Arial', sans-serif; color: #111827; }
  h1 { font-size: 20pt; font-weight: 700; text-align: center; margin: 0 0 2pt; letter-spacing: -0.01em; }
  h2 { font-size: 9pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; color: #4b5563; border-bottom: 1px solid #9ca3af; padding-bottom: 1pt; margin: 14pt 0 6pt; }
  h3 { font-size: 12pt; font-weight: 700; margin: 8pt 0 0; }
  p { margin: 0 0 6pt; }
  ul { margin: 0 0 6pt 0; padding-left: 16pt; }
  li { margin-bottom: 2pt; }
  hr { border: 0; border-top: 1px solid #d1d5db; margin: 8pt 0; }
  a { color: #2563eb; text-decoration: underline; }
  strong { font-weight: 700; }
  em { font-style: italic; }
`;

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

  const body = await req.json() as { content?: string; filename?: string; format?: 'docx' | 'pdf' };
  const format = body.format ?? 'docx';
  const defaultName = format === 'pdf' ? 'resume.pdf' : 'resume.docx';
  const filename = body.filename ?? defaultName;

  if (format === 'pdf') {
    const md = body.content ?? await getMasterResume(userId);
    const pdf = await mdToPdf(
      { content: md },
      {
        css: PDF_CSS,
        pdf_options: { format: 'Letter', printBackground: true },
        launch_options: { args: ['--no-sandbox', '--disable-setuid-sandbox'] },
      },
    );
    return new Response(new Uint8Array(pdf.content), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  }

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
