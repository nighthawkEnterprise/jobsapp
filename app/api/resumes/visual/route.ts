import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import mammoth from 'mammoth';

const DOCX_FILE = path.join(process.cwd(), 'data', 'resume.docx');

export async function GET() {
  if (!fs.existsSync(DOCX_FILE)) {
    return NextResponse.json({ error: 'No docx source on file' }, { status: 404 });
  }
  const buffer = fs.readFileSync(DOCX_FILE);
  const { value: html } = await mammoth.convertToHtml({ buffer });
  return NextResponse.json({ html });
}
