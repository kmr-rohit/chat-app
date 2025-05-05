"use client";

import { useState, useEffect, useMemo } from "react";
import { Client, Storage, ID, Account } from "appwrite";

// Appwrite config
const APPWRITE_ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "https://fra.cloud.appwrite.io/v1";
const APPWRITE_PROJECT = process.env.NEXT_PUBLIC_APPWRITE_PROJECT || "6818f27f0020b6f37ce7";
const APPWRITE_BUCKET = process.env.NEXT_PUBLIC_APPWRITE_BUCKET || "6818f4b3000b55e6e8d7"; // You must create this bucket in your Appwrite console

import PasscodeGate from "@/components/PasscodeGate";

export default function Upload() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [passcodeOk, setPasscodeOk] = useState(false);

  // Memoize Appwrite client objects so they're not recreated on every render
  const client = useMemo(() => {
    const c = new Client();
    c.setEndpoint(APPWRITE_ENDPOINT).setProject(APPWRITE_PROJECT);
    return c;
  }, []);
  const storage = useMemo(() => new Storage(client), [client]);
  const account = useMemo(() => new Account(client), [client]);

  // Anonymous auth at top level
  useEffect(() => {
    if (!passcodeOk) return;
    async function ensureSession() {
      try {
        await account.get();
      } catch {
        await account.createAnonymousSession();
      }
    }
    ensureSession();
  }, [passcodeOk]);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!file) {
      setError("Please select a file");
      return;
    }
    setUploading(true);
    try {
      await storage.createFile(APPWRITE_BUCKET, ID.unique(), file);
      setSuccess("Upload successful!");
      setFile(null);
    } catch (err: any) {
      setError(err.message || "Upload failed");
    }
    setUploading(false);
  }

  // Shadcn UI imports
  const { Button } = require("@/components/ui/button");

  return (
    <div className="max-w-lg mx-auto mt-8 p-6 bg-card rounded shadow">
      <h2 className="text-xl font-bold mb-4">Upload Image or Video</h2>
      <form onSubmit={handleUpload} className="flex flex-col gap-4">
        <input
          type="file"
          accept="image/*,video/*"
          onChange={e => setFile(e.target.files?.[0] || null)}
          className="border border-border p-2 rounded bg-background text-foreground"
        />
        <Button type="submit" disabled={uploading} className="w-full">
          {uploading ? "Uploading..." : "Upload"}
        </Button>
        {error && <div className="text-red-500 bg-destructive/10 border border-destructive rounded px-3 py-2 text-sm">{error}</div>}
        {success && <div className="text-green-400 bg-green-900/10 border border-green-800 rounded px-3 py-2 text-sm">{success}</div>}
      </form>
    </div>
  );
}
