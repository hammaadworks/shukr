# Contributing to Shukr

First off, thank you for considering contributing to Shukr! It's people like you that make Shukr such a great tool for the community. This guide will help you get started with the contribution process.

---

## 🛠️ Development Environment

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [pnpm](https://pnpm.io/) (Recommended)

### Setup
1.  **Fork the Repo:** Create your own copy of the repository.
2.  **Clone Locally:** `git clone https://github.com/YOUR_USERNAME/shukr.git`
3.  **Install Dependencies:** `pnpm install`
4.  **Start Dev Server:** `pnpm dev`

---

## 📝 Coding Standards

To maintain a high level of code quality, we follow these guidelines:

### 1. TypeScript & Types
- All new code must be written in **TypeScript**.
- Avoid using `any`. Define proper interfaces and types.
- Ensure your code passes the linter: `pnpm lint`.

### 2. Component Structure
- Use **Functional Components** with hooks.
- Keep components small and focused on a single responsibility.
- Use **CSS Modules** for styling to avoid global class name collisions.

### 3. Clean Code Principles
- Use descriptive variable and function names.
- Follow the **DRY** (Don't Repeat Yourself) principle.
- Write meaningful comments for complex logic.

### 4. Accessibility (a11y)
- Shukr is for people with mobility and speech challenges. Ensure all new features are accessible via keyboard and screen readers.
- Provide proper `aria-label` attributes for buttons and interactive elements.

---

## 🚀 The Pull Request Process

1.  **Create a Branch:** `git checkout -b feature/your-feature-name` or `bugfix/your-fix-name`.
2.  **Make Your Changes:** Follow the coding standards above.
3.  **Commit with Clarity:** Use descriptive commit messages (e.g., `feat: add mouth-open gesture for selection`).
4.  **Push and Open PR:** Push your branch and open a Pull Request against the `main` branch of the original repository.
5.  **Review:** A maintainer will review your PR and may suggest changes. Once approved, it will be merged!

---

## 🐛 Bug Reports & Feature Requests

### Reporting a Bug
Before reporting a bug, check the [existing issues](https://github.com/hammaadworks/shukr/issues) to see if it has already been reported. When opening an issue, please include:
- A clear, descriptive title.
- Steps to reproduce the issue.
- Expected vs. actual behavior.
- Browser and OS details.

### Suggesting a Feature
We love new ideas! When suggesting a feature, please explain:
- What the feature is.
- Why it would be useful.
- How you imagine it working.

---

## 📄 License
By contributing to Shukr, you agree that your contributions will be licensed under the [MIT License](../LICENSE).

---

Thank you for helping us make communication more accessible for everyone! ❤️
