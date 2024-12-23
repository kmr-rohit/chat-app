interface Message {
  sender: string;
  message: string;
  timestamp: Date;
  id: string;
}

export const KEYWORD = "troitroi";
export let messages: Message[] = [];

export function cleanupMessages() {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  messages = messages.filter(msg => new Date(msg.timestamp) > fiveMinutesAgo);
}

setInterval(cleanupMessages, 30000);