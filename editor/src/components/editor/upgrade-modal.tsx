"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { AudioLines, Languages, Sparkles, Film, Tv } from "lucide-react";
import { toast } from "sonner";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userEmail: string;
}

export function UpgradeModal({ open, onOpenChange, userEmail }: UpgradeModalProps) {
  const handleUpgrade = () => {
    const CHECKOUT_BASE =
      "https://graphosai.lemonsqueezy.com/checkout/buy/2a8c453e-7b12-4743-bf50-8571c9cfae30";
    const url = `${CHECKOUT_BASE}?checkout[email]=${encodeURIComponent(userEmail || "")}`;
    window.open(url, "_blank");
    onOpenChange(false);
    toast.success("Redirecting to secure Lemonsqueezy checkout...");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[320px] sm:max-w-[320px] border-none ring-0 bg-white p-0 text-zinc-900 shadow-2xl overflow-hidden rounded-[28px]"
        showCloseButton={false}
      >
        {/* Soft, luxury ambient gradient fades on the background mirroring the template design */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_220px_at_100%_0%,rgba(99,102,241,0.45),rgba(168,85,247,0.25)_50%,transparent_100%)] rounded-[28px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-44 h-44 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-sky-400/10 via-indigo-500/5 to-transparent blur-xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-44 h-44 bg-[radial-gradient(circle_at_bottom_right,_var(--tw-gradient-stops))] from-purple-500/10 via-purple-500/5 to-transparent blur-xl pointer-events-none" />

        <div className="flex flex-col items-center px-5 pt-9 pb-8 relative z-10">
          {/* Entire Top Illustration replaced by 6.png */}
          <div className="relative w-18 h-18 mb-4 flex items-center justify-center">
            <img
              src="/6.png"
              alt="Upgrade Premium Illustration"
              className="w-full h-full object-contain select-none transform hover:scale-105 transition-transform duration-300"
            />
          </div>

          {/* Heading with beautiful unique blue-purple gradient text */}
          <DialogTitle className="text-2xl font-black tracking-tight text-center text-zinc-900 leading-tight">
            <span className="bg-gradient-to-r from-[#91b5ff] via-[#8050ff] to-[#6d2df2] bg-clip-text text-transparent font-black pr-1">
              10X
            </span>
            Productivity
          </DialogTitle>

          <div className="w-full mt-6 space-y-4">
            {/* Feature 1: Unlimited Credits */}
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                {/* Checkmark replaced by 7.png */}
                <img
                  src="/7.png"
                  alt="Verified"
                  className="w-4.5 h-4.5 shrink-0 object-contain select-none"
                />
                <span className="text-xs font-bold text-zinc-900 leading-none">
                  Unlimited Credits
                </span>
              </div>
              <span className="text-[10px] font-semibold text-zinc-500 pl-6.5 mt-1.5 leading-normal">
                High-speed Google Cloud TTS & STT processing.
              </span>
            </div>

            {/* Feature 2: Unlock Premium Features */}
            <div className="flex flex-col w-full">
              <div className="flex items-center gap-2">
                {/* Checkmark replaced by 7.png */}
                <img
                  src="/7.png"
                  alt="Verified"
                  className="w-4.5 h-4.5 shrink-0 object-contain select-none"
                />
                <span className="text-xs font-bold text-zinc-900 leading-none">
                  Unlock All Premium Features
                </span>
              </div>

              {/* Nested List with Stand-alone Minimalist Icons */}
              <div className="pl-6.5 mt-3 space-y-2.5">
                {[
                  {
                    text: "AI Voice Dubbing (TTS)",
                    icon: <AudioLines className="w-3.5 h-3.5 text-zinc-500" />,
                  },
                  {
                    text: "AI Audio Transcription (STT)",
                    icon: <Languages className="w-3.5 h-3.5 text-zinc-500" />,
                  },
                  {
                    text: "Smart AI Video Copilot",
                    icon: <Sparkles className="w-3.5 h-3.5 text-zinc-500" />,
                  },
                  {
                    text: "Unlimited Video Projects",
                    icon: <Film className="w-3.5 h-3.5 text-zinc-500" />,
                  },
                  {
                    text: "Creative Partner Copilot",
                    icon: <Tv className="w-3.5 h-3.5 text-zinc-500" />,
                  },
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-2.5 text-[10px] text-zinc-700">
                    {item.icon}
                    <span className="font-semibold">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Action button */}
          <div className="w-full mt-7">
            {/* Premium Matte Black Button with Unique Luxury Gold Gradient Text, fully rounded Apple Style */}
            <button
              onClick={handleUpgrade}
              className="w-full relative h-10.5 bg-zinc-950 hover:bg-zinc-900 text-white rounded-full flex items-center justify-center cursor-pointer active:scale-[0.99] transition-all duration-150"
            >
              <span className="bg-gradient-to-r from-amber-200 via-yellow-400 to-orange-400 bg-clip-text text-transparent font-black tracking-wider uppercase text-xs">
                Upgrade Now
              </span>
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
