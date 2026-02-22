import { GoogleMapsWrapper } from "./browser-wrapper.js";
import { execSync } from "child_process";
import { ErrorCode } from "./types.js";

/**
 * PlaceService (Native CLI Execution Edition)
 * 內部呼叫 openclaw browser CLI 執行腳本，並直接返回解析後的清單資料。
 */
export class PlaceService {
  private wrapper: GoogleMapsWrapper;

  constructor() {
    this.wrapper = new GoogleMapsWrapper();
  }

  private cleanJson(output: string): string {
    const jsonMatch = output.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error(`INVALID_JSON_OUTPUT: ${output}`);
    return jsonMatch[0];
  }

  private checkBrowserStatus(): void {
    try {
      // 優先檢查是否有活動中的 Tabs
      const tabsOutput = execSync("openclaw browser tabs --profile chrome --json", { encoding: "utf8" });
      const cleanedTabs = this.cleanJson(tabsOutput);
      const tabsData = JSON.parse(cleanedTabs);
      
      if (!tabsData.tabs || tabsData.tabs.length === 0) {
        throw new Error("BROWSER_NO_ACTIVE_TABS: No active browser tabs found. Please ensure the OpenClaw Browser Relay extension is active and connected.");
      }
    } catch (error: any) {
      if (error.message.includes("BROWSER_") || error.message.includes("INVALID_JSON")) throw error;
      
      // 退而求其次檢查 status
      try {
        const statusOutput = execSync("openclaw browser status --profile chrome --json", { encoding: "utf8" });
        const cleanedStatus = this.cleanJson(statusOutput);
        const status = JSON.parse(cleanedStatus);
        if (!status.running && !status.cdpReady) {
          throw new Error("BROWSER_SERVICE_NOT_RUNNING: The browser service is not active.");
        }
      } catch (innerError: any) {
         throw new Error(`BROWSER_SERVICE_UNREACHABLE: ${error.message}`);
      }
    }
  }

  private runCli(script: string, retryCount = 0): any {
    this.checkBrowserStatus();

    try {
      const escapedScript = script.replace(/'/g, "'\\''");
      const request = JSON.stringify({
        kind: "evaluate",
        fn: escapedScript
      });
      
      const command = `openclaw browser act --profile chrome --targetId last --request '${request.replace(/'/g, "'\\''")}' --json --timeoutMs 30000`;
      
      const output = execSync(command, { encoding: "utf8" });
      const cleaned = this.cleanJson(output);
      const parsed = JSON.parse(cleaned);
      
      if (!parsed.ok) {
        throw new Error(`CLI_EXECUTION_FAILED: ${parsed.error || "Unknown error"}`);
      }
      
      const result = parsed.result;

      if (result === ErrorCode.NAVIGATING) {
        if (retryCount < 3) {
          execSync("sleep 3");
          return this.runCli(script, retryCount + 1);
        }
        throw new Error(ErrorCode.NAVIGATING);
      }
      
      if (typeof result === 'string' && Object.values(ErrorCode).includes(result as ErrorCode)) {
        throw new Error(result);
      }
      
      return result;
    } catch (error: any) {
      if (error.message?.includes("NAVIGATING")) {
        if (retryCount < 3) {
          execSync("sleep 3");
          return this.runCli(script, retryCount + 1);
        }
        throw new Error(ErrorCode.NAVIGATING);
      }
      
      const errorMsg = error.message || "";
      if (errorMsg.includes("AUTH_REQUIRED")) throw new Error(ErrorCode.AUTH_REQUIRED);
      if (errorMsg.includes("SIDEBAR_NOT_FOUND")) throw new Error(ErrorCode.SIDEBAR_NOT_FOUND);
      if (errorMsg.includes("COLLECTION_NOT_FOUND")) throw new Error(ErrorCode.COLLECTION_NOT_FOUND);
      
      throw error;
    }
  }

  async listAllCollections() {
    try {
      const collections = this.runCli(this.wrapper.listCollectionsScript);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(collections, null, 2),
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [{ type: "text" as const, text: `Error: ${error.message}` }],
        isError: true,
      };
    }
  }

  async getPlacesFromCollection(collectionName: string) {
    try {
      const places = this.runCli(this.wrapper.getPlacesScript(collectionName));
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(places, null, 2),
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [{ type: "text" as const, text: `Error: ${error.message}` }],
        isError: true,
      };
    }
  }
}
