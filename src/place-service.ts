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

  private runCli(script: string, retryCount = 0): any {
    try {
      const request = JSON.stringify({
        kind: "evaluate",
        fn: script
      });
      
      const command = `openclaw browser act --profile chrome --targetId last --request '${request.replace(/'/g, "'\\''")}'`;
      const output = execSync(command, { encoding: "utf8" });
      const parsed = JSON.parse(output);
      
      if (!parsed.ok) {
        throw new Error(parsed.error || "CLI_EXECUTION_FAILED");
      }
      
      // 內部處理 NAVIGATING 狀態
      if (parsed.result === ErrorCode.NAVIGATING) {
        if (retryCount < 3) {
          execSync("sleep 3");
          return this.runCli(script, retryCount + 1);
        }
        throw new Error(ErrorCode.NAVIGATING);
      }
      
      if (Object.values(ErrorCode).includes(parsed.result)) {
        throw new Error(parsed.result);
      }
      
      return parsed.result;
    } catch (error: any) {
      if (error.message?.includes("NAVIGATING")) {
        if (retryCount < 3) {
          execSync("sleep 3");
          return this.runCli(script, retryCount + 1);
        }
        throw new Error(ErrorCode.NAVIGATING);
      }
      if (error.message?.includes("AUTH_REQUIRED")) throw new Error(ErrorCode.AUTH_REQUIRED);
      if (error.message?.includes("SIDEBAR_NOT_FOUND")) throw new Error(ErrorCode.SIDEBAR_NOT_FOUND);
      if (error.message?.includes("COLLECTION_NOT_FOUND")) throw new Error(ErrorCode.COLLECTION_NOT_FOUND);
      
      throw new Error(`INTERNAL_ERROR: ${error.message}`);
    }
  }

  async listAllCollections() {
    const collections = this.runCli(this.wrapper.listCollectionsScript);
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(collections, null, 2),
        },
      ],
    };
  }

  async getPlacesFromCollection(collectionName: string) {
    const places = this.runCli(this.wrapper.getPlacesScript(collectionName));
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(places, null, 2),
        },
      ],
    };
  }
}
