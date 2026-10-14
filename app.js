/**
 * Mock Test Viewer — Main Application
 * Targets iPhone 15 (Safari iOS 17+, 393x852 pt, DPR 3, Standalone & Tab)
 */

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

  // Empty state buttons
  btnEmptyImport: document.getElementById('btn-empty-import'),
  btnEmptyPaste: document.getElementById('btn-empty-paste'),
  btnSheetPickFiles: document.getElementById('btn-sheet-pick-files'),
  filePicker: document.getElementById('file-picker'),
  formPasteHtml: document.getElementById('form-paste-html'),
  pasteTestName: document.getElementById('paste-test-name'),
  pasteTestHtml: document.getElementById('paste-test-html')
};

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
    // Show sun icon (click to switch to light)
    elements.themeIcon.innerHTML = `
      <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0s-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0s-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41l-1.06-1.06zm1.06-10.96c.39-.39.39-1.03 0-1.41s-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06c.39-.39.39-1.03 0-1.41s-1.03-.39-1.41 0z"/>
    `;
  } else {
    // Show moon icon (click to switch to dark)
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

// Watch OS system theme changes
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
   Phase 1 Event Listeners & Initialization
   ========================================================================== */
function initPhase1() {
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
  elements.btnSettings.addEventListener('click', () => openSheet(elements.sheetSettings));
  elements.btnCloseSettingsSheet.addEventListener('click', () => closeSheet(elements.sheetSettings));

  // 3. Import Sheet & Actions
  elements.btnAddTest.addEventListener('click', () => openSheet(elements.sheetImport));
  elements.btnCloseImportSheet.addEventListener('click', () => closeSheet(elements.sheetImport));

  elements.btnEmptyImport.addEventListener('click', () => {
    elements.filePicker.click();
  });

  elements.btnSheetPickFiles.addEventListener('click', () => {
    closeSheet(elements.sheetImport);
    elements.filePicker.click();
  });

  elements.btnEmptyPaste.addEventListener('click', () => {
    openSheet(elements.sheetImport);
    setTimeout(() => {
      elements.pasteTestHtml.focus();
    }, 300);
  });

  // Close sheets on backdrop click
  elements.sheetImport.addEventListener('click', (e) => {
    if (e.target === elements.sheetImport) closeSheet(elements.sheetImport);
  });

  elements.sheetSettings.addEventListener('click', (e) => {
    if (e.target === elements.sheetSettings) closeSheet(elements.sheetSettings);
  });

  // Modal backdrop click
  elements.modalContainer.addEventListener('click', (e) => {
    if (e.target === elements.modalContainer) closeModal();
  });

  // 4. Reader View In-App Confirmations (Phase 1 Stub/Skeleton)
  elements.btnReaderBack.addEventListener('click', async () => {
    const confirmed = await showModal({
      title: 'Leave test?',
      body: 'Your current progress will be preserved automatically. You can resume this attempt anytime.',
      buttons: [
        { text: 'Leave test', className: 'btn-danger', value: true },
        { text: 'Continue test', className: 'btn-secondary', value: false }
      ]
    });

    if (confirmed) {
      switchView('library');
      showToast('Left test', 'info');
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
      showToast('Restarting test...', 'warning');
      // In Phase 3, this will reload the iframe srcdoc
    }
  });

  console.log('Mock Test Viewer Phase 1 initialized for iPhone 15.');
}

// Kickoff
document.addEventListener('DOMContentLoaded', initPhase1);
