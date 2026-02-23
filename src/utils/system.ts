import { execSync } from "child_process";
import path from "path";
import os from "os";

export const DEBUG_DIR = path.join(os.homedir(), ".my-places-mcp", "debug");

/**
 * 檢測當前環境的 X11 Display
 */
export function getDisplay(exec: typeof execSync = execSync): string {
  try {
    const x11Files = exec("ls /tmp/.X11-unix/", { encoding: "utf8" });
    const match = x11Files.match(/X(\d+)/);
    return match ? `:${match[1]}` : ":1";
  } catch (e) {
    return ":1";
  }
}

/**
 * 清理並提取 CLI 輸出的 JSON 部分
 */
export function cleanJson(output: string | Buffer | undefined): string {
  if (output === undefined) throw new Error("INVALID_JSON_OUTPUT: undefined");
  const s = typeof output === "string" ? output : output.toString("utf8");
  const jsonMatch = s.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error(`INVALID_JSON_OUTPUT: ${s}`);
  return jsonMatch[0];
}
