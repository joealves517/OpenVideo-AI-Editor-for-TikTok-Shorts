"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, BookOpen, Flame, Coins, ArrowRight, GraduationCap } from "lucide-react";
import { toast } from "sonner";

interface AcademyModalProps {
  open?: boolean;
}

export function AcademyModal({ open: initialOpen = true }: AcademyModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Show modal on mount (whenever user enters the editing screen)
    setIsOpen(initialOpen);
  }, [initialOpen]);

  const handleOpenAcademy = () => {
    // Open in a new tab to prevent Next.js navigation interference and keep active editor session
    const url =
      typeof window !== "undefined" && window.location.protocol === "chrome-extension:"
        ? "academy.html"
        : "/academy";
    window.open(url, "_blank");
    setIsOpen(false);
    toast.success("Opening Faceless Academy in a new tab...");
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent
        className="max-w-[420px] sm:max-w-[420px] border-none ring-0 bg-white p-0 text-zinc-900 shadow-2xl overflow-hidden rounded-[24px]"
        showCloseButton={true}
      >
        {/* Banner Cover Image */}
        <div className="relative w-full aspect-video select-none overflow-hidden">
          <img
            src="/academy-banner.png"
            alt="AI Faceless Video Academy Cover"
            className="w-full h-full object-cover transform hover:scale-[1.02] transition-transform duration-700 ease-out"
          />
          {/* Subtle luxurious ambient glow inside image */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
        </div>

        {/* Content Area */}
        <div className="px-6 pt-5 pb-6 flex flex-col items-center relative z-10">
          <div className="flex items-center gap-2 mb-2 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full text-blue-600">
            <GraduationCap className="size-4 shrink-0" />
            <span className="text-[10px] font-bold tracking-wider uppercase">
              Faceless Video Academy
            </span>
          </div>

          <DialogTitle className="text-xl font-black text-center text-zinc-900 tracking-tight leading-tight">
            Explore Content Automation Academy!
          </DialogTitle>

          <DialogDescription className="text-xs text-zinc-500 text-center font-medium mt-1">
            The blueprint to build and automate high-yielding faceless channels.
          </DialogDescription>

          {/* Value Bullets */}
          <div className="w-full mt-5 space-y-3 bg-zinc-50 border border-zinc-200/50 p-4 rounded-xl">
            {[
              {
                icon: <Coins className="size-4 text-amber-500 shrink-0" />,
                title: "High-Paying CPM Niches",
                text: "Find the most profitable themes (Finance, Health, Tech, AI).",
              },
              {
                icon: <Sparkles className="size-4 text-violet-500 shrink-0" />,
                title: "50+ Script Hooks Library",
                text: "Copy high-retention attention-grabbing hooks in 1-click.",
              },
              {
                icon: <BookOpen className="size-4 text-blue-500 shrink-0" />,
                title: "5-Minute Daily Workflow",
                text: "Step-by-step automation checklist for faceless channels.",
              },
            ].map((bullet, idx) => (
              <div key={idx} className="flex items-start gap-3 text-left">
                <div className="mt-0.5 p-1 rounded-md bg-white border border-zinc-200/60 shadow-sm shrink-0">
                  {bullet.icon}
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-bold text-zinc-800 leading-none">
                    {bullet.title}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-medium leading-normal mt-0.5">
                    {bullet.text}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Action Button: Opens in New Tab */}
          <Button
            onClick={handleOpenAcademy}
            className="w-full mt-6 h-11 bg-zinc-950 hover:bg-zinc-900 text-white font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-[0.98] transition-all"
          >
            Open Academy & Get Resources
            <ArrowRight className="size-4 text-white" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
