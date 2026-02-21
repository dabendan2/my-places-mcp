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
      await this.page!.waitForSelector('div[role="main"]', { timeout: 15000 });

      const results = await this.page!.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button[aria-label*="地點"]'));
        return buttons
          .map(btn => {
            const label = btn.getAttribute('aria-label') || "";
            const match = label.match(/(.+) (私人|已分享|已公開)·(\d+) 個地點/);
            if (match) {
              const parent = btn.parentElement;
              const id = btn.getAttribute('data-list-id') || 
                         (parent ? parent.getAttribute('data-list-id') : null);

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

      // 檢查是否每個清單都有 ID
      for (const col of results) {
        if (!col.id) {
          throw new Error(`ID_EXTRACTION_FAILED: 清單 "${col.name}" 缺少必要的 data-list-id。`);
        }
      }

      return results as Collection[];
    } catch (error: any) {
      if (error.message.includes("ID_EXTRACTION_FAILED")) throw error;
      throw new Error(`COLLECTION_FETCH_FAILED: 擷取清單失敗。原因: ${error.message}`);
    }
  }

  async getPlacesCount(collectionId: string): Promise<number> {
    await this.ensureActiveSession();
    try {
      if (!this.page!.url().includes("google.com/maps/save")) {
        await this.page!.goto("https://www.google.com/maps/save", { timeout: 30000 });
      }
      await this.page!.waitForSelector('div[role="main"]', { timeout: 15000 });

      return await this.page!.evaluate((id) => {
        const btn = document.querySelector(`button[data-list-id="${id}"], button[aria-label*="${id}"]`);
        if (!btn) throw new Error("COLLECTION_NOT_FOUND");
        const label = btn.getAttribute('aria-label') || "";
        const match = label.match(/·(\d+) 個地點/);
        return match ? parseInt(match[1], 10) : 0;
      }, collectionId);
    } catch (error: any) {
      if (error.message.includes("COLLECTION_NOT_FOUND")) {
        throw new Error(`COLLECTION_NOT_FOUND: 找不到 ID 為 "${collectionId}" 的清單。`);
      }
      throw new Error(`COUNT_FETCH_FAILED: 無法取得清單地點總數 (ID: ${collectionId})。原因: ${error.message}`);
    }
  }

  async getPlaces(collectionId: string): Promise<Place[]> {
    await this.ensureActiveSession();

    const expectedCount = await this.getPlacesCount(collectionId);

    try {
      const selector = `button[data-list-id="${collectionId}"], button[aria-label*="${collectionId}"]`;
      await this.page!.waitForSelector(selector, { timeout: 10000 });
      await this.page!.click(selector);
      await this.page!.waitForSelector('div[role="main"]', { timeout: 15000 });

      const places = await this.page!.evaluate(() => {
        const items = Array.from(document.querySelectorAll('div[role="main"] button[aria-label]'));
        return items
          .map(item => {
            const name = item.getAttribute('aria-label') || "";
            if (name === "分享" || name === "新增地點" || name === "更多選項") return null;

            const parent = item.closest('div');
            const infoText = parent?.innerText || "";
            const statusMatch = infoText.match(/(已歇業|暫停營業|營業中|地點已不存在)/);
            
            // TDD: 若找不到狀態回傳 null 以便後續檢查
            const status = statusMatch ? statusMatch[0] : null;

            const categoryMatch = infoText.match(/(?:·\s*|)([\u4e00-\u9fa5a-zA-Z\s]+)$/m);
            // TDD: 若找不到類別回傳 null
            const category = categoryMatch ? categoryMatch[1].trim() : null;
            
            return {
              name: name,
              url: `https://www.google.com/maps/search/${encodeURIComponent(name)}`,
              status: status,
              category: category,
              note: "尚未實作附註完整解析"
            };
          })
          .filter((p) => p !== null && p.name.length > 0);
      });

      // 嚴格檢查狀態與類別
      for (const p of places) {
        if (!p!.status) throw new Error(`STATUS_PARSE_FAILED: 地點 "${p!.name}" 的狀態解析失敗。`);
        if (!p!.category) throw new Error(`CATEGORY_PARSE_FAILED: 地點 "${p!.name}" 的類別解析失敗。`);
      }

      if (places.length !== expectedCount) {
        throw new Error(`DATA_INCONSISTENCY: 擷取數量 (${places.length}) 與預期總數 (${expectedCount}) 不符。`);
      }

      return places as Place[];
    } catch (error: any) {
      if (error.message.includes("STATUS_PARSE_FAILED") || 
          error.message.includes("CATEGORY_PARSE_FAILED") ||
          error.message.includes("DATA_INCONSISTENCY")) {
        throw error;
      }
      throw new Error(`PLACE_FETCH_FAILED: 擷取地點失敗 (ID: ${collectionId})。原因: ${error.message}`);
    }
  }

  async close() {
    if (this.browser) await this.browser.close();
  }
}
