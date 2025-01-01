import { NextResponse } from 'next/server';
import { connectToDatabase } from '../utils/mongodb';
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

    const { db } = await connectToDatabase();
    await db.collection('messages').insertOne(newMessage);

    return NextResponse.json({ status: 'success' });
  }
  
  return NextResponse.json({ status: 'error', message: 'Invalid message' }, { status: 400 });
}