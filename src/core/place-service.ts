import { GoogleMapsWrapper } from "./browser-wrapper.js";
import { execSync } from "child_process";
import { writeFileSync, mkdirSync } from "fs";
import { ErrorCode } from "./types.js";
import { getDisplay, cleanJson } from "../utils/system.js";

/**
 * PlaceService (Native CLI Execution Edition)
 * 內部呼叫 openclaw browser CLI 執行腳本，並直接返回解析後的清單資料。
 */
export class PlaceService {
  private wrapper: GoogleMapsWrapper;
  public _exec = execSync;
  private debug = process.env.DEBUG === "true";

  constructor() {
    this.wrapper = new GoogleMapsWrapper();
  }

  private getActiveProfile(): { name: string; hasTabs: boolean } {
    try {
      const profilesOutput = this._exec("openclaw browser profiles --json", { encoding: "utf8" });
      const json = JSON.parse(cleanJson(profilesOutput));
      const profiles = json.profiles || [];
      
      const withTabs = profiles.find((p: any) => p.running && p.tabCount > 0);
      if (withTabs) return { name: withTabs.name, hasTabs: true };
      
      const running = profiles.find((p: any) => p.running);
      if (running) return { name: running.name, hasTabs: false };
    } catch (e) {
      if (this.debug) console.warn("Failed to get active profile, falling back to 'openclaw'", e);
    }

    return { name: "openclaw", hasTabs: false };
  }

  private checkBrowserStatus(): { profile: string; targetId?: string } {
    const profileInfo = this.getActiveProfile();
    
    const tabsOutput = this._exec(`openclaw browser --browser-profile ${profileInfo.name} tabs --json`, { encoding: "utf8" });
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
      const display = getDisplay(this._exec);
      this._exec(`DISPLAY=${display} google-chrome --remote-debugging-port=18800 --user-data-dir=/home/ubuntu/.openclaw/browsers/openclaw > /dev/null 2>&1 &`, { encoding: "utf8" });
      this._exec("sleep 5");
      return this.checkBrowserStatus();
    } catch (e) {
      throw new Error("BROWSER_CONNECTION_FAILED");
    }
  }

  private runCli(script: string, retryCount = 0): any {
    const { profile, targetId } = this.checkBrowserStatus();
    const tempPath = "/home/ubuntu/.my-places-mcp/debug";

    try {
      const escapedScript = script.replace(/'/g, "'\\''");
      const targetArg = targetId ? `--target-id ${targetId}` : "";
      const command = `openclaw browser --browser-profile ${profile} evaluate ${targetArg} --fn '${escapedScript}' --json --timeout 60000`;
      
      let output: string = "";
      try {
        output = this._exec(command, { encoding: "utf8" });
      } catch (execError: any) {
        const errorMsg = execError.stdout?.toString() || execError.message || "";
        if (errorMsg.includes("Execution context was destroyed") && retryCount < 1) {
          if (this.debug) console.warn(`Navigation detected (Context Destroyed), retrying once (1/1)...`);
          this._exec("sleep 5");
          return this.runCli(script, retryCount + 1);
        }

        output = errorMsg;
        if (this.debug) {
          try { mkdirSync(tempPath, { recursive: true }); } catch (e) {}
          try { writeFileSync(`${tempPath}/cli_exec_error.log`, output); } catch (e) {}
          this.captureDebugInfo(profile, tempPath, targetId);
        }
        throw execError;
      }
      
      if (this.debug) {
        try { mkdirSync(tempPath, { recursive: true }); } catch (e) {}
        try { writeFileSync(`${tempPath}/browser_evaluate_raw_response.json`, output); } catch (e) {}
      }

      const parsed = JSON.parse(cleanJson(output));
      if (!parsed.ok) throw new Error(parsed.error || "CLI_EXECUTION_FAILED");
      
      const result = parsed.result;
      if (Array.isArray(result) && result.length === 0) throw new Error("NO_ELEMENTS_FOUND");
      if (typeof result === 'string' && Object.values(ErrorCode).includes(result as ErrorCode)) throw new Error(result);

      return result;
    } catch (error: any) {
      if (this.debug) {
        this.captureDebugInfo(profile, tempPath, targetId);
      }

      const msg = error.message || "";
      for (const code of Object.values(ErrorCode)) {
        if (msg.includes(`Error: ${code}`) || msg === code) throw new Error(code);
      }
      throw error;
    }
  }

  private captureDebugInfo(profile: string, path: string, targetId?: string): void {
    try {
      const targetIdArg = targetId ? targetId : "";
      const targetIdFlag = targetId ? `--target-id ${targetId}` : "";
      try { mkdirSync(path, { recursive: true }); } catch (e) {}
      this._exec(`openclaw browser --browser-profile ${profile} screenshot ${targetIdArg} --path ${path}/last_error_screenshot.png`);
      const pageSource = this._exec(`openclaw browser --browser-profile ${profile} evaluate ${targetIdFlag} --fn "() => document.documentElement.outerHTML"`, { encoding: "utf8" });
      try { writeFileSync(`${path}/last_error_page_source.html`, pageSource); } catch (e) {}
    } catch (e) {
      if (this.debug) console.error("DEBUG_CAPTURE_FAILED", e);
    }
  }

  async listAllCollections() {
    try {
      const collections = this.runCli(this.wrapper.listCollectionsScript);
      return { content: [{ type: "text" as const, text: JSON.stringify(collections, null, 2) }] };
    } catch (error: any) {
      const msg = error.stdout?.toString() || error.message || "UNKNOWN_ERROR";
      return { content: [{ type: "text" as const, text: `Error: ${msg}` }], isError: true };
    }
  }

  async getPlacesFromCollection(collectionName: string) {
    try {
      const places = this.runCli(this.wrapper.getPlacesScript(collectionName));
      
      if (this.debug) {
        try {
          const tempPath = "/home/ubuntu/.my-places-mcp/debug";
          mkdirSync(tempPath, { recursive: true });
          writeFileSync(`${tempPath}/last_places_result.json`, JSON.stringify(places, null, 2));
        } catch (e) {}
      }

      return { content: [{ type: "text" as const, text: JSON.stringify(places, null, 2) }] };
    } catch (error: any) {
      const msg = error.stdout?.toString() || error.message || "UNKNOWN_ERROR";
      return { content: [{ type: "text" as const, text: `Error: ${msg}` }], isError: true };
    }
  }
}
