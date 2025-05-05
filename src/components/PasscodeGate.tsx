"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function PasscodeGate({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(true);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const PASSCODE = process.env.NEXT_PUBLIC_PASSCODE || "1020"; // Fallback to default if env var not set

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (input.length !== 4) {
      setError("Passcode must be 4 digits");
      return;
    }
    if (String(input) === String(PASSCODE)) {
      setOpen(false);
      setError("");
      onSuccess();
    } else {
      setError("Incorrect passcode");
    }
  }

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-[350px]">
        <DialogHeader>
          <DialogTitle>Enter Passcode</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="password"
            maxLength={4}
            inputMode="numeric"
            autoFocus
            className="w-full px-3 py-2 border rounded bg-gray-800 text-white"
            value={input}
            onChange={e => setInput(e.target.value.replace(/[^0-9]/g, ""))}
            placeholder="4-digit passcode"
          />
          {error && <div className="text-red-500 text-sm">{error}</div>}
          <DialogFooter>
            <Button type="submit" className="w-full">Enter</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
