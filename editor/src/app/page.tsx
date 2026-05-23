"use client";

import "@/lib/api-bootstrap";
import { useState, useEffect } from "react";
import Editor from "@/components/editor/editor";
import { LogoIcons } from "@/components/shared/logos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Icons } from "@/components/shared/icons";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";

export default function Page() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [email, setEmail] = useState<string>("");
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    // Wait until BetterAuth session check is complete
    if (isPending) return;

    try {
      // User explicitly signed out — stay on login screen
      if (localStorage.getItem("openvideo_signed_out") === "true") {
        setIsLoggedIn(false);
        setIsLoading(false);
        return;
      }
    } catch {}

    // BetterAuth mock session resolved with user data
    if (session) {
      setIsLoggedIn(true);
      setIsLoading(false);
      return;
    }

    // Fallback: check localStorage saved by Chrome Extension login
    try {
      const savedAuth = localStorage.getItem("openvideo_auth");
      if (savedAuth === "true") {
        setIsLoggedIn(true);
        setIsLoading(false);
        return;
      }
    } catch {}

    // No auth found
    setIsLoggedIn(false);
    setIsLoading(false);
  }, [session, isPending]);

  const handleGoogleLogin = async () => {
    setAuthLoading(true);
    try {
      localStorage.removeItem("openvideo_signed_out");
      const chromeObj = typeof window !== "undefined" ? (window as any).chrome : null;

      // If we are running inside a real Chrome Extension page
      if (chromeObj && chromeObj.identity && chromeObj.identity.getAuthToken) {
        chromeObj.identity.getAuthToken({ interactive: true }, (token: string | undefined) => {
          const err = chromeObj.runtime?.lastError;
          if (err) {
            toast.error("Google Auth failed: " + err.message);
            setAuthLoading(false);
          } else if (token) {
            // Fetch real user profile from Google API using the token
            fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
              headers: { Authorization: `Bearer ${token}` },
            })
              .then((res) => {
                if (!res.ok) throw new Error("Failed to fetch profile from Google API");
                return res.json();
              })
              .then((data) => {
                const email = data.email || "user@gmail.com";
                const name = data.name || email.split("@")[0];
                const image = data.picture || "";
                const user = { name, email, image };

                try {
                  localStorage.setItem("openvideo_user", JSON.stringify(user));
                  localStorage.setItem("openvideo_auth", "true");
                } catch (e) {}

                setIsLoggedIn(true);
                toast.success("Successfully signed in with Google");
                setAuthLoading(false);
              })
              .catch((err) => {
                console.warn("[Page Auth] Failed to fetch Google userinfo:", err);
                // Fallback to local profile info using chrome.identity
                if (chromeObj.identity.getProfileUserInfo) {
                  chromeObj.identity.getProfileUserInfo(
                    { accountStatus: "ANY" },
                    (userInfo: any) => {
                      const email = userInfo.email || "user@gmail.com";
                      const name = email.split("@")[0];
                      const user = { name, email, image: "" };
                      try {
                        localStorage.setItem("openvideo_user", JSON.stringify(user));
                        localStorage.setItem("openvideo_auth", "true");
                      } catch (e) {}
                      setIsLoggedIn(true);
                      toast.success("Successfully signed in with Google");
                      setAuthLoading(false);
                    },
                  );
                } else {
                  try {
                    const user = { name: "Creator", email: "user@gmail.com", image: "" };
                    localStorage.setItem("openvideo_user", JSON.stringify(user));
                    localStorage.setItem("openvideo_auth", "true");
                  } catch (e) {}
                  setIsLoggedIn(true);
                  toast.success("Successfully signed in with Google");
                  setAuthLoading(false);
                }
              });
          }
        });
        return;
      }

      // Local development: Call real Google OAuth via Better-Auth
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/",
      });
    } catch (err: any) {
      toast.error("Login failed: " + err.message);
    } finally {
      if (typeof window !== "undefined" && !(window as any).chrome?.identity) {
        setAuthLoading(false);
      }
    }
  };

  if (isLoading) return null;

  if (isLoggedIn) {
    return <Editor />;
  }

  return (
    <div className="relative min-h-screen w-screen flex flex-col items-center justify-center bg-[#0a0a0a] text-white overflow-hidden font-sans">
      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] height-[600px] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] height-[600px] rounded-full bg-violet-600/10 blur-[120px] pointer-events-none" />

      {/* Subtle Dot Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      {/* Main Login Card */}
      <div className="relative z-10 w-full max-w-md p-8 mx-4 rounded-3xl border border-white/5 bg-black/40 backdrop-blur-2xl shadow-2xl flex flex-col items-center">
        {/* Animated App Logo & Title */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="w-20 h-20 rounded-3xl overflow-hidden flex items-center justify-center shadow-2xl shadow-black/50 transform transition-transform hover:scale-105 duration-300 mb-2">
            <img
              src="/icon128.png"
              alt="OpenVideo Icon"
              className="w-full h-full object-contain drop-shadow-lg"
            />
          </div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white via-neutral-200 to-neutral-500 bg-clip-text text-transparent">
            OpenVideo Copilot
          </h1>
          <p className="text-sm text-neutral-400 text-center font-medium">
            High-performance AI Video Editor with Client-side Engine
          </p>
        </div>

        {/* Buttons and Fields */}
        <div className="w-full flex flex-col gap-4 mt-4">
          {/* Main Action: Google 1-Click login */}
          <Button
            onClick={handleGoogleLogin}
            disabled={authLoading}
            className="w-full h-12 bg-white hover:bg-neutral-100 text-black font-semibold rounded-2xl flex items-center justify-center gap-3 transition-all duration-300 shadow-xl shadow-white/10 active:scale-[0.98] cursor-pointer text-base"
          >
            {authLoading ? (
              <Icons.spinner className="h-6 w-6 animate-spin text-black" />
            ) : (
              <Icons.google className="h-6 w-6" />
            )}
            Sign in with Google
          </Button>
        </div>

        {/* Footer info */}
        <div className="mt-8 text-xs text-neutral-500 text-center font-medium">
          Secure authentication powered by Google Cloud & Extension Identity APIs
        </div>
      </div>
    </div>
  );
}
