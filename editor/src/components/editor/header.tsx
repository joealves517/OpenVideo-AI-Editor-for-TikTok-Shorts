"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { IconShare } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { useStudioStore } from "@/stores/studio-store";
import { usePanelStore } from "@/stores/panel-store";
import { useProjectStore } from "@/stores/project-store";
import { fontManager, Log, type IClip } from "@openvideo/engine-pixi";
import { ExportModal } from "./export-modal";
import { LogoIcons } from "../shared/logos";
import Link from "next/link";
import { Icons } from "../shared/icons";
import {
  Keyboard,
  FileJson,
  Download,
  Upload,
  MessageSquare,
  Settings,
  Database,
  FilePlus,
  Square,
  Smartphone,
  Monitor,
  ChevronLeft,
} from "lucide-react";
import { IconSparkles2 } from "@tabler/icons-react";
import { toast } from "sonner";
import { Compositor } from "@openvideo/engine-pixi";
import { ShortcutsModal } from "./shortcuts-modal";
import { SupportModal } from "../support-modal";
import { useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useRouter, useParams } from "next/navigation";
import { storageService } from "@/lib/storage/storage-service";
import { Save } from "lucide-react";
import AutosizeInput from "../ui/autosize-input";
import { authClient } from "@/lib/auth-client";
import { core, projectStore } from "@/lib/project";
import { useStore } from "zustand";
import { template } from "./sample";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, User, GraduationCap } from "lucide-react";
import { signOutAndRedirect } from "@/lib/sign-out";
import { UpgradeModal } from "./upgrade-modal";

export default function Header() {
  const { studio } = useStudioStore();
  const { toggleCopilot, isCopilotVisible } = usePanelStore();
  const { aspectRatio, setCanvasSize } = useProjectStore();
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isBatchExporting, setIsBatchExporting] = useState(false);
  const [customWidth, setCustomWidth] = useState("");
  const [customHeight, setCustomHeight] = useState("");
  const router = useRouter();
  const params = useParams();
  const projectId = (params.projectId as string) || "default_project";
  const { data: session } = authClient.useSession();
  const { projectName, setProjectName } = useProjectStore();
  const [isSaving, setIsSaving] = useState(false);
  const [title, setTitle] = useState(projectName || "Untitled video");
  const [userInfo, setUserInfo] = useState<{ name: string; email: string; image: string } | null>(
    null,
  );
  const [isSignOutOpen, setIsSignOutOpen] = useState(false);
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [userCredits, setUserCredits] = useState<{
    credits: number;
    tier: string;
    freeCreditsUsedToday?: number;
    maxFreeCredits?: number;
  } | null>(null);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  useEffect(() => {
    if (session?.user) {
      setUserInfo({
        name: session.user.name || "Creator",
        email: session.user.email || "user@example.com",
        image: session.user.image || "",
      });
      return;
    }

    // Fallback: read user info saved by Chrome Extension login flow
    try {
      const savedUser = localStorage.getItem("openvideo_user");
      if (savedUser) {
        setUserInfo(JSON.parse(savedUser));
        return;
      }
    } catch {}

    setUserInfo(null);
  }, [session]);

  useEffect(() => {
    if (userInfo?.email) {
      fetch("/api/user")
        .then((r) => r.json())
        .then((data) => {
          if (!data.error) {
            setUserCredits(data);
          }
        })
        .catch((err) => console.error("Failed to fetch user credits:", err));
    }
  }, [userInfo?.email]);

  const handleSignOut = () => {
    setIsSignOutOpen(true);
  };

  const performSignOut = () => {
    signOutAndRedirect();
  };

  // Sync title with store when project name changes externally (like on initial load)
  useEffect(() => {
    if (projectName && projectName !== title) {
      setTitle(projectName);
    }
  }, [projectName]);

  const handleApplyCustomSize = () => {
    const w = parseInt(customWidth);
    const h = parseInt(customHeight);
    if (!isNaN(w) && !isNaN(h) && w > 0 && h > 0) {
      setCanvasSize({ width: w, height: h }, "Custom");
    } else {
      toast.error("Invalid dimensions");
    }
  };

  const handleGetStarted = (route: string) => {
    router.push(route);
  };

  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  // Track undo/redo availability from Core store history
  const canUndo = useStore(projectStore, (s) => s.history.length > 0);
  const canRedo = useStore(projectStore, (s) => s.future.length > 0);

  // NOTE: canUndo/canRedo state now sourced from core.store — no studio history listener needed.

  const handleSave = async (showToast = true) => {
    if (!studio || !projectId) return;

    setIsSaving(true);
    let toastId;
    if (showToast) {
      toastId = toast.loading("Saving project...");
    }

    try {
      const studioJSON = studio.exportToJSON();
      await storageService.saveProjectFull(projectId, studioJSON);
      console.log("Project saved", studioJSON);
      if (showToast) {
        toast.success("Project saved", { id: toastId });
      }
    } catch (error) {
      console.error("Failed to save project", error);
      if (showToast) {
        toast.error("Failed to save project", { id: toastId });
      }
    } finally {
      setIsSaving(false);
    }
  };
  // Auto-save on studio changes (with debounce)
  useEffect(() => {
    if (!studio || !projectId) return;

    let timeoutId: NodeJS.Timeout;

    const onStudioChange = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        handleSave(false); // Silent save
      }, 1000); // 1 second debounce
    };
    const eventsToListen = [
      "history:changed",
      "clip:added",
      "clip:removed",
      "clip:updated",
      "clip:moved",
      "track:added",
      "track:removed",
      "clips:removed",
      "clip:replaced",
      "clip:propsChange",
      "propsChange",
    ];

    eventsToListen.forEach((event) => {
      studio.on(event, onStudioChange);
    });

    return () => {
      eventsToListen.forEach((event) => {
        studio.off(event, onStudioChange);
      });
      clearTimeout(timeoutId);
    };
  }, [studio, projectId]);

  const handleNew = () => {
    setIsNewProjectOpen(true);
  };

  const performNewProject = () => {
    core.project.new();
  };

  const handleExportJSON = () => {
    try {
      const json = core.project.export();
      if (Object.keys(json.clips).length === 0) {
        toast.warning("No clips to export");
        return;
      }

      const jsonString = JSON.stringify(json, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const aEl = document.createElement("a");
      document.body.appendChild(aEl);
      aEl.href = url;
      aEl.download = `${projectName || "project"}-${Date.now()}.json`;
      aEl.click();

      setTimeout(() => {
        if (document.body.contains(aEl)) {
          document.body.removeChild(aEl);
        }
        URL.revokeObjectURL(url);
      }, 100);
    } catch (error) {
      Log.error("Export to JSON error:", error);
      toast.error("Failed to export to JSON: " + (error as Error).message);
    }
  };

  const handleImportJSON = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,application/json";
    input.style.display = "none";

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const json = JSON.parse(text);
        core.project.import(json);
        toast.success("Project imported successfully");
      } catch (error) {
        Log.error("Load from JSON error:", error);
        toast.error("Failed to load from JSON: " + (error as Error).message);
      } finally {
        if (document.body.contains(input)) {
          document.body.removeChild(input);
        }
      }
    };

    document.body.appendChild(input);
    input.click();
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };

  return (
    <header className="relative flex h-[52px] w-full shrink-0 items-center justify-between px-4 bg-card z-10 border-b">
      <div className="flex items-center gap-3">
        <img
          src="/icon48.png"
          className="h-7 w-7 rounded-md object-contain select-none shrink-0"
          alt="OpenVideo Logo"
        />
        <div className="pointer-events-none flex h-10 items-center gap-2 rounded-md select-none">
          <span className="px-1 text-sm font-semibold text-foreground">OpenVideo Copilot</span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-2 border-border/50">
              <Monitor className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium">
                {aspectRatio === "Custom" ? "Custom" : aspectRatio}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-[180px]">
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => setCanvasSize({ width: 1080, height: 1920 }, "9:16")}
            >
              <Smartphone className="mr-2 h-4 w-4 shrink-0" />
              <div className="flex flex-col">
                <span className="text-sm font-medium leading-none">9:16</span>
                <span className="text-xs text-muted-foreground mt-1">Tiktok / Shorts</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => setCanvasSize({ width: 1920, height: 1080 }, "16:9")}
            >
              <Monitor className="mr-2 h-4 w-4 shrink-0" />
              <div className="flex flex-col">
                <span className="text-sm font-medium leading-none">16:9</span>
                <span className="text-xs text-muted-foreground mt-1">Youtube</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => setCanvasSize({ width: 1080, height: 1080 }, "1:1")}
            >
              <Square className="mr-2 h-4 w-4 shrink-0" />
              <div className="flex flex-col">
                <span className="text-sm font-medium leading-none">1:1</span>
                <span className="text-xs text-muted-foreground mt-1">Instagram</span>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4 pr-4">
        <div className="flex items-center">
          <Button
            onClick={() => core.undo()}
            disabled={!canUndo}
            variant="ghost"
            size="icon"
            className="h-8 w-8"
          >
            <Icons.undo className="size-4.5" />
          </Button>
          <Button
            onClick={() => core.redo()}
            disabled={!canRedo}
            className="text-muted-foreground h-8 w-8"
            variant="ghost"
            size="icon"
          >
            <Icons.redo className="size-4.5" />
          </Button>
        </div>

        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => setIsShortcutsModalOpen(true)}
          >
            <Keyboard className="size-5" />
          </Button>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-8 w-8 transition-colors relative group/sparkle",
            isCopilotVisible
              ? "text-primary hover:text-primary/80"
              : "text-muted-foreground hover:text-foreground",
          )}
          onClick={toggleCopilot}
        >
          <IconSparkles2 stroke={1.5} className="size-5" />
          <div className="absolute top-[130%] left-1/2 -translate-x-1/2 px-2.5 py-1 bg-neutral-900 border border-border/40 text-white text-[10px] font-medium rounded-md whitespace-nowrap shadow-xl opacity-0 scale-95 pointer-events-none group-hover/sparkle:opacity-100 group-hover/sparkle:scale-100 transition-all duration-150 ease-out z-50">
            {isCopilotVisible ? "Close AI Copilot" : "Open AI Copilot"}
          </div>
        </Button>

        <Button
          size="sm"
          className="gap-2 rounded-full h-8 px-4"
          onClick={() => setIsExportModalOpen(true)}
        >
          Download
        </Button>

        <ExportModal open={isExportModalOpen} onOpenChange={setIsExportModalOpen} />
        <ShortcutsModal open={isShortcutsModalOpen} onOpenChange={setIsShortcutsModalOpen} />

        {/* User Avatar Menu */}
        {userInfo && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-8 w-8 rounded-full p-0 flex items-center justify-center outline-none border border-border/50 hover:bg-white/5"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={userInfo.image || ""} alt={userInfo.name || "User"} />
                  <AvatarFallback className="bg-primary/10 text-primary text-[10px]">
                    {userInfo.name?.charAt(0).toUpperCase() || <User className="h-3 w-3" />}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuItem className="flex flex-col items-start gap-1 p-2 outline-none">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium leading-none capitalize">{userInfo.name}</p>
                  <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded border border-border/50 leading-none font-medium capitalize tracking-wide">
                    {userCredits?.tier || "Free"}
                  </span>
                </div>
                <p className="text-xs leading-none text-muted-foreground mt-0.5">
                  {userInfo.email}
                </p>
              </DropdownMenuItem>

              {userCredits && userCredits.tier !== "premium" && (
                <>
                  <div className="px-2 pb-2 pt-1">
                    <button
                      className="w-full relative h-12 rounded-lg overflow-hidden group cursor-pointer border-none p-0 outline-none hover:opacity-90 transition-opacity ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      onClick={() => setIsUpgradeModalOpen(true)}
                    >
                      {/* Background Image with scale to crop white borders */}
                      <div className="absolute inset-0 z-0">
                        <img
                          src="/pro-banner.png"
                          alt="Upgrade to Pro"
                          className="w-full h-full object-cover object-center scale-150 group-hover:scale-125 transition-transform duration-500 ease-out"
                        />
                      </div>
                      {/* Soft overlay for subtle texture blending */}
                      <div className="absolute inset-0 bg-black/[0.02] z-10" />
                      {/* Content */}
                      <div className="relative z-20 flex items-center justify-center h-full gap-2 text-neutral-900">
                        <IconSparkles2 className="w-4 h-4 text-amber-600 font-bold drop-shadow-sm" />
                        <span className="text-sm font-bold tracking-wide text-neutral-900 drop-shadow-sm">
                          Upgrade to Pro
                        </span>
                      </div>
                    </button>
                  </div>
                </>
              )}

              <DropdownMenuItem
                className="cursor-pointer py-2"
                onClick={() => {
                  const url =
                    typeof window !== "undefined" &&
                    window.location.protocol === "chrome-extension:"
                      ? "academy.html"
                      : "/academy";
                  window.open(url, "_blank");
                }}
              >
                <GraduationCap className="mr-2 h-4 w-4" />
                <span>Faceless Academy</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer py-2"
                onClick={() => setIsSupportModalOpen(true)}
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                <span>Help & Support</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive cursor-pointer py-2"
                onClick={handleSignOut}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Sign Out Confirmation Modal */}
      <AlertDialog open={isSignOutOpen} onOpenChange={setIsSignOutOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign Out</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to sign out?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={performSignOut}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sign out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* New Project Confirmation Modal */}
      <AlertDialog open={isNewProjectOpen} onOpenChange={setIsNewProjectOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>New Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to start a new project? Unsaved changes will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={performNewProject}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Support Modal */}
      <SupportModal open={isSupportModalOpen} onOpenChange={setIsSupportModalOpen} />

      {/* Premium Upgrade Modal */}
      <UpgradeModal
        open={isUpgradeModalOpen}
        onOpenChange={setIsUpgradeModalOpen}
        userEmail={userInfo?.email || ""}
      />
    </header>
  );
}
