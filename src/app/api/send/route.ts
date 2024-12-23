import { NextResponse } from 'next/server';
import { messages } from '../messages/store';
import crypto from 'crypto';

export async function POST(req: Request) {
  const { message, sender } = await req.json();
  
  if (message && sender) {
    messages.push({
      id: crypto.randomBytes(16).toString('hex'),
      sender,
      message,
      timestamp: new Date()
    });
    return NextResponse.json({ status: 'success' });
  }
  
  return NextResponse.json({ status: 'error', message: 'Invalid message' }, { status: 400 });
}