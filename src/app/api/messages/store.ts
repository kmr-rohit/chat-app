interface Message {
  sender: string;
  message: string;
  timestamp: Date;
  id: string;
}

export const KEYWORD = "Troitroi1020";
export let activeMessages: Message[] = [];


export function cleanupMessages() {
  activeMessages = [];
}

export function addMessage(message: Message) {
  activeMessages.push(message);
  // cleanupMessages();
}

// setInterval(() => {
//   cleanupMessages();
// }, 300000);
