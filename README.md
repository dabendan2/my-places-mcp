# My Places MCP

專為 Google Maps 「已儲存地點」設計的 Model Context Protocol (MCP) Server。具備自動捲動技術，可完整提取長清單資料。

## 🤖 Agent 執行指南 (SKILL)
當 AI Agent 使用此工具時，請遵循以下流程：

### 1. 獲取所有清單 (list_all_collections)
- **執行方式**：呼叫工具後，使用 `browser:act` (profile="chrome") 執行返回的腳本。
- **錯誤處理**：
  - `NAVIGATING`: 腳本正在導航，請等待 3 秒後重新執行。
  - `AUTH_REQUIRED`: 提示使用者需先在 Chrome 登入 Google 帳號。

### 2. 獲取清單內地點 (get_places_from_collection)
- **自動化特性**：腳本會**自動捲動**頁面以載入完整清單。
- **錯誤處理**：
  - `DATA_INCONSISTENCY`: 抓取數量與標題不符，請重新執行以繼續捲動。

---

## 🛠 功能特點
- **全自動導航**：自動開啟並切換至「已儲存」側欄。
- **動態捲動載入**：自動處理 Google Maps 動態載入，確保大型清單提取完整。
- **嚴謹校驗**：內建錯誤代碼規範，確保資料與標題吻合。

## 🚀 安裝與執行

### 開發環境
```bash
npm install
npm run build
```

### MCP 設定 (openclaw.json)
```json
{
  "mcpServers": {
    "my-places": {
      "command": "node",
      "args": ["/absolute/path/to/my-places-mcp/dist/index.js"]
    }
  }
}
```

## 🧪 測試
- `npm test`: 執行核心邏輯與錯誤代碼驗證。
- `npm run test:coverage`: 查看測試覆蓋率報表（核心模組 100% 覆蓋）。

## 授權
MIT
