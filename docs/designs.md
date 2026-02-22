# My Places MCP 設計文檔

本文件描述 `my-places-mcp` 的架構設計與實現邏輯。

## 1. 核心目標
建立一個可靠的 MCP Server，能夠自動化操作瀏覽器，從 Google Maps 提取使用者的「已儲存地點」清單及其內容。

## 2. 系統架構

### 2.1 驅動層 (Execution Layer)
本服務不直接操作 Playwright 或 Puppeteer，而是透過 `openclaw browser` CLI 進行中轉。
*   **優點**：能夠直接利用 OpenClaw 已建立的瀏覽器 Profile、Cookie 狀態及多分頁管理機制。
*   **實作**：使用 Node.js `child_process.execSync` 呼叫 CLI 命令。

### 2.2 核心組件 (Core Components)
*   **PlaceService**: 主控邏輯，負責瀏覽器狀態檢查、Profile 選取、Display 偵測、命令調度及錯誤復原（重試機制）。
*   **GoogleMapsWrapper**: 腳本生成器，將複雜的 DOM 操作封裝為可在瀏覽器環境執行的 JavaScript 字串。
*   **SystemUtils**: 提供基礎設施支援，如 X11 Display 自動檢測與 CLI 輸出 JSON 的正規化清洗。

## 3. 關鍵流程 (Flows)

### 3.1 瀏覽器狀態自動修正 (Self-Healing)
當調用任何工具時，`PlaceService` 會執行以下檢查：
1.  **Profile 檢測**：尋找正在運行的 Profile。
2.  **分頁確保**：
    *   若有現成分頁：強制導航至 `google.com/maps`。
    *   若 Profile 運行中但無分頁：主動開啟新分頁。
    *   若 Profile 未運行：嘗試透過 X11 環境啟動 Google Chrome。

### 3.2 資料提取邏輯
*   **Auth Check**: 在操作前掃描 DOM，若發現「登入」字樣，立即中斷並回報 `AUTH_REQUIRED`。
*   **Sidebar Navigation**: 模擬點擊「已儲存」按鈕，並等待側邊欄 DOM 載入完全（採用指數退避或循環輪詢等待）。
*   **Data Parsing**: 在瀏覽器端完成 DOM 提取與物件封裝，僅回傳乾淨的 JSON。

## 4. 除錯與觀測 (Debuggability)
為了應對網頁 UI 頻繁變動，系統內建了強大的除錯捕獲機制：
*   **自動截圖**: 發生異常時，自動截取當前頁面。
*   **源碼備份**: 紀錄報錯當下的 HTML DOM，以便進行離線 CSS Selector 分析。
*   **集中管理**: 所有日誌存放於 `~/.my-places-mcp/debug/`。

## 5. 錯誤處理 (Error Handling)
系統定義了統一的 `ErrorCode`：
*   `AUTH_REQUIRED`: 需要登入。
*   `SIDEBAR_NOT_FOUND`: 無法找到已儲存地點面板。
*   `COLLECTION_NOT_FOUND`: 指定的清單名稱不存在。
*   `BROWSER_CONNECTION_FAILED`: 無法與 OpenClaw 瀏覽器建立連線。
*   `DATA_INCONSISTENCY`: 抓取到的數量與頁面顯示不符（資料庫未完全加載）。

## 6. 目錄結構規範
*   `/src/core/`: 存放不可變的業務邏輯。
*   `/src/utils/`: 存放平台相關工具。
*   `/bin/`: 存放生產環境的執行入口。
*   `/tests/`: 存放所有 Jest 測試用例。
*   `/examples/`: 存放開發過程中的功能驗證腳本。
