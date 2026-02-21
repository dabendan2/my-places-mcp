# My Places MCP

專為 Google Maps 「已儲存地點」設計的 Model Context Protocol (MCP) Server。具備自動捲動技術，可完整提取長清單資料。

## 功能特點
- **全自動導航**：自動開啟並切換至「已儲存」側欄。
- **動態捲動載入**：自動處理 Google Maps 的動態載入機制，確保大型清單（如數百個地點）提取完整。
- **嚴謹校驗**：內建 `DATA_INCONSISTENCY` 偵測，確保抓取數量與標題完全吻合。
- **環境複用**：支援 OpenClaw Chrome Profile，免去重複登入。

## 安裝與執行

### 開發環境
```bash
npm install
npm run build
```

### MCP 設定
在 `openclaw.json` 中加入：
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

## 測試
- `npm test`: 執行核心邏輯與錯誤代碼驗證。
- `npm run test:coverage`: 查看測試覆蓋率報表（核心模組 100% 覆蓋）。

## 授權
MIT
