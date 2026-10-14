# Mock Test Viewer for iPhone 15 (Safari, iOS 17+)

A personal, offline-capable progressive web application specifically crafted for iPhone 15 (393×852 pt, DPR 3, Dynamic Island, home indicator) running iOS 17+ Safari. It allows you to import single-file HTML mock tests onto your phone, store them in IndexedDB, and attempt them full-screen with progress protection, timer safety, and offline support.

---

## Key Features

1. **Test Library**:
   - Visual inventory displaying test title, formatted file size, date added, and last opened.
   - Dynamic attempt status bubbles: empty circle (unattempted), half-filled amber (in progress), green checkmark (completed attempt).
   - Real-time search filter (displayed when $\ge 6$ tests are in library).
   - Instant sorting by Recently Opened, Date Added, Name (A–Z), and File Size.
   - Inline test renaming and deletion (with optional attempt history cleanup).

2. **File Import & Duplicate Handling**:
   - Native multi-file picker from the iOS Files app and iCloud Drive (`.html`, `.htm`).
   - "Paste HTML" dialog for direct test markup insertion.
   - Automated UTF-8 BOM (`\uFEFF`) stripping and CRLF to LF normalization.
   - Automated `<title>` extraction with clean filename fallback.
   - Duplicate title detection offering **Replace**, **Keep Both**, or **Cancel**.
   - Large file safeguards: warning at $> 20\text{ MB}$, and memory-exhaustion alert at $> 50\text{ MB}$.

3. **Reader & Dynamic Island Integration**:
   - Sandboxed iframe (`allow-scripts allow-same-origin allow-forms allow-modals allow-popups allow-downloads`) loaded via `srcdoc`.
   - **Patch-on-Open**:
     - Automatically injects responsive layout fixes (`.box, .wc { max-width: 92vw !important }`) so 400px dashboards fit comfortably on 393pt screens without horizontal scrolling.
     - Stubs unsupported Safari `document.documentElement.requestFullscreen()` to return a resolved Promise.
     - Intercepts blocking `window.alert()` inside tests and routes them to non-blocking parent toast notifications.
     - Stubs `window.confirm()` and `window.prompt()` to prevent iOS thread freezes.
   - **Progress Safety**: Triggers `frame.contentWindow.saveProgress()` on `visibilitychange` (`hidden`), `pagehide`, and `beforeunload`.
   - **Screen Wake Lock**: Activates `navigator.wakeLock` while a test is active; automatically re-acquires on app visibility.

4. **Backup & Restore**:
   - One-click JSON backup export containing all test HTML files and all `localStorage` keys starting with `MM_` (attempt histories, scores, in-progress resume states).
   - Restore mechanism supporting **Merge** (preserving existing tests) or **Replace All**.

5. **Offline Support & Service Worker**:
   - Precaches application shell (`index.html`, `styles.css`, `app.js`, `db.js`, `manifest.webmanifest`, `/icons/*`).
   - Runtime cache-first strategy for external test assets:
     - Font Awesome (`cdnjs.cloudflare.com`)
     - Google Fonts (`fonts.googleapis.com`, `fonts.gstatic.com`)
     - Platform Logos (`u1.oliveboard.in`)
   - Header offline badge and Settings sheet connection indicator.

---

## Technical Constraints & Implementation

- **Strict Vanilla Stack**: 100% Vanilla HTML5, CSS3, and ES6+ JavaScript. Zero build steps, zero node dependencies, zero frameworks, zero external CDNs for app code.
- **Strict Relative Paths**: Compatible with GitHub Pages subpaths (`/<repo-name>/`) and Netlify Drop.
- **iPhone 15 Metrics & Guidelines**:
  - Viewport meta: `viewport-fit=cover`.
  - Shell height: `100dvh` (dynamic viewport height).
  - Safe-area insets: `env(safe-area-inset-top)`, `env(safe-area-inset-bottom)`, `env(safe-area-inset-left)`, `env(safe-area-inset-right)`.
  - All form inputs $\ge 16\text{px}$ to completely eliminate iOS Safari automatic tap-zoom.
  - All touch targets $\ge 44\text{pt}$ ($44\text{px}$).
  - In-app custom dialogs replacing native `alert/confirm/prompt`.

---

## Project Structure

```text
├── dist/                     # Clean production drop folder (Netlify / hosting)
│   ├── _headers              # Cache-Control: no-cache for sw.js
│   ├── app.js                # App controllers, modals, reader, import, backup
│   ├── db.js                 # IndexedDB wrapper with memory fallback
│   ├── index.html            # App shell, sheets, and dialogs
│   ├── manifest.webmanifest  # PWA configuration
│   ├── styles.css            # Responsive design, iOS safe areas, themes
│   ├── sw.js                 # Service worker with precaching and runtime cache
│   └── icons/                # Web app & Apple Touch icons (180x180, etc.)
├── icons/                    # Source icon assets
├── sample/                   # Reference mock test sample
├── DEPLOY.md                 # Step-by-step Netlify Drop & GitHub Pages guide
└── README.md                 # Project documentation
```

---

## Deployment

Refer to [`DEPLOY.md`](./DEPLOY.md) for detailed Netlify Drop and GitHub Pages deployment instructions.
