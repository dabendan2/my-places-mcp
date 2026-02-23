import { execSync, spawnSync } from "child_process";
import { writeFileSync, mkdirSync } from "fs";
import { ErrorCode, LIST_COLLECTIONS_TEMPLATE, GET_PLACES_TEMPLATE } from "./constants.js";
import { cleanJson, DEBUG_DIR } from "../utils/system.js";
import { BrowserManager } from "./browser-manager.js";

/**
 * PlaceService (Native CLI Execution Edition)
 * 內部呼叫 openclaw browser CLI 執行腳本，並直接返回解析後的清單資料。
 */
export class PlaceService {
  public _exec = execSync;
  public _spawn = spawnSync; // 新增可注入的 spawn
  private debug = process.env.DEBUG === "true";
  private browserManager: BrowserManager;

  constructor() {
    this.browserManager = new BrowserManager(this._exec, this.debug);
  }

  private runCli(script: string): any {
    const { profile, targetId } = this.browserManager.checkBrowserStatus();

    try {
      const escapedScript = script.replace(/'/g, "'\\''");
      const targetArg = targetId ? `--target-id ${targetId}` : "";
      const command = `openclaw browser --browser-profile ${profile} evaluate ${targetArg} --fn '${escapedScript}' --json --timeout 60000`;
      
      const result = this._spawn(command, { shell: true, encoding: 'utf8' } as any);
      const stdout = result.stdout?.toString() || "";
      const stderr = result.stderr?.toString() || "";

      if (this.debug) {
        try { 
          mkdirSync(DEBUG_DIR, { recursive: true });
          writeFileSync(`${DEBUG_DIR}/browser_evaluate_raw_stdout.json`, stdout);
          if (stderr) writeFileSync(`${DEBUG_DIR}/browser_evaluate_raw_stderr.log`, stderr);
        } catch (e) {}
      }

      if (result.status !== 0) {
        const errorMsg = stderr || stdout || "CLI_EXECUTION_FAILED";
        if (this.debug) {
          try { writeFileSync(`${DEBUG_DIR}/cli_exec_error.log`, `STATUS: ${result.status}\nERROR: ${errorMsg}`); } catch (e) {}
          this.captureDebugInfo(profile, DEBUG_DIR, targetId);
        }
        throw new Error(errorMsg);
      }

      const parsed = JSON.parse(cleanJson(stdout));
      if (!parsed.ok) throw new Error(parsed.error || "CLI_EXECUTION_FAILED");
      
      const evalResult = parsed.result;
      if (Array.isArray(evalResult) && evalResult.length === 0) throw new Error("NO_ELEMENTS_FOUND");
      if (typeof evalResult === 'string' && Object.values(ErrorCode).includes(evalResult as ErrorCode)) throw new Error(evalResult);

      return evalResult;
    } catch (error: any) {
      if (this.debug) {
        this.captureDebugInfo(profile, DEBUG_DIR, targetId);
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
      const collections = this.runCli(LIST_COLLECTIONS_TEMPLATE);
      return { content: [{ type: "text" as const, text: JSON.stringify(collections, null, 2) }] };
    } catch (error: any) {
      const msg = error.message || "UNKNOWN_ERROR";
      throw new Error(msg);
    }
  }

  async getPlacesFromCollection(collectionName: string) {
    try {
      const places = this.runCli(GET_PLACES_TEMPLATE(collectionName));
      
      if (this.debug) {
        try {
          mkdirSync(DEBUG_DIR, { recursive: true });
          writeFileSync(`${DEBUG_DIR}/last_places_result.json`, JSON.stringify(places, null, 2));
        } catch (e) {}
      }

      return { content: [{ type: "text" as const, text: JSON.stringify(places, null, 2) }] };
    } catch (error: any) {
      const msg = error.message || "UNKNOWN_ERROR";
      throw new Error(msg);
    }
  }
}
