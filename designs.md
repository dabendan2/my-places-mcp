# Design Document - my-places-mcp

## 實作原理
本專案透過 MCP Server 介面，封裝 OpenClaw Browser 的自動化能力，以獲取 Google Maps 的私人地點資料。

## OpenClaw Browser CLI Wrapper 功能需求
為了讓 MCP Server 能穩定獲取資料，Wrapper 應包含以下功能：

### 1. Session 管理 (Session Persistence)
- 使用 `profile: "chrome"` 以重用使用者的登入狀態，避免處理複雜的登入驗證。
- 自動檢查當前 Tab 是否已在目標網域 (`google.com/maps`)。

### 2. 頁面導航與狀態掃描 (Navigation & State Scanning)
- `navigate_to_saved()`: 直接導航至 `https://www.google.com/maps/save`。
- `ensure_list_view()`: 確保「清單」分頁處於 active 狀態。

### 3. 資料擷取 (Data Extraction)
- `extract_collections()`: 
    - 掃描 DOM 中的 `tabpanel`。
    - 擷取清單名稱、地點數量（解析字串如 "私人·724 個地點"）及存取權限。
- `extract_places(collection_id)`:
    - 點擊指定清單進入詳細頁面。
    - **無限捲動處理**：地點清單為動態載入，需實作捲動觸發載入邏輯。
    - 屬性擷取：
        - `name`: 標題文字。
        - `url`: 擷取 `<a>` 標籤的 `href` 或點擊後擷取當前 URL。
        - `status`: 辨識關鍵字如「已歇業」、「暫停營業」、「營業中」。

### 4. 異常處理 (Error Handling)
- 處理元素未找到 (Element Not Found) 錯誤。
- 處理網路逾時 (Timeout)。
- 偵測是否被引導至登入頁面（若 Session 失效）。

## API 流程圖
1. `list_all_collections` -> `browser.open` -> `browser.snapshot` -> 解析清單 -> 回傳 JSON。
2. `get_places_from_collection` -> `browser.act(click)` -> `browser.snapshot(scroll)` -> 解析地點 -> 回傳 JSON。
