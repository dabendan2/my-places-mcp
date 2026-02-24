# Google Maps Flow Analysis: A vs B

This document details the critical differences between the legacy layout (Flow A) and the modern dynamic layout (Flow B) observed in Google Maps.

## 1. Top-Level Comparison

| Feature | Flow A (Legacy) | Flow B (Modern) |
| :--- | :--- | :--- |
| **Navigation** | Uses internal AJAX updates (SPA behavior). | Triggers full or heavy URL navigation on collection click. |
| **Sidebar** | Explicit `div[role="main"]` exists. | `role="main"` is often absent or unpopulated in detail view. |
| **Container** | Static sidebar nesting. | Flattened, nested `div.XiKgde` and `div.WNBkOb` layers. |
| **Rendering** | Standard scrollable list. | Aggressive **Virtual Scroll** (DOM nodes recycled). |

---

## 2. Page Transition Flow

### Flow A (Side-Panel Mode)
1. **Initial**: User is on `google.com/maps/`.
2. **Action**: Click "Saved" button.
3. **Result**: Side panel slides out containing list of collections.
4. **Detail**: Click a collection (e.g., "Want to go"). The same side panel updates its content.
5. **DOM**: Container remains within `div[role="main"]`.

### Flow B (Navigation Mode)
1. **Initial**: User could be anywhere (even non-Maps URLs).
2. **Action**: `navigate` to `google.com/maps/`.
3. **Transition**: URL contains unique hashes (e.g., `/data=!4m6!1m2...`).
4. **Detail**: Click a collection. The browser triggers a **URL navigation**. The context may be destroyed/re-created.
5. **DOM**: Legacy sidebar is replaced by a full-height `div.m6QErb.dS8AEf.XiKgde`.

---

## 3. Critical Detection & Scraper Logic

### Key Identifiers (CSS / InnerText)
*   **Standard Collections**: Don't rely solely on names (localized). Use `google-symbols` innerText:
    *   `` : Want to go
    *   `` : Favorites
    *   `` : Starred
*   **Scroll Container (Flow B)**: `div.m6QErb.dS8AEf.XiKgde` is the most stable target for `scrollBy`.

### The "Incremental" Scraping Strategy
**Mandatory for Flow B** due to Virtual Scroll node recycling:
1.  **Don't** wait to scroll to the bottom.
2.  **Do** use a `Map` in memory.
3.  **Step**: 
    *   Capture visible `button.SMP2wb` elements.
    *   Extract `{name, url, category}`.
    *   Add to `Map` using `name` or `url` as the key.
    *   Scroll down by ~1000px.
    *   Wait for rendering (1-2s).
    *   Repeat until target count (e.g., 100) or no new items found.

---

## 4. Known Instability Factors
*   **Execution Context**: Avoid `window.location.href` inside `evaluate`. Use CLI `navigate` to ensure a clean state.
*   **Gateway Timeouts**: Large scripts in a single `evaluate` trigger timeouts. Split logic into:
    1.  `navigate`
    2.  `evaluate` (Click Entry)
    3.  `evaluate` (Incremental Scrape Loop)
*   **Port Collision**: Ensure serial execution to avoid `Port 18800 in use`.
