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

  private checkBrowserStatus(): void {
    const tabsOutput = this._exec("openclaw browser tabs --json", { encoding: "utf8" });
    const tabsData = JSON.parse(this.cleanJson(tabsOutput));
    
    if (!tabsData.tabs?.length) {
      throw new Error("BROWSER_NO_ACTIVE_TABS");
    }
  }

  private runCli(script: string, retryCount = 0): any {
    this.checkBrowserStatus();

    try {
      const escapedScript = script.replace(/'/g, "'\\''");
      const command = `openclaw browser evaluate --fn '${escapedScript}' --json --timeout 60000`;
      const output = this._exec(command, { encoding: "utf8" });
      
      if (this.debug) {
        try {
          writeFileSync("/home/ubuntu/.openclaw/workspace/my-places-mcp/temp/raw_output.json", output);
        } catch (e) {
          console.error("DEBUG_WRITE_RAW_FAILED", e);
        }
      }

      const parsed = JSON.parse(this.cleanJson(output));
      if (!parsed.ok) throw new Error(parsed.error || "CLI_EXECUTION_FAILED");
      
      const result = parsed.result;
      
      if (Array.isArray(result) && result.length === 0) throw new Error("NO_ELEMENTS_FOUND");
      if (typeof result === 'string' && Object.values(ErrorCode).includes(result as ErrorCode)) throw new Error(result);
      
      if (this.debug) {
        try {
          writeFileSync("/home/ubuntu/.openclaw/workspace/my-places-mcp/temp/result.json", JSON.stringify(result, null, 2));
        } catch (e) {}
      }

      return result;
    } catch (error: any) {
      const msg = error.message || "";
      for (const code of Object.values(ErrorCode)) {
        if (msg.includes(code)) throw new Error(code);
      }
      throw error;
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
