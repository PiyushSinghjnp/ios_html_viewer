/**
 * Mock Test Viewer — Main Application (app.js)
 * Targets iPhone 15 (Safari iOS 17+, 393x852 pt, DPR 3, Standalone & Tab)
 */

import {
  initDB,
  getAllTests,
  getTestById,
  getTestByName,
  saveTest,
  deleteTest,
  renameTest,
  updateTestLastOpened,
  clearAllTests,
  getStorageStats,
  formatBytes,
  isStoragePersisted
} from './db.js';

// DOM Elements
const elements = {
  appShell: document.getElementById('app-shell'),
  mainHeader: document.getElementById('main-header'),
  btnThemeToggle: document.getElementById('btn-theme-toggle'),
  btnSettings: document.getElementById('btn-settings'),
  btnAddTest: document.getElementById('btn-add-test'),
  themeIcon: document.getElementById('theme-icon'),
  metaThemeColor: document.getElementById('meta-theme-color'),
  selectTheme: document.getElementById('select-theme'),

  // Views
  viewLibrary: document.getElementById('view-library'),
  viewReader: document.getElementById('view-reader'),
  emptyState: document.getElementById('empty-state'),
  testList: document.getElementById('test-list'),
  libraryControls: document.getElementById('library-controls'),
  storageBanner: document.getElementById('storage-banner'),
  inputSearch: document.getElementById('input-search'),
  btnClearSearch: document.getElementById('btn-clear-search'),
  selectSort: document.getElementById('select-sort'),
  testCountLabel: document.getElementById('test-count-label'),

  // Settings
  settingsTestCount: document.getElementById('settings-test-count'),
  settingsStorageSize: document.getElementById('settings-storage-size'),
  settingsPersistStatus: document.getElementById('settings-persist-status'),
  settingsOfflineStatus: document.getElementById('settings-offline-status'),
  btnExportBackup: document.getElementById('btn-export-backup'),
  btnImportBackup: document.getElementById('btn-import-backup'),
  backupFilePicker: document.getElementById('backup-file-picker'),

  // Offline status badge
  offlineBadge: document.getElementById('offline-badge'),
  offlineStatusText: document.getElementById('offline-status-text'),

  // Reader Controls
  btnReaderBack: document.getElementById('btn-reader-back'),
  btnReaderRestart: document.getElementById('btn-reader-restart'),
  readerTitle: document.getElementById('reader-title'),
  testIframe: document.getElementById('test-iframe'),

  // Sheets & Modals
  sheetImport: document.getElementById('sheet-import'),
  btnCloseImportSheet: document.getElementById('btn-close-import-sheet'),
  sheetSettings: document.getElementById('sheet-settings'),
  btnCloseSettingsSheet: document.getElementById('btn-close-settings-sheet'),
  modalContainer: document.getElementById('modal-container'),
  modalTitle: document.getElementById('modal-title'),
  modalBody: document.getElementById('modal-body'),
  modalActions: document.getElementById('modal-actions'),
  toastContainer: document.getElementById('toast-container'),

  // Import Action Elements
  btnEmptyImport: document.getElementById('btn-empty-import'),
  btnEmptyPaste: document.getElementById('btn-empty-paste'),
  btnSheetPickFiles: document.getElementById('btn-sheet-pick-files'),
  filePicker: document.getElementById('file-picker'),
  formPasteHtml: document.getElementById('form-paste-html'),
  pasteTestName: document.getElementById('paste-test-name'),
  pasteTestHtml: document.getElementById('paste-test-html')
};

// Global App State
let currentTests = [];
let activeTestId = null;
let wakeLockSentinel = null;
let searchQuery = '';
let sortPreference = localStorage.getItem('mocktest_sort_pref') || 'recent';
let isDeleteInProgress = false;
let isRenameInProgress = false;
let isImportInProgress = false;
let currentModalResolver = null;

/* ==========================================================================
   Theme Management (Light / Dark / Auto)
   ========================================================================== */
const THEME_STORAGE_KEY = 'mock_viewer_theme';

export function getPreferredTheme() {
  const saved = localStorage.getItem(THEME_STORAGE_KEY);
  if (saved === 'light' || saved === 'dark' || saved === 'auto') {
    return saved;
  }
  return 'auto';
}

export function applyTheme(theme) {
  const root = document.documentElement;
  
  if (theme === 'auto') {
    root.removeAttribute('data-theme');
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    elements.metaThemeColor.setAttribute('content', isDark ? '#090d16' : '#f8fafc');
  } else if (theme === 'dark') {
    root.setAttribute('data-theme', 'dark');
    elements.metaThemeColor.setAttribute('content', '#090d16');
  } else if (theme === 'light') {
    root.setAttribute('data-theme', 'light');
    elements.metaThemeColor.setAttribute('content', '#f8fafc');
  }

  if (elements.selectTheme) {
    elements.selectTheme.value = theme;
  }

  updateThemeIcon(theme);
}

function updateThemeIcon(theme) {
  if (!elements.themeIcon) return;
  const isDarkActive = theme === 'dark' || (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  
  if (isDarkActive) {
    elements.themeIcon.innerHTML = `
      <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0s-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0s-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41l-1.06-1.06zm1.06-10.96c.39-.39.39-1.03 0-1.41s-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06c.39-.39.39-1.03 0-1.41s-1.03-.39-1.41 0z"/>
    `;
  } else {
    elements.themeIcon.innerHTML = `
      <path d="M12.3 2a10 10 0 0 0-.19 14 9.92 9.92 0 0 0 7.89 4 10.06 10.06 0 0 0 3.95-.81 1 1 0 0 0 .5-1.31 1 1 0 0 0-1-.59A8 8 0 0 1 12 4.1a8.16 8.16 0 0 1 1.47.13 1 1 0 0 0 1.13-.7 1 1 0 0 0-.46-1.22A9.87 9.87 0 0 0 12.3 2z"/>
    `;
  }
}

export function toggleTheme() {
  const current = getPreferredTheme();
  let next = 'dark';
  if (current === 'auto') {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    next = isDark ? 'light' : 'dark';
  } else if (current === 'dark') {
    next = 'light';
  } else {
    next = 'dark';
  }
  localStorage.setItem(THEME_STORAGE_KEY, next);
  applyTheme(next);
  showToast(`Switched to ${next} theme`, 'info');
}

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  if (getPreferredTheme() === 'auto') {
    applyTheme('auto');
  }
});

/* ==========================================================================
   Toast Notification System
   ========================================================================== */
export function showToast(message, type = 'info', duration = 3000) {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.setAttribute('role', 'status');
  toast.textContent = message;

  elements.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
    setTimeout(() => toast.remove(), 200);
  }, duration);
}

/* ==========================================================================
   In-App Modal Dialog System (Replacing alert/confirm/prompt)
   ========================================================================== */
export function showModal({ title, body, buttons = [] }) {
  if (currentModalResolver) {
    currentModalResolver(null);
    currentModalResolver = null;
  }

  return new Promise((resolve) => {
    currentModalResolver = resolve;

    elements.modalTitle.textContent = title;
    if (typeof body === 'string') {
      elements.modalBody.innerHTML = body;
    } else if (body instanceof HTMLElement) {
      elements.modalBody.innerHTML = '';
      elements.modalBody.appendChild(body);
    }
    
    elements.modalActions.innerHTML = '';

    buttons.forEach((btnConfig) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = btnConfig.className || 'btn-secondary';
      btn.textContent = btnConfig.text;
      if (btnConfig.id) btn.id = btnConfig.id;
      btn.addEventListener('click', async () => {
        if (typeof btnConfig.onClick === 'function') {
          const proceed = await btnConfig.onClick();
          if (proceed === false) return;
        }
        const val = btnConfig.value !== undefined ? btnConfig.value : btnConfig.text;
        closeModal(val);
      });
      elements.modalActions.appendChild(btn);
    });

    elements.modalContainer.classList.add('active');
    elements.modalContainer.setAttribute('aria-hidden', 'false');
  });
}

export function closeModal(resolutionValue = null) {
  elements.modalContainer.classList.remove('active');
  elements.modalContainer.setAttribute('aria-hidden', 'true');
  if (currentModalResolver) {
    const res = currentModalResolver;
    currentModalResolver = null;
    res(resolutionValue);
  }
}

/* ==========================================================================
   Action Sheets (Import & Settings)
   ========================================================================== */
export function openSheet(sheetElement) {
  sheetElement.classList.add('active');
  sheetElement.setAttribute('aria-hidden', 'false');
}

export function closeSheet(sheetElement) {
  sheetElement.classList.remove('active');
  sheetElement.setAttribute('aria-hidden', 'true');
}

/* ==========================================================================
   View Switching (Library <-> Reader)
   ========================================================================== */
export function switchView(target) {
  if (target === 'reader') {
    document.body.classList.add('in-reader');
    if (elements.mainHeader) elements.mainHeader.classList.add('hidden');
    elements.viewLibrary.classList.remove('active');
    elements.viewReader.classList.add('active');
  } else {
    document.body.classList.remove('in-reader');
    if (elements.mainHeader) elements.mainHeader.classList.remove('hidden');
    elements.viewReader.classList.remove('active');
    elements.viewLibrary.classList.add('active');
  }
}

/* ==========================================================================
   Patch-on-Open & Safety Injection
   ========================================================================== */
/**
 * In-memory patch injected right after <head>
 * Original test HTML in IndexedDB is never modified.
 */
export function patchTestHtml(originalHtml) {
  if (!originalHtml) return '';

  const patchBlock = `
  <!-- Mock Test Viewer Patch-on-Open -->
  <style id="viewer-patch-styles">
    /* Fix dashboard box 400px overflow on iPhone 15 (393pt screen) */
    .box, .wc {
      max-width: 92vw !important;
      width: auto !important;
      box-sizing: border-box !important;
    }
    /* Smooth iOS scrolling & strict height locking */
    html, body {
      height: 100% !important;
      max-height: 100% !important;
      margin: 0 !important;
      padding: 0 !important;
      overflow: hidden !important;
      -webkit-overflow-scrolling: touch !important;
      overscroll-behavior-y: contain !important;
    }
    #app {
      height: 100% !important;
      max-height: 100% !important;
      width: 100% !important;
      position: absolute !important;
      inset: 0 !important;
      display: flex !important;
      flex-direction: column !important;
      overflow: hidden !important;
    }
    .th {
      flex-shrink: 0 !important;
      height: 38px !important;
      min-height: 38px !important;
      padding: 0 10px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
    }
    .ht {
      font-size: 13px !important;
      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
    }
    .hl img {
      width: 75px !important;
      height: auto !important;
    }
    #mc {
      flex: 1 1 0 !important;
      height: auto !important;
      min-height: 0 !important;
      max-height: 100% !important;
      width: 100% !important;
      display: flex !important;
      overflow: hidden !important;
      position: relative !important;
    }
    #left-panel {
      flex: 1 1 0 !important;
      height: 100% !important;
      min-height: 0 !important;
      display: flex !important;
      flex-direction: column !important;
      overflow: hidden !important;
      width: 100% !important;
    }
    #slim-header {
      flex-shrink: 0 !important;
      min-height: 34px !important;
      height: auto !important;
      padding: 6px 12px !important;
    }
    #qop-container {
      flex: 1 1 0 !important;
      min-height: 0 !important;
      height: auto !important;
      overflow-y: auto !important;
      -webkit-overflow-scrolling: touch !important;
    }
    .split-left {
      overflow-y: auto !important;
      -webkit-overflow-scrolling: touch !important;
      box-sizing: border-box !important;
    }
    .split-mid {
      overflow-y: auto !important;
      -webkit-overflow-scrolling: touch !important;
      box-sizing: border-box !important;
    }
    .bar {
      flex-shrink: 0 !important;
      min-height: 48px !important;
      height: auto !important;
      z-index: 25 !important;
      background: #f9f9f9 !important;
      border-top: 1px solid #e0e0e0 !important;
      padding: 6px 10px !important;
      padding-bottom: max(6px, env(safe-area-inset-bottom, 0px)) !important;
      box-sizing: border-box !important;
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
    }
    @media (max-width: 768px) {
      .th {
        height: 32px !important;
        min-height: 32px !important;
        padding: 0 8px !important;
        justify-content: center !important;
      }
      .header-title-container { display: none !important; }
      .fb { display: none !important; }
      .bar {
        padding: 6px 8px !important;
        gap: 4px !important;
        flex-direction: column !important;
      }
      #aBL, #aBR {
        width: 100% !important;
        display: flex !important;
        gap: 5px !important;
        justify-content: space-between !important;
      }
      .ob {
        padding: 7px 4px !important;
        font-size: 11.5px !important;
      }
      #qop-container {
        display: block !important;
        overflow-y: auto !important;
      }
      .split-left {
        max-width: 100% !important;
        width: 100% !important;
        flex: none !important;
        border-right: none !important;
        border-bottom: 2px dashed #cbd5e1 !important;
        padding: 10px 12px !important;
        overflow-y: visible !important;
      }
      .split-mid {
        max-width: 100% !important;
        width: 100% !important;
        flex: none !important;
        padding: 10px 12px !important;
        overflow-y: visible !important;
      }
    }
  </style>
  <script id="viewer-patch-scripts">
    (function() {
      // Stub documentElement.requestFullscreen for iPhone Safari
      if (!document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen = function() {
          return Promise.resolve();
        };
      }
      if (!document.requestFullscreen) {
        document.requestFullscreen = function() {
          return Promise.resolve();
        };
      }
      if (!document.exitFullscreen) {
        document.exitFullscreen = function() {
          return Promise.resolve();
        };
      }

      // Non-blocking safe stubs for alert, confirm, prompt to prevent Safari UI freezes
      window.alert = function(msg) {
        console.log('[Test Alert]', msg);
        try {
          if (window.parent && typeof window.parent.showToast === 'function') {
            window.parent.showToast(String(msg), 'info', 4000);
          }
        } catch (e) {}
      };

      window.confirm = function(msg) {
        console.log('[Test Confirm - auto accepted]', msg);
        return true;
      };

      window.prompt = function(msg, defaultText) {
        console.log('[Test Prompt - default returned]', msg);
        return defaultText || '';
      };
    })();
  <\/script>
  `;

  // Inject right after <head> or <head ...>
  if (/<head[^>]*>/i.test(originalHtml)) {
    return originalHtml.replace(/(<head[^>]*>)/i, `$1\n${patchBlock}`);
  }

  // Fallback: prepend if no <head> tag exists
  return patchBlock + '\n' + originalHtml;
}

/**
 * Trigger window.saveProgress() inside the test iframe safely
 */
function callSaveProgress() {
  try {
    if (elements.testIframe && elements.testIframe.contentWindow) {
      if (typeof elements.testIframe.contentWindow.saveProgress === 'function') {
        elements.testIframe.contentWindow.saveProgress();
        console.log('[Reader] saveProgress() invoked successfully');
      }
    }
  } catch (err) {
    console.warn('[Reader] saveProgress() invocation error:', err);
  }
}

/* ==========================================================================
   Screen Wake Lock Management
   ========================================================================== */
async function acquireWakeLock() {
  if ('wakeLock' in navigator) {
    try {
      if (wakeLockSentinel) {
        await releaseWakeLock();
      }
      wakeLockSentinel = await navigator.wakeLock.request('screen');
      wakeLockSentinel.addEventListener('release', () => {
        console.log('[WakeLock] Screen wake lock released');
        wakeLockSentinel = null;
      });
      console.log('[WakeLock] Screen wake lock active');
    } catch (err) {
      console.warn('[WakeLock] Request failed:', err);
    }
  }
}

async function releaseWakeLock() {
  if (wakeLockSentinel) {
    try {
      await wakeLockSentinel.release();
    } catch (err) {
      console.warn('[WakeLock] Release error:', err);
    }
    wakeLockSentinel = null;
  }
}

/* ==========================================================================
   HTML Parsing & Normalization
   ========================================================================== */
export function normalizeHtml(rawText) {
  if (!rawText) return '';
  let text = rawText;
  // Handle UTF-8 BOM (\uFEFF or \uFFFE)
  if (text.charCodeAt(0) === 0xFEFF || text.charCodeAt(0) === 0xFFFE) {
    text = text.slice(1);
  }
  // Normalize CRLF and CR to LF
  text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  return text;
}

export function extractTitleFromHtml(html, fallbackName = 'Untitled Test') {
  const safeFallback = (typeof fallbackName === 'string' && fallbackName.trim().length > 0) ? fallbackName.trim() : 'Untitled Test';
  if (!html) return safeFallback;
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (match && match[1]) {
    const decoded = match[1]
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();
    if (decoded.length > 0) return decoded;
  }
  return safeFallback;
}

/* ==========================================================================
   Import Workflow (Files & Paste)
   ========================================================================== */
async function handleFileSelection(files) {
  if (!files || files.length === 0 || isImportInProgress) return;
  isImportInProgress = true;

  try {
    closeSheet(elements.sheetImport);
    let importedCount = 0;
    let totalBytes = 0;

    for (const file of Array.from(files)) {
      // 1. Empty file detection
      if (file.size === 0) {
        showToast(`"${file.name}" is empty (0 bytes). Skipped.`, 'warning', 3500);
        continue;
      }

      // 2. Large file size warnings (50 MB & 20 MB thresholds)
      if (file.size > 50 * 1024 * 1024) {
        const proceed = await showModal({
          title: 'Very large file warning',
          body: `"${file.name}" is ${formatBytes(file.size)}. Files over 50 MB may exceed iOS Safari memory limits and crash your browser tab. Do you want to proceed?`,
          buttons: [
            { text: 'Import anyway', className: 'btn-danger', value: true },
            { text: 'Skip file', className: 'btn-secondary', value: false }
          ]
        });
        if (!proceed) continue;
      } else if (file.size > 20 * 1024 * 1024) {
        const proceed = await showModal({
          title: 'Large file warning',
          body: `"${file.name}" is ${formatBytes(file.size)}. Importing files over 20 MB may consume significant memory on iOS Safari. Do you want to continue?`,
          buttons: [
            { text: 'Import anyway', className: 'btn-primary', value: true },
            { text: 'Skip file', className: 'btn-secondary', value: false }
          ]
        });
        if (!proceed) continue;
      }

      try {
        const rawText = await file.text();
        if (!rawText || rawText.trim().length === 0) {
          showToast(`"${file.name}" has no text content. Skipped.`, 'warning', 3500);
          continue;
        }

        const html = normalizeHtml(rawText);
        const fallbackName = file.name.replace(/\.[^/.]+$/, '').trim() || 'Untitled Test';
        const title = extractTitleFromHtml(html, fallbackName);

        const saved = await saveImportedTest(title, html, file.size);
        if (saved) {
          importedCount++;
          totalBytes += file.size;
        }
      } catch (err) {
        console.error('[Import] Failed to read file:', file.name, err);
        showToast(`Failed to import "${file.name}": ${err.message}`, 'error', 4000);
      }
    }

    elements.filePicker.value = '';

    if (importedCount > 0) {
      showToast(`Imported ${importedCount} ${importedCount === 1 ? 'test' : 'tests'} (${formatBytes(totalBytes)})`, 'success');
      await refreshLibrary();
    }
  } finally {
    isImportInProgress = false;
  }
}

async function saveImportedTest(title, html, size) {
  const existing = await getTestByName(title);

  if (existing) {
    const choice = await showModal({
      title: 'Test already exists',
      body: `A test named "${title}" is already in your library. Because mock tests store attempt history in localStorage using this title, what would you like to do?`,
      buttons: [
        { text: 'Replace existing', className: 'btn-danger', value: 'replace' },
        { text: 'Keep both', className: 'btn-secondary', value: 'keep-both' },
        { text: 'Cancel', className: 'btn-secondary', value: 'cancel' }
      ]
    });

    if (choice === 'cancel') {
      return false;
    }

    if (choice === 'replace') {
      existing.html = html;
      existing.size = size;
      existing.added = Date.now();
      await saveTest(existing);
      return true;
    }

    if (choice === 'keep-both') {
      const newTitle = `${title} (${new Date().toLocaleDateString()})`;
      await saveTest({
        name: newTitle,
        html,
        size,
        added: Date.now(),
        lastOpened: 0
      });
      return true;
    }
  }

  await saveTest({
    name: title,
    html,
    size,
    added: Date.now(),
    lastOpened: 0
  });

  return true;
}

async function handlePasteSubmit(e) {
  e.preventDefault();
  const rawHtml = elements.pasteTestHtml.value.trim();
  if (!rawHtml) {
    showToast('Please paste some HTML content first.', 'warning');
    return;
  }

  const html = normalizeHtml(rawHtml);
  const userTitle = elements.pasteTestName.value.trim();
  const title = userTitle || extractTitleFromHtml(html, 'Pasted Test');
  const size = new Blob([html]).size;

  try {
    const saved = await saveImportedTest(title, html, size);
    if (saved) {
      elements.pasteTestName.value = '';
      elements.pasteTestHtml.value = '';
      closeSheet(elements.sheetImport);
      showToast(`Saved "${title}" (${formatBytes(size)})`, 'success');
      await refreshLibrary();
    }
  } catch (err) {
    console.error('[Paste] Error saving test:', err);
    showToast(`Error saving test: ${err.message}`, 'error');
  }
}

/* ==========================================================================
   Library Rendering & Attempt Status
   ========================================================================== */
function formatRelativeDate(timestamp) {
  if (!timestamp) return 'Never';
  const now = Date.now();
  const diffSec = Math.floor((now - timestamp) / 1000);
  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  const days = Math.floor(diffSec / 86400);
  if (days < 30) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatDate(timestamp) {
  if (!timestamp) return '';
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

function getAttemptStatus(testName) {
  const keySuffix = testName.replace(/\s+/g, '_');
  const hasCompleted = localStorage.getItem(`MM_${keySuffix}`) !== null || localStorage.getItem(`MM_${testName}`) !== null;
  const hasInProg = localStorage.getItem(`MM_InProg_${keySuffix}`) !== null || localStorage.getItem(`MM_InProg_${testName}`) !== null;

  if (hasCompleted) {
    return {
      statusClass: 'attempted',
      label: 'Completed attempt',
      iconSvg: '<svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>'
    };
  }

  if (hasInProg) {
    return {
      statusClass: 'in-progress',
      label: 'In-progress attempt',
      iconSvg: '<svg viewBox="0 0 24 24"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm4.2 14.2L11 13V7h1.5v5.2l4.5 2.7-.8 1.3z"/></svg>'
    };
  }

  return {
    statusClass: 'unattempted',
    label: 'Unattempted',
    iconSvg: ''
  };
}

/* ==========================================================================
   Test Management (Rename & Delete with History Cleanup)
   ========================================================================== */
async function promptRenameTest(test) {
  if (isRenameInProgress) return;
  isRenameInProgress = true;

  try {
    const wrapper = document.createElement('div');
    wrapper.className = 'form-group';
    wrapper.style.margin = '4px 0 0';

    const label = document.createElement('label');
    label.className = 'form-label';
    label.textContent = 'Enter new test title';
    label.htmlFor = 'modal-rename-input';

    const input = document.createElement('input');
    input.type = 'text';
    input.id = 'modal-rename-input';
    input.className = 'form-input';
    input.value = test.name;
    input.autocomplete = 'off';
    input.autocapitalize = 'sentences';
    input.style.fontSize = '16px'; // Prevents Safari auto-zoom

    wrapper.appendChild(label);
    wrapper.appendChild(input);

    let submittedName = null;

    const result = await showModal({
      title: 'Rename test',
      body: wrapper,
      buttons: [
        {
          text: 'Save name',
          className: 'btn-primary',
          onClick: () => {
            const val = input.value.trim();
            if (!val) {
              showToast('Please enter a test title.', 'warning');
              input.focus();
              return false;
            }
            submittedName = val;
            return true;
          },
          value: true
        },
        { text: 'Cancel', className: 'btn-secondary', value: false }
      ]
    });

    if (result && submittedName && submittedName !== test.name) {
      try {
        await renameTest(test.id, submittedName);
        showToast(`Renamed to "${submittedName}"`, 'success');
        await refreshLibrary();
      } catch (err) {
        console.error('[Rename] Error:', err);
        showToast(`Failed to rename test: ${err.message}`, 'error');
      }
    }
  } finally {
    isRenameInProgress = false;
  }
}

async function promptDeleteTest(test) {
  if (isDeleteInProgress) return;

  const wrapper = document.createElement('div');
  
  const desc = document.createElement('p');
  desc.style.marginBottom = '14px';
  desc.style.fontSize = '14.5px';
  desc.style.lineHeight = '1.45';
  desc.textContent = `Are you sure you want to delete "${test.name}"? This test file will be removed from your device.`;

  const label = document.createElement('label');
  label.className = 'form-checkbox-label';

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.id = 'delete-history-checkbox';
  checkbox.className = 'form-checkbox';
  checkbox.checked = false; // Default: keep history

  const span = document.createElement('span');
  span.textContent = 'Also delete attempt history & progress for this test';

  label.appendChild(checkbox);
  label.appendChild(span);

  wrapper.appendChild(desc);
  wrapper.appendChild(label);

  const confirmed = await showModal({
    title: 'Delete test?',
    body: wrapper,
    buttons: [
      { text: 'Delete test', className: 'btn-danger', value: true },
      { text: 'Cancel', className: 'btn-secondary', value: false }
    ]
  });

  if (!confirmed) return;

  if (isDeleteInProgress) return;
  isDeleteInProgress = true;

  try {
    if (checkbox.checked) {
      const keySuffix = test.name.replace(/\s+/g, '_');
      localStorage.removeItem(`MM_${keySuffix}`);
      localStorage.removeItem(`MM_InProg_${keySuffix}`);
      localStorage.removeItem(`MM_${test.name}`);
      localStorage.removeItem(`MM_InProg_${test.name}`);
      
      // Also clean any keys starting with MM_ that match this title
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k && (k.startsWith(`MM_${keySuffix}`) || k.startsWith(`MM_InProg_${keySuffix}`) || k.startsWith(`MM_${test.name}`))) {
          localStorage.removeItem(k);
        }
      }
    }

    await deleteTest(test.id);
    showToast(`Deleted "${test.name}"`, 'info');
    await refreshLibrary();
  } catch (err) {
    console.error('[Delete] Error:', err);
    showToast(`Failed to delete test: ${err.message}`, 'error');
  } finally {
    isDeleteInProgress = false;
  }
}

export async function refreshLibrary() {
  currentTests = await getAllTests();
  renderLibrary();
  await updateSettingsStats();
}

function renderLibrary() {
  const totalCount = currentTests.length;
  elements.testCountLabel.textContent = `${totalCount} ${totalCount === 1 ? 'test' : 'tests'}`;

  if (totalCount === 0) {
    elements.emptyState.classList.remove('hidden');
    elements.testList.classList.add('hidden');
    elements.libraryControls.classList.add('hidden');
    elements.testList.innerHTML = '';
    return;
  }

  elements.emptyState.classList.add('hidden');
  elements.testList.classList.remove('hidden');

  // Show search & sort controls when 6+ tests exist
  if (totalCount >= 6) {
    elements.libraryControls.classList.remove('hidden');
  } else {
    elements.libraryControls.classList.add('hidden');
  }

  // Filter tests by search query
  let filtered = [...currentTests];
  if (searchQuery) {
    filtered = filtered.filter(test => test.name.toLowerCase().includes(searchQuery));
    elements.testCountLabel.textContent = `${filtered.length} of ${totalCount} ${totalCount === 1 ? 'test' : 'tests'}`;
  }

  // Sort tests
  filtered.sort((a, b) => {
    switch (sortPreference) {
      case 'added':
        return (b.added || 0) - (a.added || 0);
      case 'name':
        return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
      case 'size':
        return (b.size || 0) - (a.size || 0);
      case 'recent':
      default: {
        const aOpen = a.lastOpened || 0;
        const bOpen = b.lastOpened || 0;
        if (aOpen !== bOpen) return bOpen - aOpen;
        return (b.added || 0) - (a.added || 0);
      }
    }
  });

  elements.testList.innerHTML = '';

  if (filtered.length === 0) {
    const emptySearch = document.createElement('div');
    emptySearch.className = 'search-empty-state';
    emptySearch.innerHTML = `
      <p>No tests matching "<strong>${escapeHtml(searchQuery)}</strong>"</p>
      <button type="button" class="btn-secondary" id="btn-search-empty-clear" style="min-height: 44px; min-width: 120px;">
        <span>Clear search</span>
      </button>
    `;
    emptySearch.querySelector('#btn-search-empty-clear').addEventListener('click', () => {
      elements.inputSearch.value = '';
      searchQuery = '';
      elements.btnClearSearch.classList.add('hidden');
      renderLibrary();
      elements.inputSearch.focus();
    });
    elements.testList.appendChild(emptySearch);
    return;
  }

  const fragment = document.createDocumentFragment();

  filtered.forEach((test) => {
    const card = document.createElement('article');
    card.className = 'test-card';
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `Open ${test.name}`);

    const attempt = getAttemptStatus(test.name);

    card.innerHTML = `
      <div class="test-card-header">
        <h3 class="test-title">${escapeHtml(test.name)}</h3>
        <div class="test-attempt-bubble ${attempt.statusClass}" title="${attempt.label}" aria-label="${attempt.label}">
          ${attempt.iconSvg}
        </div>
      </div>
      <div class="test-meta-row">
        <div class="test-meta-item">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
          </svg>
          <span>${formatBytes(test.size || test.html.length)}</span>
        </div>
        <div class="test-meta-item">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
            <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z"/>
          </svg>
          <span>Added ${formatDate(test.added)}</span>
        </div>
        <div class="test-meta-item">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
            <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
          </svg>
          <span>${test.lastOpened ? `Opened ${formatRelativeDate(test.lastOpened)}` : 'Never opened'}</span>
        </div>
      </div>
      <div class="test-card-actions">
        <button type="button" class="test-action-btn btn-card-rename" aria-label="Rename ${escapeHtml(test.name)}">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
          </svg>
          <span>Rename</span>
        </button>
        <button type="button" class="test-action-btn delete-btn btn-card-delete" aria-label="Delete ${escapeHtml(test.name)}">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
          </svg>
          <span>Delete</span>
        </button>
      </div>
    `;

    // Click card body to open in reader
    card.addEventListener('click', () => openTestInReader(test.id));

    // Rename button
    const btnRename = card.querySelector('.btn-card-rename');
    btnRename.addEventListener('click', (e) => {
      e.stopPropagation();
      promptRenameTest(test);
    });

    // Delete button
    const btnDelete = card.querySelector('.btn-card-delete');
    btnDelete.addEventListener('click', (e) => {
      e.stopPropagation();
      promptDeleteTest(test);
    });

    fragment.appendChild(card);
  });

  elements.testList.appendChild(fragment);
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}

/* ==========================================================================
   Reader Launcher (Phase 3 Full Implementation)
   ========================================================================== */
export async function openTestInReader(testId) {
  const test = await getTestById(testId);
  if (!test) {
    showToast('Could not load test.', 'error');
    return;
  }

  activeTestId = test.id;
  await updateTestLastOpened(test.id);
  elements.readerTitle.textContent = test.name;

  // Apply patch-on-open in memory (CSS max-width + Safari fullscreen stub)
  const patchedHtml = patchTestHtml(test.html);
  elements.testIframe.srcdoc = patchedHtml;

  // Request screen wake lock
  await acquireWakeLock();

  switchView('reader');
  showToast(`Starting "${test.name}"`, 'info');
}

/* ==========================================================================
   Backup & Restore (JSON Export / Import of Tests + MM_ LocalStorage Keys)
   ========================================================================== */
async function exportBackup() {
  try {
    const tests = await getAllTests();
    const history = {};

    // Collect all localStorage keys starting with "MM_" (attempt history + resume state)
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('MM_')) {
        history[key] = localStorage.getItem(key);
      }
    }

    const backupData = {
      version: 1,
      app: 'Mock Test Viewer',
      exportedAt: new Date().toISOString(),
      testsCount: tests.length,
      historyCount: Object.keys(history).length,
      tests,
      history
    };

    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `mock_tests_backup_${dateStr}.json`;

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast(`Exported ${tests.length} tests and ${Object.keys(history).length} history records`, 'success');
  } catch (err) {
    console.error('[Backup] Export error:', err);
    showToast(`Failed to export backup: ${err.message}`, 'error');
  }
}

async function handleBackupFile(file) {
  if (!file) return;

  try {
    let text = await file.text();
    // Strip UTF-8 BOM if present
    if (text.charCodeAt(0) === 0xFEFF) {
      text = text.slice(1);
    }

    let backupData;
    try {
      backupData = JSON.parse(text);
    } catch {
      showToast('Invalid backup file. JSON parsing failed.', 'error');
      return;
    }

    if (!backupData || typeof backupData !== 'object') {
      showToast('Corrupted or invalid backup file format.', 'error');
      return;
    }

    const incomingTests = Array.isArray(backupData.tests) ? backupData.tests : [];
    const incomingHistory = (typeof backupData.history === 'object' && backupData.history !== null) ? backupData.history : {};
    const historyKeysCount = Object.keys(incomingHistory).length;

    if (incomingTests.length === 0 && historyKeysCount === 0) {
      showToast('This backup file contains no tests or history records.', 'warning');
      return;
    }

    // Modal with Merge / Replace choice
    const modalBody = document.createElement('div');
    modalBody.innerHTML = `
      <p style="margin-bottom: 12px; font-size: 14.5px; line-height: 1.45;">
        Found <strong>${incomingTests.length}</strong> ${incomingTests.length === 1 ? 'test' : 'tests'} and <strong>${historyKeysCount}</strong> attempt history/progress ${historyKeysCount === 1 ? 'record' : 'records'} in this backup.
      </p>
      <div style="background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 12px; font-size: 13px; line-height: 1.4; color: var(--text-secondary); margin-bottom: 6px;">
        <p style="margin-bottom: 6px;"><strong>Merge:</strong> Add new tests and overwrite existing tests with matching names. Retain other existing tests and merge history.</p>
        <p><strong>Replace all:</strong> Delete all current tests and wipe previous attempt history before restoring this backup.</p>
      </div>
    `;

    const choice = await showModal({
      title: 'Restore backup',
      body: modalBody,
      buttons: [
        { text: 'Merge', className: 'btn-primary', value: 'merge' },
        { text: 'Replace all', className: 'btn-danger', value: 'replace' },
        { text: 'Cancel', className: 'btn-secondary', value: 'cancel' }
      ]
    });

    if (!choice || choice === 'cancel') {
      return;
    }

    if (choice === 'replace') {
      // 1. Clear current IndexedDB tests
      await clearAllTests();

      // 2. Clear current MM_ localStorage keys
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && key.startsWith('MM_')) {
          localStorage.removeItem(key);
        }
      }

      // 3. Save incoming tests
      for (const t of incomingTests) {
        if (!t.name || !t.html) continue;
        await saveTest({
          name: t.name,
          html: t.html,
          size: t.size || new Blob([t.html]).size,
          added: t.added || Date.now(),
          lastOpened: t.lastOpened || 0
        });
      }

      // 4. Restore incoming history keys
      for (const [k, v] of Object.entries(incomingHistory)) {
        if (k.startsWith('MM_')) {
          localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v));
        }
      }
    } else if (choice === 'merge') {
      // 1. Merge tests
      for (const t of incomingTests) {
        if (!t.name || !t.html) continue;
        const existing = await getTestByName(t.name);
        if (existing) {
          existing.html = t.html;
          existing.size = t.size || new Blob([t.html]).size;
          if (t.lastOpened && t.lastOpened > (existing.lastOpened || 0)) {
            existing.lastOpened = t.lastOpened;
          }
          await saveTest(existing);
        } else {
          await saveTest({
            name: t.name,
            html: t.html,
            size: t.size || new Blob([t.html]).size,
            added: t.added || Date.now(),
            lastOpened: t.lastOpened || 0
          });
        }
      }

      // 2. Merge history keys
      for (const [k, v] of Object.entries(incomingHistory)) {
        if (k.startsWith('MM_')) {
          localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v));
        }
      }
    }

    // Refresh UI and stats
    await refreshLibrary();
    await updateSettingsStats();

    // Show confirmation modal
    await showModal({
      title: 'Restore complete',
      body: `Successfully restored ${incomingTests.length} tests and ${historyKeysCount} history records (${choice === 'replace' ? 'replaced all previous data' : 'merged with existing data'}).`,
      buttons: [
        { text: 'Done', className: 'btn-primary', value: true }
      ]
    });

    showToast(`Restored ${incomingTests.length} tests and ${historyKeysCount} history records`, 'success');
  } catch (err) {
    console.error('[Backup] Import error:', err);
    showToast(`Restore failed: ${err.message}`, 'error');
  } finally {
    elements.backupFilePicker.value = '';
  }
}

/* ==========================================================================
   Settings & Storage Stats
   ========================================================================== */
async function updateSettingsStats() {
  const stats = await getStorageStats();
  if (elements.settingsTestCount) {
    elements.settingsTestCount.textContent = `${stats.count} ${stats.count === 1 ? 'test' : 'tests'}`;
  }
  if (elements.settingsStorageSize) {
    elements.settingsStorageSize.textContent = stats.formattedSize;
  }

  const persisted = await isStoragePersisted();
  if (elements.settingsPersistStatus) {
    if (persisted) {
      elements.settingsPersistStatus.textContent = 'Active (Protected)';
      elements.settingsPersistStatus.style.color = 'var(--success)';
    } else {
      elements.settingsPersistStatus.textContent = 'Standard';
      elements.settingsPersistStatus.style.color = 'var(--text-secondary)';
    }
  }

  if (elements.settingsOfflineStatus) {
    const isCached = Boolean(navigator.serviceWorker && navigator.serviceWorker.controller);
    if (!navigator.onLine) {
      elements.settingsOfflineStatus.textContent = isCached ? 'Offline (Ready)' : 'Offline';
      elements.settingsOfflineStatus.style.color = 'var(--warning)';
    } else {
      elements.settingsOfflineStatus.textContent = isCached ? 'Available offline (v1.0.0)' : 'Caching app shell...';
      elements.settingsOfflineStatus.style.color = isCached ? 'var(--success)' : 'var(--text-secondary)';
    }
  }
}

/* ==========================================================================
   Service Worker & Offline Management
   ========================================================================== */

/**
 * Update the UI offline badges and settings indicator
 * @param {boolean} isOnline
 * @param {boolean} isCached
 */
function updateOfflineUI(isOnline, isCached) {
  const badge = elements.offlineBadge;
  const statusText = elements.offlineStatusText;
  const settingsStatus = elements.settingsOfflineStatus;

  if (!badge || !statusText) return;

  if (!isOnline) {
    badge.classList.remove('updating');
    badge.classList.add('offline');
    const text = isCached ? 'Offline (Ready)' : 'Offline';
    statusText.textContent = text;
    if (settingsStatus) {
      settingsStatus.textContent = text;
      settingsStatus.style.color = 'var(--warning)';
    }
  } else {
    badge.classList.remove('offline', 'updating');
    const text = isCached ? 'Available offline' : 'Ready';
    statusText.textContent = text;
    if (settingsStatus) {
      settingsStatus.textContent = isCached ? 'Available offline (v1.0.0)' : 'Online only';
      settingsStatus.style.color = isCached ? 'var(--success)' : 'var(--text-secondary)';
    }
  }
}

/**
 * Register Service Worker for offline capability
 */
async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.warn('[SW] Service Workers not supported in this environment.');
    updateOfflineUI(navigator.onLine, false);
    return;
  }

  // Initial check: if already controlled, it's available offline
  const isCurrentlyControlled = Boolean(navigator.serviceWorker.controller);
  updateOfflineUI(navigator.onLine, isCurrentlyControlled);

  try {
    const registration = await navigator.serviceWorker.register('sw.js', { scope: './' });
    console.log('[SW] ServiceWorker registered with scope:', registration.scope);

    // If controller already present, we're active
    if (navigator.serviceWorker.controller) {
      updateOfflineUI(navigator.onLine, true);
    }

    registration.addEventListener('updatefound', () => {
      const installing = registration.installing;
      if (!installing) return;

      if (elements.offlineBadge) {
        elements.offlineBadge.classList.add('updating');
      }
      if (elements.offlineStatusText) {
        elements.offlineStatusText.textContent = 'Updating...';
      }

      installing.addEventListener('statechange', () => {
        if (installing.state === 'installed') {
          if (navigator.serviceWorker.controller) {
            showToast('New version ready for next visit', 'info');
          } else {
            showToast('App is ready for offline use', 'success');
          }
          updateOfflineUI(navigator.onLine, true);
        }
      });
    });

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('[SW] Service Worker controller changed.');
      updateOfflineUI(navigator.onLine, true);
    });

  } catch (err) {
    console.warn('[SW] Registration failed:', err);
    updateOfflineUI(navigator.onLine, false);
  }
}

/**
 * Setup online/offline event listeners and badge interactivity
 */
function initNetworkMonitoring() {
  const checkStatus = () => {
    const isOnline = navigator.onLine;
    const isCached = Boolean(navigator.serviceWorker && navigator.serviceWorker.controller);
    updateOfflineUI(isOnline, isCached);
  };

  window.addEventListener('online', () => {
    checkStatus();
    showToast('Internet connection restored', 'info');
  });

  window.addEventListener('offline', () => {
    checkStatus();
    showToast('Offline mode active. Saved tests work normally.', 'warning');
  });

  if (elements.offlineBadge) {
    elements.offlineBadge.addEventListener('click', () => {
      const isOnline = navigator.onLine;
      const isCached = Boolean(navigator.serviceWorker && navigator.serviceWorker.controller);
      if (!isOnline) {
        showToast('You are offline. All saved tests and attempt history work on-device.', 'info');
      } else if (isCached) {
        showToast('App shell & test engines are cached. Ready for offline use.', 'success');
      } else {
        showToast('Connecting to network. Offline cache is initializing...', 'info');
      }
    });
  }

  checkStatus();
}

/* ==========================================================================
   Initialization & Event Wiring
   ========================================================================== */
async function initApp() {
  // 1. Initialize Theme
  applyTheme(getPreferredTheme());
  elements.btnThemeToggle.addEventListener('click', toggleTheme);

  if (elements.selectTheme) {
    elements.selectTheme.addEventListener('change', (e) => {
      const chosen = e.target.value;
      localStorage.setItem(THEME_STORAGE_KEY, chosen);
      applyTheme(chosen);
      showToast(`Theme set to ${chosen}`, 'info');
    });
  }

  // 2. Settings Sheet
  elements.btnSettings.addEventListener('click', () => {
    updateSettingsStats();
    openSheet(elements.sheetSettings);
  });
  elements.btnCloseSettingsSheet.addEventListener('click', () => closeSheet(elements.sheetSettings));

  // Backup & Restore
  if (elements.btnExportBackup) {
    elements.btnExportBackup.addEventListener('click', exportBackup);
  }
  if (elements.btnImportBackup) {
    elements.btnImportBackup.addEventListener('click', () => elements.backupFilePicker.click());
  }
  if (elements.backupFilePicker) {
    elements.backupFilePicker.addEventListener('change', async (e) => {
      if (e.target.files && e.target.files.length > 0) {
        await handleBackupFile(e.target.files[0]);
      }
    });
  }

  // 3. Import Sheet & Trigger Actions
  elements.btnAddTest.addEventListener('click', () => openSheet(elements.sheetImport));
  elements.btnCloseImportSheet.addEventListener('click', () => closeSheet(elements.sheetImport));

  elements.btnEmptyImport.addEventListener('click', () => elements.filePicker.click());
  elements.btnSheetPickFiles.addEventListener('click', () => {
    closeSheet(elements.sheetImport);
    elements.filePicker.click();
  });

  elements.btnEmptyPaste.addEventListener('click', () => {
    openSheet(elements.sheetImport);
    setTimeout(() => elements.pasteTestHtml.focus(), 300);
  });

  elements.filePicker.addEventListener('change', (e) => handleFileSelection(e.target.files));
  elements.formPasteHtml.addEventListener('submit', handlePasteSubmit);

  // Sheet backdrop dismiss
  elements.sheetImport.addEventListener('click', (e) => {
    if (e.target === elements.sheetImport) closeSheet(elements.sheetImport);
  });

  elements.sheetSettings.addEventListener('click', (e) => {
    if (e.target === elements.sheetSettings) closeSheet(elements.sheetSettings);
  });

  elements.modalContainer.addEventListener('click', (e) => {
    if (e.target === elements.modalContainer) closeModal();
  });

  // 3b. Library Search and Sort Controls
  if (elements.selectSort) {
    elements.selectSort.value = sortPreference;
    elements.selectSort.addEventListener('change', (e) => {
      sortPreference = e.target.value;
      localStorage.setItem('mocktest_sort_pref', sortPreference);
      renderLibrary();
    });
  }

  if (elements.inputSearch) {
    elements.inputSearch.addEventListener('input', (e) => {
      searchQuery = e.target.value.trim().toLowerCase();
      if (searchQuery.length > 0) {
        elements.btnClearSearch.classList.remove('hidden');
      } else {
        elements.btnClearSearch.classList.add('hidden');
      }
      renderLibrary();
    });
  }

  if (elements.btnClearSearch) {
    elements.btnClearSearch.addEventListener('click', () => {
      elements.inputSearch.value = '';
      searchQuery = '';
      elements.btnClearSearch.classList.add('hidden');
      renderLibrary();
      elements.inputSearch.focus();
    });
  }

  // 4. Reader Navigation Controls
  elements.btnReaderBack.addEventListener('click', async () => {
    const confirmed = await showModal({
      title: 'Leave test?',
      body: 'Your progress has been saved. You can resume this attempt anytime.',
      buttons: [
        { text: 'Leave test', className: 'btn-danger', value: true },
        { text: 'Continue test', className: 'btn-secondary', value: false }
      ]
    });

    if (confirmed) {
      callSaveProgress();
      await releaseWakeLock();
      elements.testIframe.srcdoc = '';
      activeTestId = null;
      switchView('library');
      await refreshLibrary();
    }
  });

  elements.btnReaderRestart.addEventListener('click', async () => {
    const confirmed = await showModal({
      title: 'Restart test?',
      body: 'This will reset your current timer and answers for this session. Are you sure?',
      buttons: [
        { text: 'Restart test', className: 'btn-danger', value: true },
        { text: 'Cancel', className: 'btn-secondary', value: false }
      ]
    });

    if (confirmed && activeTestId) {
      const test = await getTestById(activeTestId);
      if (test) {
        showToast('Restarting test...', 'warning');
        // Clear srcdoc and re-apply patched HTML to guarantee a clean reset
        elements.testIframe.srcdoc = '';
        setTimeout(() => {
          elements.testIframe.srcdoc = patchTestHtml(test.html);
        }, 50);
      }
    }
  });

  // 5. Visibility & Safety Hooks (Progress saving & Wake Lock)
  document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState === 'hidden') {
      if (activeTestId) {
        callSaveProgress();
      }
    } else if (document.visibilityState === 'visible') {
      if (activeTestId) {
        await acquireWakeLock();
      }
    }
  });

  window.addEventListener('pagehide', () => {
    if (activeTestId) {
      callSaveProgress();
    }
  });

  window.addEventListener('beforeunload', () => {
    if (activeTestId) {
      callSaveProgress();
    }
  });

  // 6. Initialize IndexedDB
  const dbStatus = await initDB();
  if (dbStatus.isFallback) {
    elements.storageBanner.classList.add('active');
    elements.storageBanner.innerHTML = `
      <strong>Temporary Storage Active:</strong> IndexedDB is not fully available in this tab mode (${dbStatus.error || 'fallback mode'}). Tests will remain until this page is closed. Add to Home Screen to ensure persistent offline storage.
    `;
  }

  // 7. Initial Load of Tests
  await refreshLibrary();

  // 8. Service Worker & Offline Capability
  initNetworkMonitoring();
  await registerServiceWorker();

  console.log('Mock Test Viewer initialized successfully with offline support.');
}

document.addEventListener('DOMContentLoaded', initApp);
