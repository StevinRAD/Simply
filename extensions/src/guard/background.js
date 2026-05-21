// Simply Guard - Background Service Worker
// Memblokir extension cookie editor berbahaya
// Enkripsi AES-GCM 256-bit via crypto.js (importScripts)

// ── Import crypto module ──
importScripts("crypto.js");

const BLOCKED_EXTENSION_IDS = [
  "hlkenndednhfkekhgcdicdfddnkalmdm", // Cookie-Editor
  "fngmhnnpilhplaeedifhccceomclgfbg", // EditThisCookie
  "hdhngoamekjhmnpenphenpaiindoinpo", // Cookie Manager
  "gigiddbkofmmehoipndncpadfopebjfh", // Cookie AutoDelete
  "cclelndahbckbenkjhflpdbgdldlbecc", // Cookie Quick Manager
  "dhdgffkkebhmkfjojejmpbldmpobfkfo", // Cookies
];

// State
let guardActive = true;
let blockedExtensions = [];

// Initialize on install
chrome.runtime.onInstalled.addListener(async () => {
  console.log("Simply Guard installed");
  await checkAndBlockExtensions();
  await saveGuardStatus(true);
});

// Check on startup
chrome.runtime.onStartup.addListener(async () => {
  console.log("Simply Guard started");
  // Muat status guard dari storage terenkripsi
  const stored = await getEncrypted("guardActive");
  if (stored !== null) guardActive = stored;

  const storedBlocked = await getEncrypted("blockedExtensions");
  if (storedBlocked) blockedExtensions = storedBlocked;

  await checkAndBlockExtensions();
});

// Monitor extension changes
chrome.management.onInstalled.addListener(async (extensionInfo) => {
  console.log("Extension installed:", extensionInfo.name);
  if (BLOCKED_EXTENSION_IDS.includes(extensionInfo.id)) {
    await blockExtension(extensionInfo);
  }
});

chrome.management.onEnabled.addListener(async (extensionInfo) => {
  console.log("Extension enabled:", extensionInfo.name);
  if (BLOCKED_EXTENSION_IDS.includes(extensionInfo.id)) {
    await blockExtension(extensionInfo);
  }
});

// Main function: Check and block dangerous extensions
async function checkAndBlockExtensions() {
  try {
    const allExtensions = await chrome.management.getAll();
    blockedExtensions = [];

    for (const ext of allExtensions) {
      if (BLOCKED_EXTENSION_IDS.includes(ext.id) && ext.enabled) {
        await blockExtension(ext);
      }
    }

    // Simpan daftar blocked terenkripsi
    await setEncrypted("blockedExtensions", blockedExtensions);

    updateBadge();
  } catch (error) {
    console.error("Error checking extensions:", error);
  }
}

// Block a specific extension
async function blockExtension(extensionInfo) {
  try {
    await chrome.management.setEnabled(extensionInfo.id, false);

    blockedExtensions.push({
      id: extensionInfo.id,
      name: extensionInfo.name,
      blockedAt: new Date().toISOString()
    });

    console.log(`Blocked extension: ${extensionInfo.name}`);

    showNotification(
      "Extension Diblokir",
      `${extensionInfo.name} telah dinonaktifkan oleh Simply Guard untuk keamanan akun Anda.`
    );
  } catch (error) {
    console.error(`Failed to block extension ${extensionInfo.name}:`, error);
  }
}

// Save guard status terenkripsi
async function saveGuardStatus(active) {
  guardActive = active;
  await setEncrypted("guardActive", active);
  updateBadge();
}

// Update extension badge
function updateBadge() {
  if (guardActive) {
    chrome.action.setBadgeText({ text: "ON" });
    chrome.action.setBadgeBackgroundColor({ color: "#22c55e" });
  } else {
    chrome.action.setBadgeText({ text: "OFF" });
    chrome.action.setBadgeBackgroundColor({ color: "#ef4444" });
  }
}

// Show notification
function showNotification(title, message) {
  chrome.notifications.create({
    type: "basic",
    iconUrl: "icons/icon128.png",
    title: title,
    message: message,
    priority: 2
  });
}

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  (async () => {
    try {
      if (request.action === "getGuardStatus") {
        sendResponse({ active: guardActive, blockedExtensions });

      } else if (request.action === "pathBlocked") {
        showNotification(
          "Akses Diblokir",
          `Halaman ${request.path} diblokir untuk keamanan akun Anda.`
        );
        sendResponse({ success: true });
      }
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
  })();
  return true;
});

// Periodic check (every 5 minutes)
setInterval(checkAndBlockExtensions, 5 * 60 * 1000);

// Initial check
checkAndBlockExtensions();
