import { NextResponse } from 'next/server';
import { getMasterResume } from '@/lib/store';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { mdToPdf } from 'md-to-pdf';
import fs from 'fs';
import path from 'path';

const OUTPUT_DIR = path.join(process.cwd(), 'output');

export async function POST(req: Request) {
  const { format } = await req.json(); // 'docx' | 'pdf'
  const resumeMd = getMasterResume();

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

  try {
    if (format === 'docx') {
      // Extremely basic Markdown to Docx mapping for prototype
      const lines = resumeMd.split('\n');
      const docChildren = lines.map(line => {
        if (line.startsWith('# ')) return new Paragraph({ text: line.replace('# ', ''), heading: 'Heading1' });
        if (line.startsWith('## ')) return new Paragraph({ text: line.replace('## ', ''), heading: 'Heading2' });
        if (line.startsWith('### ')) return new Paragraph({ text: line.replace('### ', ''), heading: 'Heading3' });
        if (line.startsWith('- ')) return new Paragraph({ text: line.replace('- ', ''), bullet: { level: 0 } });
        return new Paragraph({ text: line });
      });

      const doc = new Document({ sections: [{ properties: {}, children: docChildren }] });
      const buffer = await Packer.toBuffer(doc);
      const filePath = path.join(OUTPUT_DIR, `master-resume-${timestamp}.docx`);
      fs.writeFileSync(filePath, buffer);
      
      return NextResponse.json({ success: true, filePath });

    } else if (format === 'pdf') {
      const filePath = path.join(OUTPUT_DIR, `master-resume-${timestamp}.pdf`);
      await mdToPdf({ content: resumeMd }, { dest: filePath });
      return NextResponse.json({ success: true, filePath });
    }

    return NextResponse.json({ error: 'Invalid format' }, { status: 400 });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 });
  }
}
