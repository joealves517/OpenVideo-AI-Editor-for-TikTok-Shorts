"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ArrowUpIcon,
  Wand2,
  RefreshCw,
  PlusIcon,
  X,
  Sparkles,
  Terminal,
  Search,
  Mic,
  Subtitles,
  Paintbrush,
  LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { projectStore } from "@/lib/project";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useStore } from "zustand";
import { IClip } from "@/types/timeline";
import { ImportAsset } from "@/genkit/type";
import { IconSparkles2 } from "@tabler/icons-react";
import { usePanelStore } from "@/stores/panel-store";
import * as aiTools from "./tools";
import { useParams } from "next/navigation";
import { IndexedDBAdapter } from "@/lib/storage/indexeddb-adapter";

interface Message {
  role: "user" | "model";
  content: string;
  reasoning?: string;
  reasoningCollapsed?: boolean;
  tools?: Array<{
    name: string;
    arg: any;
    status: "running" | "done" | "error";
    response?: any;
  }>;
}

interface Suggestion {
  text: string;
  icon: LucideIcon;
}

const SUGGESTIONS: Suggestion[] = [
  { text: "Find and add a beautiful city video", icon: Search },
  { text: 'Generate voiceover saying "Welcome back"', icon: Mic },
  { text: "Auto-caption this video project", icon: Subtitles },
  { text: "Make text yellow and bigger", icon: Paintbrush },
];

export default function Assistant() {
  const { toggleCopilot } = usePanelStore();
  const clips = useStore(projectStore, (s) => s.clips);
  const selectedClipIds = useStore(projectStore, (s) => s.selectedIds);
  const tracks = useStore(projectStore, (s) => s.tracks);
  const getClip = (id: string) => projectStore.getState().clips[id];

  const params = useParams();
  const projectId = (params?.projectId as string) || "default_project";

  const chatAdapter = useMemo(() => {
    return new IndexedDBAdapter<any>("openvideo-chat-db", "chat-history");
  }, []);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isReasoningOpen, setIsReasoningOpen] = useState<Record<number, boolean>>({});
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load chat history from IndexedDB on mount / projectId change
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const data = await chatAdapter.get(projectId);
        if (data && Array.isArray(data.messages)) {
          setMessages(data.messages);
        } else {
          setMessages([]);
        }
      } catch (e) {
        console.error("Failed to load chat history:", e);
        setMessages([]);
      }
    };
    loadHistory();
  }, [projectId, chatAdapter]);

  // Auto-save chat history to IndexedDB when messages change (with 500ms debounce)
  useEffect(() => {
    const saveHistory = async () => {
      if (messages.length === 0) {
        try {
          await chatAdapter.remove(projectId);
        } catch (e) {
          console.error("Failed to clear chat history from IndexedDB:", e);
        }
        return;
      }
      try {
        await chatAdapter.set(projectId, { messages });
      } catch (e) {
        console.error("Failed to save chat history to IndexedDB:", e);
      }
    };

    const timer = setTimeout(() => {
      saveHistory();
    }, 500);

    return () => clearTimeout(timer);
  }, [messages, projectId, chatAdapter]);

  const mapClipsToAssets = useCallback(
    (clipArray: IClip[]): ImportAsset[] => {
      return clipArray.map((clip) => {
        const track = tracks.find((t) => t.clipIds.includes(clip.id));
        const trackId = track ? track.id : `unknown_track`;

        const assetType = clip.type.toLowerCase();
        const textContent = clip.text || (clip as any)._text || clip.caption?.text || "";

        return {
          assetId: clip.id,
          type: "import",
          assetType: assetType === "caption" ? "text" : assetType,
          text: textContent,
          url: clip.src || "",
          label: clip.name || `Clip ${clip.id}`,
          trackId,
          display: {
            from: clip.display.from / 1000,
            to: clip.display.to / 1000,
          },
          trim: clip.trim
            ? {
                from: clip.trim.from / 1000,
                to: clip.trim.to / 1000,
              }
            : undefined,
        };
      });
    },
    [tracks],
  );

  const selectedAssets = useMemo(() => {
    const selectedClips = selectedClipIds.map(getClip).filter(Boolean) as IClip[];
    return mapClipsToAssets(selectedClips);
  }, [selectedClipIds, getClip, mapClipsToAssets]);

  // Auto-scroll to bottom — track both message count and last model message content for streaming
  const lastModelContent =
    messages[messages.length - 1]?.role === "model" ? messages[messages.length - 1]?.content : "";
  const lastModelToolsLen = messages[messages.length - 1]?.tools?.length ?? 0;
  useEffect(() => {
    requestAnimationFrame(() => {
      if (scrollRef.current) {
        const scrollElement = scrollRef.current.closest("[data-slot='scroll-area-viewport']");
        if (scrollElement) {
          scrollElement.scrollTop = scrollElement.scrollHeight;
        }
      }
    });
  }, [messages.length, lastModelContent, lastModelToolsLen, isLoading]);

  // Auto-scroll thought process during streaming
  const lastModelMessageReasoning =
    messages[messages.length - 1]?.role === "model" ? messages[messages.length - 1]?.reasoning : "";
  useEffect(() => {
    if (isLoading && lastModelMessageReasoning) {
      const lastIndex = messages.length - 1;
      const scrollContainer = document.getElementById(`reasoning-scroll-${lastIndex}`);
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [lastModelMessageReasoning, isLoading, messages.length]);

  const handleToolAction = async (name: string, arg: any): Promise<boolean> => {
    try {
      console.log("[Tool Action] Executing:", name, arg);
      if (name === "add_text" || name === "addClip")
        await aiTools.handleAddClip({ ...arg, type: "text" });
      else if (name === "add_image") await aiTools.handleAddClip({ ...arg, type: "image" });
      else if (name === "add_video") await aiTools.handleAddClip({ ...arg, type: "video" });
      else if (name === "add_audio") await aiTools.handleAddClip({ ...arg, type: "audio" });
      else if (name === "update_clip" || name === "updateClip") await aiTools.handleUpdateClip(arg);
      else if (name === "remove_clip" || name === "removeClip") await aiTools.handleRemoveClip(arg);
      else if (name === "split_clip" || name === "splitClip") await aiTools.handleSplitClip(arg);
      else if (name === "trim_clip" || name === "trimClip") await aiTools.handleTrimClip(arg);
      else if (name === "add_transition" || name === "addTransition")
        await aiTools.handleAddTransition(arg);
      else if (name === "add_effect" || name === "addEffect") await aiTools.handleAddEffect(arg);
      else if (name === "duplicate_clip" || name === "duplicateClip")
        await aiTools.handleDuplicateClip(arg);
      else if (name === "search_and_add_media" || name === "searchAndAddMedia")
        await aiTools.handleSearchAndAddMedia(arg);
      else if (name === "generate_voiceover" || name === "generateVoiceover")
        await aiTools.handleGenerateVoiceover(arg);
      else if (name === "seek_to_time" || name === "seekToTime")
        await aiTools.handleSeekToTime(arg);
      else if (name === "generate_captions" || name === "generateCaptions")
        await aiTools.handleGenerateCaptions(arg);
      else console.warn("Unknown tool:", name);
      return true;
    } catch (e) {
      console.error("Tool execution failed:", name, e);
      return false;
    }
  };

  const handleReset = () => {
    setMessages([]);
    setInput("");
    setIsLoading(false);
    setIsReasoningOpen({});
  };

  const handleSubmit = async (suggestionText?: string) => {
    const text = suggestionText || input;
    if (!text.trim() || isLoading) return;

    // Gather history from the current state BEFORE adding the new message
    const chatHistory = messages
      .map((m) => ({
        role: m.role,
        content: m.content || "",
      }))
      .filter((h) => h.content.trim() !== "");

    const userMessage: Message = { role: "user", content: text };
    const placeholderModelMessage: Message = {
      role: "model",
      content: "",
      reasoning: "",
      reasoningCollapsed: false,
      tools: [],
    };
    setMessages((prev) => [...prev, userMessage, placeholderModelMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat/editor?stream=true", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: chatHistory,
          metadata: {
            selectedAssets: selectedAssets,
            currentTime: projectStore.getState().currentTime / 1_000_000,
          },
        }),
      });

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let modelContent = "";
      let modelReasoning = "";
      const executedTools = new Set<string>();

      // Placeholder model message already added at the beginning of handleSubmit
      const currentModelMessageIndex = messages.length + 1;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunkText = decoder.decode(value, { stream: true });
        console.log("[Chat Debug] Raw chunk:", chunkText);
        const lines = chunkText.split("\n");

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine) continue;

          let jsonString = trimmedLine;
          if (jsonString.startsWith("data: ")) {
            jsonString = jsonString.slice(6);
          }
          if (jsonString === "[DONE]") continue;

          try {
            const parsed = JSON.parse(jsonString);

            if (parsed.event) {
              if (parsed.event === "reasoning") {
                modelReasoning += parsed.text;
                setMessages((prev) => {
                  const newMsgs = [...prev];
                  const last = newMsgs[newMsgs.length - 1];
                  last.reasoning = modelReasoning;
                  last.reasoningCollapsed = false;
                  return newMsgs;
                });
              } else if (parsed.event === "text") {
                modelContent += parsed.text;
                setMessages((prev) => {
                  const newMsgs = [...prev];
                  const last = newMsgs[newMsgs.length - 1];
                  last.content = modelContent;
                  return newMsgs;
                });
              } else if (parsed.event === "tool") {
                const toolKey = `${parsed.name}:${JSON.stringify(parsed.arg)}`;

                // Deduplicate tool calls on the client side
                if (executedTools.has(toolKey)) {
                  console.log(
                    "[Assistant] Tool already executed in this turn, skipping duplicate:",
                    toolKey,
                  );
                  continue;
                }
                executedTools.add(toolKey);

                setMessages((prev) => {
                  const newMsgs = [...prev];
                  const last = newMsgs[newMsgs.length - 1];
                  if (!last.tools) last.tools = [];
                  const existingIndex = last.tools.findIndex(
                    (t) => `${t.name}:${JSON.stringify(t.arg)}` === toolKey,
                  );
                  const toolObj = {
                    name: parsed.name,
                    arg: parsed.arg,
                    status: "running" as const,
                    response: parsed.response,
                  };
                  if (existingIndex > -1) {
                    last.tools[existingIndex] = toolObj;
                  } else {
                    last.tools.push(toolObj);
                  }
                  return newMsgs;
                });

                // Always execute tool locally — backend responses are dummy acknowledgments,
                // the real execution (Pexels API, clip add, voiceover) happens on the frontend
                const toolSuccess = await handleToolAction(parsed.name, parsed.arg);

                // Mark tool as done or error after execution
                setMessages((prev) => {
                  const newMsgs = [...prev];
                  const last = newMsgs[newMsgs.length - 1];
                  if (last.tools) {
                    const idx = last.tools.findIndex(
                      (t) => `${t.name}:${JSON.stringify(t.arg)}` === toolKey,
                    );
                    if (idx > -1) last.tools[idx].status = toolSuccess ? "done" : "error";
                  }
                  return newMsgs;
                });
              } else if (parsed.event === "error") {
                // Handle backend errors (e.g., VertexAI 429 rate limit)
                const errorMsg =
                  parsed.message || "An unexpected error occurred. Please try again.";
                console.error("[Chat Stream Error]", errorMsg);
                setMessages((prev) => {
                  const newMsgs = [...prev];
                  const last = newMsgs[newMsgs.length - 1];
                  if (last && last.role === "model") {
                    last.content =
                      modelContent ||
                      "⚠️ AI is currently overloaded. Please try again in a few minutes.";
                    last.reasoningCollapsed = true;
                  }
                  return newMsgs;
                });
                setIsLoading(false);
              } else if (parsed.event === "done") {
                if (parsed.reply && !modelContent) {
                  const cleanReply = parsed.reply.trim();
                  const cleanReasoning = modelReasoning.trim();
                  if (cleanReply !== cleanReasoning) {
                    modelContent = parsed.reply;
                  }
                }
                setMessages((prev) => {
                  const newMsgs = [...prev];
                  const last = newMsgs[newMsgs.length - 1];
                  if (last && last.role === "model") {
                    last.content = modelContent;
                    last.reasoningCollapsed = true;
                  }
                  return newMsgs;
                });
              }
            } else if (parsed.message) {
              // Backward-compatibility
              modelContent += parsed.message;
              setMessages((prev) => {
                const newMsgs = [...prev];
                const last = newMsgs[newMsgs.length - 1];
                last.content = modelContent;
                return newMsgs;
              });
            } else if (parsed.reply && !modelContent) {
              modelContent = parsed.reply;
              setMessages((prev) => {
                const newMsgs = [...prev];
                const last = newMsgs[newMsgs.length - 1];
                if (last && last.role === "model") {
                  last.content = modelContent;
                  last.reasoningCollapsed = true;
                }
                return newMsgs;
              });
            }
          } catch (e) {
            // Raw text chunk fallback
            if (!jsonString.startsWith("{") && !jsonString.startsWith("[")) {
              modelContent += jsonString;
              setMessages((prev) => {
                const newMsgs = [...prev];
                const last = newMsgs[newMsgs.length - 1];
                last.content = modelContent;
                return newMsgs;
              });
            }
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => {
        const newMsgs = [...prev];
        if (newMsgs.length > 0) {
          const last = newMsgs[newMsgs.length - 1];
          if (last.role === "model") {
            last.content =
              "Sorry, I encountered an error while processing your request. Please try again later (Rate limit exceeded).";
          }
        }
        return newMsgs;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: Suggestion) => {
    handleSubmit(suggestion.text);
  };

  return (
    <div className="flex flex-col h-full bg-neutral-950 text-foreground text-sm overflow-hidden border-l border-neutral-900">
      {/* Sleek Minimalist Header */}
      <div className="flex items-center justify-end px-4 py-3 bg-neutral-950 shrink-0">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleReset}
            className="h-8 w-8 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg relative group/header-btn transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="sr-only">Reset conversation</span>
            <div className="absolute top-[130%] left-1/2 -translate-x-1/2 px-2 py-1 bg-neutral-900 border border-neutral-800 text-white text-[10px] rounded-md whitespace-nowrap opacity-0 scale-95 pointer-events-none group-hover/header-btn:opacity-100 group-hover/header-btn:scale-100 transition-all duration-150 ease-out z-50">
              Reset conversation
            </div>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleReset}
            className="h-8 w-8 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg relative group/header-btn transition-all"
          >
            <PlusIcon className="w-4 h-4" />
            <span className="sr-only">New chat</span>
            <div className="absolute top-[130%] left-1/2 -translate-x-1/2 px-2 py-1 bg-neutral-900 border border-neutral-800 text-white text-[10px] rounded-md whitespace-nowrap opacity-0 scale-95 pointer-events-none group-hover/header-btn:opacity-100 group-hover/header-btn:scale-100 transition-all duration-150 ease-out z-50">
              New chat
            </div>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleCopilot}
            className="h-8 w-8 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg relative group/header-btn transition-all"
          >
            <X className="w-4 h-4" />
            <span className="sr-only">Close</span>
            <div className="absolute top-[130%] right-0 px-2 py-1 bg-neutral-900 border border-neutral-800 text-white text-[10px] rounded-md whitespace-nowrap opacity-0 scale-95 pointer-events-none group-hover/header-btn:opacity-100 group-hover/header-btn:scale-100 transition-all duration-150 ease-out z-50">
              Close Copilot
            </div>
          </Button>
        </div>
      </div>

      {messages.length === 0 ? (
        <div className="flex-1 items-center flex justify-center p-6">
          <div className="flex flex-1 flex-col items-center justify-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-[320px] text-center pb-12">
            <div className="relative flex items-center justify-center">
              <IconSparkles2 className="relative w-12 h-12 text-neutral-300" stroke={1.2} />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold tracking-tight text-neutral-100">
                Creative Partner Copilot
              </h2>
              <p className="text-xs text-neutral-400 leading-relaxed">
                I'm your AI creative companion. I can edit clips, add transitions, generate
                voiceovers, and search for stock media automatically.
              </p>
            </div>

            <div className="w-full flex flex-col gap-2.5 pt-4">
              <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-500">
                Suggested Prompts
              </span>
              <div className="grid grid-cols-1 gap-2">
                {SUGGESTIONS.map((s, idx) => {
                  const SuggestionIcon = s.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSuggestionClick(s)}
                      className="w-full text-left px-4 py-3 rounded-xl bg-neutral-900/30 hover:bg-neutral-900/60 border border-neutral-900 hover:border-neutral-850 transition-all duration-300 text-xs text-neutral-300 hover:text-white hover:-translate-y-[1px] hover:shadow-lg flex items-center gap-2.5 font-medium group"
                    >
                      <SuggestionIcon
                        className="w-3.5 h-3.5 text-neutral-500 group-hover:text-neutral-300 transition-colors"
                        strokeWidth={1.5}
                      />
                      <span>{s.text}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <ScrollArea className="flex-1 min-h-0 h-full">
          <div ref={scrollRef} className="min-h-full flex flex-col overflow-x-hidden p-4 space-y-4">
            {messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "flex w-full animate-in fade-in slide-in-from-bottom-2 duration-300",
                  m.role === "user" ? "justify-end" : "justify-start",
                )}
              >
                {m.role === "user" ? (
                  <div className="flex flex-col space-y-1 items-end max-w-[85%]">
                    <div className="py-2.5 px-4 rounded-2xl rounded-tr-none bg-neutral-800 border border-neutral-700/40 text-white font-medium shadow-md leading-relaxed text-[13.5px] select-text">
                      {m.content}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col space-y-2 w-full items-start">
                    {/* 1. Reasoning Accordion */}
                    {m.reasoning && (
                      <div className="border-l border-neutral-800 pl-3.5 py-1 text-xs w-full transition-all">
                        <button
                          onClick={() => {
                            setMessages((prev) => {
                              const newMsgs = [...prev];
                              if (newMsgs[i]) {
                                newMsgs[i] = {
                                  ...newMsgs[i],
                                  reasoningCollapsed: !newMsgs[i].reasoningCollapsed,
                                };
                              }
                              return newMsgs;
                            });
                          }}
                          className="flex items-center gap-2 text-neutral-500 hover:text-neutral-300 font-medium transition-colors select-none"
                        >
                          {isLoading && i === messages.length - 1 ? (
                            <span className="relative flex h-1.5 w-1.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neutral-600 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-neutral-500"></span>
                            </span>
                          ) : (
                            <span className="h-1.5 w-1.5 rounded-full bg-neutral-600"></span>
                          )}
                          <span className="text-[12px] font-sans">
                            {m.reasoningCollapsed ? "Thought process..." : "Thought process"}
                          </span>
                          <span className="text-[10px] text-neutral-500 font-sans ml-0.5">
                            {m.reasoningCollapsed ? "▼" : "▲"}
                          </span>
                        </button>
                        {!m.reasoningCollapsed && (
                          <div
                            id={`reasoning-scroll-${i}`}
                            className={cn(
                              "mt-2 text-neutral-500 font-sans text-[12.5px] leading-relaxed select-text pr-2 overflow-y-auto scrollbar-thin scroll-smooth",
                              isLoading && i === messages.length - 1 ? "max-h-24" : "max-h-[300px]",
                            )}
                          >
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                p: ({ className, ...props }) => (
                                  <p
                                    className="leading-5 not-first:mt-2 last:mb-0 text-neutral-500"
                                    {...props}
                                  />
                                ),
                                code: ({ className, children, ...props }) => (
                                  <code
                                    className="bg-neutral-900/40 text-neutral-400 px-1 py-0.5 rounded font-mono text-[11px] border border-neutral-800"
                                    {...props}
                                  >
                                    {children}
                                  </code>
                                ),
                                strong: ({ className, ...props }) => (
                                  <strong className="font-semibold text-neutral-400" {...props} />
                                ),
                              }}
                            >
                              {m.reasoning}
                            </ReactMarkdown>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 2. Tool Executions */}
                    {m.tools && m.tools.length > 0 && (
                      <div className="flex flex-col gap-1.5 w-full">
                        {m.tools.map((t, idx) => {
                          const isDone = t.status === "done";
                          const isError = t.status === "error";
                          const icon = isDone ? (
                            <div className="h-4 w-4 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-[10px] font-bold">
                              ✓
                            </div>
                          ) : isError ? (
                            <div className="h-4 w-4 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400 text-[10px] font-bold">
                              ✕
                            </div>
                          ) : (
                            <RefreshCw className="h-3 w-3 text-neutral-400 animate-spin" />
                          );

                          let friendlyName = t.name;
                          if (t.name === "add_text") friendlyName = "Adding text clip to timeline";
                          else if (t.name === "add_image") friendlyName = "Generating custom image";
                          else if (t.name === "add_video") friendlyName = "Adding stock video clip";
                          else if (t.name === "add_audio")
                            friendlyName = "Generating voiceover track";
                          else if (t.name === "update_clip")
                            friendlyName = "Updating clip properties";
                          else if (t.name === "remove_clip")
                            friendlyName = "Removing clip from timeline";
                          else if (t.name === "split_clip") friendlyName = "Splitting video clip";
                          else if (t.name === "seek_to_time")
                            friendlyName = `Moving playhead to ${t.arg?.time || 0}s`;
                          else if (t.name === "search_and_add_media")
                            friendlyName = `Searching media for "${t.arg?.query}"`;
                          else if (t.name === "generate_voiceover")
                            friendlyName = "Generating text-to-speech";
                          else if (t.name === "generate_captions")
                            friendlyName = "Generating captions";

                          return (
                            <div
                              key={idx}
                              className="flex items-center justify-between rounded-xl bg-neutral-900/40 border border-neutral-900 px-3 py-2 text-xs text-neutral-300 animate-in fade-in duration-300 w-full"
                            >
                              <div className="flex items-center gap-2">
                                {icon}
                                <span
                                  className={`font-medium ${isError ? "text-red-300" : "text-neutral-200"}`}
                                >
                                  {friendlyName}
                                </span>
                              </div>
                              {!isDone && !isError && (
                                <span className="text-[9px] text-neutral-500 font-mono animate-pulse">
                                  running
                                </span>
                              )}
                              {isError && (
                                <span className="text-[9px] text-red-400 font-mono">failed</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* 3. Text Message Bubble */}
                    {m.content ? (
                      <div className="py-2 px-1 text-neutral-200 leading-relaxed text-[13.5px] w-full grid overflow-hidden select-text">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            h1: ({ className, ...props }) => (
                              <h1
                                className="scroll-m-20 text-xl font-extrabold tracking-tight last:mb-0 mb-3 mt-1 text-neutral-100"
                                {...props}
                              />
                            ),
                            h2: ({ className, ...props }) => (
                              <h2
                                className="scroll-m-20 text-lg font-semibold tracking-tight first:mt-0 last:mb-0 mb-2 mt-3 text-neutral-200"
                                {...props}
                              />
                            ),
                            h3: ({ className, ...props }) => (
                              <h3
                                className="scroll-m-20 text-base font-semibold tracking-tight first:mt-0 last:mb-0 mb-1 mt-2 text-neutral-200"
                                {...props}
                              />
                            ),
                            p: ({ className, ...props }) => (
                              <p
                                className="leading-6 not-first:mt-3 last:mb-0 text-neutral-300"
                                {...props}
                              />
                            ),
                            ul: ({ className, ...props }) => (
                              <ul
                                className="my-3 ml-5 list-disc [&>li]:mt-1.5 text-neutral-300"
                                {...props}
                              />
                            ),
                            ol: ({ className, ...props }) => (
                              <ol
                                className="my-3 ml-5 list-decimal [&>li]:mt-1.5 text-neutral-300"
                                {...props}
                              />
                            ),
                            code: ({ className, children, ...props }) => {
                              const isInline = !className?.includes("language-");
                              return isInline ? (
                                <code
                                  className="bg-neutral-800 text-neutral-200 px-1 py-0.5 rounded font-mono text-[11px] border border-neutral-700/30"
                                  {...props}
                                >
                                  {children}
                                </code>
                              ) : (
                                <code className={cn("text-[11px] font-mono", className)} {...props}>
                                  {children}
                                </code>
                              );
                            },
                            pre: ({ className, ...props }) => (
                              <pre
                                className="overflow-x-auto rounded-xl bg-neutral-950 border border-neutral-900 p-3 text-neutral-300 my-3 scrollbar-thin"
                                {...props}
                              />
                            ),
                          }}
                        >
                          {m.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      // Display elegant three-dots bouncing typing indicator while generating response
                      isLoading &&
                      messages[messages.length - 1] === m && (
                        <div className="flex space-x-1 items-center px-3.5 py-2.5 bg-neutral-900/30 border border-neutral-900/60 rounded-2xl rounded-tl-none w-max shadow-sm animate-in fade-in duration-300">
                          <span className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                          <span className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                          <span className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce"></span>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      )}

      {/* Futuristic input panel */}
      <div className="p-3 bg-gradient-to-t from-neutral-950 via-neutral-950 to-transparent shrink-0">
        <div
          className={cn(
            "rounded-xl border bg-neutral-900/40 backdrop-blur-md shadow-2xl transition-all duration-300 relative flex flex-col p-1.5",
            isFocused
              ? "border-neutral-700 bg-neutral-900/60 shadow-[0_0_20px_rgba(255,255,255,0.01)]"
              : "border-neutral-900 hover:border-neutral-800",
          )}
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="Ask Co-Creator..."
            className="w-full min-h-[50px] max-h-[160px] resize-none bg-transparent px-3 py-1.5 text-[13px] text-foreground placeholder-neutral-500 outline-none border-none focus:ring-0 focus-visible:ring-0 focus:outline-none scrollbar-thin"
          />
          <div className="flex items-center justify-end px-1.5 pb-1">
            <button
              onClick={() => handleSubmit()}
              disabled={!input.trim() || isLoading}
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-lg transition-all duration-300 relative group/send-btn",
                input.trim() && !isLoading
                  ? "bg-neutral-200 hover:bg-white text-neutral-950 scale-100 hover:scale-105 active:scale-95 shadow-md shadow-black/20"
                  : "bg-neutral-800 text-neutral-500 scale-95 opacity-50 cursor-not-allowed",
              )}
            >
              <ArrowUpIcon className="w-3.5 h-3.5" />
              <div className="absolute bottom-[130%] right-0 px-2 py-1 bg-neutral-900 border border-neutral-800 text-white text-[10px] rounded-md whitespace-nowrap opacity-0 scale-95 pointer-events-none group-hover/send-btn:opacity-100 group-hover/send-btn:scale-100 transition-all duration-150 ease-out z-50">
                Send message
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
