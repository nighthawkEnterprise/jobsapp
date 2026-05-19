import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { v4 as uuid } from 'uuid';

const FILE = path.join(process.cwd(), 'data', 'waitlist.json');

interface WaitlistEntry {
  id: string;
  email: string;
  source: string;
  createdAt: string;
}

function read(): WaitlistEntry[] {
  if (!fs.existsSync(FILE)) return [];
  return JSON.parse(fs.readFileSync(FILE, 'utf8')) as WaitlistEntry[];
}

function write(entries: WaitlistEntry[]) {
  fs.writeFileSync(FILE, JSON.stringify(entries, null, 2));
}

export async function POST(req: Request) {
  const { email, source = 'landing' } = await req.json() as { email?: string; source?: string };

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Valid email required.' }, { status: 400 });
  }

  const entries = read();
  if (entries.some(e => e.email.toLowerCase() === email.toLowerCase())) {
    return NextResponse.json({ alreadyJoined: true });
  }

  entries.push({ id: uuid(), email: email.toLowerCase(), source, createdAt: new Date().toISOString() });
  write(entries);

  return NextResponse.json({ success: true, position: entries.length });
}

export async function GET() {
  const entries = read();
  return NextResponse.json({ count: entries.length, entries });
}
