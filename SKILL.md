# My Places MCP Skill

Google Maps 「已儲存地點」提取工具。

## 核心流程

### 1. 獲取所有清單 (list_all_collections)
- **觸發時機**：使用者詢問有哪些清單或地點分類時。
- **執行方式**：呼叫 `list_all_collections`，獲取腳本後使用 `browser:act` (profile="chrome") 執行。
- **錯誤處理**：
  - `NAVIGATING`: 腳本正在導航，請等待 3 秒後重新執行腳本。
  - `AUTH_REQUIRED`: 提示使用者需先在 Chrome 登入 Google 帳號。

### 2. 獲取清單內地點 (get_places_from_collection)
- **觸發時機**：已知清單 ID，需列出具體地點資訊時。
- **執行方式**：呼叫 `get_places_from_collection(collection_id)`，使用 `browser:act` (profile="chrome") 執行腳本。
- **自動化特性**：此腳本會**自動捲動**頁面以載入完整清單，預期執行時間較長。
- **錯誤處理**：
  - `DATA_INCONSISTENCY`: 抓取數量與標題不符，通常是因為捲動未完成，請重試。

## 最佳實踐
- 始終使用 `profile="chrome"` 以複用使用者的登入 Session。
- 提取地點後，優先顯示地點名稱、類別與狀態。
