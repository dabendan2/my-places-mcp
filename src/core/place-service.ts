import { execSync, spawnSync } from "child_process";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { ErrorCode, BROWSER_UTILS } from "./constants.js";
import { cleanJson, DEBUG_DIR } from "../utils/system.js";
import { BrowserManager } from "./browser-manager.js";

export class PlaceService {
  public _exec = execSync;
  public _spawn = spawnSync;
  private debug = process.env.DEBUG === "true";
  private browserManager: BrowserManager;

  constructor() {
    this.browserManager = new BrowserManager(this._exec, this.debug);
  }

  private runBrowserCmd(args: string, timeout = 60000): string {
    const { profile } = this.browserManager.checkBrowserStatus();
    const command = `openclaw browser --browser-profile ${profile} ${args} --timeout ${timeout}`;
    const result = this._spawn(command, { shell: true, encoding: 'utf8' } as any);
    const stdout = result.stdout?.toString() || "";
    const stderr = result.stderr?.toString() || "";
    if (result.status !== 0) throw new Error(stdout || stderr || "CLI_EXECUTION_FAILED");
    return stdout;
  }

  private evaluate(fn: string, targetId?: string, timeout = 60000): any {
    const targetArg = targetId ? `--target-id ${targetId}` : "";
    const escaped = fn.replace(/'/g, "'\\''");
    const stdout = this.runBrowserCmd(`evaluate ${targetArg} --fn '${escaped}' --json`, timeout);
    const parsed = JSON.parse(cleanJson(stdout));
    if (!parsed.ok) throw new Error(parsed.error || "EVALUATE_FAILED");
    return parsed.result;
  }

  private captureDebugInfo(profile: string, path: string, targetId?: string): void {
    try {
      const targetIdArg = targetId ? targetId : "";
      mkdirSync(path, { recursive: true });
      const screenshotOutput = this.runBrowserCmd(`screenshot ${targetIdArg}`);
      const mediaMatch = screenshotOutput.match(/MEDIA:\s*(.+)/);
      if (mediaMatch && mediaMatch[1]) {
        const resolvedPath = mediaMatch[1].trim().replace(/^~/, process.env.HOME || "/home/ubuntu");
        if (existsSync(resolvedPath)) this._exec(`cp "${resolvedPath}" "${path}/last_error_screenshot.png"`);
        else throw new Error(`File not found: ${resolvedPath}`);
      }
      const pageSource = this.evaluate(`() => document.documentElement.outerHTML`, targetId);
      writeFileSync(`${path}/last_error_page_source.html`, pageSource);
    } catch (e) {
      if (this.debug) console.error("DEBUG_CAPTURE_FAILED", e);
      throw e;
    }
  }

  async listAllCollections() {
    try {
      // 1. 強制導航 (適用 A/B)
      this.runBrowserCmd(`navigate "https://www.google.com/maps/"`);
      
      // 2. 獲取清單
      const collections = this.evaluate(`(async () => {
        ${BROWSER_UTILS}
        checkAuth();
        await navigateToSaved();
        const flow = detectFlow();
        if (flow === 'UNKNOWN') throw new Error("${ErrorCode.ERROR_UNKNOWN_FLOW}");
        
        // 元件化選取器 (XiKgde/WNBkOb 為 Flow B, role="main" 為 Flow A)
        const sidebars = Array.from(document.querySelectorAll('div.m6QErb.WNBkOb.XiKgde, div[role="main"]'));
        const sidebar = sidebars.find(s => s.offsetParent !== null) || sidebars[0];
        const buttons = Array.from(sidebar.querySelectorAll('button')).filter(b => 
            b.querySelector('.Io6YTe') || b.querySelector('.gSkmPd') || b.querySelector('.google-symbols')
        );
        
        return buttons.map(btn => {
          const name = btn.querySelector('.Io6YTe')?.innerText?.trim() || btn.innerText.split('\\n')[0];
          const sym = btn.querySelector('.google-symbols')?.innerText || "";
          let type = "custom";
          // 優先使用符號識別 (不分語系)
          if (sym === '' || name.includes("想去") || name.toLowerCase().includes("want to go")) type = "want_to_go";
          else if (sym === '' || name.includes("喜愛") || name.toLowerCase().includes("favorites")) type = "favorites";
          else if (sym === '' || name.includes("星號") || name.toLowerCase().includes("starred")) type = "starred";
          
          const meta = btn.querySelector('.gSkmPd')?.innerText || "";
          const countMatch = meta.match(/(\\d+)/);
          return { 
            name, 
            type, 
            count: countMatch ? parseInt(countMatch[1], 10) : -1, 
            visibility: meta.includes('·') ? meta.split('·')[0].trim() : "私人" 
          };
        });
      })()`);
      return { content: [{ type: "text" as const, text: JSON.stringify(collections, null, 2) }] };
    } catch (error: any) {
      if (this.debug) this.captureDebugInfo("openclaw", DEBUG_DIR);
      return { content: [{ type: "text" as const, text: `Error: ${error.message}` }], isError: true };
    }
  }

  async getPlacesFromCollection(collectionName: string) {
    const allPlaces = new Map();
    try {
      // 1. 強制重置導航 (確保在乾淨狀態)
      this.runBrowserCmd(`navigate "https://www.google.com/maps/"`);
      
      // 2. 進入清單 (分段執行 evaluate)
      this.evaluate(`(async () => {
        ${BROWSER_UTILS}
        await navigateToSaved();
        const btn = Array.from(document.querySelectorAll('button')).find(b => 
            b.innerText.includes("${collectionName}") || 
            (b.querySelector('.Io6YTe') && b.querySelector('.Io6YTe').innerText.includes("${collectionName}"))
        );
        if (btn) btn.click();
      })()`);
      
      // 3. 增量滾動抓取 (分多個 CLI evaluate 調用以防超時)
      for (let i = 0; i < 15; i++) {
        const batch: any[] = this.evaluate(`(async () => {
          const sleep = m => new Promise(r => setTimeout(r, m));
          // 定位滾動容器 (元件化支援 A/B)
          const scrollable = document.querySelector('div.m6QErb.dS8AEf.XiKgde') || 
                             document.querySelector('div.m6QErb[style*="overflow-y: auto"]') ||
                             document.querySelector('div.m6QErb.dS8AEf');
          
          const items = Array.from(document.querySelectorAll('button.SMP2wb')).map(el => ({
            name: el.querySelector('.Io6YTe')?.innerText?.trim() || el.innerText.split('\\n')[0].trim(),
            url: "https://www.google.com/maps/search/" + encodeURIComponent(el.innerText.split('\\n')[0].trim())
          }));
          
          if (scrollable) scrollable.scrollBy(0, 1000);
          await sleep(1500); 
          return items;
        })()`);
        
        batch.forEach(p => { 
          if (p.name && allPlaces.size < 100) allPlaces.set(p.name, p); 
        });
        if (allPlaces.size >= 100) break;
      }
      
      return { content: [{ type: "text" as const, text: JSON.stringify(Array.from(allPlaces.values()), null, 2) }] };
    } catch (error: any) {
      if (this.debug) this.captureDebugInfo("openclaw", DEBUG_DIR);
      return { content: [{ type: "text" as const, text: `Error: ${error.message}` }], isError: true };
    }
  }
}
