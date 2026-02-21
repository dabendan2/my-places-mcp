export interface Collection {
  id: string;
  name: string;
  count: number;
  visibility: string;
}

export interface Place {
  name: string;
  url: string;
  status: string;
  category: string;
  note: string;
}

/**
 * GoogleMapsWrapper (OpenClaw Full-Auto Strict Edition)
 * 具備完整自動化導航路徑，並保持解析結果的絕對嚴謹。
 */
export class GoogleMapsWrapper {
  get navigationUrl() {
    return "https://www.google.com/maps/";
  }

  /**
   * 生成具備「自動搜尋入口」功能的腳本
   */
  get listCollectionsScript() {
    return `(async () => {
      const sleep = m => new Promise(r => setTimeout(r, m));

      // 1. 確保位於 Google Maps
      if (!window.location.hostname.includes("google.com")) {
        window.location.href = "https://www.google.com/maps/";
        return "NAVIGATING";
      }

      // 2. 嘗試開啟「已儲存」側欄 (若未開啟)
      let sidebar = document.querySelector('div[role="main"]');
      if (!sidebar || !document.body.innerText.includes("已儲存")) {
        const savedBtn = Array.from(document.querySelectorAll('button')).find(b => 
          b.innerText.includes('已儲存') || b.getAttribute('aria-label')?.includes('已儲存')
        );
        
        if (savedBtn) {
          savedBtn.click();
        } else {
          // 嘗試透過漢堡選單
          const menuBtn = document.querySelector('button#searchbox-hamburger') || document.querySelector('button[aria-label*="選單"]');
          if (menuBtn) {
            menuBtn.click();
            await sleep(1000);
            const menuSavedBtn = Array.from(document.querySelectorAll('span, button')).find(el => 
              el.innerText.includes('您的地點') || el.innerText.includes('已儲存')
            );
            if (menuSavedBtn) menuSavedBtn.click();
          }
        }
        await sleep(2000); // 等待側欄渲染
        sidebar = document.querySelector('div[role="main"]');
      }

      // 3. 偵測登入狀態
      if (document.body.innerText.includes("登入") && document.body.innerText.includes("帳號")) {
        throw new Error("AUTH_REQUIRED: 偵測到未登入狀態。");
      }

      if (!sidebar) throw new Error("SIDEBAR_NOT_FOUND: 無法自動開啟「已儲存」側欄。");

      // 3. 嚴格解析
      const buttons = Array.from(sidebar.querySelectorAll('button[aria-label*="地點"]'));
      return buttons.map(btn => {
        const label = btn.getAttribute('aria-label') || "";
        const match = label.match(/^(.+) (私人|已分享|已公開)·(\\d+) 個地點$/);
        
        if (!match) throw new Error("PARSE_ERROR: 清單格式異常 (" + label + ")");

        const id = btn.getAttribute('data-list-id');
        if (!id) throw new Error("MISSING_ID: 清單 " + match[1] + " 缺少 data-list-id。");

        return {
          id: id,
          name: match[1].trim(),
          visibility: match[2],
          count: parseInt(match[3], 10)
        };
      });
    })()`;
  }

  getPlacesScript(collectionId: string) {
    return `(async () => {
      const sleep = m => new Promise(r => setTimeout(r, m));

      // 1. 確保位於 Google Maps
      if (!window.location.hostname.includes("google.com")) {
        window.location.href = "https://www.google.com/maps/";
        return "NAVIGATING";
      }

      // 2. 尋找並進入清單 (若不在該清單內)
      let listBtn = document.querySelector('button[data-list-id="' + collectionId + '"]');
      if (listBtn) {
        const label = listBtn.getAttribute('aria-label') || "";
        const match = label.match(/·(\\d+) 個地點$/);
        const expectedCount = match ? parseInt(match[1], 10) : 0;

        listBtn.click();
        await sleep(2000);

        // 3. 抓取地點
        const items = Array.from(document.querySelectorAll('div[role="main"] button[aria-label]'));
        const places = items.map(item => {
          const name = item.getAttribute('aria-label') || "";
          if (["分享", "新增地點", "更多選項"].includes(name)) return null;

          const parent = item.closest('div');
          const infoText = parent?.innerText || "";
          
          const statusMatch = infoText.match(/(已歇業|暫停營業|營業中|地點已不存在)/);
          const categoryMatch = infoText.match(/(?:·\\s*|)([\\u4e00-\\u9fa5a-zA-Z\\s]+)$/m);

        if (!statusMatch) throw new Error("STATUS_MISSING: 地點 " + name + " 缺少營業狀態。");
        if (!categoryMatch) throw new Error("CATEGORY_MISSING: 地點 " + name + " 缺少類別資訊。");
          
          return {
            name: name,
            url: "https://www.google.com/maps/search/" + encodeURIComponent(name),
            status: statusMatch[0],
            category: categoryMatch[1].trim(),
            note: "自動化嚴格提取"
          };
        }).filter(p => p !== null);

        if (places.length !== expectedCount) {
          throw new Error("DATA_INCONSISTENCY: 數量不符 (抓取:" + places.length + ", 預期:" + expectedCount + ")");
        }
        return places;
      } else {
         throw new Error("COLLECTION_NOT_FOUND: 在目前頁面找不到 ID 為 " + collectionId + " 的清單。");
      }
    })()`;
  }
}
