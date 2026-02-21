# My Places MCP

Google 地圖「已儲存地點」提取工具。讓 AI 能夠讀取您在 Google Maps 上分類的地點清單與詳細資訊。

## 核心功能

### 1. 獲取所有清單 (`list_all_collections`)
- **用途**：列出您帳號中所有的地點清單（如：想去的地點、喜愛的地點、自定義旅遊清單）。
- **輸入**：無。
- **輸出**：清單物件陣列，每個物件包含：
  - `name`: 清單名稱（作為後續查詢的關鍵字）。
  - `type`: 類型（`want_to_go` 想去、`starred` 加星、`favorites` 喜愛、`custom` 自定義）。
  - `count`: 地點總數。
  - `visibility`: 隱私狀態（私人、已分享）。

### 2. 獲取清單內地點 (`get_places_from_collection`)
- **用途**：進入特定清單並抓取其中所有的地點詳細資料。
- **參數要求**：
  - `collectionName`: (String, 必需)。請務必傳入從 `list_all_collections` 獲取的精確 `name` 字串。例如：`"想去的地點"` 或 `"2025清邁"`。
- **輸出**：地點物件陣列，每個物件包含：
  - `name`: 地點名稱。
  - `url`: Google Maps 搜尋網址。
  - `status`: 營業狀態（營業中、已歇業、暫停營業、未知）。
  - `category`: 地點類別（如：餐廳、咖啡廳）。

## 使用者操作流程
1. **環境準備**：確保您的 Chrome 瀏覽器已開啟並**登入 Google 帳號**。
2. **第一步**：執行 `list_all_collections` 找到您感興趣的清單名稱。
3. **第二步**：將該名稱傳入 `get_places_from_collection` 以獲取完整地點列表。系統會自動在瀏覽器中定位、捲動並抓取資料，您無需手動操作。

## 常見問題與異常處理
- **畫面跳轉中**：系統內建自動導航恢復機制。若重試 3 次失敗，會拋出 `NAVIGATING` 錯誤，此時請檢查 Chrome 是否被遮擋或卡住。
- **需要登入**：若傳回 `AUTH_REQUIRED`，請直接在 Chrome 視窗中完成登入，系統將於下次執行時自動接續。
- **找不到清單**：請確認傳入的 `collectionName` 與列表顯示的名稱完全一致（包含空白）。

## 安裝
```bash
npm install
npm run build
```
