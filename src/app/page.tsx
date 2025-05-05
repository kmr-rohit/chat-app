'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { ChatInput } from '@/components/ui/ChatInput';
import { Client, Storage, ID } from 'appwrite';

import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Carousel, CarouselItem } from '@/components/ui/carousel';

export default function Chat() {
  const [username, setUsername] = useState('');
  const [keyword, setKeyword] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Media upload state
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);

  const lastMessageRef = useRef<HTMLDivElement>(null);

  // Media preview modal state
  const [mediaPreviewOpen, setMediaPreviewOpen] = useState(false);
  const [mediaPreviewIndex, setMediaPreviewIndex] = useState(0);
  // Get all media messages (image/video)
  const mediaMessages = messages
    .map((msg, idx) => ({ ...msg, _idx: idx }))
    .filter(msg => msg.type === 'image-message' || msg.type === 'video-message');
  function openMediaPreview(msgIdx: number) {
    // Find the index of this media message in the filtered list
    const previewIdx = mediaMessages.findIndex(m => m._idx === msgIdx);
    setMediaPreviewIndex(previewIdx >= 0 ? previewIdx : 0);
    setMediaPreviewOpen(true);
  }

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
            {username === 'Rohit' && (
              <button
                onClick={cleanupMessages}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Clear Chat
              </button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-4 border rounded bg-gray-900">
            {messages.map((msg, index) => (
              <div
                key={msg.id}
                ref={index === messages.length - 1 ? lastMessageRef : null}
                className={`p-3 m-1 rounded-lg text-white ${
                  msg.sender === username
                    ? 'bg-blue-700 ml-auto' // sent by user
                    : 'bg-gray-700' // received
                } max-w-[80%]`}
              >
                <div className="break-words break-all whitespace-pre-wrap">{msg.message}</div>
                {/* Show image/video preview if message is image-message or video-message */}
                {msg.type === 'image-message' && msg.url && (
                  <img src={msg.url} alt="media" className="mt-2 rounded max-w-xs max-h-48 cursor-pointer" onClick={() => openMediaPreview(index)} />
                )}
                {msg.type === 'video-message' && msg.url && (
                  <video src={msg.url} className="mt-2 rounded max-w-xs max-h-48 cursor-pointer" controls onClick={() => openMediaPreview(index)} />
                )}
                <div className="text-xs text-gray-300 text-right">
                  {formatTime(msg.timestamp)}
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-2 p-2 border-t bg-gray-900">
            <div className="flex gap-2">
              <ChatInput
                type="text"
                placeholder="Type your message"
                className="flex-1"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <Button onClick={sendMessage}>
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
                <Button variant="outline" asChild>
                  <span>Upload Image/Video</span>
                </Button>
              </label>
              {mediaPreview && (
                <div className="flex items-center gap-2">
                  {mediaType === 'image' ? (
                    <img src={mediaPreview} alt="preview" className="h-12 w-12 object-cover rounded" />
                  ) : (
                    <video src={mediaPreview} className="h-12 w-12 object-cover rounded" controls />
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
      {/* Media preview modal */}
      <Dialog open={mediaPreviewOpen} onOpenChange={setMediaPreviewOpen}>
        <DialogContent className="max-w-2xl">
          <Carousel
            className="w-full"
            setApi={(api) => {
              if (api && mediaPreviewOpen) {
                api.scrollTo(mediaPreviewIndex);
              }
            }}
          >
            {mediaMessages.map((msg, idx) => (
              <CarouselItem key={msg.id || idx}>
                {msg.type === 'image-message' && msg.url && (
                  <img src={msg.url} alt="media" className="w-full max-h-[70vh] object-contain rounded" />
                )}
                {msg.type === 'video-message' && msg.url && (
                  <video src={msg.url} className="w-full max-h-[70vh] object-contain rounded" controls />
                )}
              </CarouselItem>
            ))}
          </Carousel>
        </DialogContent>
      </Dialog>
    </main>
  );
}
