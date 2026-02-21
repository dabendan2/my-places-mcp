# My Places MCP

專為 Google Maps 「已儲存地點」設計的 Model Context Protocol (MCP) Server。

## 🤖 Agent 執行指南 (SKILL)
當 AI Agent 使用此工具時，請遵循以下流程：

### 1. 獲取所有清單 (list_all_collections)
- **執行方式**：呼叫工具後，使用 `browser:act` (profile="chrome") 執行返回的腳本。
- **識別機制**：採用**名稱索引 (Name-based Indexing)**，不再使用不穩定的 `id`。
- **清單類型**：自動辨識 `type` 欄位（`want_to_go`, `starred`, `favorites`, `custom`）。
- **錯誤處理**：
  - `NAVIGATING`: 腳本正在引導至正確頁面，請等待並重新執行。
  - `AUTH_REQUIRED`: 需在 Chrome 登入 Google 帳號。

### 2. 獲取清單內地點 (get_places_from_collection)
- **參數要求**：需傳入 `collectionName`。
- **自動化特性**：腳本會根據名稱定位並**自動捲動**頁面以載入完整清單。
- **錯誤處理**：
  - `COLLECTION_NOT_FOUND`: 找不到該名稱的清單，請確認名稱是否正確。

---

## 🛠 功能特點
- **強健狀態恢復**：自動處理各種瀏覽器狀態（如詳情頁、編輯畫面），自動恢復至列表導航。
- **名稱基準定位**：適應 Google Maps UI 隱藏 `data-list-id` 的變更。
- **類型自動判定**：透過圖示 CSS 特徵自動分類清單。

## 🚀 安裝與執行
```bash
npm install
npm run build
```

## 🧪 測試
- `npm test`: 執行核心邏輯與錯誤代碼檢核。
