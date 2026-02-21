# Design Document - My Places MCP Server

## Architecture: OpenClaw Native Mode (v0.2.3)

### Core Concept
Instead of managing a standalone Playwright instance, this server functions as a **Script Orchestrator**. It generates complex JavaScript payloads designed to be executed via OpenClaw's `browser` interface.

### Technical Implementation
1. **Dynamic Navigation**: Scripts detect `window.location` and handle cross-origin redirection to `google.com/maps`.
2. **UI Orchestration**: 
   - Uses `document.querySelector` and `innerText` filtering to find entry points (Saved buttons, Hamburger menu).
   - Implements `async/await` with `setTimeout` (aliased as `sleep`) to handle Google's dynamic DOM rendering.
3. **Strict Extraction**: 
   - **Regex Anchoring**: Matches exactly `^(.+) (私人|已分享|已公開)·(\d+) 個地點$`.
   - **ID Extraction**: Relies strictly on `data-list-id` for unique identification.
   - **Data Integrity**: Pre-calculates `expectedCount` from list headers and validates against the final results array.

### Error Handling Strategy
The server uses a **Fail-Fast** approach. No fallback parsing (like raw text splitting) is permitted to ensure data reliability.

### Development Flow
- **TDD Requirement**: Every new navigation or extraction logic must first have a validation check in `src/test-wrapper.ts`.
- **Build**: Uses `tsc` for TypeScript transpilation to `./dist`.
