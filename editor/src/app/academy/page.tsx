"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  GraduationCap,
  BookOpen,
  Search,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Copy,
  Clock,
  Compass,
  Zap,
  Menu,
  X,
} from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ACADEMY_NAVIGATION, DocItem } from "./navigation";

const cleanMarkdown = (content: string): string => {
  if (!content) return "";
  return (
    content
      // Remove center alignment div wrapper
      .replace(/<div align="center">/g, "")
      .replace(/<\/div>/g, "")
      // Transform raw image anchor <a href="URL"><img src="IMG_URL" ... /></a> -> [![alt](IMG_URL)](URL)
      .replace(
        /<a href="([^"]+)"><img src="([^"]+)"[^>]*alt="([^"]+)"[^>]*><\/a>/g,
        "[![$3]($2)]($1)",
      )
      .replace(/<a href="([^"]+)"><img src="([^"]+)"[^>]*><\/a>/g, "[![]($2)]($1)")
      // Transform other raw images <img src="IMG_URL" ... /> -> ![](IMG_URL)
      .replace(/<img src="([^"]+)"[^>]*alt="([^"]+)"[^>]*>/g, "![$2]($1)")
      .replace(/<img src="([^"]+)"[^>]*>/g, "![]($1)")
      // Transform other raw anchors <a href="URL">...</a> -> [...](URL)
      .replace(/<a href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g, "[$2]($1)")
  );
};

export default function AcademyPage() {
  const [activeDoc, setActiveDoc] = useState<DocItem>(ACADEMY_NAVIGATION[0]);
  const [markdownContent, setMarkdownContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    "course-mastery": true,
    "getting-started-guides": false,
    "core-feature-guides": false,
    "monetization-guides": false,
    "bonuses-resources": true,
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [readingProgress, setReadingProgress] = useState<number>(0);
  const contentAreaRef = useRef<HTMLDivElement>(null);

  // Load document content
  useEffect(() => {
    async function fetchDoc() {
      setIsLoading(true);
      try {
        const response = await fetch(`academy-data/${activeDoc.path}`);
        if (!response.ok) {
          throw new Error("Failed to load document");
        }
        const text = await response.text();
        setMarkdownContent(text);
      } catch (err) {
        console.error(err);
        setMarkdownContent(`
# ⚠️ Document Load Error

We couldn't load the document \`${activeDoc.path}\`. 

It might have been moved or is currently unavailable offline. Please try selecting another module or guide from the sidebar.
        `);
      } finally {
        setIsLoading(false);
        // Scroll reader to top
        if (contentAreaRef.current) {
          contentAreaRef.current.scrollTop = 0;
        }
      }
    }

    fetchDoc();
  }, [activeDoc]);

  // Track reading progress scroll
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const scrollPercent = (target.scrollTop / (target.scrollHeight - target.clientHeight)) * 100;
    setReadingProgress(Math.min(100, Math.max(0, scrollPercent)));
  };

  const toggleCategory = (catId: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  };

  // Estimate reading time (average 200 words per minute)
  const estimateReadingTime = (text: string): number => {
    const words = text.trim().split(/\s+/).length;
    return Math.max(1, Math.ceil(words / 200));
  };

  // Flatten items for search
  const getAllFileItems = (items: DocItem[]): DocItem[] => {
    const list: DocItem[] = [];
    items.forEach((item) => {
      if (item.type === "file") {
        list.push(item);
      } else if (item.children) {
        list.push(...getAllFileItems(item.children));
      }
    });
    return list;
  };

  const filteredItems = searchQuery.trim()
    ? getAllFileItems(ACADEMY_NAVIGATION).filter((item) =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : null;

  return (
    <div className="relative h-screen w-screen flex flex-col bg-[#07070a] text-zinc-100 font-sans overflow-hidden select-none">
      {/* Top glowing indicators */}
      <div className="absolute top-[-10%] left-[-15%] w-[600px] h-[600px] rounded-full bg-blue-600/5 blur-[120px] pointer-events-none" />
      <div className="absolute top-[30%] right-[-10%] w-[600px] h-[600px] rounded-full bg-cyan-600/5 blur-[120px] pointer-events-none" />

      {/* Horizontal Reading Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-[3px] bg-neutral-900 z-50">
        <div
          className="h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-teal-400 transition-all duration-75 shadow-[0_0_8px_#06b6d4]"
          style={{ width: `${readingProgress}%` }}
        />
      </div>

      {/* Header Bar */}
      <header className="relative z-40 flex h-16 w-full items-center justify-between px-6 border-b border-zinc-800/60 bg-black/40 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-cyan-400" />
          <span className="text-sm font-extrabold tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
            Faceless Academy
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Mobile menu trigger */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden h-8 w-8 border border-zinc-800 text-zinc-400 cursor-pointer"
          >
            {mobileMenuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </Button>
        </div>
      </header>

      {/* Main Workspace Split View */}
      <div className="flex-1 flex w-full relative overflow-hidden h-[calc(100vh-64px)]">
        {/* SIDEBAR NAVIGATION */}
        <aside
          className={`
          absolute md:static top-0 left-0 h-full w-[285px] border-r border-zinc-900 bg-[#07070a]/95 md:bg-[#07070a] z-30 transition-transform duration-300 ease-out flex flex-col shrink-0
          ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
        >
          {/* Sidebar search box */}
          <div className="p-4 border-b border-zinc-900 flex-none">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
              <input
                type="text"
                placeholder="Search resources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-8.5 bg-zinc-950/60 border border-zinc-900 rounded-lg pl-9 pr-4 text-xs text-zinc-300 placeholder-zinc-500 focus:outline-none focus:border-cyan-500/50 transition-colors font-medium"
              />
            </div>
          </div>

          {/* Navigation Scroll Area */}
          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-4 select-none">
            {/* SEARCH RESULTS MODE */}
            {filteredItems !== null ? (
              <div className="space-y-1.5">
                <span className="text-[9px] font-extrabold text-zinc-500 uppercase tracking-widest px-2 block mb-2">
                  Search Results ({filteredItems.length})
                </span>
                {filteredItems.length === 0 ? (
                  <p className="text-[10px] text-zinc-500 font-semibold px-2">
                    No documents found matching search query.
                  </p>
                ) : (
                  filteredItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveDoc(item);
                        setMobileMenuOpen(false);
                      }}
                      className={`
                        w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors
                        ${
                          activeDoc.id === item.id
                            ? "bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-bold"
                            : "border border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50"
                        }
                      `}
                    >
                      <BookOpen className="size-3 shrink-0" />
                      <span className="truncate">{item.title}</span>
                    </button>
                  ))
                )}
              </div>
            ) : (
              /* REGULAR DIRECTORY TREE MODE */
              ACADEMY_NAVIGATION.map((cat) => {
                if (cat.type === "file") {
                  return (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setActiveDoc(cat);
                        setMobileMenuOpen(false);
                      }}
                      className={`
                        w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2.5 cursor-pointer border transition-colors
                        ${
                          activeDoc.id === cat.id
                            ? "bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-cyan-500/20 text-cyan-400 font-bold"
                            : "border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50"
                        }
                      `}
                    >
                      <Compass className="size-3.5 shrink-0 text-cyan-500" />
                      <span>{cat.title}</span>
                    </button>
                  );
                }

                const isExpanded = expandedCategories[cat.id];
                return (
                  <div key={cat.id} className="flex flex-col gap-1">
                    <button
                      onClick={() => toggleCategory(cat.id)}
                      className="w-full text-left px-3 py-1.5 flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                    >
                      <span>{cat.title}</span>
                      {isExpanded ? (
                        <ChevronDown className="size-3" />
                      ) : (
                        <ChevronRight className="size-3" />
                      )}
                    </button>

                    {isExpanded && cat.children && (
                      <div className="pl-1 space-y-0.5 border-l border-zinc-900/80 ml-2 mt-0.5">
                        {cat.children.map((file) => (
                          <button
                            key={file.id}
                            onClick={() => {
                              setActiveDoc(file);
                              setMobileMenuOpen(false);
                            }}
                            className={`
                              w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 cursor-pointer border transition-all
                              ${
                                activeDoc.id === file.id
                                  ? "bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-cyan-500/20 text-cyan-400 font-bold"
                                  : "border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40"
                              }
                            `}
                          >
                            <BookOpen
                              className={`size-3 shrink-0 ${activeDoc.id === file.id ? "text-cyan-400" : "text-zinc-600"}`}
                            />
                            <span className="truncate">{file.title}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </nav>
        </aside>

        {/* READER MAIN VIEWPORT */}
        <main
          ref={contentAreaRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto bg-gradient-to-b from-[#08080c] to-[#040406] px-6 py-8 md:p-12 relative flex flex-col h-full scroll-smooth"
        >
          {/* Back glows */}
          <div className="absolute top-[20%] left-[5%] w-[400px] h-[400px] rounded-full bg-blue-600/[0.02] blur-[80px] pointer-events-none" />

          {/* Quick Loading skeleton */}
          {isLoading ? (
            <div className="max-w-3xl w-full mx-auto space-y-6 animate-pulse mt-4">
              <div className="h-4 w-32 bg-zinc-800 rounded-full" />
              <div className="h-10 w-[70%] bg-zinc-800 rounded-xl" />
              <div className="h-5 w-40 bg-zinc-800 rounded-full" />
              <div className="space-y-3 pt-6">
                <div className="h-4 w-full bg-zinc-800/80 rounded" />
                <div className="h-4 w-full bg-zinc-800/80 rounded" />
                <div className="h-4 w-[90%] bg-zinc-800/80 rounded" />
              </div>
              <div className="h-48 w-full bg-zinc-800/40 rounded-2xl border border-zinc-800/60" />
            </div>
          ) : (
            <div className="max-w-3xl w-full mx-auto flex-1 flex flex-col relative">
              {/* Document Header Metadata */}
              <div className="flex flex-col gap-2.5 pb-6 border-b border-zinc-900 mb-8 flex-none select-none">
                <div className="inline-flex items-center gap-1.5 text-[10px] font-extrabold text-cyan-400 uppercase tracking-widest">
                  <Sparkles className="size-3" />
                  Learning Academy Resource
                </div>
                <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight leading-none">
                  {activeDoc.title}
                </h1>

                {/* Reading estimation */}
                <div className="flex items-center gap-4 text-xs font-semibold text-zinc-500 mt-1">
                  <span className="flex items-center gap-1.5">
                    <Clock className="size-3.5" />
                    {estimateReadingTime(markdownContent)} min read
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1.5">
                    <Zap className="size-3.5 text-amber-500" />
                    Offline-ready material
                  </span>
                </div>
              </div>

              {/* Document Rich-Text Content Reader */}
              <article className="flex-1 text-zinc-300 prose prose-invert max-w-none pb-20 leading-relaxed font-sans">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({ node, ...props }) => (
                      <h1
                        className="text-2xl md:text-3xl font-black text-white tracking-tight mt-8 mb-4 border-b border-zinc-900 pb-2.5 select-text"
                        {...props}
                      />
                    ),
                    h2: ({ node, ...props }) => (
                      <h2
                        className="text-xl md:text-2xl font-extrabold text-neutral-100 mt-8 mb-3 flex items-center gap-2 select-text"
                        {...props}
                      />
                    ),
                    h3: ({ node, ...props }) => (
                      <h3
                        className="text-lg font-bold text-neutral-200 mt-6 mb-2.5 select-text"
                        {...props}
                      />
                    ),
                    p: ({ node, ...props }) => (
                      <p
                        className="text-sm md:text-[14.5px] text-zinc-300/90 leading-relaxed my-4 font-medium select-text"
                        {...props}
                      />
                    ),
                    ul: ({ node, ...props }) => (
                      <ul
                        className="list-disc list-inside my-4 space-y-2 pl-2 text-sm md:text-[14.5px] text-zinc-300 font-medium select-text"
                        {...props}
                      />
                    ),
                    ol: ({ node, ...props }) => (
                      <ol
                        className="list-decimal list-inside my-4 space-y-2 pl-2 text-sm md:text-[14.5px] text-zinc-300 font-medium select-text"
                        {...props}
                      />
                    ),
                    li: ({ node, ...props }) => (
                      <li className="marker:text-cyan-500 select-text" {...props} />
                    ),
                    blockquote: ({ node, ...props }) => (
                      <blockquote
                        className="border-l-4 border-cyan-500 bg-cyan-500/5 pl-4 py-2.5 my-5 rounded-r-xl text-zinc-300 italic text-xs font-semibold leading-relaxed select-text"
                        {...props}
                      />
                    ),
                    table: ({ node, ...props }) => (
                      <div className="overflow-x-auto w-full my-6 border border-zinc-900 rounded-xl bg-white/[0.01]">
                        <table className="w-full text-xs text-left border-collapse" {...props} />
                      </div>
                    ),
                    th: ({ node, ...props }) => (
                      <th
                        className="px-4 py-2 bg-white/[0.03] border-b border-zinc-800 text-[10px] font-extrabold uppercase tracking-wider text-zinc-400"
                        {...props}
                      />
                    ),
                    td: ({ node, ...props }) => (
                      <td
                        className="px-4 py-2 border-b border-zinc-900 text-zinc-300 font-semibold"
                        {...props}
                      />
                    ),
                    a: ({ node, href, children, ...props }) => {
                      if (!href) return <span {...props}>{children}</span>;

                      const isExternal = href.startsWith("http://") || href.startsWith("https://");
                      const isWorkspace =
                        href === "/" || href === "/index.html" || href === "/home";

                      if (isExternal) {
                        return (
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-cyan-400 hover:text-cyan-300 transition-colors underline font-bold select-text"
                            {...props}
                          >
                            {children}
                          </a>
                        );
                      }

                      if (isWorkspace) {
                        let workspaceUrl = "/index.html";
                        if (typeof window !== "undefined") {
                          // Try to resolve dynamic extension ID if running in Chrome Extension environment
                          const chromeObj = (window as any).chrome;
                          if (chromeObj?.runtime?.getURL) {
                            workspaceUrl = chromeObj.runtime.getURL("index.html");
                          } else {
                            workspaceUrl = "/";
                          }
                        }
                        return (
                          <a
                            href={workspaceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-cyan-400 hover:text-cyan-300 transition-colors underline font-bold select-text"
                            {...props}
                          >
                            {children}
                          </a>
                        );
                      }

                      // Handle internal Markdown document links offline (e.g., ./course/module-0/README.md)
                      const handleInternalLinkClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
                        e.preventDefault();

                        // Normalize relative path segments
                        const normalizedPath = href.replace(/^\.\//, "").replace(/^\.\.\//, "");

                        // Recursive helper to look up active navigation tree item
                        const findDocByPath = (
                          items: DocItem[],
                          targetPath: string,
                        ): DocItem | null => {
                          for (const item of items) {
                            if (item.type === "file" && item.path.endsWith(targetPath)) {
                              return item;
                            }
                            if (item.children) {
                              const found = findDocByPath(item.children, targetPath);
                              if (found) return found;
                            }
                          }
                          return null;
                        };

                        const pathSegments = normalizedPath.split("/");
                        const filePart = pathSegments[pathSegments.length - 1];

                        let matchedDoc = findDocByPath(ACADEMY_NAVIGATION, normalizedPath);
                        if (!matchedDoc) {
                          // Fallback to match segment filename only
                          matchedDoc = findDocByPath(ACADEMY_NAVIGATION, filePart);
                        }

                        if (matchedDoc) {
                          setActiveDoc(matchedDoc);
                          toast.success(`Navigating to ${matchedDoc.title}`);
                        } else {
                          console.warn(`Internal document path not mapped: ${href}`);
                          toast.error("Linked section is not mapped offline");
                        }
                      };

                      return (
                        <a
                          href={href}
                          onClick={handleInternalLinkClick}
                          className="text-cyan-400 hover:text-cyan-300 transition-colors underline font-bold cursor-pointer select-text"
                        >
                          {children}
                        </a>
                      );
                    },
                    code({ node, className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || "");
                      const codeString = String(children).replace(/\n$/, "");
                      const isInline =
                        !codeString.includes("\n") &&
                        (!className || !className.includes("language-"));
                      if (!isInline) {
                        return (
                          <div className="relative group/code my-5 overflow-hidden rounded-xl border border-zinc-900 bg-neutral-950 font-mono text-xs shadow-inner">
                            {/* Copy button header */}
                            <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-900/60 bg-white/[0.01]">
                              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                                {match ? match[1] : "code snippet"}
                              </span>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(codeString);
                                  toast.success("Prompt/Code copied successfully!");
                                }}
                                className="text-zinc-500 hover:text-white transition-colors cursor-pointer flex items-center gap-1 font-sans text-[10px] font-bold"
                              >
                                <Copy className="size-3" />
                                Copy
                              </button>
                            </div>
                            <pre className="p-4 overflow-x-auto text-zinc-300 leading-relaxed font-semibold select-text">
                              <code {...props}>{children}</code>
                            </pre>
                          </div>
                        );
                      }
                      return (
                        <code
                          className="bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-xs font-semibold text-cyan-400 font-mono select-text"
                          {...props}
                        >
                          {children}
                        </code>
                      );
                    },
                  }}
                >
                  {cleanMarkdown(markdownContent)}
                </ReactMarkdown>
              </article>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
