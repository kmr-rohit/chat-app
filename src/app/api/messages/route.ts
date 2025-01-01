import { NextResponse } from 'next/server';
import { connectToDatabase } from '../utils/mongodb';

export async function GET() {
  const { db } = await connectToDatabase();
  // console.log('db', db);
  const messages = await db.collection('messages').find({}).toArray();
  return NextResponse.json(messages);
}