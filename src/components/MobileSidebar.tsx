"use client";

import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

export function MobileSidebar() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 bg-card">
        <div className="font-bold text-lg py-4 border-b border-border">Chat App</div>
        <nav className="flex flex-col gap-2 py-4">
          <a href="/" className="px-3 py-2 rounded hover:bg-muted transition">Chat</a>
          <a href="/gallery" className="px-3 py-2 rounded hover:bg-muted transition">Gallery</a>
          <a href="/upload" className="px-3 py-2 rounded hover:bg-muted transition">Upload</a>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
