import "pixi.js/unsafe-eval";

/**
 * OpenVideo Copilot API Bootstrap
 *
 * Monkey patches window.fetch to automatically intercept ALL /api/* requests
 * and route them to the Google Cloud Run backend with OAuth credentials.
 *
 * Since the backend now maps 1:1 with the original Next.js API routes,
 * we simply prepend the Cloud Run base URL — no endpoint remapping needed.
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://openvideo-copilot-backend-676582412453.us-central1.run.app";

/**
 * Safely request the Google Identity OAuth Access Token.
 * Calls chrome.identity.getAuthToken directly inside Chrome Extension.
 * In dev server: falls back to localStorage mock token.
 */
async function getExtensionAuthToken(interactive = false): Promise<string | null> {
  const chromeObj = typeof window !== "undefined" ? (window as any).chrome : null;

  if (chromeObj && chromeObj.identity && chromeObj.identity.getAuthToken) {
    return new Promise((resolve) => {
      chromeObj.identity.getAuthToken({ interactive }, (token: string | undefined) => {
        const err = chromeObj.runtime?.lastError;
        if (err) {
          console.warn("[Bootstrap Auth] Direct Extension OAuth error:", err.message);
          resolve(null);
        } else {
          resolve(token || null);
        }
      });
    });
  }

  return null;
}

/**
 * Initialize Monkey Patching for window.fetch
 *
 * All /api/* requests are intercepted and routed to the Cloud Run backend.
 * The backend routes match the original Next.js API paths exactly:
 *   /api/chat/editor        → POST (Genkit AI chat with 16 tools)
 *   /api/chat/script-to-video → POST (Script-to-video flow)
 *   /api/transcribe          → POST (Google Cloud STT)
 *   /api/elevenlabs/voiceover → POST (Google Cloud TTS)
 *   /api/elevenlabs/music     → POST (Music generation)
 *   /api/elevenlabs/sfx       → POST (SFX generation)
 *   /api/pexels               → GET  (Pexels stock media proxy)
 *   /api/audio/music           → POST (Music search proxy)
 *   /api/audio/sfx             → POST (SFX search proxy)
 *   /api/projects              → CRUD (Firestore projects)
 *   /api/projects/:id          → GET/PATCH/DELETE
 *   /api/custom-presets        → GET/POST (Custom presets)
 *   /api/batch-export          → GET/POST (Batch export)
 *   /api/uploads/presign       → POST (GCS signed URLs)
 */
export function bootstrapApiFetcher() {
  if (typeof window === "undefined") return;
  if ((window as any).__api_bootstrapped) return;

  const originalFetch = window.fetch;

  window.fetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    let url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;

    const isExtensionOrigin = url.startsWith(window.location.origin) || !url.startsWith("http");
    const isBackendOrigin = url.startsWith(API_BASE_URL);
    const isApiCall = (isExtensionOrigin || isBackendOrigin) && url.includes("/api/");

    if (isApiCall) {
      // 1. Mock BetterAuth sign-out endpoint to satisfy authClient.signOut() locally
      if (url.includes("/api/auth/sign-out")) {
        console.log("[API-Intercept] Mocking sign-out for BetterAuth client");

        const chromeObj = typeof window !== "undefined" ? (window as any).chrome : null;
        if (chromeObj && chromeObj.identity && chromeObj.identity.getAuthToken) {
          try {
            chromeObj.identity.getAuthToken({ interactive: false }, (token: string | undefined) => {
              if (token) {
                chromeObj.identity.removeCachedAuthToken({ token }, () => {
                  console.log("[API-Intercept] Successfully removed cached Chrome Identity token");
                });
              }
            });
          } catch (e) {
            console.warn("[API-Intercept] Failed to clear extension token:", e);
          }
        }

        try {
          localStorage.removeItem("openvideo_auth");
          localStorage.removeItem("openvideo_user");
        } catch (e) {}

        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      // 2. Mock BetterAuth session endpoints to satisfy useSession() hook in the React frontend
      if (url.includes("/api/auth/get-session") || url.includes("/api/auth/session")) {
        console.log("[API-Intercept] Mocking session for BetterAuth client");

        // If user explicitly signed out, don't auto re-login
        try {
          if (localStorage.getItem("openvideo_signed_out") === "true") {
            console.log("[API-Intercept] User signed out — returning null session");
            return new Response(JSON.stringify(null), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            });
          }
        } catch {}

        const token = await getExtensionAuthToken();
        if (!token) {
          return new Response(JSON.stringify(null), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }

        try {
          const res = await originalFetch("https://www.googleapis.com/oauth2/v3/userinfo", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const profile = (await res.json()) as any;
            const mockSession = {
              user: {
                id: profile.sub,
                email: profile.email,
                emailVerified: profile.email_verified === true || profile.email_verified === "true",
                name: profile.name || profile.email.split("@")[0],
                image: profile.picture || "",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
              session: {
                id: "mock-session-id",
                userId: profile.sub,
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                token: token,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            };
            return new Response(JSON.stringify(mockSession), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            });
          }
        } catch (err) {
          console.error("[API-Intercept] Failed to fetch Google profile for mock session:", err);
        }

        return new Response(JSON.stringify(null), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      // 2. Redirect other API calls to the Cloud Run Backend
      const apiIndex = url.indexOf("/api/");
      const relativeApiPath = url.substring(apiIndex); // e.g. "/api/pexels?type=video"
      const absoluteUrl = `${API_BASE_URL}${relativeApiPath}`;
      // Don't log if it's already an absolute URL to avoid spam, but we still inject token
      if (!isBackendOrigin) {
        console.log(`[API-Intercept] ${url} -> ${absoluteUrl}`);
      }

      // Clone request configurations and prepare headers
      const newInit = { ...(init || {}) };
      const headers = new Headers(newInit.headers || {});

      // Inject Authorization Token
      const token = await getExtensionAuthToken();
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }

      newInit.headers = headers;

      try {
        const response = await originalFetch(absoluteUrl, newInit);

        // Monitor and log credit billing returned in headers
        const creditsDeducted = response.headers.get("X-Credits-Deducted");
        const remainingCredits = response.headers.get("X-Remaining-Credits");

        if (creditsDeducted) {
          console.log(
            `[Copilot-Billing] Spent: ${creditsDeducted} credits. Remaining: ${remainingCredits}`,
          );
        }

        if (!response.ok) {
          // Suppress 404 logs for project loads, as it is a normal and expected fallback behavior
          const isProject404 = response.status === 404 && absoluteUrl.includes("/api/projects/");
          if (!isProject404) {
            const clonedResponse = response.clone();
            const errText = await clonedResponse.text();
            console.warn(
              `[API-Intercept] Backend returned ${response.status} for ${absoluteUrl}:`,
              errText,
            );
          }
        }

        return response;
      } catch (err) {
        console.error(`[API-Intercept] Fetch to ${absoluteUrl} failed:`, err);
        throw err;
      }
    }

    // Pass other domains or absolute URLs through unchanged
    return originalFetch(input, init);
  };

  (window as any).__api_bootstrapped = true;
  console.log(`=================================================`);
  console.log(`  OpenVideo Copilot API Interceptor Active`);
  console.log(`  Cloud Run Base URL: ${API_BASE_URL}`);
  console.log(`  Intercepting: ALL /api/* requests`);
  console.log(`=================================================`);
}

// Auto bootstrap on import in client browser
if (typeof window !== "undefined") {
  bootstrapApiFetcher();
}
