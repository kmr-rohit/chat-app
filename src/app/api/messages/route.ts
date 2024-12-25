import { NextResponse } from 'next/server';
import { activeMessages } from './store';

export async function GET() {
  return NextResponse.json(activeMessages);
}