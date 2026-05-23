"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogoIcons } from "@/components/shared/logos";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Folder,
  Clock,
  LogOut,
  Video,
  Layers,
  Settings,
  Sliders,
  User,
  GraduationCap,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

import { authClient } from "@/lib/auth-client";
import { signOutAndRedirect } from "@/lib/sign-out";

interface Project {
  id: string;
  name: string;
  updatedAt: string;
  duration: string;
  aspectRatio: string;
  thumbnailColor: string;
}

export default function HomePage() {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<{ name: string; email: string; image: string } | null>(
    null,
  );
  const [isSignOutOpen, setIsSignOutOpen] = useState(false);
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (isPending) return;

    if (session?.user) {
      setUserInfo({
        name: session.user.name || "Creator",
        email: session.user.email || "user@example.com",
        image: session.user.image || "",
      });
      return;
    }

    // Verify auth via localStorage (fallback/compatibility)
    const savedAuth = localStorage.getItem("openvideo_auth");
    if (savedAuth === "true") {
      try {
        const userStr = localStorage.getItem("openvideo_user");
        if (userStr) {
          setUserInfo(JSON.parse(userStr));
          return;
        }
      } catch (e) {}
    }

    // If no session and no saved auth, redirect to landing
    router.push("/");
  }, [session, isPending, router]);

  const handleLogout = () => {
    setIsSignOutOpen(true);
  };

  const performSignOut = () => {
    signOutAndRedirect();
  };

  const handleCreateNewProject = () => {
    router.push("/");
  };

  // Mock list of beautiful recent projects
  const recentProjects: Project[] = [
    {
      id: "proj-1",
      name: "Explainer Video Ad",
      updatedAt: "2 hours ago",
      duration: "0:30",
      aspectRatio: "16:9 Landscape",
      thumbnailColor: "from-blue-600 to-indigo-600",
    },
    {
      id: "proj-2",
      name: "TikTok Cinematic Intro",
      updatedAt: "1 day ago",
      duration: "0:15",
      aspectRatio: "9:16 Portrait",
      thumbnailColor: "from-fuchsia-600 to-pink-600",
    },
    {
      id: "proj-3",
      name: "Square Product Promo",
      updatedAt: "3 days ago",
      duration: "1:00",
      aspectRatio: "1:1 Square",
      thumbnailColor: "from-emerald-600 to-teal-600",
    },
  ];

  return (
    <div className="relative min-h-screen w-screen flex flex-col bg-[#0a0a0a] text-white font-sans overflow-x-hidden">
      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-violet-600/10 blur-[100px] pointer-events-none" />

      {/* Subtle Dot Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808005_1px,transparent_1px),linear-gradient(to_bottom,#80808005_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      {/* Top Header Navigation */}
      <header className="relative z-10 flex h-16 w-full items-center justify-between px-8 border-b border-white/5 bg-black/40 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center shadow-lg shadow-black/50">
            <img src="/icon48.png" alt="OpenVideo Icon" className="w-full h-full object-contain" />
          </div>
          <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-white to-neutral-400 bg-clip-text text-transparent">
            OpenVideo Copilot
          </span>
        </div>

        <div className="flex items-center gap-4">
          {userInfo && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-10 w-10 rounded-full p-0 flex items-center justify-center outline-none border border-white/10 hover:bg-white/5 shadow-lg"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={userInfo.image || ""} alt={userInfo.name || "User"} />
                    <AvatarFallback className="bg-primary/20 text-primary font-bold">
                      {userInfo.name?.charAt(0).toUpperCase() || <User className="h-4 w-4" />}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-56 bg-black/80 backdrop-blur-xl border-white/10 text-white"
                align="end"
                forceMount
              >
                <DropdownMenuItem className="flex flex-col items-start gap-1 p-3 outline-none hover:bg-transparent cursor-default focus:bg-transparent">
                  <p className="text-sm font-semibold leading-none capitalize">{userInfo.name}</p>
                  <p className="text-xs leading-none text-neutral-400 mt-1">{userInfo.email}</p>
                </DropdownMenuItem>
                <div className="h-px bg-white/10 my-1" />
                <DropdownMenuItem
                  className="text-red-400 focus:text-red-300 focus:bg-red-500/10 cursor-pointer py-2.5 px-3 rounded-lg mx-1 my-1 flex items-center transition-colors"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span className="font-medium">Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </header>

      {/* Main Workspace Dashboard Content */}
      <main className="relative z-10 flex-1 max-w-6xl w-full mx-auto px-8 py-10 flex flex-col gap-10">
        {/* Welcome Hero Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-8 rounded-3xl border border-white/5 bg-gradient-to-br from-white/[0.03] to-transparent backdrop-blur-lg">
          <div className="flex flex-col gap-2">
            <h2 className="text-3xl font-extrabold tracking-tight">
              Welcome back,{" "}
              <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent capitalize">
                {userInfo?.name || "Creator"}
              </span>
              !
            </h2>
            <p className="text-sm text-neutral-400 max-w-lg">
              Start editing video instantly with high-performance client-side WebCodecs and
              real-time AI copilot assistance.
            </p>
          </div>

          <Button
            onClick={handleCreateNewProject}
            className="h-12 bg-white hover:bg-neutral-100 text-black font-semibold px-6 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-white/5 hover:scale-[1.02] active:scale-[0.98] cursor-pointer shrink-0"
          >
            <Plus className="h-5 w-5" />
            Create New Video
          </Button>
        </div>

        {/* Faceless Video Mastery Academy Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 rounded-3xl border border-white/5 bg-gradient-to-r from-blue-500/10 via-violet-500/10 to-transparent backdrop-blur-lg">
          <div className="flex items-start gap-4">
            <div className="p-3.5 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
              <GraduationCap className="h-7 w-7" />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-blue-400 tracking-wider uppercase">
                Faceless Video Academy
              </span>
              <h3 className="text-xl font-bold tracking-tight">
                Master short-form content automation
              </h3>
              <p className="text-xs text-neutral-400 max-w-xl leading-relaxed">
                Khám phá bí kíp tự động hóa kênh TikTok, Shorts & Reels từ A đến Z. Lựa chọn chủ đề
                (Niche) kiếm tiền cao, lấy ý tưởng video giật gân, và tăng tốc sản xuất cùng
                OpenVideo Copilot.
              </p>
            </div>
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
            className="h-10 bg-white/5 hover:bg-white/10 text-white font-semibold border border-white/10 px-5 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0 hover:scale-[1.02] active:scale-[0.98]"
          >
            Learn & Get Resources
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Recent Workspace Projects Section */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-2.5">
            <Folder className="h-5 w-5 text-blue-500" />
            <h3 className="text-lg font-bold tracking-tight">Recent Projects</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recentProjects.map((project) => (
              <div
                key={project.id}
                onClick={handleCreateNewProject}
                className="group relative rounded-2xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] p-5 flex flex-col gap-4 cursor-pointer transition-all duration-300 hover:border-white/10 hover:shadow-xl hover:shadow-black/20"
              >
                {/* Simulated Thumbnail */}
                <div
                  className={`w-full aspect-video rounded-xl bg-gradient-to-tr ${project.thumbnailColor} opacity-70 group-hover:opacity-95 transition-opacity flex items-center justify-center shadow-inner relative overflow-hidden`}
                >
                  <div className="absolute inset-0 bg-black/20" />
                  <Video className="w-10 h-10 text-white drop-shadow-md transform group-hover:scale-110 transition-transform duration-300" />
                  <span className="absolute bottom-2 right-2 text-xs bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md font-bold text-neutral-300">
                    {project.duration}
                  </span>
                </div>

                {/* Metadata */}
                <div className="flex flex-col gap-1">
                  <h4 className="font-semibold text-neutral-200 group-hover:text-white transition-colors truncate">
                    {project.name}
                  </h4>
                  <div className="flex items-center justify-between text-xs text-neutral-400 font-medium">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {project.updatedAt}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-neutral-900 border border-white/5">
                      {project.aspectRatio}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Empty State Help Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          <div className="rounded-2xl border border-white/5 bg-white/[0.01] p-6 flex items-start gap-4">
            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 shrink-0">
              <Layers className="h-5 w-5" />
            </div>
            <div className="flex flex-col gap-1.5">
              <h4 className="font-semibold text-neutral-200">100% Upstream Ready</h4>
              <p className="text-xs text-neutral-400 leading-relaxed">
                This dashboard page acts as a local placeholder syncing directly with{" "}
                <code className="text-neutral-300">/home</code>. When they release database
                dashboard features, pull changes to sync instantly.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/5 bg-white/[0.01] p-6 flex items-start gap-4">
            <div className="p-3 rounded-xl bg-violet-500/10 text-violet-400 shrink-0">
              <Sliders className="h-5 w-5" />
            </div>
            <div className="flex flex-col gap-1.5">
              <h4 className="font-semibold text-neutral-200">Next-gen Extension Tech</h4>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Running client-side canvas renderers in a native extension context. All projects and
                assets are stored locally within the high-speed filesystem.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Branding */}
      <footer className="w-full py-6 mt-auto border-t border-white/5 text-center text-xs text-neutral-500 font-medium">
        OpenVideo Copilot Dashboard • Powered by Google Cloud & Native Extension APIs
      </footer>

      {/* Sign Out Confirmation Modal */}
      <AlertDialog open={isSignOutOpen} onOpenChange={setIsSignOutOpen}>
        <AlertDialogContent className="bg-black/90 border-white/10 text-white backdrop-blur-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Sign Out</AlertDialogTitle>
            <AlertDialogDescription className="text-neutral-400">
              Are you sure you want to sign out of your account?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/10 hover:bg-white/5 hover:text-white">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600 text-white"
              onClick={performSignOut}
            >
              Sign out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
