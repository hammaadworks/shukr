# Deployment & PWA Guide

Shukr is a high-accessibility **Progressive Web App (PWA)**. It is designed to be deployed once and run everywhere—entirely offline.

---

## 🚀 One-Click Deployment (Recommended)

The fastest way to deploy your own instance of Shukr is via **Vercel**.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fhammaadworks%2Fshukr)

1.  **Click the button** above.
2.  **Connect your GitHub account**.
3.  **Vercel will automatically detect** the Vite project and deploy it.

---

## 🛠️ Manual Deployment

Shukr can be hosted on any static provider (Netlify, GitHub Pages, S3).

### Build Process
1.  `pnpm install`
2.  `pnpm build`
3.  Upload the `dist/` folder to your provider.

### Server Requirements
*   **HTTPS:** Mandatory for PWA installation and Camera/Microphone access.
*   **MIME Types:** Ensure `.webmanifest` files are served as `application/manifest+json`.

---

## 📱 PWA Features

Shukr uses `vite-plugin-pwa` for an optimized mobile experience.
*   **Pre-caching:** Core fonts (Nastaliq), icons, and logic are cached for 100% offline reliability.
*   **Standalone Mode:** The app runs without browser address bars when added to the home screen.
*   **Background Sync:** Updates are downloaded in the background; users are prompted to reload when a new version is ready.

---

## 🔄 Updates & Maintenance

*   **CD/CI:** Committing to your main branch will trigger an automatic rebuild and deployment.
*   **Version Control:** The `settings.json` file controls the default "Universe" versioning. Increment this when pushing critical vocabulary updates.
