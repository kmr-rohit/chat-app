interface Message {
  sender: string;
  message: string;
  timestamp: Date;
  id: string;
}

export const KEYWORD = "troitroi";
export let activeMessages: Message[] = [];


export function cleanupMessages() {
  // clear all messages from active messages 
  activeMessages = activeMessages.filter((message) => {
    return message.timestamp.getTime() > Date.now() - 180000;
  });
}

export function addMessage(message: Message) {
  activeMessages.push(message);
  cleanupMessages();
}

setInterval(() => {
  cleanupMessages();
}, 185000);