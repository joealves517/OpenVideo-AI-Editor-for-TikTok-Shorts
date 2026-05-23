"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { SendIcon, XIcon, CheckCircle2, MessageCircleQuestion } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Icons } from "@/components/shared/icons";
import { authClient } from "@/lib/auth-client";

interface SupportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SUPPORT_WEBHOOK_URL =
  "https://script.google.com/macros/s/AKfycbww8SxkxrSOYScJNdtkhorXTqIQ10qVT8WHRgHXnrCRjyYbYhfHLWlta97sFzVk8o0pSA/exec";

export function SupportModal({ open, onOpenChange }: SupportModalProps) {
  const { data: session } = authClient.useSession();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, []);

  useEffect(() => {
    autoResize();
  }, [content, autoResize]);

  // Reset state when opened
  useEffect(() => {
    if (open) {
      setTitle("");
      setContent("");
      setStatus("idle");
      setErrorMessage("");
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) return;
    setStatus("loading");

    // Get user info with localStorage fallback
    let userName = "Guest User";
    let userEmail = "guest@openvideo.com";

    if (session?.user) {
      userName = session.user.name || userName;
      userEmail = session.user.email || userEmail;
    } else {
      try {
        const savedUser = localStorage.getItem("openvideo_user");
        if (savedUser) {
          const parsed = JSON.parse(savedUser);
          userName = parsed.name || userName;
          userEmail = parsed.email || userEmail;
        }
      } catch {}
    }

    try {
      await fetch(SUPPORT_WEBHOOK_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          name: userName,
          email: userEmail,
          title: `[OpenVideo Copilot] ${title}`,
          content: content,
        }),
      });

      // With mode: "no-cors", the response is opaque.
      // If fetch didn't throw a network error, we assume it succeeded.
      setStatus("success");
    } catch (err: any) {
      console.error("Support submission failed:", err);
      setStatus("error");
      setErrorMessage(err.message || "Network error. Please try again.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[400px] p-0 overflow-hidden bg-background border-border/50 shadow-2xl rounded-2xl"
        showCloseButton={false}
      >
        {/* Hidden titles for accessibility */}
        <DialogTitle className="sr-only">Contact Support</DialogTitle>
        <DialogDescription className="sr-only">Send a support request</DialogDescription>

        {/* Header handle - decorative to match blacknote style */}
        <div className="w-full h-8 flex items-center justify-center pt-2">
          <div className="w-12 h-1.5 bg-muted rounded-full opacity-50" />
        </div>

        <div className="px-5 pb-6">
          {/* Centered Icon instead of Lottie */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <MessageCircleQuestion className="w-8 h-8" />
            </div>
          </div>

          {status === "success" || status === "error" ? (
            <div className="flex flex-col items-center justify-center py-2">
              <div
                className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${status === "success" ? "bg-green-500/10 text-green-500" : "bg-destructive/10 text-destructive"}`}
              >
                {status === "success" ? <CheckCircle2 size={28} /> : <XIcon size={28} />}
              </div>
              <h3 className="text-lg font-bold text-foreground mb-1">
                {status === "success" ? "Message Sent!" : "Failed to Send"}
              </h3>
              <p className="text-sm text-muted-foreground text-center mb-6">
                {status === "success"
                  ? "Thank you for your feedback. We'll get back to you soon."
                  : "We encountered an issue while sending your message. Please try again."}
              </p>
              <button
                onClick={status === "success" ? () => onOpenChange(false) : () => setStatus("idle")}
                className="w-full h-11 flex items-center justify-center gap-2 rounded-full text-[14px] font-semibold transition-all bg-primary text-primary-foreground hover:opacity-90 active:scale-[0.98]"
              >
                {status === "success" ? "Close" : "Try Again"}
              </button>
            </div>
          ) : (
            <>
              <div className="mb-5">
                <h3 className="text-[18px] font-bold text-foreground tracking-tight text-center">
                  Contact Support
                </h3>
              </div>

              <div className="flex flex-col gap-3">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Subject"
                  className="w-full bg-muted/30 border border-border/50 rounded-xl px-4 py-3 text-[14px] text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 transition-colors"
                  disabled={status === "loading"}
                />

                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="How can we help you?"
                  className="w-full bg-muted/30 border border-border/50 rounded-xl px-4 py-3 text-[14px] text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 transition-colors resize-none min-h-[120px]"
                  disabled={status === "loading"}
                />

                <button
                  onClick={handleSubmit}
                  disabled={!title.trim() || !content.trim() || status === "loading"}
                  className="w-full h-11 mt-2 flex items-center justify-center gap-2 rounded-full text-[14px] font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-primary text-primary-foreground hover:opacity-90 active:scale-[0.98]"
                >
                  {status === "loading" ? (
                    <Icons.spinner className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <SendIcon size={16} className="mr-1" />
                      Send Message
                    </>
                  )}
                </button>

                {/* Cancel/Close button for convenience */}
                {status !== "loading" && (
                  <button
                    onClick={() => onOpenChange(false)}
                    className="w-full h-11 flex items-center justify-center gap-2 rounded-full text-[14px] font-medium bg-muted/50 text-foreground hover:bg-muted transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
