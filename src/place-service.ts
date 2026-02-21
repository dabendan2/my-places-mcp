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

  private runCli(script: string): any {
    try {
      // 構建 CLI 指令，並透過 JSON 格式傳遞腳本以避免轉義問題
      const request = JSON.stringify({
        kind: "evaluate",
        fn: script
      });
      
      const command = `openclaw browser act --profile chrome --targetId last --request '${request.replace(/'/g, "'\\''")}'`;
      const output = execSync(command, { encoding: "utf8" });
      
      // 預期 openclaw CLI 輸出 JSON 格式的結果
      const parsed = JSON.parse(output);
      
      if (!parsed.ok) {
        throw new Error(parsed.error || "CLI_EXECUTION_FAILED");
      }
      
      // 處理 GoogleMaps 狀態代碼 (如 NAVIGATING)
      if (Object.values(ErrorCode).includes(parsed.result)) {
        throw new Error(parsed.result);
      }
      
      return parsed.result;
    } catch (error: any) {
      if (error.message?.includes("NAVIGATING")) throw new Error(ErrorCode.NAVIGATING);
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
