// Simply Guard - Content Script
// Menampilkan notifikasi visual saat path diblokir

const BLOCKED_PATHS = [
  "/tv2",
  "/account",
  "/youraccount",
  "/profiles/manage",
  "/manageprofiles",
  "/profiles/transfer",
  "/security",
  "/password",
  "/email",
  "/billing",
];

// Check if current path is blocked
function isPathBlocked() {
  const currentPath = window.location.pathname;
  return BLOCKED_PATHS.some(blockedPath => currentPath.startsWith(blockedPath));
}

// Show visual notification
function showBlockedNotification() {
  // Remove existing notification if any
  const existing = document.getElementById("simply-guard-notification");
  if (existing) existing.remove();

  // Create notification element
  const notification = document.createElement("div");
  notification.id = "simply-guard-notification";
  notification.innerHTML = `
    <div style="
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #ef4444, #dc2626);
      color: white;
      padding: 16px 20px;
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      max-width: 350px;
      animation: slideIn 0.3s ease-out;
    ">
      <div style="display: flex; align-items: center; gap: 12px;">
        <div style="
          width: 40px;
          height: 40px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
        ">🛡️</div>
        <div style="flex: 1;">
          <div style="font-weight: 600; margin-bottom: 4px;">Akses Diblokir</div>
          <div style="font-size: 12px; opacity: 0.9;">
            Halaman ini diblokir oleh Simply Guard untuk keamanan akun Anda.
          </div>
        </div>
      </div>
    </div>
    <style>
      @keyframes slideIn {
        from {
          transform: translateX(400px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
    </style>
  `;

  document.body.appendChild(notification);

  // Auto remove after 5 seconds
  setTimeout(() => {
    notification.style.animation = "slideOut 0.3s ease-in";
    setTimeout(() => notification.remove(), 300);
  }, 5000);

  // Notify background script
  chrome.runtime.sendMessage({
    action: "pathBlocked",
    path: window.location.pathname
  });
}

// Monitor URL changes (for SPA navigation)
let lastPath = window.location.pathname;

function checkPath() {
  const currentPath = window.location.pathname;
  
  if (currentPath !== lastPath) {
    lastPath = currentPath;
    
    if (isPathBlocked()) {
      showBlockedNotification();
      // Redirect to browse page after a short delay
      setTimeout(() => {
        window.location.href = "https://www.netflix.com/browse";
      }, 2000);
    }
  }
}

// Initial check
if (isPathBlocked()) {
  showBlockedNotification();
  setTimeout(() => {
    window.location.href = "https://www.netflix.com/browse";
  }, 2000);
}

// Monitor for URL changes (SPA navigation)
setInterval(checkPath, 500);

// Also monitor history changes
const originalPushState = history.pushState;
const originalReplaceState = history.replaceState;

history.pushState = function(...args) {
  originalPushState.apply(this, args);
  checkPath();
};

history.replaceState = function(...args) {
  originalReplaceState.apply(this, args);
  checkPath();
};

window.addEventListener("popstate", checkPath);

console.log("Simply Guard active - protecting your account");
