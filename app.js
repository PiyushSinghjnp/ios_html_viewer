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
  btnExportBackup: document.getElementById('btn-export-backup'),
  btnImportBackup: document.getElementById('btn-import-backup'),
  backupFilePicker: document.getElementById('backup-file-picker'),

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
  return new Promise((resolve) => {
    elements.modalTitle.textContent = title;
    elements.modalBody.innerHTML = typeof body === 'string' ? body : '';
    if (typeof body !== 'string' && body instanceof HTMLElement) {
      elements.modalBody.innerHTML = '';
      elements.modalBody.appendChild(body);
    }
    
    elements.modalActions.innerHTML = '';

    buttons.forEach((btnConfig) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = btnConfig.className || 'btn-secondary';
      btn.textContent = btnConfig.text;
      btn.addEventListener('click', () => {
        closeModal();
        resolve(btnConfig.value !== undefined ? btnConfig.value : btnConfig.text);
      });
      elements.modalActions.appendChild(btn);
    });

    elements.modalContainer.classList.add('active');
    elements.modalContainer.setAttribute('aria-hidden', 'false');
  });
}

export function closeModal() {
  elements.modalContainer.classList.remove('active');
  elements.modalContainer.setAttribute('aria-hidden', 'true');
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
    elements.viewLibrary.classList.remove('active');
    elements.viewReader.classList.add('active');
  } else {
    elements.viewReader.classList.remove('active');
    elements.viewLibrary.classList.add('active');
  }
}

/* ==========================================================================
   HTML Parsing & Normalization
   ========================================================================== */
export function normalizeHtml(rawText) {
  if (!rawText) return '';
  let text = rawText;
  // Handle UTF-8 BOM
  if (text.charCodeAt(0) === 0xFEFF) {
    text = text.slice(1);
  }
  return text;
}

export function extractTitleFromHtml(html, fallbackName = 'Untitled Test') {
  if (!html) return fallbackName;
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
  return fallbackName;
}

/* ==========================================================================
   Import Workflow (Files & Paste)
   ========================================================================== */
async function handleFileSelection(files) {
  if (!files || files.length === 0) return;

  closeSheet(elements.sheetImport);
  let importedCount = 0;
  let totalBytes = 0;

  for (const file of Array.from(files)) {
    // 20 MB size warning
    if (file.size > 20 * 1024 * 1024) {
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
      const html = normalizeHtml(rawText);
      const fallbackName = file.name.replace(/\.[^/.]+$/, '');
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
}

async function saveImportedTest(title, html, size) {
  // Check for duplicate title
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
      // Append timestamp or counter
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

  // Brand new test
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

/**
 * Determine attempt state based on sample test conventions:
 * localStorage key "MM_<title>" and "MM_InProg_<title>"
 */
function getAttemptStatus(testName) {
  const keySuffix = testName.replace(/\s+/g, '_');
  const hasCompleted = localStorage.getItem(`MM_${keySuffix}`) !== null;
  const hasInProg = localStorage.getItem(`MM_InProg_${keySuffix}`) !== null;

  if (hasCompleted) {
    return {
      statusClass: 'attempted',
      label: 'Completed',
      iconSvg: '<svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>'
    };
  }

  if (hasInProg) {
    return {
      statusClass: 'in-progress',
      label: 'In Progress',
      iconSvg: '<svg viewBox="0 0 24 24"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm4.2 14.2L11 13V7h1.5v5.2l4.5 2.7-.8 1.3z"/></svg>'
    };
  }

  return {
    statusClass: 'unattempted',
    label: 'Unattempted',
    iconSvg: ''
  };
}

export async function refreshLibrary() {
  currentTests = await getAllTests();
  renderLibrary();
  await updateSettingsStats();
}

function renderLibrary() {
  const count = currentTests.length;
  elements.testCountLabel.textContent = `${count} ${count === 1 ? 'test' : 'tests'}`;

  if (count === 0) {
    elements.emptyState.classList.remove('hidden');
    elements.testList.classList.add('hidden');
    elements.libraryControls.classList.add('hidden');
    elements.testList.innerHTML = '';
    return;
  }

  elements.emptyState.classList.add('hidden');
  elements.testList.classList.remove('hidden');

  // Controls shown when 6+ tests
  if (count >= 6) {
    elements.libraryControls.classList.remove('hidden');
  } else {
    elements.libraryControls.classList.add('hidden');
  }

  elements.testList.innerHTML = '';

  currentTests.forEach((test) => {
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
    `;

    // Click card to open in Reader (or trigger info in Phase 2)
    card.addEventListener('click', () => openTestInReader(test.id));

    elements.testList.appendChild(card);
  });
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
   Reader Launcher (Phase 2 & Phase 3 Bridge)
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

  // In Phase 2: Switch view and load test HTML into iframe
  elements.testIframe.srcdoc = test.html;
  switchView('reader');
  showToast(`Opened "${test.name}"`, 'info');
}

/* ==========================================================================
   Settings & Storage Stats
   ========================================================================== */
async function updateSettingsStats() {
  const stats = await getStorageStats();
  elements.settingsTestCount.textContent = `${stats.count} ${stats.count === 1 ? 'test' : 'tests'}`;
  elements.settingsStorageSize.textContent = stats.formattedSize;

  const persisted = await isStoragePersisted();
  if (persisted) {
    elements.settingsPersistStatus.textContent = 'Active (Protected)';
    elements.settingsPersistStatus.style.color = 'var(--success)';
  } else {
    elements.settingsPersistStatus.textContent = 'Standard';
    elements.settingsPersistStatus.style.color = 'var(--text-secondary)';
  }
}

/* ==========================================================================
   Initialization
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
      elements.testIframe.srcdoc = '';
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

    if (confirmed) {
      if (activeTestId) {
        const test = await getTestById(activeTestId);
        if (test) {
          elements.testIframe.srcdoc = test.html;
          showToast('Restarted test', 'info');
        }
      }
    }
  });

  // 5. Initialize IndexedDB
  const dbStatus = await initDB();
  if (dbStatus.isFallback) {
    elements.storageBanner.classList.add('active');
    elements.storageBanner.innerHTML = `
      <strong>Temporary Storage Active:</strong> IndexedDB is not fully available in this tab mode (${dbStatus.error || 'fallback mode'}). Tests will remain until this page is closed. Add to Home Screen to ensure persistent offline storage.
    `;
  }

  // 6. Initial Load of Tests
  await refreshLibrary();

  console.log('Mock Test Viewer Phase 2 loaded successfully.');
}

document.addEventListener('DOMContentLoaded', initApp);
