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
}

export class GoogleMapsWrapper {
  private browser: Browser | null = null;
  private page: Page | null = null;

  async init() {
    try {
      this.browser = await chromium.launch({ headless: false }).catch(err => {
        throw new Error("BROWSER_SERVICE_NOT_FOUND: 無法啟動或連接 OpenClaw Browser 控制服務。請檢查後台服務狀態。");
      });
      this.page = await this.browser.newPage();
    } catch (error: any) {
      throw new Error(`INITIALIZATION_FAILED: 瀏覽器初始化失敗。原因: ${error.message}`);
    }
  }

  /**
   * 嚴格連線檢查，不自動修復。
   */
  private async ensureActiveSession() {
    if (!this.browser || !this.page) {
      throw new Error("SESSION_NOT_INITIALIZED: 瀏覽器尚未初始化，請先呼叫 init()。");
    }
    if (this.page.isClosed()) {
      throw new Error("BROWSER_TAB_CLOSED: 目標分頁已關閉，連線中斷。");
    }
    // 檢查 CDP 連線可用性
    try {
      await this.page.evaluate(() => window.location.href);
    } catch (e) {
      throw new Error("BROWSER_CONTROL_LOST: 無法與瀏覽器通訊，控制服務可能已崩潰或失聯。");
    }
  }

  async listCollections(): Promise<Collection[]> {
    await this.ensureActiveSession();
    
    try {
      if (!this.page!.url().includes("google.com/maps/save")) {
        await this.page!.goto("https://www.google.com/maps/save", { timeout: 30000 });
      }
      await this.page!.waitForSelector('role=tab[name="清單"]', { timeout: 10000 });

      return await this.page!.evaluate(() => {
        const items = Array.from(document.querySelectorAll('button[role="button"]'));
        return items
          .map(item => {
            const text = item.textContent || "";
            const match = text.match(/(.+) (私人|已分享)·(\d+) 個地點/);
            if (match) {
              // 嘗試從 data-list-id 或 href 中提取 ID
              // Google Maps 清單按鈕通常包裹在包含 ID 的容器中
              const container = item.closest('[data-list-id]');
              const id = container ? container.getAttribute('data-list-id') : null;
              
              if (!id) {
                throw new Error(`ID_EXTRACTION_FAILED: 無法從清單 "${match[1].trim()}" 中提取必要的 ID。`);
              }
              
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
      // 嚴格根據 ID 定位元素，不使用名稱模糊匹配
      const selector = `[data-list-id="${collectionId}"]`;
      await this.page!.waitForSelector(selector, { timeout: 10000 }).catch(() => {
        throw new Error(`COLLECTION_NOT_FOUND: 找不到 ID 為 "${collectionId}" 的清單。`);
      });
      await this.page!.click(selector);
      await this.page!.waitForSelector('main', { timeout: 10000 });

      return await this.page!.evaluate(() => {
        const items = Array.from(document.querySelectorAll('div[role="region"] button[role="button"]'));
        return items
          .map(item => {
            const name = item.querySelector('div')?.textContent || item.textContent || "";
            const statusMatch = document.body.innerText.match(/(已歇業|暫停營業|營業中)/);
            const status = statusMatch ? statusMatch[0] : "未知";
            return {
              name: name.trim(),
              url: window.location.href,
              status: status
            };
          })
          .filter(p => p.name.length > 0 && !p.name.includes("更多選項") && !p.name.includes("分享"));
      });
    } catch (error: any) {
      throw new Error(`PLACE_FETCH_FAILED: 擷取地點失敗 (ID: ${collectionId})。原因: ${error.message}`);
    }
  }

  async close() {
    if (this.browser) await this.browser.close();
  }
}
