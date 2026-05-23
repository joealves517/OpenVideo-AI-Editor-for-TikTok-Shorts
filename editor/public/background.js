/**
 * OpenVideo Copilot Background Service Worker (Manifest V3)
 * Manages full-page application tab and handles OAuth authentication tokens.
 */

// Handle extension icon click to open the editor in a full tab
chrome.action.onClicked.addListener(async () => {
  const extensionOrigin = chrome.runtime.getURL(""); // Returns "chrome-extension://<id>/"
  const indexUrl = chrome.runtime.getURL("index.html");

  // Check if any extension tab (across all sub-pages) is already open
  const tabs = await chrome.tabs.query({ url: `${extensionOrigin}*` });

  if (tabs.length > 0) {
    // Focus the existing editor tab
    chrome.tabs.update(tabs[0].id, { active: true });
    chrome.windows.update(tabs[0].windowId, { focused: true });
  } else {
    // Open a new editor tab with index.html
    chrome.tabs.create({ url: indexUrl });
  }
});

// Listener for authenticating Google Identity via chrome.identity
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "GET_AUTH_TOKEN") {
    chrome.identity.getAuthToken({ interactive: true }, (token) => {
      if (chrome.runtime.lastError) {
        console.error("[Background Auth] Error getting token:", chrome.runtime.lastError);
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        console.log("[Background Auth] Token acquired successfully");
        sendResponse({ success: true, token });
      }
    });
    return true; // Keep message channel open for async response
  }

  if (request.action === "CLEAR_AUTH_TOKEN") {
    const token = request.token;
    if (token) {
      chrome.identity.removeCachedAuthToken({ token }, () => {
        sendResponse({ success: true });
      });
      return true;
    }
  }
});
