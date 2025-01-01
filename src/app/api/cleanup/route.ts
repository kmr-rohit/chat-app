// app/api/cleanup/route.ts
import { connectToDatabase } from '../utils/mongodb';

export async function POST() {
  const { db } = await connectToDatabase();
  await db.collection('messages').deleteMany({});
  return Response.json({ success: true });
}