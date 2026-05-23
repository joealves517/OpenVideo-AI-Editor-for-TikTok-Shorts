/**
 * Chrome Extension sign out.
 *
 * Fully revokes the Google OAuth token, clears all local state,
 * then hard-navigates back to the login screen.
 */
export function signOutAndRedirect(): void {
  const chromeObj = typeof window !== "undefined" ? (window as any).chrome : null;

  // 1. Revoke + remove Chrome Identity token
  if (chromeObj?.identity?.getAuthToken) {
    try {
      chromeObj.identity.getAuthToken({ interactive: false }, (token: string | undefined) => {
        if (token) {
          // Revoke with Google servers so next login must re-authorize
          fetch(`https://accounts.google.com/o/oauth2/revoke?token=${token}`).catch(() => {});

          // Remove from Chrome's internal cache
          chromeObj.identity.removeCachedAuthToken({ token }, () => {});
        }
      });
    } catch {
      // best-effort
    }
  }

  // 2. Wipe all auth state
  try {
    localStorage.removeItem("openvideo_auth");
    localStorage.removeItem("openvideo_user");
    localStorage.setItem("openvideo_signed_out", "true");
  } catch {
    // ignore
  }

  // 3. Hard navigate to landing page
  window.location.href = window.location.origin + "/index.html";
}
