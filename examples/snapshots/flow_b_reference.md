# Google Maps Flow B Analysis (2026-02-23)

## Environment
- Profile: `openclaw`
- Language: Traditional Chinese (zh-TW)
- UI State: "Your Places" > "Lists" tab

## Selector Observations

### 1. List Item Button
- **Tag**: `button`
- **Class**: `CsEnBe` (Note: In some sessions, this might be present even in Flow B)
- **Structure**:
  - Container: `div.AeaXub`
  - Name: `div.Io6YTe` (Text: "想去的地點")
  - Metadata: `div.gSkmPd` (Text: "私人·725 個地點")

### 2. Version Detection
- **Flow A (Legacy)**: Container `div[role="main"]`
- **Flow B (Modern)**: Container `div.m6QErb.dS8AEf.XiKgde` (specifically looking for `XiKgde` class)

### 3. Data Extraction (JavaScript Logic)
```javascript
const btn = document.querySelector('button.CsEnBe');
const name = btn.querySelector('.Io6YTe').innerText.trim();
const meta = btn.querySelector('.gSkmPd').innerText.trim(); // "私人·725 個地點"

const visibility = meta.split('·')[0]; // "私人"
const count = parseInt(meta.match(/(\d+)/)[1], 10); // 725
```

## Captured Evidence
- Snapshot text: `examples/snapshots/google_maps_flow_b_20260223.txt`
- Screenshot: `examples/snapshots/google_maps_flow_b_20260223.png`
