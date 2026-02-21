# My Places MCP Server

此伺服器用於提取 Google Maps 中的儲存地點清單。

## 使用前要求

1. **OpenClaw Gateway**: 需確保 OpenClaw Gateway 正在執行。
2. **瀏覽器分頁**: 需開啟一個掛載了 **OpenClaw Browser Relay** 的 Chrome/Chromium 分頁（Badge 顯示 ON）。
3. **Google 帳號**: 需在該分頁完成 Google 帳號登入。

## 使用方法

### 1. 獲取所有清單 `list_all_collections`
列出帳號下所有已儲存的地點清單。

- **回傳範例**:
  ```json
  [
    { "id": "list_abc123", "name": "清單名稱", "count": 12, "visibility": "私人" }
  ]
  ```

### 2. 獲取地點清單 `get_places_from_collection`
獲取指定清單內的詳細地點資訊。

- **參數**: `collection_id` (必填) - 由 `list_all_collections` 取得的 `id`。
- **回傳範例**:
  ```json
  [
    { 
      "name": "地點名稱", 
      "url": "https://www.google.com/maps/search/...", 
      "status": "營業中", 
      "category": "餐廳"
    }
  ]
  ```

## 錯誤代碼說明

### 系統層級
- `BROWSER_CONTROL_FAILED`: 無法連線至 OpenClaw 瀏覽器控制服務或分頁已關閉。
- `NAVIGATING`: 正在自動導向至 Google Maps 網域，需重新執行腳本。
- `SIDEBAR_NOT_FOUND`: 無法自動定位或開啟 Google Maps 的「已儲存」側欄。

### 業務邏輯層級
- `AUTH_REQUIRED`: 偵測到 Google 登入頁面，需使用者手動登入。
- `COLLECTION_NOT_FOUND`: 在目前頁面找不到指定的清單 ID。
- `PARSE_ERROR`: 清單按鈕格式不符嚴格正則表達式。
- `MISSING_ID`: 清單項目缺失關鍵的 `data-list-id`。
- `STATUS_MISSING`: 地點資訊中解析不到「營業狀態」。
- `CATEGORY_MISSING`: 地點資訊中解析不到「地點類別」。
- `DATA_INCONSISTENCY`: 實際抓取的地點數量與清單標示的總數不符。
