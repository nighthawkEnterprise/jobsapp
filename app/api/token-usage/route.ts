import { NextResponse } from 'next/server';
import { getUsage } from '@/lib/usage';

export async function GET() {
  const stats = await getUsage();
  return NextResponse.json(stats);
}
