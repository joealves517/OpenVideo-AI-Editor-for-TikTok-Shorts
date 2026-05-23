import { emailOTPClient, magicLinkClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL:
    process.env.BETTER_AUTH_URL ||
    "https://openvideo-copilot-backend-676582412453.us-central1.run.app",
  plugins: [magicLinkClient(), emailOTPClient()],
});
