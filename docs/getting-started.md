# Getting Started with Shukr

Shukr is an adaptive AAC (Augmentative and Alternative Communication) platform designed to be universally accessible. Whether you're a user, a caregiver, or a developer, getting started is straightforward.

---

## 📱 For Users (Installation)

Shukr is a **Progressive Web App (PWA)**. It runs in your browser but installs like a native app, providing full offline access and a dedicated home screen icon.

### Installation Steps

1.  **Open the App:** Navigate to the Shukr deployment URL using a modern browser (Chrome, Safari, or Edge).
2.  **Add to Home Screen:**
    *   **iOS (iPhone/iPad):** Tap the **Share** button and select **Add to Home Screen**.
    *   **Android:** Tap the browser menu (three dots) and select **Install App** or **Add to Home Screen**.
3.  **Launch:** Open the Shukr icon from your home screen. It will launch in a standalone, immersive window.

### Initial Configuration
On first launch, you will be prompted to select your **Language Pair**:
- **Primary Language:** The language used by the speaker.
- **Secondary Language:** The language used by the caregiver (shown in dual-mode).
- **Supported:** Urdu, English, Spanish, Arabic, Hindi, Chinese, French.

---

## 💻 For Developers (Setup)

Shukr is an open-source project. We welcome contributors to help expand our gesture models and language support.

### Prerequisites
*   [Node.js](https://nodejs.org/) (v18+)
*   [pnpm](https://pnpm.io/) (Highly Recommended)

### Setup Steps

1.  **Clone & Install:**
    ```bash
    git clone https://github.com/hammaadworks/shukr.git
    cd shukr
    pnpm install
    ```

2.  **Launch Development Server:**
    ```bash
    pnpm dev
    ```

3.  **Build for Production:**
    ```bash
    pnpm build
    ```

### Environment Variables
For AI features (automated word fixes), you can set defaults in a `.env` file:
*   `VITE_AI_ENDPOINT`: Your AI provider URL.
*   `VITE_AI_API_KEY`: Your API key.
*   `VITE_AI_MODEL`: Target model (e.g., `gemini-1.5-flash`).

---

## 🛡️ Privacy & Security

Shukr is **Offline-First and Local-Only**.
*   **Privacy by Design:** Your voice recordings, custom words, and camera data never touch a server.
*   **Local AI:** All gesture recognition happens on your local GPU/CPU.
*   **No Tracking:** We do not include any third-party tracking or telemetry.
