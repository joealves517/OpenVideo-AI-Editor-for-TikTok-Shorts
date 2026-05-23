# Privacy Policy for OpenVideo - AI Editor for TikTok & Shorts

**Effective Date:** May 23, 2026

This Privacy Policy explains how **OpenVideo - AI Editor for TikTok & Shorts** ("we", "us", or "our") collects, uses, and protects your information when you use our Chrome Extension and associated web services. We are committed to ensuring your privacy is protected and strictly adhere to the Google Chrome Web Store Developer Program Policies.

---

## 1. Core Privacy Architecture: Client-Side First

OpenVideo is designed with a "client-side first" philosophy. The core video editing, rendering, and composition tasks utilizing WebCodecs and the PixiJS engine are executed **locally within your browser**. 

Your heavy media files (videos, high-resolution images, and local audio) are cached locally on your device using IndexedDB and the Origin Private File System (OPFS). **They are NOT automatically uploaded to our servers** unless you explicitly initiate an AI processing feature or cloud synchronization.

---

## 2. Information We Collect

To provide our services, we collect the following types of information:

### A. Authentication & Profile Information
When you sign in using Google OAuth2, we collect your:
*   **Email Address**
*   **Basic Profile Information** (Name and Profile Picture)
*   **Purpose:** To authenticate your identity securely, create your personal workspace, manage your AI generation credits, and allow you to sync your projects across devices.

### B. User-Generated Content & Project Data
*   **Project Metadata:** Timeline structures, layer configurations, and text elements (JSON format).
*   **Media for AI Processing:** If you use AI features (e.g., Speech-to-Text transcription, AI Voiceover generation, or AI Copilot chat), the specific text, audio segment, or prompt necessary to fulfill that action is securely transmitted to our backend.
*   **Purpose:** To save your project state for cross-device synchronization and to process advanced AI computations that cannot run locally.

### C. Technical Permissions
Our extension requests specific Chrome permissions strictly for functionality:
*   `identity`: For secure Google Sign-In.
*   `storage` & `unlimitedStorage`: To bypass standard browser quota limits so we can save large temporary video files, decoded frames, and project states locally on your hard drive.
*   `host_permissions` (`https://openvideo-copilot-backend-676582412453.us-central1.run.app/*`): To allow the extension to communicate securely with our Google Cloud backend for database syncing and AI processing.

---

## 3. How We Use Your Information

We use the collected information **exclusively for the core functionality** of the OpenVideo application:
1.  **To Provide and Maintain the Service:** Ensuring the editor works smoothly and your projects are saved.
2.  **To Power AI Features:** Communicating with backend APIs (such as Google Gemini, Deepgram, and ElevenLabs) to provide transcription, voiceovers, and intelligent editing suggestions.
3.  **To Manage Accounts:** Tracking AI credit usage (Free vs. Premium tiers) and preventing abuse.
4.  **Customer Support:** Responding to your inquiries or troubleshooting bugs.

**Strict Usage Guarantee:**
*   We **DO NOT** use your data for creditworthiness or lending purposes.
*   We **DO NOT** use your data for purposes unrelated to the extension's core functionality.

---

## 4. Data Sharing and Disclosure

We respect your privacy and enforce strict data-sharing limitations:

*   **No Sale of Data:** We **DO NOT** sell, rent, or trade your personal information or project data to third parties under any circumstances.
*   **Trusted Service Providers:** We securely share specific, minimal data payloads with trusted infrastructure providers solely to operate the service. This includes:
    *   **Google Cloud:** For database hosting (PostgreSQL), serverless backend (Cloud Run), and AI processing (Gemini).
    *   **Deepgram:** For Speech-to-Text transcription services.
    *   **ElevenLabs:** For Text-to-Speech (Voiceover) generation.
    *   **Pexels:** For searching stock media (using your text search queries).
*   **Legal Compliance:** We may disclose information if required by law or in response to valid requests by public authorities.

---

## 5. Data Security

We implement robust security measures to protect your data. All data transmitted between your browser and our backend is encrypted in transit using industry-standard HTTPS/TLS protocols. User authentication is handled securely via OAuth 2.0 standard tokens without us ever seeing your password.

---

## 6. Your Rights and Choices

You have full control over your data:
*   **Revoke Access:** You can revoke OpenVideo's access to your Google Account at any time via your Google Account Security settings.
*   **Uninstall:** You can remove the extension from Chrome at any time, which will instantly stop any local background processes.
*   **Data Deletion Request:** You have the right to request the complete deletion of your account, projects, and associated data from our servers. To do so, please contact us using the email below.

---

## 7. Changes to This Privacy Policy

We may update our Privacy Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons. We will notify you of any material changes by updating the "Effective Date" at the top of this document and, where appropriate, providing an in-app notification.

---

## 8. Contact Us

If you have any questions, concerns, or requests regarding this Privacy Policy or how your data is handled, please contact us at:

**Email:** Alvesoscar517@gmail.com
