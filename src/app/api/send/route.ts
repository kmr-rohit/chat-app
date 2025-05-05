import { NextResponse } from 'next/server';
import { connectToDatabase } from '../utils/mongodb';
import crypto from 'crypto';

export async function POST(req: Request) {
  const { message, sender, type, url } = await req.json();
  
  if (message || ((type === 'image-message' || type === 'video-message') && url)) {
    const newMessage: any = {
      id: crypto.randomBytes(16).toString('hex'),
      sender,
      message: message || '',
      timestamp: new Date(),
    };
    if (type) newMessage.type = type;
    if (url) newMessage.url = url;

    const { db } = await connectToDatabase();
    await db.collection('messages').insertOne(newMessage);

    return NextResponse.json({ status: 'success' });
  }
  
  return NextResponse.json({ status: 'error', message: 'Invalid message' }, { status: 400 });
}