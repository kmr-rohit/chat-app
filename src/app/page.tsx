'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { ChatInput } from '@/components/ui/ChatInput';
import { Client, Storage, ID } from 'appwrite';
import { FaUser } from 'react-icons/fa';

import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Carousel, CarouselItem } from '@/components/ui/carousel';

export default function Chat() {
  const [username, setUsername] = useState('');
  const [keyword, setKeyword] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [notifying, setNotifying] = useState(false);
  const [notificationSent, setNotificationSent] = useState(false);
  const [notificationTime, setNotificationTime] = useState<string | null>(null);

  // Media upload state
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);

  const lastMessageRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);

  // Media preview modal state
  const [mediaPreviewOpen, setMediaPreviewOpen] = useState(false);
  const [previewMedia, setPreviewMedia] = useState<{ url: string, type: string } | null>(null);

  // Appwrite config
  const APPWRITE_ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "https://fra.cloud.appwrite.io/v1";
  const APPWRITE_PROJECT = process.env.NEXT_PUBLIC_APPWRITE_PROJECT || "6818f27f0020b6f37ce7";
  const APPWRITE_BUCKET = process.env.NEXT_PUBLIC_APPWRITE_BUCKET || "6818f4b3000b55e6e8d7";

  // Memoize Appwrite client/storage
  const client = useMemo(() => {
    const c = new Client();
    c.setEndpoint(APPWRITE_ENDPOINT).setProject(APPWRITE_PROJECT);
    return c;
  }, []);
  const storage = useMemo(() => new Storage(client), [client]);

  // Media upload handlers
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [uploadError, setUploadError] = useState("");
  async function onMediaChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setMediaFile(file);
    setMediaPreview(null);
    setMediaType(file.type.startsWith('image') ? 'image' : 'video');
    setUploadError("");
    setUploadingMedia(true);
    try {
      // Upload to Appwrite
      const res = await storage.createFile(APPWRITE_BUCKET, ID.unique(), file);
      // Get preview URL
      const url = `https://fra.cloud.appwrite.io/v1/storage/buckets/${APPWRITE_BUCKET}/files/${res.$id}/view?project=${APPWRITE_PROJECT}`;
      setMediaPreview(url);
    } catch (err: any) {
      setUploadError(err.message || "Upload failed");
      setMediaFile(null);
      setMediaPreview(null);
      setMediaType(null);
    }
    setUploadingMedia(false);
  }
  function clearMedia() {
    setMediaFile(null);
    setMediaPreview(null);
    setMediaType(null);
    setUploadError("");
  }
  async function sendMediaMessage() {
    if (!mediaFile || !mediaPreview || !mediaType) return;
    // Send to backend (MongoDB)
    await fetch('/api/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: '',
        sender: username,
        type: mediaType + '-message',
        url: mediaPreview,
      })
    });
    setMessage("");
    clearMedia();
  }

  const joinChat = async () => {
    // Validate inputs
    if (!keyword.trim()) {
      alert('Please enter a keyword');
      return;
    }
    if (!username.trim()) {
      alert('Please enter your name');
      return;
    }

    try {
      const res = await fetch('/api/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setIsAuthenticated(true);
      } else {
        alert(data.message || 'Failed to join chat');
      }
    } catch (error) {
      console.error('Error joining chat:', error);
      alert('Failed to connect to server');
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

  // Add this new function to handle scroll events
  const handleScroll = () => {
    if (!chatContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    const isAtBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 50;
    
    setIsUserScrolling(!isAtBottom);
  };

  useEffect(() => {
    if (lastMessageRef.current && !isUserScrolling) {
      lastMessageRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [messages, isUserScrolling]);

  const formatTime = (date: string) => {
    const d = new Date(date);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  // Send notification to Rohit
  const sendNotification = async () => {
    if (!username) return;
    
    setNotifying(true);
    try {
      const res = await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sender: username,
          message: 'is waiting for you in the chat!' 
        })
      });
      
      if (res.ok) {
        setNotificationSent(true);
        const now = new Date();
        setNotificationTime(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`);
        // Reset after 5 minutes
        setTimeout(() => {
          setNotificationSent(false);
          setNotificationTime(null);
        }, 300000); // 5 minutes
      }
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
    setNotifying(false);
  };

  function openMediaPreview(msgIdx: number) {
    const msg = messages[msgIdx];
    if (msg && (msg.type === 'image-message' || msg.type === 'video-message') && msg.url) {
      setPreviewMedia({
        url: msg.url,
        type: msg.type
      });
      setMediaPreviewOpen(true);
    }
  }

  return (
    <main className="max-w-2xl mx-auto p-4 flex flex-col h-screen">
      {!isAuthenticated ? (
        <div className="space-y-4">
          <h1 className="text-2xl font-bold">Join Chat</h1>
          <ChatInput
            type="text"
            placeholder="Enter secret keyword"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          <ChatInput
            type="text"
            placeholder="Enter your name"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <Button onClick={joinChat} className="w-full">
            Join
          </Button>
        </div>
      ) : (
        <div className="flex flex-col h-[98%]">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Chat Room</h2>
            <div className="flex gap-2">
              {/* Notification button - only visible for non-Rohit users */}
              {username !== 'Rohit' && (
                <div className="flex items-center">
                  {notificationSent ? (
                    <span className="text-xs text-green-400 mr-2">
                      Notification sent at {notificationTime}
                    </span>
                  ) : null}
                  <Button
                    onClick={sendNotification}
                    disabled={notifying || notificationSent}
                    className={`${notifying ? 'bg-gray-500' : notificationSent ? 'bg-green-600' : 'bg-blue-600'} text-white`}
                    size="sm"
                  >
                    {notifying ? 'Sending...' : notificationSent ? 'Notified' : 'Notify Rohit'}
                  </Button>
                </div>
              )}
              
              {/* Admin clear chat button */}
              {username === 'Rohit' && (
                <button
                  onClick={cleanupMessages}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Clear Chat
                </button>
              )}
            </div>
          </div>
          {/* Chat scrollable message area */}
          <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 border rounded bg-gray-100 dark:bg-gray-900" onScroll={handleScroll}>
            {messages.map((msg, index) => {
  const isUser = msg.sender === username;
  return (
    <div key={msg.id || index} className={`flex flex-col mb-3 ${isUser ? 'items-end' : 'items-start'}`} ref={index === messages.length - 1 ? lastMessageRef : null}>
      <div className={`flex items-end ${isUser ? 'justify-end' : 'justify-start'} w-full`}>
        {/* Avatar for receiver (left) */}
        {!isUser && (
          <div className="flex-shrink-0 mr-2">
            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-white shadow-md">
              {/* Default user icon */}
              <FaUser className="w-5 h-5 text-gray-500" />
            </div>
          </div>
        )}
        {/* Message bubble */}
        <div
          className={`relative p-3 rounded-2xl shadow-md transition-all duration-150 group ${
            isUser
              ? 'bg-blue-600 text-white rounded-br-none'
              : 'bg-gray-100 text-gray-900 rounded-bl-none'
          } max-w-[80%] flex flex-col gap-1`}
        >
          {/* Message text */}
          {msg.message && (
            <div className="break-words break-all whitespace-pre-wrap text-sm">{msg.message}</div>
          )}
          {/* Media preview */}
          {msg.type === 'image-message' && msg.url && (
            <img
              src={msg.url}
              alt="media"
              className="mt-2 rounded-lg max-w-xs max-h-48 cursor-pointer border border-gray-200 hover:scale-105 transition-transform duration-150"
              onClick={() => openMediaPreview(index)}
            />
          )}
          {msg.type === 'video-message' && msg.url && (
            <video
              src={msg.url}
              className="mt-2 rounded-lg max-w-xs max-h-48 cursor-pointer border border-gray-200 hover:scale-105 transition-transform duration-150"
              controls
              onClick={() => openMediaPreview(index)}
            />
          )}
          {/* Timestamp */}
          <div className={`text-xs mt-1 ${isUser ? 'text-blue-200' : 'text-gray-500'}`}>
            {formatTime(msg.timestamp)}
          </div>
        </div>
        {/* Avatar for sender (right) */}
        {isUser && (
          <div className="flex-shrink-0 ml-2">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white shadow-md">
              {/* Default user icon */}
              <FaUser className="w-5 h-5 text-white" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
})}
          </div>
          {/* Chat input area */}
          <div className="flex flex-col gap-2 p-3 border-t bg-gray-50 dark:bg-gray-900">
            <div className="flex gap-2">
              <ChatInput
                type="text"
                placeholder="Type your message"
                className="flex-1 rounded-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all bg-white dark:bg-gray-800 dark:border-gray-700"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <Button
                onClick={sendMessage}
                className="rounded-full px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow transition-all"
              >
                Send
              </Button>
            </div>
            <div className="flex gap-2 items-center">
              <input
                type="file"
                accept="image/*,video/*"
                id="media-upload"
                className="hidden"
                onChange={onMediaChange}
              />
              <label htmlFor="media-upload">
                <Button variant="outline" asChild className="rounded-full px-4 py-2">
                  <span>Upload Image/Video</span>
                </Button>
              </label>
              {mediaPreview && (
                <div className="flex items-center gap-2 animate-fade-in">
                  {mediaType === 'image' ? (
                    <img src={mediaPreview} alt="preview" className="h-12 w-12 object-cover rounded-lg border border-gray-200" />
                  ) : (
                    <video src={mediaPreview} className="h-12 w-12 object-cover rounded-lg border border-gray-200" controls />
                  )}
                  <Button variant="destructive" size="sm" onClick={clearMedia}>
                    Remove
                  </Button>
                  <Button size="sm" onClick={sendMediaMessage}>
                    Send Media
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Media preview modal with download button */}
      <Dialog open={mediaPreviewOpen} onOpenChange={setMediaPreviewOpen}>
        <DialogContent className="max-w-2xl">
          {previewMedia && (
            <div className="w-full flex flex-col items-center gap-2">
              {previewMedia.type === 'image-message' && (
                <img src={previewMedia.url} alt="media" className="w-full max-h-[70vh] object-contain rounded" />
              )}
              {previewMedia.type === 'video-message' && (
                <video src={previewMedia.url} className="w-full max-h-[70vh] object-contain rounded" controls autoPlay />
              )}
              {/* Download button */}
              <a href={previewMedia.url} download target="_blank" rel="noopener noreferrer" className="mt-2 px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700">Download</a>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
