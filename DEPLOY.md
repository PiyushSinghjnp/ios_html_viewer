# Deployment Guide: Mock Test Viewer

This application is 100% static (Vanilla HTML/CSS/JS) with all data stored locally on-device in IndexedDB and `localStorage`. It requires no backend, no build tools, and no external dependencies.

---

## Option 1: Netlify Drop (Fastest & Recommended for iPhone)

Netlify Drop allows immediate SSL deployment with custom headers (`_headers` ensures Safari never caches `sw.js` stale copies).

### Steps:
1. Open [app.netlify.com/drop](https://app.netlify.com/drop) in your desktop browser.
2. Drag and drop the **`dist`** folder located in this repository directly onto the Netlify Drop page.
   *(The `dist` folder already contains `index.html`, `styles.css`, `app.js`, `db.js`, `sw.js`, `manifest.webmanifest`, `/icons`, and the `_headers` cache-control rule).*
3. Wait 5 seconds for deployment to finish.
4. Copy your live HTTPS URL (e.g. `https://your-app-name.netlify.app`).
5. Open this URL on your **iPhone 15 in Safari**.

---

## Option 2: GitHub Pages

The application is built entirely with relative paths (`./`), making it fully compatible with GitHub Pages subpaths (e.g., `https://<username>.github.io/<repo-name>/`).

### Steps:
1. Push your repository to GitHub:
   ```bash
   git add -A
   git commit -m "Deploy: Production ready"
   git push origin master
   ```
2. In your GitHub repository:
   - Navigate to **Settings** > **Pages**.
   - Under **Build and deployment** > **Source**, choose **Deploy from a branch**.
   - Under **Branch**, select `master` (or `main`) and folder `/ (root)`.
   - Click **Save**.
3. GitHub Pages will build and deploy the site in 1–2 minutes.
4. Access the site on your iPhone at `https://<username>.github.io/<repo-name>/`.

---

## Adding to iPhone 15 Home Screen

For the best full-screen experience (running as a standalone web app with home indicator and safe area insets respected):

1. Open the deployed HTTPS URL in **Safari on iOS 17+**.
2. Tap the **Share button** (square with upward arrow at bottom center).
3. Scroll down and tap **Add to Home Screen**.
4. Confirm or edit the title (defaults to **Mock Tests**), then tap **Add** in the top right.
5. The **Mock Tests** app icon will appear on your Home Screen.
6. Tap it to launch full-screen!
