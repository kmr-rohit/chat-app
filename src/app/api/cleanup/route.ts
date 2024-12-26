// app/api/cleanup/route.ts
import { cleanupMessages } from '../messages/store';

export async function POST() {
  cleanupMessages();
  return Response.json({ success: true });
}