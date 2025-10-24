# Getting Started with Shukr

Shukr is designed to be accessible and easy to set up for everyone, whether you're a user, a caregiver, or a developer.

---

## 📱 For Users (Installation)

The best way to use Shukr is as a **Progressive Web App (PWA)**. This ensures that all features (including offline access) work seamlessly on your device.

### Installation Steps

1.  **Open the App:** Navigate to [shukr.vercel.app](https://shukr.vercel.app) using a modern browser (Chrome on Android, Safari on iOS).
2.  **Add to Home Screen:**
    *   **iOS (iPhone/iPad):** Tap the **Share** button (the square with an arrow) and select **Add to Home Screen**.
    *   **Android:** Tap the three dots menu (top-right) or look for an **Install App** banner at the bottom.
3.  **Launch from Home Screen:** Shukr will now appear as an icon on your home screen. Open it to start using it without browser UI bars.

### System Requirements
*   **Camera Access:** Required for gesture recognition.
*   **Microphone Access:** Required for Voice Studio and Ambient Listener.
*   **Storage:** At least 100MB of free space for local recordings and configuration.

---

## 💻 For Developers (Setup)

If you're looking to contribute to the code or run a local version for development, follow these steps.

### Prerequisites
*   [Node.js](https://nodejs.org/) (v18 or higher)
*   [pnpm](https://pnpm.io/) (Recommended) or `npm`/`yarn`

### Setup Steps

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/hammaadworks/shukr.git
    cd shukr
    ```

2.  **Install Dependencies:**
    ```bash
    pnpm install
    ```

3.  **Launch Development Server:**
    ```bash
    pnpm dev
    ```
    The app will be available at `http://localhost:5173`.

4.  **Run Build (Optional):**
    To test the production build locally:
    ```bash
    pnpm build
    ```

### Recommended Tools
*   **VS Code:** With ESLint and Prettier extensions.
*   **Chrome DevTools:** Use the **Lighthouse** tab to test PWA and Accessibility performance.

---

## 🛡️ Privacy & Security

Shukr is **offline-first** by design.
*   **No Cloud Storage:** Your recordings, custom words, and usage patterns never leave your device.
*   **Local ML:** All gesture and voice recognition happens locally using your browser's CPU/GPU via MediaPipe.
*   **Open Source:** Our entire code is public, ensuring full transparency about how your data is handled.
