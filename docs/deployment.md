# Deployment & PWA Guide

Shukr is designed as a **Progressive Web App (PWA)**, allowing it to be installed on any device and run entirely offline. This guide covers how to deploy Shukr and how to set it up for the best user experience.

---

## 🚀 One-Click Deployment

The fastest way to deploy your own instance of Shukr is via **Vercel**.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fhammaadworks%2Fshukr)

1.  **Click the button** above.
2.  **Connect your GitHub account** and select a repository name.
3.  **Vercel will automatically detect** the Vite project and deploy it.
4.  Once finished, you'll have a live URL to share with users.

---

## 🛠️ Manual Deployment

If you prefer to host Shukr on your own server or a different provider (e.g., Netlify, GitHub Pages):

### Build the Project
1.  **Install dependencies:** `pnpm install`
2.  **Run the build command:** `pnpm build`
3.  **Find the output:** The production-ready files will be in the `dist/` folder.

### Server Requirements
Any static file server can host Shukr. However, for PWA features to work correctly:
*   **HTTPS is required:** PWAs cannot be installed over insecure (HTTP) connections.
*   **Correct MIME Types:** Ensure `.js` and `.webmanifest` files are served with the correct headers.

---

## 📱 PWA Configuration

Shukr uses `vite-plugin-pwa` to manage the service worker and offline assets.

### Key PWA Features
*   **Pre-caching:** All core application logic, fonts (Nastaliq), and icons are cached on the first load.
*   **Background Updates:** When a new version of the app is available, the service worker will download it in the background and notify the user to refresh.
*   **Standalone Mode:** When installed on a home screen, Shukr runs in a dedicated window without browser address bars, making it feel like a native app.

### Customizing the PWA Manifest
You can modify the app name, icons, and theme color in `vite.config.ts` under the `pwaOptions` section.

```typescript
// vite.config.ts
pwaOptions: {
  manifest: {
    name: 'Shukr: Adaptive AAC',
    short_name: 'Shukr',
    description: 'Urdu-first adaptive AAC platform.',
    theme_color: '#ffffff',
    icons: [
      {
        src: 'pwa-192x192.png',
        sizes: '192x192',
        type: 'image/png'
      }
    ]
  }
}
```

---

## 🔄 Updates & Maintenance

To update your live Shukr deployment:
1.  **Commit changes** to your GitHub repository.
2.  **Vercel/Netlify will automatically trigger** a new build and deployment.
3.  **Users will receive a notification** in the app the next time they open it, asking them to "Reload for Latest Version."

---

## 🛡️ Security & Privacy Note
Since Shukr is a client-side only app, there is no backend server to maintain. This significantly reduces the attack surface and ensures that all user data remains on the device, never touching your deployment server.
