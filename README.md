# My Places MCP

Google 地圖「已儲存地點」提取工具。

## 核心功能

### 1. 獲取所有清單 (list_all_collections)
- **輸入**：無。
- **輸出**：清單資料 JSON。
- **資料包含**：名稱 (`name`)、類型 (`type`: 想去、加星、喜愛、自定義)、地點數量 (`count`)、隱私狀態 (`visibility`)。
- **特性**：內部自動呼叫 `openclaw browser` CLI 驅動 Chrome，具備自動導航恢復機制。

### 2. 獲取清單內地點 (get_places_from_collection)
- **輸入**：`collectionName` (清單名稱)。
- **輸出**：地點資料 JSON。
- **資料包含**：名稱、網址、營業狀態、類別。
- **特性**：自動定位清單並處理分頁捲動。

## 異常處理
- `AUTH_REQUIRED`：需於 Chrome 登入 Google 帳號。
- `COLLECTION_NOT_FOUND`：清單名稱不匹配，請確認名稱是否正確。
- `NAVIGATING`（內部已處理）：若自動導航重試 3 次後仍失敗，則會拋出此錯誤，建議檢查 Chrome 狀態。

## 安裝
```bash
npm install
npm run build
```
