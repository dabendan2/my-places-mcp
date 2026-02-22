# My Places MCP Server

基於 Model Context Protocol (MCP) 的 Google Maps 地點清單獲取服務。本服務透過 `openclaw browser` CLI 實作自動化瀏覽器操作，能夠從使用者的 Google Maps 帳號中讀取儲存的地點集合（Collections）及其詳細地點資訊。

## 特色

- **自動導航**：自動確保瀏覽器分頁處於 Google Maps 並進入「已儲存」地點頁面。
- **權限檢查**：自動偵測登入狀態，若未登入將返回 `AUTH_REQUIRED` 錯誤。
- **高強健性**：內建 UI 元素等待與重試機制，適應網路波動或頁面加載延遲。
- **除錯友善**：發生錯誤時自動記錄截圖與 HTML 原始碼，方便快速定位問題。

## 系統需求

- **Node.js**: v18.0.0+
- **OpenClaw**: 已安裝並配置 `openclaw browser` CLI。
- **Google Chrome**: 需安裝於系統中（服務會自動嘗試啟動具備遠端除錯埠 18800 的實例）。
- **Display**: 需要 X11 環境（如 Ubuntu Desktop 或具備虛擬顯示器之環境）。

## 安裝

```bash
cd my-places-mcp
npm install
npm run build
```

## 使用工具 (Tools)

### 1. `list_all_collections`
獲取使用者帳號中所有儲存的地點清單（如：想去的地點、喜愛的地點、自定義清單）。
- **輸入參數**: 無
- **輸出範例**:
  ```json
  [
    { "name": "想去的地點", "type": "want_to_go", "visibility": "私人", "count": 12 },
    { "name": "2025 越南旅遊", "type": "custom", "visibility": "私人", "count": 8 }
  ]
  ```

### 2. `get_places_from_collection`
獲取特定清單內的詳細地點列表。
- **輸入參數**: 
  - `collection_id` (string, Required): 清單的名稱（如："想去的地點"）。
- **輸出範例**:
  ```json
  [
    {
      "name": "Ekkamai Bus Station",
      "url": "https://www.google.com/maps/search/Ekkamai%20Bus%20Station",
      "status": "營業中",
      "category": "巴士站",
      "note": "名稱索引版自動提取"
    }
  ]
  ```
- **核心機制**:
  - **自動滾動**: 針對長清單，服務會自動模擬滾動操作以觸發延遲載入。
  - **數量校驗**: 抓取完成後會比對頁面顯示的總數，若數量不符將拋出 `DATA_INCONSISTENCY` 錯誤以確保資料完整性。
  - **狀態偵測**: 自動提取地點的營業狀態（如：已歇業、營業中）與類別。

## 除錯 (Debug)

若要開啟詳細除錯日誌，請設置環境變數：
```bash
DEBUG=true
```

開啟後，所有除錯資訊將輸出至 `~/.my-places-mcp/debug/` 目錄：
- `last_error_screenshot.png`: 發生錯誤時的網頁截圖。
- `last_error_page_source.html`: 發生錯誤時的 DOM 原始碼。
- `cli_exec_error.log`: 原始 CLI 執行錯誤訊息。
- `browser_evaluate_raw_response.json`: 瀏覽器返回的原始資料。
- `last_places_result.json`: 最近一次成功獲取的資料快照。

## 專案結構

- `src/core/`: 核心邏輯（服務類與瀏覽器封裝）。
- `src/utils/`: 系統工具（X11 檢測、JSON 清洗）。
- `tests/`: Jest 單元與整合測試。
- `bin/`: 獨立執行的 CLI 腳本入口。
- `examples/`: 開發範例與功能測試腳本。

## 測試

執行完整測試套件：
```bash
npm test
```
