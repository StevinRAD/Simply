/**
 * Simply Extension - Content Script
 * Handles page interaction and visual feedback for cookie injection
 */

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'COOKIES_INJECTED') {
    handleCookiesInjected(message.data);
    sendResponse({ success: true });
  } else if (message.type === 'CHECK_LOGIN_STATUS') {
    checkLoginStatus().then(status => {
      sendResponse({ status });
    });
    return true; // Keep channel open for async response
  }
});

/**
 * Show visual notification when cookies are injected
 */
function handleCookiesInjected(data) {
  const { serviceName, success, error } = data;
  
  if (success) {
    showNotification(`✓ ${serviceName} - Login otomatis berhasil`, 'success');
    
    // Auto-reload page after 1 second to apply cookies
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  } else {
    showNotification(`✗ ${serviceName} - Gagal inject cookies: ${error}`, 'error');
  }
}

/**
 * Check if user is already logged in to the service
 */
async function checkLoginStatus() {
  // Check common login indicators
  const indicators = {
    hasAuthCookie: document.cookie.includes('auth') || 
                    document.cookie.includes('session') || 
                    document.cookie.includes('token'),
    hasLogoutButton: !!document.querySelector('[href*="logout"], [href*="signout"], button[class*="logout"]'),
    hasLoginForm: !!document.querySelector('form[action*="login"], input[type="password"]'),
    hasUserMenu: !!document.querySelector('[class*="user-menu"], [class*="profile"], [class*="account"]')
  };
  
  // Determine login status based on indicators
  const isLoggedIn = (indicators.hasAuthCookie || indicators.hasLogoutButton || indicators.hasUserMenu) 
                     && !indicators.hasLoginForm;
  
  return {
    isLoggedIn,
    indicators,
    url: window.location.href
  };
}

/**
 * Show notification overlay
 */
function showNotification(message, type = 'info') {
  // Remove existing notification if any
  const existing = document.getElementById('simply-extension-notification');
  if (existing) {
    existing.remove();
  }
  
  // Create notification element
  const notification = document.createElement('div');
  notification.id = 'simply-extension-notification';
  notification.textContent = message;
  
  // Style based on type
  const styles = {
    position: 'fixed',
    top: '20px',
    right: '20px',
    padding: '16px 24px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    zIndex: '999999',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    animation: 'simply-slide-in 0.3s ease-out',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  };
  
  if (type === 'success') {
    styles.background = '#10b981';
    styles.color = '#ffffff';
  } else if (type === 'error') {
    styles.background = '#ef4444';
    styles.color = '#ffffff';
  } else {
    styles.background = '#3b82f6';
    styles.color = '#ffffff';
  }
  
  Object.assign(notification.style, styles);
  
  // Add animation keyframes
  if (!document.getElementById('simply-extension-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'simply-extension-styles';
    styleSheet.textContent = `
      @keyframes simply-slide-in {
        from {
          transform: translateX(400px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      @keyframes simply-slide-out {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(400px);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(styleSheet);
  }
  
  // Add to page
  document.body.appendChild(notification);
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    notification.style.animation = 'simply-slide-out 0.3s ease-out';
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 5000);
}

/**
 * Monitor page for login state changes
 */
function monitorLoginState() {
  let lastLoginState = null;
  
  const checkInterval = setInterval(async () => {
    const currentState = await checkLoginStatus();
    
    if (lastLoginState !== null && lastLoginState.isLoggedIn !== currentState.isLoggedIn) {
      // Login state changed
      chrome.runtime.sendMessage({
        type: 'LOGIN_STATE_CHANGED',
        data: {
          isLoggedIn: currentState.isLoggedIn,
          url: window.location.href
        }
      });
    }
    
    lastLoginState = currentState;
  }, 3000); // Check every 3 seconds
  
  // Stop monitoring after 30 seconds
  setTimeout(() => {
    clearInterval(checkInterval);
  }, 30000);
}

/**
 * Read Supabase session from localStorage (works on dashboard pages)
 */
function readSupabaseSession() {
  try {
    const sessionKey = Object.keys(localStorage).find(
      k => k.startsWith('sb-') && k.endsWith('-auth-token')
    );
    if (!sessionKey) return null;
    const raw = localStorage.getItem(sessionKey);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

/**
 * Send session to background script
 */
function syncSessionToBackground(session) {
  if (!session?.access_token) return;
  chrome.runtime.sendMessage(
    { action: 'setSession', session },
    (response) => {
      if (chrome.runtime.lastError) return;
      if (response?.success) {
        console.log('[Simply] Session synced to extension');
      }
    }
  );
}

/**
 * Check if current page is the Simply dashboard
 */
function isSimplyDashboard() {
  const host = window.location.hostname;
  const port = window.location.port;
  // Match localhost:3000 (dev) or production domain
  return (host === 'localhost' && port === '3000') ||
         host.includes('simply');
}

/**
 * Sync session from dashboard localStorage to extension
 */
function syncDashboardSession() {
  if (!isSimplyDashboard()) return;

  // Initial sync
  const session = readSupabaseSession();
  if (session) {
    syncSessionToBackground(session);
  }

  // Listen for storage changes from other tabs
  window.addEventListener('storage', (e) => {
    if (e.key && e.key.startsWith('sb-') && e.key.endsWith('-auth-token')) {
      if (e.newValue) {
        try {
          const newSession = JSON.parse(e.newValue);
          syncSessionToBackground(newSession);
        } catch (err) { /* ignore */ }
      } else {
        // Session removed = logout
        chrome.runtime.sendMessage({ action: 'logout' });
      }
    }
  });

  // Poll for session changes in same tab (storage event doesn't fire for same-tab changes)
  let lastToken = session?.access_token || null;
  const pollInterval = setInterval(() => {
    const current = readSupabaseSession();
    const currentToken = current?.access_token || null;
    if (currentToken !== lastToken) {
      lastToken = currentToken;
      if (current) {
        syncSessionToBackground(current);
      } else {
        chrome.runtime.sendMessage({ action: 'logout' });
      }
    }
  }, 3000);

  // Stop polling after 5 minutes to save resources
  setTimeout(() => clearInterval(pollInterval), 5 * 60 * 1000);
}

/**
 * Initialize content script
 */
function init() {
  // Sync session from dashboard
  syncDashboardSession();

  // Start monitoring login state (for service pages)
  monitorLoginState();
  
  // Send ready message to background
  chrome.runtime.sendMessage({
    type: 'CONTENT_SCRIPT_READY',
    data: {
      url: window.location.href,
      title: document.title
    }
  });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
