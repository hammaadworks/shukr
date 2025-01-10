# Shukr: Adaptive Multi-Language AAC 🌙

**Shukr** (Arabic: "Gratitude") is a modern, offline-first Augmentative and Alternative Communication (AAC) platform. Born out of a desire to help seniors with speech challenges, it is now an **open-source mission** to provide accessible communication for everyone, everywhere. 

While it features an **Urdu-first** and **gesture-driven** design, it is built to be deeply localized for any language, region, or cultural context.

[![Vercel Deployment](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)](https://shukr.vercel.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

![Shukr Banner](shukr_shots/hero.png)

## ✨ Features

-   🌍 **Multi-Language Support:** Originally Urdu-first, it is designed for global localization. Switch between Urdu (Nastaliq script) and English seamlessly, or add your own!
-   🖐️ **Gesture Recognition:** Control the app without touching the screen. Use face and hand gestures (Mouth Open, Pointing) to navigate and select words.
-   🎨 **Doodle Mode:** Communicate through sketches and hand-drawn symbols, powered by local machine learning.
-   🎙️ **Voice Studio:** Record custom voices for family members to make communication feel personal and familiar.
-   🧠 **Adaptive Prediction:** Learns from user habits to suggest the most likely next word based on historical usage and time of day.
-   👂 **Ambient Listener:** Voice-activated navigation and triggers for hands-free operation.
-   💾 **Offline-First (PWA):** Works entirely offline once installed. Secure, private, and local-only data storage.
-   📁 **Data Portability:** Export and import your entire configuration (Universe Porter) to sync across devices effortlessly.

## 🚀 Getting Started

### For Users (Installation)
The easiest way to use Shukr is to visit the [Live App](https://shukr.vercel.app) and "Add to Home Screen" to install it as a PWA on your Android or iOS device.

### For Developers (Setup)
```bash
git clone https://github.com/hammaadworks/shukr.git
cd shukr
pnpm install
npm run dev
```

## 📖 Documentation

Explore our extensive documentation to get the most out of Shukr:

-   **[Architecture Overview](./docs/architecture.md)**: Deep dive into the technical design.
-   **[Design System](./docs/design-system.md)**: UI/UX principles, typography, and color palette.
-   **[Getting Started](./docs/getting-started.md)**: Setup guide for users and developers.
-   **[Language Management](./docs/language-management.md)**: How the Dual-Language system works and adding new languages.
-   **[Customization Guide](./docs/customization.md)**: How to add new categories, regional content, and styling.
-   **[Gesture Control Guide](./docs/features/gestures.md)**: Learn how to control Shukr with face and hands.
-   **[Doodle Mode](./docs/features/doodle.md)**: Sketch-based communication and training.
-   **[Voice Studio](./docs/features/voice-studio.md)**: Managing custom voice recordings.
-   **[Deployment & PWA](./docs/deployment.md)**: How to host and install Shukr.
-   **[Contribution Guidelines](./docs/CONTRIBUTING.md)**: How to help improve Shukr.

## 🤝 Contributing & Global Reach

Shukr is an open project dedicated to ALLAH SWT and His beloved Rasool SAW. Our goal is to ensure that anyone lacking speech, regardless of their language or region, can benefit from this platform. 

We welcome contributions! Whether it's:
1.  **Localizing** for a new language (Spanish, Arabic, Bengali, etc.).
2.  **Adapting** categories for different regions/cultures.
3.  **Improving** accessibility for specific mobility needs.

Please check our [Contributing Guide](./docs/CONTRIBUTING.md) to get started.

## 📄 License

This project is licensed under the [MIT License](./LICENSE).

---

Built with ❤️ by [hammaadworks](https://github.com/hammaadworks)
