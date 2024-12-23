import { NextResponse } from 'next/server';
import { messages, cleanupMessages } from './store';

export async function GET() {
  cleanupMessages();
  return NextResponse.json(messages);
}