import { execSync } from "child_process";
import { getDisplay, cleanJson } from "../utils/system.js";

export class BrowserManager {
  constructor(private _exec: typeof execSync = execSync, private debug: boolean = false) {}

  public getActiveProfile(): { name: string; hasTabs: boolean } {
    try {
      const profilesOutput = this._exec("openclaw browser profiles --json", { encoding: "utf8" });
      if (this.debug) console.log("DEBUG: profiles output:", profilesOutput);
      const json = JSON.parse(cleanJson(profilesOutput));
      const profiles = json.profiles || [];
      
      // 1. 優先尋找目前正在運行且有分頁的 profile
      const withTabs = profiles.find((p: any) => p.running && p.tabCount > 0);
      if (withTabs) return { name: withTabs.name, hasTabs: true };
    } catch (e) {
      if (this.debug) console.warn("Failed to get active profile, falling back to 'openclaw'", e);
    }
    // Fallback: 回傳預設值 "openclaw"
    return { name: "openclaw", hasTabs: false };
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
      
      // 啟動瀏覽器永遠屬於 openclaw profile，其 CDP Port 為 18800
      const port = 18800;
      const userDataDir = `/home/ubuntu/.openclaw/browsers/openclaw`;
      
      this._exec(`DISPLAY=${display} google-chrome --remote-debugging-port=${port} --user-data-dir=${userDataDir} "https://www.google.com/maps/" > /dev/null 2>&1 &`, { encoding: "utf8" });
      this._exec("sleep 8"); 
      return this.checkBrowserStatus();
    } catch (e: any) {
      if (this.debug) console.error("START_CHROME_FAILED", e);
      throw new Error("BROWSER_CONNECTION_FAILED");
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
