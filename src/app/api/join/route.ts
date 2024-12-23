import { NextResponse } from 'next/server';
import { KEYWORD } from '../messages/store';

export async function POST(req: Request) {
  const { keyword } = await req.json();
  
  if (keyword === KEYWORD) {
    return NextResponse.json({ status: 'success' });
  }
  
  return NextResponse.json({ status: 'error', message: 'Invalid keyword' }, { status: 401 });
}