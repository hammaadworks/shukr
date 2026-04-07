# Shukr Unified Design System (MASTER)

## 1. Project Context
**Project:** Shukr (Adaptive AAC)
**User Persona:** Pious Muslim Indian lady (Naani) with speech loss and shingles.
**Target Device:** Samsung / Android Mobile (High Aspect Ratio).
**Mood:** Empathetic, Spiritual, Warm, Premium, Accessible.

## 2. Core Style Guide

### 2.1 Color Palette
| Role | Hex | CSS Variable | Usage |
|------|-----|--------------|-------|
| Primary | `#2D5A27` | `--color-primary` | Sage Green - Calming, Spiritual |
| Accent | `#D4AF37` | `--color-accent` | Soft Gold - Empathy, Warmth |
| Background| `#FDFBF7` | `--color-bg` | Warm Cream - Tactile, Comfortable |
| Surface | `#FFFFFF` | `--color-surface` | Pure White - Cleanliness |
| Text | `#1F2937` | `--color-text` | Charcoal - High Contrast |
| Muted | `#6B7280` | `--color-text-muted`| Soft Gray - Low Priority |
| Danger | `#DC2626` | `--color-danger` | Alert Red - Urgent Health |

### 2.2 Typography
- **Primary Font:** `Inter` (Sans-serif) - Modern, clear.
- **Urdu Font:** `Noto Nastaliq Urdu` - Beautiful, high legibility.
- **Rules:**
  - Base English: `18px`.
  - Base Urdu: `24px` (1.2x - 1.5x multiplier).
  - Mood: Compassionate, large, bold.

### 2.3 Visual Primitives
- **Radius:** `24px` (Radius-Empathy) - Soft, no sharp edges.
- **Shadow:** `0 10px 25px -5px rgba(45, 90, 39, 0.1)` (Shadow-Soft).
- **Glassmorphism:** `backdrop-filter: blur(15px); background: rgba(255, 255, 255, 0.8)`.

## 3. Layout Patterns (Android Optimized)
- **Viewport:** `100dvh` (No overflow).
- **Instagram Story Style:** Circular/Rounded-square categories at the top.
- **Tactile Grid:** 2-column word cards for senior accessibility.
- **Sentence Dock:** Glassmorphic container in the top "Comfort Zone."

## 4. Anti-Patterns
- ❌ No sterile "medical" blue/white clinical themes.
- ❌ No tiny text or low-contrast Meta descriptions.
- ❌ No vertical overflow on main screens.
- ❌ No harsh borders or sharp corners.

## 5. Local Governance
All future components and styles MUST align with this MASTER file to maintain brand empathy and technical integrity.
