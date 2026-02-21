# My Places MCP

Google 地圖「已儲存地點」提取工具。

## 核心功能

### 1. 獲取所有清單 (list_all_collections)
- **輸入**：無。
- **輸出**：清單資料 JSON（名稱、類型、數量、隱私）。
- **實作**：內部自動呼叫 `openclaw browser` CLI 驅動 Chrome。

### 2. 獲取清單內地點 (get_places_from_collection)
- **輸入**：`collectionName` (清單名稱)。
- **輸出**：地點資料 JSON（名稱、網址、狀態、類別）。
- **實作**：內部自動處理定位與捲動。

## 異常處理
- `NAVIGATING`: 頁面導航中，建議 3 秒後重試。
- `AUTH_REQUIRED`: 需於 Chrome 登入 Google 帳號。
- `COLLECTION_NOT_FOUND`: 清單名稱不匹配。

## 安裝
```bash
npm install
npm run build
```
