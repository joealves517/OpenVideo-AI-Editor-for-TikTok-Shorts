"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  GraduationCap,
  Coins,
  Flame,
  Zap,
  TrendingUp,
  Copy,
  Check,
  ExternalLink,
  ChevronRight,
  BookOpen,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";

export default function PanelAcademy() {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeAccordion, setActiveAccordion] = useState<string | null>("niches");

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Hook template copied!");
    setTimeout(() => setCopiedId(null), 1500);
  };

  const niches = [
    {
      title: "Finance & Investing",
      cpm: "$10-50 CPM",
      color: "text-amber-400",
      icon: <Coins className="size-4" />,
    },
    {
      title: "Health & Wellness",
      cpm: "$3-10 CPM",
      color: "text-emerald-400",
      icon: <Flame className="size-4" />,
    },
    {
      title: "Technology & AI",
      cpm: "$5-20 CPM",
      color: "text-cyan-400",
      icon: <Zap className="size-4" />,
    },
    {
      title: "Business & Startups",
      cpm: "$8-25 CPM",
      color: "text-violet-400",
      icon: <TrendingUp className="size-4" />,
    },
  ];

  const hooks = [
    {
      id: "h1",
      category: "Retention Hook",
      text: "Why 99% of people fail at [topic], and the 1% secret they won't tell you.",
    },
    {
      id: "h2",
      category: "Negative Hook",
      text: "Stop doing [action] immediately if you want to achieve [goal] in 2026.",
    },
    {
      id: "h3",
      category: "Curiosity Loop",
      text: "I tested 10 different [niche] side hustles for a week. Here is the shocking truth.",
    },
    {
      id: "h4",
      category: "Secret Info",
      text: "The completely free AI tool that feels highly illegal to know right now.",
    },
  ];

  const toggleAccordion = (name: string) => {
    setActiveAccordion(activeAccordion === name ? null : name);
  };

  return (
    <div className="h-full flex flex-col bg-card select-none">
      {/* Academy Panel Header */}
      <div className="px-5 py-4 flex-none flex flex-col gap-2 bg-white/[0.01]">
        <div className="flex items-center gap-2">
          <GraduationCap className="size-5 text-primary shrink-0" />
          <h2 className="text-sm font-bold tracking-tight text-foreground">Faceless Academy</h2>
        </div>
        <p className="text-[10px] text-muted-foreground leading-normal font-medium">
          Ideas, script hooks & content workflows to build profitable automated channels.
        </p>
      </div>

      <Separator orientation="horizontal" />

      {/* Main content scroll area */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {/* Full-screen CTA Banner */}
        <div className="p-4 rounded-xl border border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-extrabold text-primary uppercase tracking-wider">
              PRO ACADEMY
            </span>
            <h4 className="text-xs font-bold text-foreground">Faceless Creator Masterclass</h4>
            <p className="text-[10px] text-muted-foreground leading-relaxed font-medium">
              Open the full-screen Academy Dashboard to explore profitable niches, copy viral
              scripts, and master faceless workflows.
            </p>
          </div>
          <Button
            onClick={() =>
              window.open(
                typeof window !== "undefined" && window.location.protocol === "chrome-extension:"
                  ? "academy.html"
                  : "/academy",
                "_blank",
              )
            }
            className="w-full h-8 bg-white hover:bg-neutral-100 text-black text-[10px] font-bold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer shadow-lg active:scale-[0.98] transition-transform"
          >
            Open Full Academy
            <ExternalLink className="size-3" />
          </Button>
        </div>

        {/* Accordion 1: Profitable Niches */}
        <div className="border border-border/40 rounded-xl overflow-hidden bg-white/[0.01]">
          <button
            onClick={() => toggleAccordion("niches")}
            className="w-full px-4 py-3 flex items-center justify-between text-xs font-bold text-neutral-200 hover:text-white transition-colors cursor-pointer bg-white/[0.01]"
          >
            <div className="flex items-center gap-2">
              <Coins className="size-4 text-amber-500" />
              <span>Profitable Niches (CPM)</span>
            </div>
            <ChevronRight
              className={`size-3.5 text-neutral-500 transition-transform duration-200 ${activeAccordion === "niches" ? "rotate-90" : ""}`}
            />
          </button>

          {activeAccordion === "niches" && (
            <div className="px-4 pb-4 pt-1 space-y-2 border-t border-border/30 bg-black/20">
              {niches.map((niche, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-white/5"
                >
                  <div className="flex items-center gap-2">
                    <span className={niche.color}>{niche.icon}</span>
                    <span className="text-[10px] font-semibold text-neutral-300">
                      {niche.title}
                    </span>
                  </div>
                  <span className="text-[9px] font-black text-neutral-400 bg-white/[0.04] px-2 py-0.5 rounded border border-white/5">
                    {niche.cpm}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Accordion 2: Video Hooks */}
        <div className="border border-border/40 rounded-xl overflow-hidden bg-white/[0.01]">
          <button
            onClick={() => toggleAccordion("hooks")}
            className="w-full px-4 py-3 flex items-center justify-between text-xs font-bold text-neutral-200 hover:text-white transition-colors cursor-pointer bg-white/[0.01]"
          >
            <div className="flex items-center gap-2">
              <BookOpen className="size-4 text-violet-500" />
              <span>High-Retention Hooks</span>
            </div>
            <ChevronRight
              className={`size-3.5 text-neutral-500 transition-transform duration-200 ${activeAccordion === "hooks" ? "rotate-90" : ""}`}
            />
          </button>

          {activeAccordion === "hooks" && (
            <div className="px-4 pb-4 pt-1 space-y-2 border-t border-border/30 bg-black/20">
              {hooks.map((hook) => (
                <div
                  key={hook.id}
                  className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5 flex flex-col gap-2 relative group/hook"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] font-extrabold text-violet-400 bg-violet-400/10 border border-violet-400/20 px-1.5 py-0.5 rounded uppercase leading-none">
                      {hook.category}
                    </span>
                    <button
                      onClick={() => handleCopy(hook.id, hook.text)}
                      className="text-neutral-500 hover:text-white transition-colors cursor-pointer"
                    >
                      {copiedId === hook.id ? (
                        <Check className="size-3 text-green-400" />
                      ) : (
                        <Copy className="size-3" />
                      )}
                    </button>
                  </div>
                  <p className="text-[10px] text-neutral-300 font-semibold leading-normal">
                    "{hook.text}"
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Accordion 3: Daily Workflow */}
        <div className="border border-border/40 rounded-xl overflow-hidden bg-white/[0.01]">
          <button
            onClick={() => toggleAccordion("workflow")}
            className="w-full px-4 py-3 flex items-center justify-between text-xs font-bold text-neutral-200 hover:text-white transition-colors cursor-pointer bg-white/[0.01]"
          >
            <div className="flex items-center gap-2">
              <Zap className="size-4 text-blue-500" />
              <span>Production Steps (5 Mins)</span>
            </div>
            <ChevronRight
              className={`size-3.5 text-neutral-500 transition-transform duration-200 ${activeAccordion === "workflow" ? "rotate-90" : ""}`}
            />
          </button>

          {activeAccordion === "workflow" && (
            <div className="px-4 pb-4 pt-1 space-y-3.5 border-t border-border/30 bg-black/20 text-[10px]">
              {[
                {
                  step: "1",
                  title: "Niche Selection",
                  desc: "Pick your theme (e.g. Finance) and find 5 high-converting keywords.",
                },
                {
                  step: "2",
                  title: "Script & TTS",
                  desc: "Write a short script. Use AI Voice Dubbing in the editor to voice it.",
                },
                {
                  step: "3",
                  title: "Assemble Scenes",
                  desc: "Add transitions, stock visual elements, and auto-captions.",
                },
                {
                  step: "4",
                  title: "Bulk Export",
                  desc: "Export in 9:16 portrait to publish across TikTok, Reels, & Shorts.",
                },
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-2.5">
                  <div className="size-4 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">
                    {item.step}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-bold text-neutral-200">{item.title}</span>
                    <p className="text-neutral-400 leading-normal font-medium">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
