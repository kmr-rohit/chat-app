import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../utils/mongodb';
import crypto from 'crypto';
import path from 'path';
import { writeFile } from 'fs/promises';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const formData = await req.formData();
  const sender = formData.get('sender');
  const file = formData.get('file') as File | null;

  if (!file || !sender) {
    return NextResponse.json({ status: 'error', message: 'Missing file or sender' }, { status: 400 });
  }

  const ext = file.name.split('.').pop();
  const id = crypto.randomBytes(16).toString('hex');
  const filename = `${id}.${ext}`;
  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  const filePath = path.join(uploadDir, filename);
  const fileUrl = `/uploads/${filename}`;

  // Ensure /public/uploads exists
  await writeFile(filePath, Buffer.from(await file.arrayBuffer()));

  const { db } = await connectToDatabase();
  const newMessage = {
    id,
    sender,
    message: '',
    media: {
      url: fileUrl,
      type: file.type.startsWith('image') ? 'image' : 'video',
    },
    timestamp: new Date(),
  };
  await db.collection('messages').insertOne(newMessage);

  return NextResponse.json({ status: 'success', url: fileUrl, type: newMessage.media.type, id });
}
