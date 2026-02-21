import { chromium, Browser, Page } from "playwright";

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

export class GoogleMapsWrapper {
  private browser: Browser | null = null;
  private page: Page | null = null;

  async init() {
    try {
      this.browser = await chromium.launch({ headless: false }).catch(err => {
        throw new Error("BROWSER_SERVICE_NOT_FOUND: 無法啟動或連接 OpenClaw Browser 控制服務。");
      });
      this.page = await this.browser.newPage();
    } catch (error: any) {
      throw new Error(`INITIALIZATION_FAILED: 瀏覽器初始化失敗。原因: ${error.message}`);
    }
  }

  private async ensureActiveSession() {
    if (!this.browser || !this.page) {
      throw new Error("SESSION_NOT_INITIALIZED: 瀏覽器尚未初始化。");
    }
    if (this.page.isClosed()) {
      throw new Error("BROWSER_TAB_CLOSED: 目標分頁已關閉。");
    }
    try {
      await this.page.evaluate(() => window.location.href);
    } catch (e) {
      throw new Error("BROWSER_CONTROL_LOST: 無法與瀏覽器通訊。");
    }
  }

  async listCollections(): Promise<Collection[]> {
    await this.ensureActiveSession();
    
    try {
      if (!this.page!.url().includes("google.com/maps/save")) {
        await this.page!.goto("https://www.google.com/maps/save", { timeout: 30000 });
      }
      // 等待清單面板加載
      await this.page!.waitForSelector('div[role="main"]', { timeout: 15000 });

      return await this.page!.evaluate(() => {
        // Google Maps 使用特定的按鈕結構展示清單
        const buttons = Array.from(document.querySelectorAll('button[aria-label*="地點"]'));
        return buttons
          .map(btn => {
            const label = btn.getAttribute('aria-label') || "";
            // 匹配格式: "清單名稱 私人·123 個地點" 或 "清單名稱 已分享·12 個地點"
            const match = label.match(/(.+) (私人|已分享|已公開)·(\d+) 個地點/);
            if (match) {
              // 從 JS 屬性或鄰近元素尋找唯一識別碼
              // 實測中，Google Maps 常將 ID 放在父級 div 的 data-實體屬性中
              const parent = btn.parentElement;
              const id = btn.getAttribute('data-list-id') || 
                         (parent ? parent.getAttribute('data-list-id') : null) || 
                         label.trim(); // Fallback to label only if ID extraction fails during dev

              return {
                id: id,
                name: match[1].trim(),
                visibility: match[2],
                count: parseInt(match[3], 10)
              };
            }
            return null;
          })
          .filter((c): c is Collection => c !== null);
      });
    } catch (error: any) {
      throw new Error(`COLLECTION_FETCH_FAILED: 擷取清單失敗。原因: ${error.message}`);
    }
  }

  async getPlaces(collectionId: string): Promise<Place[]> {
    await this.ensureActiveSession();

    try {
      if (!this.page!.url().includes("google.com/maps/save")) {
        await this.page!.goto("https://www.google.com/maps/save", { timeout: 30000 });
      }

      // 根據 ID 定位按鈕並點擊
      const selector = `button[data-list-id="${collectionId}"], button[aria-label*="${collectionId}"]`;
      await this.page!.waitForSelector(selector, { timeout: 10000 }).catch(() => {
        throw new Error(`COLLECTION_NOT_FOUND: 找不到 ID 為 "${collectionId}" 的清單。`);
      });
      await this.page!.click(selector);
      
      // 等待地點列表渲染
      await this.page!.waitForSelector('div[role="main"]', { timeout: 15000 });

      return await this.page!.evaluate(() => {
        // 尋找清單中的所有地點按鈕
        const items = Array.from(document.querySelectorAll('div[role="main"] button[aria-label]'));
        return items
          .map(item => {
            const name = item.getAttribute('aria-label') || "";
            // 排除控制按鈕
            if (name === "分享" || name === "新增地點" || name === "更多選項") return null;

            const parent = item.closest('div');
            const infoText = parent?.innerText || "";
            
            // 狀態解析
            const statusMatch = infoText.match(/(已歇業|暫停營業|營業中|地點已不存在)/);
            const status = statusMatch ? statusMatch[0] : "營業中"; // 預設為營業中

            // 類別解析 (通常在評分或價格之後，或在特定分隔符號後)
            // 格式範例: "4.4 顆星 · 拉麵" 或 "歷史地標"
            const categoryMatch = infoText.match(/(?:·\s*|)([\u4e00-\u9fa5a-zA-Z\s]+)$/m);
            const category = categoryMatch ? categoryMatch[1].trim() : "未知";
            
            return {
              name: name,
              url: window.location.href,
              status: status,
              category: category,
              note: "尚未實作附註完整解析"
            };
          })
          .filter((p): p is Place => p !== null && p.name.length > 0);
      });
    } catch (error: any) {
      throw new Error(`PLACE_FETCH_FAILED: 擷取地點失敗 (ID: ${collectionId})。原因: ${error.message}`);
    }
  }

  async close() {
    if (this.browser) await this.browser.close();
  }
}
