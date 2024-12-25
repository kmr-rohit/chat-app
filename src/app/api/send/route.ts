import { NextResponse } from 'next/server';
import { addMessage } from '../messages/store';
import crypto from 'crypto';

export async function POST(req: Request) {
  const { message, sender } = await req.json();
  
  if (message) {
    const newMessage = {
      id: crypto.randomBytes(16).toString('hex'),
      sender,
      message,
      timestamp: new Date()
    };
    addMessage(newMessage);
    return NextResponse.json({ status: 'success' });
  }
  
  return NextResponse.json({ status: 'error', message: 'Invalid message' }, { status: 400 });
}