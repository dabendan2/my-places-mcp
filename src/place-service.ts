import { GoogleMapsWrapper } from "./browser-wrapper.js";
import { execSync } from "child_process";
import { writeFileSync } from "fs";
import { ErrorCode } from "./types.js";

/**
 * PlaceService (Native CLI Execution Edition)
 * 內部呼叫 openclaw browser CLI 執行腳本，並直接返回解析後的清單資料。
 */
export class PlaceService {
  private wrapper: GoogleMapsWrapper;
  public _exec = execSync;
  private debug = true;

  constructor() {
    this.wrapper = new GoogleMapsWrapper();
  }

  private cleanJson(output: string | Buffer): string {
    const s = typeof output === "string" ? output : output.toString("utf8");
    const jsonMatch = s.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error(`INVALID_JSON_OUTPUT: ${s}`);
    return jsonMatch[0];
  }

  private getActiveProfile(): { name: string; hasTabs: boolean } {
    const profilesOutput = this._exec("openclaw browser profiles --json", { encoding: "utf8" });
    const { profiles } = JSON.parse(this.cleanJson(profilesOutput));
    
    const withTabs = profiles.find((p: any) => p.running && p.tabCount > 0);
    if (withTabs) return { name: withTabs.name, hasTabs: true };
    
    const running = profiles.find((p: any) => p.running);
    if (running) return { name: running.name, hasTabs: false };

    return { name: "openclaw", hasTabs: false };
  }

  private getDisplay(): string {
    try {
      const x11Files = this._exec("ls /tmp/.X11-unix/", { encoding: "utf8" });
      const match = x11Files.match(/X(\d+)/);
      return match ? `:${match[1]}` : ":1";
    } catch (e) {
      return ":1";
    }
  }

  private checkBrowserStatus(): { profile: string; targetId?: string } {
    const profileInfo = this.getActiveProfile();
    
    const tabsOutput = this._exec(`openclaw browser --browser-profile ${profileInfo.name} tabs --json`, { encoding: "utf8" });
    const { tabs } = JSON.parse(this.cleanJson(tabsOutput));
    
    const anyPage = tabs.find((t: any) => t.type === "page");
    if (anyPage) {
      console.log(`Forcing navigation to Google Maps on target ${anyPage.targetId}...`);
      this._exec(`openclaw browser --browser-profile ${profileInfo.name} navigate --target-id ${anyPage.targetId} "https://www.google.com/maps/"`, { encoding: "utf8" });
      return { profile: profileInfo.name, targetId: anyPage.targetId };
    }

    const profilesOutput = this._exec("openclaw browser profiles --json", { encoding: "utf8" });
    const { profiles } = JSON.parse(this.cleanJson(profilesOutput));
    const profileDetail = profiles.find((p: any) => p.name === profileInfo.name);

    if (profileDetail?.running) {
      console.log(`Profile ${profileInfo.name} is running but has no pages. Attempting to open one...`);
      this._exec(`openclaw browser --browser-profile ${profileInfo.name} open "https://www.google.com/maps/"`, { encoding: "utf8" });
      this._exec("sleep 3");
      const finalTabs = this._exec(`openclaw browser --browser-profile ${profileInfo.name} tabs --json`, { encoding: "utf8" });
      const { tabs: newTabs } = JSON.parse(this.cleanJson(finalTabs));
      const newPage = newTabs.find((t: any) => t.type === "page");
      return { profile: profileInfo.name, targetId: newPage?.targetId };
    }

    console.log(`Starting profile ${profileInfo.name}...`);
    try {
      const display = this.getDisplay();
      this._exec(`DISPLAY=${display} google-chrome --remote-debugging-port=18800 --user-data-dir=/home/ubuntu/.openclaw/browsers/openclaw > /dev/null 2>&1 &`, { encoding: "utf8" });
      this._exec("sleep 5");
      return this.checkBrowserStatus();
    } catch (e) {
      throw new Error("BROWSER_CONNECTION_FAILED");
    }
  }

  private runCli(script: string, retryCount = 0): any {
    const { profile, targetId } = this.checkBrowserStatus();
    const workspacePath = "/home/ubuntu/.openclaw/workspace/my-places-mcp/temp";

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
          console.warn(`Navigation detected (Context Destroyed), retrying once (1/1)...`);
          this._exec("sleep 5");
          return this.runCli(script, retryCount + 1);
        }

        output = errorMsg;
        if (this.debug) {
          writeFileSync(`${workspacePath}/exec_error_raw.log`, output);
          this.captureDebugInfo(profile, workspacePath, targetId);
        }
        throw execError;
      }
      
      if (this.debug) {
        this._exec(`mkdir -p ${workspacePath}`);
        writeFileSync(`${workspacePath}/raw_output.json`, output);
      }

      const parsed = JSON.parse(this.cleanJson(output));
      if (!parsed.ok) throw new Error(parsed.error || "CLI_EXECUTION_FAILED");
      
      const result = parsed.result;
      if (Array.isArray(result) && result.length === 0) throw new Error("NO_ELEMENTS_FOUND");
      if (typeof result === 'string' && Object.values(ErrorCode).includes(result as ErrorCode)) throw new Error(result);

      return result;
    } catch (error: any) {
      if (this.debug) {
        this.captureDebugInfo(profile, workspacePath, targetId);
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
      this._exec(`mkdir -p ${path}`);
      this._exec(`openclaw browser --browser-profile ${profile} screenshot ${targetIdArg} --path ${path}/error_screen.png`);
      const pageSource = this._exec(`openclaw browser --browser-profile ${profile} evaluate ${targetIdFlag} --fn "() => document.documentElement.outerHTML"`, { encoding: "utf8" });
      writeFileSync(`${path}/error_page_source.html`, pageSource);
    } catch (e) {
      console.error("DEBUG_CAPTURE_FAILED", e);
    }
  }

  async listAllCollections() {
    try {
      const collections = this.runCli(this.wrapper.listCollectionsScript);
      return { content: [{ type: "text" as const, text: JSON.stringify(collections, null, 2) }] };
    } catch (error: any) {
      return { content: [{ type: "text" as const, text: `Error: ${error.message}` }], isError: true };
    }
  }

  async getPlacesFromCollection(collectionName: string) {
    try {
      const places = this.runCli(this.wrapper.getPlacesScript(collectionName));
      
      if (this.debug) {
        try {
          writeFileSync("/home/ubuntu/.openclaw/workspace/my-places-mcp/temp/places_result.json", JSON.stringify(places, null, 2));
        } catch (e) {}
      }

      return { content: [{ type: "text" as const, text: JSON.stringify(places, null, 2) }] };
    } catch (error: any) {
      return { content: [{ type: "text" as const, text: `Error: ${error.message}` }], isError: true };
    }
  }
}
