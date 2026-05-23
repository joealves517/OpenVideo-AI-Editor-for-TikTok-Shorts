"use client";

import { cn } from "@/lib/utils";
import { type Tab, tabs, useMediaPanelStore } from "./store";
import { useEffect, useRef, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function TabBar() {
  const { activeTab, setActiveTab } = useMediaPanelStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(false);

  // Drag to scroll states
  const [isDown, setIsDown] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftState, setScrollLeftState] = useState(0);
  const [dragged, setDragged] = useState(false);

  const checkScrollPosition = useCallback(() => {
    const element = scrollRef.current;
    if (!element) return;

    const { scrollLeft, scrollWidth, clientWidth } = element;
    setShowLeftFade(scrollLeft > 0);
    setShowRightFade(scrollLeft < scrollWidth - clientWidth - 1);
  }, []);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    checkScrollPosition();
    element.addEventListener("scroll", checkScrollPosition);

    const resizeObserver = new ResizeObserver(checkScrollPosition);
    resizeObserver.observe(element);

    return () => {
      element.removeEventListener("scroll", checkScrollPosition);
      resizeObserver.disconnect();
    };
  }, [checkScrollPosition]);

  // Mouse drag to scroll handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    const element = scrollRef.current;
    if (!element) return;
    setIsDown(true);
    setStartX(e.pageX - element.offsetLeft);
    setScrollLeftState(element.scrollLeft);
    setDragged(false);
  };

  const handleMouseLeave = () => {
    setIsDown(false);
  };

  const handleMouseUp = () => {
    setIsDown(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDown) return;
    const element = scrollRef.current;
    if (!element) return;
    e.preventDefault();
    const x = e.pageX - element.offsetLeft;
    const walk = (x - startX) * 1.5;
    if (Math.abs(walk) > 5) {
      setDragged(true);
    }
    element.scrollLeft = scrollLeftState - walk;
  };

  return (
    <div className="relative flex items-center py-2 px-1 bg-primary/7 select-none group/tabbar z-30">
      {showLeftFade && (
        <>
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-linear-to-r from-card to-transparent z-10 pointer-events-none" />
          <button
            onClick={() => {
              scrollRef.current?.scrollBy({ left: -100, behavior: "smooth" });
            }}
            className="absolute left-1 z-20 flex h-6 w-6 items-center justify-center rounded-full border border-border/40 bg-neutral-900/90 backdrop-blur-xs text-muted-foreground hover:text-white shadow-md hover:bg-neutral-800 transition-all active:scale-90 cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        </>
      )}

      <div
        ref={scrollRef}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        className={cn(
          "overflow-x-auto scrollbar-hidden w-full select-none pb-12 -mb-12",
          isDown ? "cursor-grabbing" : "cursor-grab",
        )}
      >
        <div className="flex items-center gap-2 w-fit mx-auto px-4">
          {(Object.keys(tabs) as Tab[]).map((tabKey) => {
            const tab = tabs[tabKey];
            const isActive = activeTab === tabKey;
            return (
              <div
                className={cn(
                  "relative flex items-center justify-center flex-none h-7.5 w-7.5 cursor-pointer rounded-sm transition-all duration-200 group/tab",
                  isActive
                    ? "bg-white/10 text-white"
                    : "text-muted-foreground hover:bg-white/5 hover:text-white",
                )}
                onClick={(e) => {
                  if (dragged) {
                    e.preventDefault();
                    return;
                  }
                  setActiveTab(tabKey);
                }}
                key={tabKey}
              >
                <tab.icon className="size-5 pointer-events-none" />
                <div className="absolute top-[130%] left-1/2 -translate-x-1/2 px-2.5 py-1 bg-neutral-900 border border-border/40 text-white text-[10px] font-medium rounded-md whitespace-nowrap shadow-xl opacity-0 scale-95 pointer-events-none group-hover/tab:opacity-100 group-hover/tab:scale-100 transition-all duration-150 ease-out z-50">
                  {tab.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showRightFade && (
        <>
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-linear-to-l from-card to-transparent z-10 pointer-events-none" />
          <button
            onClick={() => {
              scrollRef.current?.scrollBy({ left: 100, behavior: "smooth" });
            }}
            className="absolute right-1 z-20 flex h-6 w-6 items-center justify-center rounded-full border border-border/40 bg-neutral-900/90 backdrop-blur-xs text-muted-foreground hover:text-white shadow-md hover:bg-neutral-800 transition-all active:scale-90 cursor-pointer"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </>
      )}
    </div>
  );
}
