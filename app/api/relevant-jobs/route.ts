import { NextResponse } from 'next/server';
import { getJobs } from '@/lib/store';

export async function GET() {
  return NextResponse.json(getJobs());
}
