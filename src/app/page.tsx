'use client';

import { useState, useEffect, useRef } from 'react';

export default function Chat() {
  const [username, setUsername] = useState('');
  const [keyword, setKeyword] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const lastMessageRef = useRef<HTMLDivElement>(null);

  const joinChat = async () => {
    const res = await fetch('/api/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keyword })
    });
    
    if (res.ok) {
      setIsAuthenticated(true);
    }
  };

  const sendMessage = async () => {
    if (!message.trim()) return;

    await fetch('/api/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, sender: username })
    });

    setMessage('');
  };

  const cleanupMessages = async () => {
    await fetch('/api/cleanup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      const interval = setInterval(async () => {
        const res = await fetch('/api/messages');
        const data = await res.json();
        setMessages(data);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [messages]);

  const formatTime = (date: string) => {
    const d = new Date(date);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <main className="max-w-2xl mx-auto p-4 flex flex-col h-screen">
      {!isAuthenticated ? (
        <div className="space-y-4">
          <h1 className="text-2xl font-bold">Join Chat</h1>
          <input
            type="text"
            placeholder="Enter secret keyword"
            className="w-full p-2 border rounded"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          <input
            type="text"
            placeholder="Enter your name"
            className="w-full p-2 border rounded"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <button
            onClick={joinChat}
            className="w-full p-2 bg-blue-500 text-white rounded"
          >
            Join
          </button>
        </div>
      ) : (
        <div className="flex flex-col h-[98%]">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Chat Room</h2>
            {username === 'Rohit' && (
              <button
                onClick={cleanupMessages}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Clear Chat
              </button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-4 border rounded">
            {messages.map((msg, index) => (
              <div
                key={msg.id}
                ref={index === messages.length - 1 ? lastMessageRef : null}
                className={`p-3 m-1 rounded-lg ${
                  msg.sender === username
                    ? 'bg-blue-100 ml-auto'
                    : 'bg-gray-100'
                } max-w-[80%]`}
              >
                <div>{msg.message}</div>
                <div className="text-xs text-gray-500 text-right">
                  {formatTime(msg.timestamp)}
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2 p-2 border-t">
            <input
              type="text"
              placeholder="Type your message"
              className="flex-1 p-2 border rounded"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <button
              onClick={sendMessage}
              className="px-4 py-2 bg-blue-500 text-white rounded"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
