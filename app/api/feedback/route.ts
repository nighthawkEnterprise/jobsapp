import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { v4 as uuid } from 'uuid';

const FILE = path.join(process.cwd(), 'data', 'feedback.json');

interface FeedbackEntry {
  id: string;
  message: string;
  email: string;
  createdAt: string;
}

function read(): FeedbackEntry[] {
  if (!fs.existsSync(FILE)) return [];
  return JSON.parse(fs.readFileSync(FILE, 'utf8')) as FeedbackEntry[];
}

export async function POST(req: Request) {
  const { message, email = '' } = await req.json() as { message?: string; email?: string };
  if (!message?.trim()) {
    return NextResponse.json({ error: 'message required' }, { status: 400 });
  }
  const entries = read();
  entries.push({ id: uuid(), message: message.trim(), email: email.trim(), createdAt: new Date().toISOString() });
  fs.writeFileSync(FILE, JSON.stringify(entries, null, 2));
  return NextResponse.json({ success: true });
}

export async function GET() {
  return NextResponse.json({ entries: read() });
}
