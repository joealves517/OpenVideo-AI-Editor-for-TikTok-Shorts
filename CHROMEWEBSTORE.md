# Chrome Web Store Listing — OpenVideo Copilot

> Last Updated: 2026-05-23

## Store Listing

**Extension Name** [REQUIRED]
OpenVideo - AI Editor for TikTok & Shorts

**Short Description** [REQUIRED]
Create viral TikToks, Shorts & Reels instantly. Features AI voiceovers, stock media, and a powerful timeline editor in your browser.

**Detailed Description** [REQUIRED]
OpenVideo Copilot is a state-of-the-art, high-performance web-based video editor that operates directly within your browser. By utilizing client-side WebCodecs and a robust PixiJS rendering engine, it delivers a smooth, low-latency, and desktop-grade editing workspace without requiring heavy uploads or cloud processing.

FEATURES
• Client-Side Rendering — Harnesses hardware-accelerated WebCodecs for efficient, instant frame encoding and decoding directly in your browser.
• Advanced PixiJS Engine — Features a premium 2D/3D composition workspace supporting multi-track timelines, rich layered structures, shapes, transforms, and real-time canvas preview.
• Universal Media Library — Import and edit video, audio, high-resolution images, texts, dynamic shapes, and captions seamlessly.
• AI Copilot Integration — Leverages Google Cloud-backed AI capabilities to assist you with transcription, automated edits, and smart video enhancements.
• Seamless Persistence & Sync — Automatically saves your timeline state locally and syncs projects seamlessly across your devices.

HOW TO USE
1. Click the OpenVideo Copilot extension icon in your Chrome toolbar.
2. Sign in using your Google account to initialize your personal workspace and cloud backup.
3. Import your media files (Videos, Audio, Images) directly into the client-side library.
4. Drag and drop clips onto the timeline, adjust layers, and use our precise timeline tools to crop, slice, and transform.
5. Utilize the AI Copilot panel to transcribe audio or ask for smart layout improvements.
6. Export your final master video file directly from the browser with ultra-fast rendering speeds.

PRIVACY
Your privacy is our priority. All video processing, composition, and rendering occur completely client-side inside your browser. Your local media files never leave your device unless you explicitly opt to sync assets. Authorized workspace metadata is secured and synced via Google Cloud.

PERMISSIONS
• "identity" — Required to authenticate via Google Sign-In to secure your projects and personalize your workspace.
• "storage" & "unlimitedStorage" — Required to cache heavy video timeline states, canvas assets, and temporary video buffers locally on your device without hitting storage quota limits.
• Access to "https://openvideo-copilot-backend-676582412453.us-central1.run.app" — Needed to connect with our Google Cloud API for AI operations, workspace backup, and project synchronization.

SUPPORT
Need assistance, found a bug, or want to suggest a feature? Please visit our GitHub repository or contact us at hello@openvideo.dev.

Version 1.0.1 — Initial launch of OpenVideo with full WebCodecs playback, PixiJS composition, Google Sign-in authentication, and AI Copilot integration.

**Category** [REQUIRED]
Productivity / Developer Tools

**Single Purpose** [REQUIRED]
A browser-based AI video editor that uses client-side rendering to create, edit, and export video projects.

**Primary Language** [REQUIRED]
English

---

## Graphics & Assets

| Asset | Dimensions | Status | Filename |
|-------|-----------|--------|----------|
| Store Icon [REQUIRED] | 128×128 PNG | ⬜ Not created | public/icon128.png |
| Screenshot 1 [REQUIRED] | 1280×800 or 640×400 | ⬜ Not created | |
| Screenshot 2 [RECOMMENDED] | 1280×800 or 640×400 | ⬜ Not created | |
| Screenshot 3 [RECOMMENDED] | 1280×800 or 640×400 | ⬜ Not created | |
| Small Promo Tile [RECOMMENDED] | 440×280 | ⬜ Not created | |

### Screenshot Notes
• Screenshot 1: The main editing timeline workspace showing a video clip playing in the preview canvas with active PixiJS transforms.
• Screenshot 2: The Google Sign-In popup and active synchronized project selector showing workspace state.
• Screenshot 3: The AI Copilot panel executing an audio transcription or timeline recommendation in real-time.

---

## Permissions Justification

The Chrome Web Store review team manually reads these declarations. Please copy-paste these exact justifications into your developer console:

| Permission | Type | Justification |
|------------|------|---------------|
| `identity` | permissions | Used to perform OAuth2 Google Sign-In authentication, allowing users to securely log in, verify their active account, and access their synced projects. |
| `storage` | permissions | Used to securely store user-facing UI configurations, theme states, and light session data locally on the client's device. |
| `unlimitedStorage` | permissions | Critical for client-side video composition. Needed to allow IndexedDB and the Origin Private File System (OPFS) to cache large chunks of decoded video frames and media assets without encountering browser quota exceptions. |
| `https://openvideo-copilot-backend-676582412453.us-central1.run.app/*` | host_permissions | Necessary to establish connection with our secure Google Cloud backend API for project synchronization, cloud storage presigning, and AI Copilot pipeline executions. |

---

## Privacy & Data Use

These declarations are required in the Chrome Developer Dashboard data disclosure form.

### Data Collection

**Does the extension collect user data?** Yes

| Data Type | Collected? | Transmitted Off-Device? | Purpose | Shared with Third Parties? |
|-----------|-----------|------------------------|---------|---------------------------|
| Authentication info | Yes | Yes (to Google Cloud API) | Used to authenticate user identity and sync workspace profiles. | No |
| User activity | Yes | Yes (to Google Cloud API) | Syncing the video project timeline state, layer structures, and editor configs. | No |
| Website content | No | No | Not collected. | No |
| Web history | No | No | Not collected. | No |

### Data Use Certification
- [x] Data is NOT sold to third parties.
- [x] Data is NOT used for purposes unrelated to the extension's core functionality.
- [x] Data is NOT used for creditworthiness or lending purposes.

---

## Privacy Policy

**Privacy Policy URL** [REQUIRED]
`https://openvideo.dev/privacy` (Ensure this URL is live and contains terms matching the disclosures above).

---

## Distribution

**Visibility**: Public
**Regions**: All regions
**Pricing**: Free

---

## Developer Info

**Publisher Name**: OpenVideoDev
**Contact Email**: hello@openvideo.dev
**Homepage URL**: `https://openvideo.dev`

---

## Version History

| Version | Date | Changes | Status |
|---------|------|---------|--------|
| 1.0.1 | 2026-05-23 | Initial submission of the extension. | Draft |
