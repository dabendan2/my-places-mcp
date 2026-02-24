import { execSync } from "child_process";
import { getDisplay, cleanJson } from "../utils/system.js";

export class BrowserManager {
  constructor(private _exec: typeof execSync = execSync, private debug: boolean = false) {}

  public getActiveProfile(): { name: string; hasTabs: boolean } {
    // 永遠強制使用 "openclaw" profile，確保與硬編碼的 18800 端口及 userDataDir 一致
    return { name: "openclaw", hasTabs: true };
  }

  public checkBrowserStatus(): { profile: string; targetId?: string } {
    const profileInfo = this.getActiveProfile();
    if (this.debug) console.log("DEBUG: active profile:", profileInfo);
    
    const tabsOutput = this._exec(`openclaw browser --browser-profile ${profileInfo.name} tabs --json`, { encoding: "utf8" });
    if (this.debug) console.log("DEBUG: tabs output:", tabsOutput);
    const json = JSON.parse(cleanJson(tabsOutput));
    const tabs = json.tabs || [];
    
    const anyPage = tabs.find((t: any) => t.type === "page");
    if (anyPage) {
      if (this.debug) console.log(`Forcing navigation to Google Maps on target ${anyPage.targetId}...`);
      this._exec(`openclaw browser --browser-profile ${profileInfo.name} navigate --target-id ${anyPage.targetId} "https://www.google.com/maps/"`, { encoding: "utf8" });
      return { profile: profileInfo.name, targetId: anyPage.targetId };
    }

    const profilesOutput = this._exec("openclaw browser profiles --json", { encoding: "utf8" });
    const jsonProfiles = JSON.parse(cleanJson(profilesOutput));
    const profiles = jsonProfiles.profiles || [];
    const profileDetail = profiles.find((p: any) => p.name === profileInfo.name);

    if (profileDetail?.running) {
      if (this.debug) console.log(`Profile ${profileInfo.name} is running but has no pages. Attempting to open one...`);
      this._exec(`openclaw browser --browser-profile ${profileInfo.name} open "https://www.google.com/maps/"`, { encoding: "utf8" });
      this._exec("sleep 3");
      const finalTabsOutput = this._exec(`openclaw browser --browser-profile ${profileInfo.name} tabs --json`, { encoding: "utf8" });
      const jsonFinal = JSON.parse(cleanJson(finalTabsOutput));
      const newTabs = jsonFinal.tabs || [];
      const newPage = newTabs.find((t: any) => t.type === "page");
      return { profile: profileInfo.name, targetId: newPage?.targetId };
    }

    if (this.debug) console.log(`Starting profile ${profileInfo.name}...`);
    try {
      let display = ":0";
      try {
        display = getDisplay(this._exec);
      } catch (e) {
        if (this.debug) console.warn("Could not detect DISPLAY, defaulting to :0");
      }
      
      const port = 18800;
      const userDataDir = `/home/ubuntu/.openclaw/browsers/openclaw`;
      
      // 1. 執行啟動命令並檢查是否立即崩潰
      try {
        this._exec(`DISPLAY=${display} google-chrome --remote-debugging-port=${port} --user-data-dir=${userDataDir} "https://www.google.com/maps/" > /dev/null 2>&1 &`, { encoding: "utf8" });
      } catch (execErr: any) {
        throw new Error(`EXEC_START_FAILED: ${execErr.message}`);
      }

      // 2. 密集檢查進程是否存活 (取代盲目 sleep 8)
      let started = false;
      for (let i = 0; i < 5; i++) {
        const ps = this._exec(`ps aux | grep google-chrome | grep "port=${port}" | grep -v grep || true`, { encoding: "utf8" }) || "";
        if (ps.includes("google-chrome")) {
          started = true;
          break;
        }
        this._exec("sleep 1");
      }

      if (!started) {
        throw new Error("CHROME_PROCESS_NOT_FOUND_AFTER_START");
      }

      this._exec("sleep 3"); // 給予 CDP 建立時間
      return this.checkBrowserStatus();
    } catch (e: any) {
      if (this.debug) console.error("START_CHROME_FATAL", e);
      throw new Error(`BROWSER_START_FAILED: ${e.message}`);
    }
  }

  public async detectFlow(targetId: string, profile: string): Promise<string> {
    const cmd = `openclaw browser --browser-profile ${profile} act --target-id ${targetId} --kind evaluate --fn "(() => {
      if (document.querySelector('.XiKgde, .WNBkOb')) return 'B';
      const mainEl = document.querySelector('div[role=\\"main\\"]');
      if (mainEl && mainEl.querySelector('button.CsEnBe')) return 'A';
      return 'UNKNOWN';
    })()" --json`;
    
    try {
      const output = this._exec(cmd, { encoding: "utf8" });
      const json = JSON.parse(cleanJson(output));
      if (!json.ok) throw new Error(json.error || "FLOW_DETECTION_FAILED");
      const flow = json.result;
      if (flow === "UNKNOWN") throw new Error("ERROR_UNKNOWN_FLOW");
      return flow;
    } catch (e: any) {
      throw new Error(`FLOW_DETECTION_FAILED: ${e.message}`);
    }
  }
}
