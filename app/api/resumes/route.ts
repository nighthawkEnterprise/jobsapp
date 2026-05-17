import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getMasterResume, saveMasterResume } from '@/lib/store';
import mammoth from 'mammoth';
import TurndownService from 'turndown';

const OUTPUT_DIR = path.join(process.cwd(), 'output');
const turndownService = new TurndownService({ headingStyle: 'atx' });

export async function GET() {
  const master = getMasterResume();

  let tailored: any[] = [];
  if (fs.existsSync(OUTPUT_DIR)) {
    const files = fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.md'));
    tailored = files.map(file => {
      const filePath = path.join(OUTPUT_DIR, file);
      const stat = fs.statSync(filePath);
      const content = fs.readFileSync(filePath, 'utf8');
      
      return {
        id: file,
        name: file,
        content: content,
        // Fallback to mtime if birthtime is not available (like on some Linux systems)
        createdAt: stat.birthtimeMs > 0 ? stat.birthtime.toISOString() : stat.mtime.toISOString()
      };
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  return NextResponse.json({ master, tailored });
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    let finalContent = '';

    if (file.name.endsWith('.docx')) {
      // It's a binary docx file, we need to extract to HTML then Markdown
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const { value: html } = await mammoth.convertToHtml({ buffer });
      finalContent = turndownService.turndown(html);
    } else {
      // Treat as plain text (.md, .txt)
      finalContent = await file.text();
    }

    saveMasterResume(finalContent);
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error("Error processing file upload:", error);
    return NextResponse.json({ error: 'Failed to process and save resume' }, { status: 500 });
  }
}
