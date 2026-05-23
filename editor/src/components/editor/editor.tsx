"use client";
import { useState, useEffect, useCallback } from "react";
import { MediaPanel } from "@/components/editor/media-panel";
import { CanvasPanel } from "@/components/editor/canvas-panel";
import Timeline from "@/components/editor/timeline";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { usePanelStore } from "@/stores/panel-store";
import Header from "@/components/editor/header";
import { Loading } from "@/components/editor/loading";
import FloatingControl from "@/components/editor/floating-controls/floating-control";
import { Compositor } from "@openvideo/engine-pixi";
import { WebCodecsUnsupportedModal } from "@/components/editor/webcodecs-unsupported-modal";
import { AcademyModal } from "./academy-modal";
import Assistant from "./assistant/assistant";
import { core } from "@/lib/project";
import { cn } from "@/lib/utils";
import { storageService } from "@/lib/storage/storage-service";

export default function Editor({
  initialDesign,
}: {
  isDataLoading?: boolean;
  initialDesign?: any;
}) {
  const {
    toolsPanel,
    copilotWidth,
    mainContent,
    timeline,
    setToolsPanel,
    setCopilotWidth,
    setMainContent,
    setTimeline,
    isCopilotVisible,
  } = usePanelStore();

  const [isReady, setIsReady] = useState(false);
  const [isWebCodecsSupported, setIsWebCodecsSupported] = useState(true);
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = window.innerWidth - e.clientX;
      const clampedWidth = Math.max(320, Math.min(newWidth, window.innerWidth * 0.5));
      setCopilotWidth(clampedWidth);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, setCopilotWidth]);

  useEffect(() => {
    if (initialDesign) {
      core.project.import(initialDesign);
    }
  }, [initialDesign]);

  useEffect(() => {
    if (initialDesign) return;

    const loadSavedProject = async () => {
      try {
        // 1. Recover all physical files from OPFS to generate fresh active Blob URLs
        const opfsFiles = await storageService.loadAllMediaFiles({
          projectId: "local-uploads",
        });

        // Map file names to their new active Blob URLs
        const nameToUrlMap: Record<string, string> = {};
        opfsFiles.forEach((file) => {
          if (file.name) {
            nameToUrlMap[file.name] = file.url || URL.createObjectURL(file.file);
          }
        });

        // 2. Load the saved project data
        const savedProject = await storageService.loadProject({ id: "default_project" });
        if (savedProject && savedProject.data) {
          const projectData = savedProject.data;

          // 3. Scan through all clips and remap expired Blob URLs to new active ones
          if (projectData.clips) {
            if (Array.isArray(projectData.clips)) {
              projectData.clips.forEach((clip: any) => {
                if (clip.src && clip.name && nameToUrlMap[clip.name]) {
                  const newUrl = nameToUrlMap[clip.name];
                  console.log(
                    `[Editor Restore] Updating clip ${clip.name} URL from ${clip.src} to ${newUrl}`,
                  );
                  clip.src = newUrl;
                }
              });
            } else if (typeof projectData.clips === "object") {
              Object.keys(projectData.clips).forEach((clipId) => {
                const clip = projectData.clips[clipId];
                if (clip && clip.src && clip.name && nameToUrlMap[clip.name]) {
                  const newUrl = nameToUrlMap[clip.name];
                  console.log(
                    `[Editor Restore] Updating clip ${clip.name} URL from ${clip.src} to ${newUrl}`,
                  );
                  clip.src = newUrl;
                }
              });
            }
          }

          console.log("[Editor] Restoring saved project with updated URLs:", savedProject);
          core.project.import(projectData);
        }
      } catch (error) {
        console.error("[Editor] Failed to auto-restore project:", error);
      }
    };

    loadSavedProject();
  }, [initialDesign]);

  useEffect(() => {
    const checkSupport = async () => {
      const isSupported = await Compositor.isSupported();
      setIsWebCodecsSupported(isSupported);
    };
    checkSupport();
  }, []);

  return (
    <div className="h-screen w-screen flex flex-col bg-background overflow-hidden">
      {!isReady && (
        <div className="absolute inset-0 z-100">
          <Loading />
        </div>
      )}
      <Header />
      <div className="flex-1 min-h-0 min-w-0 flex flex-row">
        <div className="flex-1 min-w-0 h-full">
          <ResizablePanelGroup direction="horizontal" className="h-full w-full gap-0">
            {/* Left Column: Media Panel */}
            <ResizablePanel
              defaultSize={toolsPanel}
              minSize={15}
              maxSize={40}
              onResize={setToolsPanel}
              className="max-w-7xl relative overflow-visible! bg-card min-w-0"
            >
              <MediaPanel />
              <FloatingControl />
            </ResizablePanel>

            <ResizableHandle className="bg-border/90" />

            {/* Middle Column: Preview + Timeline */}
            <ResizablePanel defaultSize={100 - toolsPanel} minSize={40} className="min-w-0 min-h-0">
              <ResizablePanelGroup direction="vertical" className="h-full w-full gap-0">
                {/* Canvas Panel */}
                <ResizablePanel
                  defaultSize={mainContent}
                  minSize={30}
                  maxSize={85}
                  onResize={setMainContent}
                  className="min-h-0"
                >
                  <CanvasPanel
                    onReady={() => {
                      setIsReady(true);
                    }}
                  />
                </ResizablePanel>

                <ResizableHandle
                  withHandle
                  className={cn(
                    "bg-border/90 z-50 hover:bg-primary/40 active:bg-primary/60 cursor-row-resize h-[3px] transition-colors relative",
                    "after:absolute after:inset-x-0 after:top-1/2 after:h-8 after:-translate-y-1/2",
                  )}
                />

                {/* Timeline Panel */}
                <ResizablePanel
                  defaultSize={timeline}
                  minSize={20}
                  maxSize={70}
                  onResize={setTimeline}
                  className="min-h-[180px] min-w-0"
                >
                  <Timeline />
                </ResizablePanel>
              </ResizablePanelGroup>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>

        {/* Right Column: Assistant Panel with custom resize & animation */}
        <div
          style={{ width: isCopilotVisible ? `${copilotWidth}px` : "0px" }}
          className={cn(
            "h-full bg-card flex flex-col relative shrink-0",
            isCopilotVisible ? "border-l border-border/90" : "border-l-0 overflow-hidden",
            isDragging ? "" : "transition-[width] duration-300 ease-in-out",
          )}
        >
          {/* Custom Resize Handle */}
          {isCopilotVisible && (
            <div
              onMouseDown={handleMouseDown}
              className={cn(
                "absolute left-0 top-0 bottom-0 w-1 -ml-[2px] cursor-col-resize z-50 transition-colors",
                "hover:bg-primary/40 active:bg-primary/60",
                isDragging ? "bg-primary/60 animate-pulse" : "bg-transparent",
              )}
            />
          )}

          <div className="w-full h-full min-w-[320px] overflow-hidden">
            <Assistant />
          </div>
        </div>
      </div>

      {/* Academy Announcement Modal */}
      <AcademyModal />

      {/* WebCodecs Support Check Modal */}
      <WebCodecsUnsupportedModal open={!isWebCodecsSupported} />
    </div>
  );
}
