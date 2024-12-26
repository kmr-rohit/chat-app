'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export default function Chat() {
  const [username, setUsername] = useState('');
  const [keyword, setKeyword] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const previousMessagesRef = useRef<any[]>([]);

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

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch('/api/messages');
      const data = await res.json();
      
      // Only update if messages have changed
      if (JSON.stringify(data) !== JSON.stringify(previousMessagesRef.current)) {
        setMessages(data);
        previousMessagesRef.current = data;
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  }, []);

  const sendMessage = async () => {
    if (!message.trim()) return;

    try {
      await fetch('/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, sender: username })
      });

      // Optimistic update
      const newMessage = {
        id: Date.now(),
        message,
        sender: username,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, newMessage]);
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if (isAuthenticated) {
      fetchMessages(); // Initial fetch
      intervalId = setInterval(fetchMessages, 1000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isAuthenticated, fetchMessages]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
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
            className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Join
          </button>
        </div>
      ) : (
        <div className="flex flex-col h-[90%]">
          <div className="flex-1 overflow-y-auto space-y-2 p-4 border rounded">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`p-3 rounded-lg ${
                  msg.sender === username
                    ? 'bg-blue-100 ml-auto'
                    : 'bg-gray-100'
                } max-w-[80%] break-words`}
              >
                <div>{msg.message}</div>
                <div className="text-xs text-gray-500 text-right">
                  {formatTime(msg.timestamp)}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
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
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              disabled={!message.trim()}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </main>
  );
}