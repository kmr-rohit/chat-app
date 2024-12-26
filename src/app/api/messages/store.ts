interface Message {
  sender: string;
  message: string;
  timestamp: Date;
  id: string;
}

export const KEYWORD = "troitroi";
export let activeMessages: Message[] = [];


export function cleanupMessages() {
  activeMessages = [];
}

export function addMessage(message: Message) {
  activeMessages.push(message);
  // cleanupMessages();
}

setInterval(() => {
  cleanupMessages();
}, 18000);