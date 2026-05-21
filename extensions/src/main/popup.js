/**
 * Simply Extension - Popup Script v2
 * Handles UI, service grouping, and account selection
 */

// ─── Constants ───
const DASHBOARD_URL = 'http://localhost:3000';

// Domain → display name
const DOMAIN_NAMES = {
  'netflix.com': 'Netflix',
  'spotify.com': 'Spotify',
  'youtube.com': 'YouTube Premium',
  'primevideo.com': 'Prime Video',
  'disneyplus.com': 'Disney+',
  'hulu.com': 'Hulu',
  'hbomax.com': 'HBO Max',
  'crunchyroll.com': 'Crunchyroll',
  'viu.com': 'Viu',
  'iqiyi.com': 'iQIYI',
  'wetv.vip': 'WeTV',
  'canva.com': 'Canva',
  'figma.com': 'Figma',
  'adobe.com': 'Adobe',
  'notion.so': 'Notion',
  'grammarly.com': 'Grammarly',
  'chatgpt.com': 'ChatGPT',
  'openai.com': 'OpenAI',
  'midjourney.com': 'Midjourney',
  'github.com': 'GitHub',
  'linkedin.com': 'LinkedIn',
};

// Domain → icon file (relative to extension root)
const DOMAIN_ICONS = {
  'netflix.com': 'icons/netflix.png',
};

// Domain → emoji fallback
const DOMAIN_EMOJIS = {
  'netflix.com': '🎬',
  'spotify.com': '🎵',
  'youtube.com': '▶️',
  'primevideo.com': '📺',
  'disneyplus.com': '🏰',
  'hulu.com': '📱',
  'hbomax.com': '🎭',
  'crunchyroll.com': '🍥',
  'viu.com': '📺',
  'iqiyi.com': '📺',
  'wetv.vip': '📺',
  'canva.com': '🎨',
  'figma.com': '🎨',
  'adobe.com': '🎨',
  'notion.so': '📝',
  'grammarly.com': '✍️',
  'chatgpt.com': '🤖',
  'openai.com': '🤖',
  'midjourney.com': '🖼️',
  'github.com': '💻',
  'linkedin.com': '💼',
};

// Domain → brand color
const DOMAIN_COLORS = {
  'netflix.com': '#e50914',
  'spotify.com': '#1db954',
  'youtube.com': '#ff0000',
  'primevideo.com': '#00a8e1',
  'disneyplus.com': '#113ccf',
  'hulu.com': '#1ce783',
  'hbomax.com': '#5822b4',
  'crunchyroll.com': '#f47521',
  'viu.com': '#1a73e8',
  'iqiyi.com': '#00be06',
  'wetv.vip': '#0052d9',
  'canva.com': '#00c4cc',
  'figma.com': '#f24e1e',
  'adobe.com': '#ff0000',
  'notion.so': '#ffffff',
  'grammarly.com': '#15c39a',
  'chatgpt.com': '#10a37f',
  'openai.com': '#10a37f',
  'midjourney.com': '#ffffff',
  'github.com': '#ffffff',
  'linkedin.com': '#0077b5',
};

// ─── State ───
let currentUser = null;
let allServices = [];
let serviceGroups = [];
let filteredGroups = [];
let searchQuery = '';

// ─── DOM Elements ───
const screens = {
  loading: document.getElementById('screen-loading'),
  auth: document.getElementById('screen-auth'),
  guard: document.getElementById('screen-guard'),
  error: document.getElementById('screen-error'),
  main: document.getElementById('screen-main'),
};

const els = {
  loginBtn: document.getElementById('login-btn'),
  downloadGuardBtn: document.getElementById('download-guard-btn'),
  retryBtn: document.getElementById('retry-btn'),
  refreshBtn: document.getElementById('refresh-btn'),
  logoutBtn: document.getElementById('logout-btn'),
  searchInput: document.getElementById('search-input'),
  servicesGrid: document.getElementById('services-grid'),
  emptyState: document.getElementById('empty-state'),
  userName: document.getElementById('user-name'),
  userPlan: document.getElementById('user-plan'),
  userAvatar: document.getElementById('user-avatar'),
  guardDot: document.getElementById('guard-dot'),
  errorTitle: document.getElementById('error-title'),
  errorMessage: document.getElementById('error-message'),
  footerDashboard: document.getElementById('footer-dashboard'),
  footerUpgrade: document.getElementById('footer-upgrade'),
  // Account panel
  accountOverlay: document.getElementById('account-overlay'),
  accountPanel: document.getElementById('account-panel'),
  panelClose: document.getElementById('panel-close'),
  panelName: document.getElementById('panel-name'),
  panelCount: document.getElementById('panel-count'),
  panelIconImg: document.getElementById('panel-icon-img'),
  panelIconEmoji: document.getElementById('panel-icon-emoji'),
  panelAccounts: document.getElementById('panel-accounts'),
};

// ─── Initialize ───
async function init() {
  try {
    showScreen('loading');

    // Set dashboard links
    els.loginBtn.href = `${DASHBOARD_URL}/login`;
    els.downloadGuardBtn.href = `${DASHBOARD_URL}/dashboard/downloads`;
    els.footerDashboard.href = `${DASHBOARD_URL}/dashboard`;
    els.footerUpgrade.href = `${DASHBOARD_URL}/dashboard/plan`;

    // Check guard
    const guardStatus = await sendMessage({ type: 'CHECK_GUARD' });
    if (!guardStatus || !guardStatus.installed) {
      showScreen('guard');
      return;
    }

    // Check session
    const session = await sendMessage({ type: 'GET_SESSION' });
    if (!session || !session.user) {
      showScreen('auth');
      return;
    }

    currentUser = session.user;

    // Load services
    const servicesData = await sendMessage({ type: 'GET_SERVICES' });
    allServices = servicesData?.services || [];

    // Group services by domain
    serviceGroups = groupServicesByDomain(allServices);
    filteredGroups = serviceGroups;

    // Render
    renderUserInfo();
    renderServices();
    updateGuardDot(true);

    showScreen('main');
  } catch (error) {
    console.error('Init error:', error);
    showError('Gagal Memuat', error.message || 'Terjadi kesalahan');
  }
}

// ─── Service Grouping ───
function groupServicesByDomain(services) {
  const groups = {};

  for (const service of services) {
    // Extract base domain for grouping
    const domain = service.domain || 'unknown';
    const key = getBaseDomain(domain);

    if (!groups[key]) {
      groups[key] = {
        domain: key,
        displayName: getDisplayName(key),
        icon: DOMAIN_ICONS[key] || null,
        emoji: DOMAIN_EMOJIS[key] || '📦',
        color: DOMAIN_COLORS[key] || '#6366f1',
        accounts: [],
        status: 'active',
        planRequired: 'free',
      };
    }

    groups[key].accounts.push(service);

    // Use highest plan requirement
    const planHierarchy = { free: 0, starter: 1, plus: 2, max: 3 };
    if (planHierarchy[service.plan_required] > planHierarchy[groups[key].planRequired]) {
      groups[key].planRequired = service.plan_required;
    }
  }

  return Object.values(groups).sort((a, b) => a.displayName.localeCompare(b.displayName));
}

function getBaseDomain(domain) {
  // Remove www. and subdomains, keep base domain
  return domain.replace(/^(www\.)?/, '').toLowerCase();
}

function getDisplayName(domain) {
  return DOMAIN_NAMES[domain] || domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1);
}

// ─── Render ───
function renderUserInfo() {
  if (!currentUser) return;

  const name = currentUser.full_name || currentUser.email || 'User';
  const plan = currentUser.plan || 'free';

  els.userName.textContent = name;
  els.userPlan.textContent = plan;
  els.userAvatar.textContent = name[0].toUpperCase();

  // Plan badge color
  els.userPlan.className = `plan-badge plan-${plan}`;
}

function renderServices() {
  const grid = els.servicesGrid;
  grid.innerHTML = '';

  if (filteredGroups.length === 0) {
    grid.classList.add('hidden');
    els.emptyState.classList.remove('hidden');
    return;
  }

  grid.classList.remove('hidden');
  els.emptyState.classList.add('hidden');

  for (const group of filteredGroups) {
    const card = createServiceCard(group);
    grid.appendChild(card);
  }
}

function createServiceCard(group) {
  const card = document.createElement('div');
  card.className = 'service-card';

  // Check access
  const canAccess = checkAccess(group.planRequired);
  if (!canAccess) {
    card.classList.add('locked');
  }

  // Icon
  const iconWrap = document.createElement('div');
  iconWrap.className = 'svc-icon-wrap';
  iconWrap.style.background = `${group.color}20`;

  if (group.icon) {
    const img = document.createElement('img');
    img.className = 'svc-icon-img';
    img.src = chrome.runtime.getURL(group.icon);
    img.alt = group.displayName;
    img.onerror = () => {
      img.style.display = 'none';
      const emoji = document.createElement('span');
      emoji.className = 'svc-icon-emoji';
      emoji.textContent = group.emoji;
      iconWrap.appendChild(emoji);
    };
    iconWrap.appendChild(img);
  } else {
    const emoji = document.createElement('span');
    emoji.className = 'svc-icon-emoji';
    emoji.textContent = group.emoji;
    iconWrap.appendChild(emoji);
  }

  // Name
  const name = document.createElement('div');
  name.className = 'svc-name';
  name.textContent = group.displayName;

  // Meta (count + status)
  const meta = document.createElement('div');
  meta.className = 'svc-meta';

  const accountCount = group.accounts.length;
  if (accountCount > 1) {
    const countBadge = document.createElement('span');
    countBadge.className = 'svc-count';
    countBadge.textContent = `${accountCount} akun`;
    meta.appendChild(countBadge);
  }

  const statusBadge = document.createElement('span');
  statusBadge.className = 'svc-status active';
  statusBadge.textContent = canAccess ? 'Active' : 'Locked';
  if (!canAccess) statusBadge.className = 'svc-status locked';
  meta.appendChild(statusBadge);

  // Lock icon
  if (!canAccess) {
    const lock = document.createElement('span');
    lock.className = 'svc-lock';
    lock.textContent = '🔒';
    card.appendChild(lock);
  }

  card.appendChild(iconWrap);
  card.appendChild(name);
  card.appendChild(meta);

  // Click handler
  if (canAccess) {
    card.addEventListener('click', () => handleServiceClick(group));
  }

  return card;
}

// ─── Service Click Handler ───
function handleServiceClick(group) {
  const accounts = group.accounts.filter(a => a.status === 'active');

  if (accounts.length === 0) {
    return;
  }

  if (accounts.length === 1) {
    // Single account → open directly
    openAccount(accounts[0]);
  } else {
    // Multiple accounts → show panel
    showAccountPanel(group, accounts);
  }
}

// ─── Account Panel ───
function showAccountPanel(group, accounts) {
  // Set panel info
  els.panelName.textContent = group.displayName;
  els.panelCount.textContent = `${accounts.length} akun tersedia`;

  // Set icon
  if (group.icon) {
    els.panelIconImg.src = chrome.runtime.getURL(group.icon);
    els.panelIconImg.classList.remove('hidden');
    els.panelIconEmoji.classList.add('hidden');
  } else {
    els.panelIconEmoji.textContent = group.emoji;
    els.panelIconEmoji.classList.remove('hidden');
    els.panelIconImg.classList.add('hidden');
  }

  // Render accounts
  els.panelAccounts.innerHTML = '';
  accounts.forEach((account, index) => {
    const item = createAccountItem(account, index + 1);
    els.panelAccounts.appendChild(item);
  });

  // Show overlay
  els.accountOverlay.classList.remove('hidden');
}

function hideAccountPanel() {
  els.accountOverlay.classList.add('hidden');
}

function createAccountItem(account, number) {
  const item = document.createElement('div');
  item.className = 'account-item';

  // Number badge
  const num = document.createElement('div');
  num.className = 'account-num';
  num.textContent = number;

  // Info
  const info = document.createElement('div');
  info.className = 'account-info';

  const name = document.createElement('div');
  name.className = 'account-name';
  name.textContent = account.name || `Akun ${number}`;

  const desc = document.createElement('div');
  desc.className = 'account-desc';
  desc.textContent = account.description || 'Klik untuk masuk';

  info.appendChild(name);
  info.appendChild(desc);

  // Arrow
  const arrow = document.createElement('span');
  arrow.className = 'account-arrow';
  arrow.textContent = '→';

  item.appendChild(num);
  item.appendChild(info);
  item.appendChild(arrow);

  // Click handler
  item.addEventListener('click', () => {
    item.classList.add('loading');
    openAccount(account);
  });

  return item;
}

// ─── Open Account (inject cookies) ───
async function openAccount(service) {
  try {
    const response = await sendMessage({
      type: 'OPEN_SERVICE',
      data: { serviceId: service.id }
    });

    if (response?.success) {
      // Close popup after success
      window.close();
    } else {
      alert(response?.error || 'Gagal membuka service. Coba lagi.');
    }
  } catch (error) {
    console.error('Error opening account:', error);
    alert('Terjadi kesalahan. Silakan coba lagi.');
  }
}

// ─── Access Check ───
function checkAccess(requiredPlan) {
  if (!currentUser) return false;
  const userPlan = currentUser.plan || 'free';
  const hierarchy = { free: 0, starter: 1, plus: 2, max: 3 };
  return (hierarchy[userPlan] || 0) >= (hierarchy[requiredPlan] || 0);
}

// ─── Search ───
function handleSearch() {
  searchQuery = els.searchInput.value.trim().toLowerCase();

  if (!searchQuery) {
    filteredGroups = serviceGroups;
  } else {
    filteredGroups = serviceGroups.filter(group =>
      group.displayName.toLowerCase().includes(searchQuery) ||
      group.domain.toLowerCase().includes(searchQuery) ||
      group.accounts.some(a => (a.name || '').toLowerCase().includes(searchQuery))
    );
  }

  renderServices();
}

// ─── Guard Dot ───
function updateGuardDot(active) {
  if (active) {
    els.guardDot.classList.add('active');
    els.guardDot.title = 'Simply Guard Aktif';
  } else {
    els.guardDot.classList.remove('active');
    els.guardDot.title = 'Simply Guard Tidak Aktif';
  }
}

// ─── Screen Management ───
function showScreen(name) {
  Object.values(screens).forEach(s => s.classList.add('hidden'));
  if (screens[name]) screens[name].classList.remove('hidden');
}

function showError(title, message) {
  els.errorTitle.textContent = title;
  els.errorMessage.textContent = message;
  showScreen('error');
}

// ─── Message Helper ───
function sendMessage(msg) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(msg, (response) => {
      if (chrome.runtime.lastError) {
        resolve(null);
      } else {
        resolve(response);
      }
    });
  });
}

// ─── Event Listeners ───
els.searchInput.addEventListener('input', handleSearch);

els.refreshBtn.addEventListener('click', () => {
  els.refreshBtn.classList.add('spinning');
  setTimeout(() => els.refreshBtn.classList.remove('spinning'), 600);
  init();
});

els.logoutBtn.addEventListener('click', () => {
  if (confirm('Yakin ingin logout?')) {
    sendMessage({ action: 'logout' }).then(() => {
      showScreen('auth');
    });
  }
});

els.panelClose.addEventListener('click', hideAccountPanel);

els.accountOverlay.addEventListener('click', (e) => {
  if (e.target === els.accountOverlay) {
    hideAccountPanel();
  }
});

els.retryBtn.addEventListener('click', init);

// ─── Start ───
document.addEventListener('DOMContentLoaded', init);
