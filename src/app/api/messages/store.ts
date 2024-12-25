interface Message {
  sender: string;
  message: string;
  timestamp: Date;
  id: string;
}

export const KEYWORD = "troitroi";
export let activeMessages: Message[] = [];
let trashMessages: Message[] = [];
const MAX_ACTIVE_MESSAGES = 15;

export function cleanupMessages() {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  
  // Move excess messages to trash
  if (activeMessages.length > MAX_ACTIVE_MESSAGES) {
    const excessMessages = activeMessages.slice(0, activeMessages.length - MAX_ACTIVE_MESSAGES);
    trashMessages.push(...excessMessages);
    activeMessages = activeMessages.slice(-MAX_ACTIVE_MESSAGES);
  }

  // Clean trash array
  trashMessages = trashMessages.filter(msg => new Date(msg.timestamp) > fiveMinutesAgo);
}

export function addMessage(message: Message) {
  activeMessages.push(message);
  cleanupMessages();
}

setInterval(() => {
  cleanupMessages();
}, 30000);