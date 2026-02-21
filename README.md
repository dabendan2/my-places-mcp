# my-places-mcp

A Model Context Protocol (MCP) server for managing personal places using OpenClaw Browser services.

## Overview
This project leverages OpenClaw's browser automation to interact with location-based services, allowing AI agents to retrieve and manage personal place lists and details.

## Features
- **取得清單列表**: 檢索所有已儲存的地點清單。
- **取得指定清單地點**: 傳回特定清單內的所有地點列表。
- **未來規劃**:
    - 編輯現有地點或清單。
    - 刪除地點。

## API 定義

### 資料結構
#### 地點清單 (Collection)
- `id`: 清單唯一識別碼
- `name`: 清單名稱
- `count`: 地點總數
- `visibility`: 隱私權狀態 (例如：私人、已分享、公開)

#### 地點物件 (Place)
- `name`: 地點名稱
- `url`: 地點超連結
- `status`: 營業狀態 (例如：營業中、已歇業、暫停營業、地點已不存在)
- `category`: 地點類別 (例如：拉麵、飯店、歷史地標)
- `note`: 使用者在清單中加入的附註內容

### Tools
- `list_all_collections()`: 取得所有地點清單（含 ID、名稱與地點數量）。
- `get_places_from_collection(collection_id: string)`: 根據清單 ID 取得該清單內的地點列表（含名稱、連結、狀態與附註）。

## Requirements
- OpenClaw with Browser service enabled.
