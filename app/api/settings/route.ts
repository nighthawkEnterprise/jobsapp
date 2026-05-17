import { NextResponse } from 'next/server';
import { getPreferences, savePreferences, getMasterResume, saveMasterResume } from '@/lib/store';

export async function GET() {
  return NextResponse.json({
    preferences: getPreferences(),
    resume: getMasterResume()
  });
}

export async function POST(req: Request) {
  const data = await req.json();
  if (data.preferences) savePreferences(data.preferences);
  if (data.resume !== undefined) saveMasterResume(data.resume);
  return NextResponse.json({ success: true });
}
