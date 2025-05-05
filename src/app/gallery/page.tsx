"use client";

import PasscodeGate from "@/components/PasscodeGate";
import { useEffect, useState } from "react";
import { Client, Storage, Account } from "appwrite";

const APPWRITE_ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "https://fra.cloud.appwrite.io/v1";
const APPWRITE_PROJECT = process.env.NEXT_PUBLIC_APPWRITE_PROJECT || "6818f27f0020b6f37ce7";
const APPWRITE_BUCKET = process.env.NEXT_PUBLIC_APPWRITE_BUCKET || "6818f4b3000b55e6e8d7";

export default function Gallery() {
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [passcodeOk, setPasscodeOk] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<any>(null);

  // Appwrite client setup
  const client = new Client();
  client.setEndpoint(APPWRITE_ENDPOINT).setProject(APPWRITE_PROJECT);
  const storage = new Storage(client);
  const account = new Account(client);

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

  // Fetch files
  useEffect(() => {
    if (!passcodeOk) return;
    async function fetchFiles() {
      setLoading(true);
      try {
        const res = await storage.listFiles(APPWRITE_BUCKET);
        setFiles(res.files);
      } catch (err: any) {
        setError(err.message || "Failed to fetch files");
      }
      setLoading(false);
    }
    fetchFiles();
  }, [passcodeOk]);

  // Multi-select logic
  function toggleSelect(id: string) {
    setSelected(sel => sel.includes(id) ? sel.filter(x => x !== id) : [...sel, id]);
  }
  function clearSelection() {
    setSelected([]);
  }
  async function handleDelete() {
    if (!selected.length) return;
    setLoading(true);
    try {
      await Promise.all(selected.map(id => storage.deleteFile(APPWRITE_BUCKET, id)));
      setFiles(files.filter((f: any) => !selected.includes(f.$id)));
      setSelected([]);
    } catch (err: any) {
      setError(err.message || "Delete failed");
    }
    setLoading(false);
  }

  // Preview logic
  function openPreview(idx: number) {
    setPreviewFile(files[idx]);
    setPreviewOpen(true);
  }

  // Shadcn UI imports
  // Button, Dialog, Carousel, Checkbox
  const { Button } = require("@/components/ui/button");
  const { Dialog, DialogContent } = require("@/components/ui/dialog");
  const { Carousel, CarouselItem } = require("@/components/ui/carousel");
  const { GalleryCheckbox } = require("@/components/GalleryCheckbox");

  if (!passcodeOk) {
    return <PasscodeGate onSuccess={() => setPasscodeOk(true)} />;
  }

  return (
    <div className="max-w-4xl mx-auto mt-8 p-4">
      <h2 className="text-xl font-bold mb-4">Gallery</h2>
      {loading && <div>Loading...</div>}
      {error && <div className="text-red-500">{error}</div>}
      {selected.length > 0 && (
        <div className="mb-4 flex gap-2">
          <Button variant="destructive" onClick={handleDelete} disabled={loading}>
            Delete Selected ({selected.length})
          </Button>
          <Button variant="outline" onClick={clearSelection}>Cancel</Button>
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {files.map((file, idx) => (
          <div key={file.$id} className={`relative border rounded p-2 bg-card shadow-sm group`}>
            <div className="absolute top-2 left-2 z-10">
              <GalleryCheckbox
                checked={selected.includes(file.$id)}
                onChange={() => toggleSelect(file.$id)}
                aria-label="Select file"
              />
            </div>
            {file.mimeType.startsWith("image") ? (
              <img
                src={`https://fra.cloud.appwrite.io/v1/storage/buckets/${APPWRITE_BUCKET}/files/${file.$id}/view?project=${APPWRITE_PROJECT}`}
                alt={file.name}
                className="w-full h-32 object-cover rounded cursor-pointer"
                onClick={() => openPreview(idx)}
              />
            ) : file.mimeType.startsWith("video") ? (
              <video
                src={`https://fra.cloud.appwrite.io/v1/storage/buckets/${APPWRITE_BUCKET}/files/${file.$id}/view?project=${APPWRITE_PROJECT}`}
                controls
                className="w-full h-32 object-cover rounded cursor-pointer"
                onClick={() => openPreview(idx)}
              />
            ) : (
              <div className="text-xs text-gray-500">{file.name}</div>
            )}
          </div>
        ))}
      </div>
      {/* Preview Modal */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl">
          {previewFile && (
            <div className="w-full flex justify-center">
              {previewFile.mimeType.startsWith("image") ? (
                <img
                  src={`https://fra.cloud.appwrite.io/v1/storage/buckets/${APPWRITE_BUCKET}/files/${previewFile.$id}/view?project=${APPWRITE_PROJECT}`}
                  alt={previewFile.name}
                  className="w-full max-h-[70vh] object-contain rounded"
                />
              ) : previewFile.mimeType.startsWith("video") ? (
                <video
                  src={`https://fra.cloud.appwrite.io/v1/storage/buckets/${APPWRITE_BUCKET}/files/${previewFile.$id}/view?project=${APPWRITE_PROJECT}`}
                  controls
                  autoPlay
                  className="w-full max-h-[70vh] object-contain rounded"
                />
              ) : (
                <div className="text-xs text-gray-500">{previewFile.name}</div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
