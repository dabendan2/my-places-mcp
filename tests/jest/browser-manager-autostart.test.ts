import { jest } from "@jest/globals";
import { BrowserManager } from "../src/core/browser-manager.js";

describe("BrowserManager (Auto-Start Unit Test)", () => {
  let manager: BrowserManager;
  let mockExec: any;

  beforeEach(() => {
    mockExec = jest.fn();
    manager = new BrowserManager(mockExec as any, false);
  });

  test("should start chrome when no profiles are running", () => {
    mockExec.mockReturnValueOnce(JSON.stringify({ tabs: [] })); // line 17: tabs
    mockExec.mockReturnValueOnce(JSON.stringify({ profiles: [] })); // line 25: profiles detail
    mockExec.mockReturnValueOnce(":0"); // line 45: getDisplay
    mockExec.mockReturnValueOnce(""); // line 52: google-chrome start
    mockExec.mockReturnValueOnce("ubuntu 1234 0.0 0.0 1234 5678 ? Ss 00:00 0:00 google-chrome --port=18800"); // line 59: ps check
    mockExec.mockReturnValueOnce(""); // line 70: sleep
    mockExec.mockReturnValueOnce(JSON.stringify({ tabs: [{ type: "page", targetId: "new-tab" }] })); // line 17 (recursive): tabs
    mockExec.mockReturnValueOnce(""); // line 22 (recursive): navigate

    const result = manager.checkBrowserStatus();
    expect(result.targetId).toBe("new-tab");
  });

  test("should open new page if profile is running but has no pages", () => {
    mockExec.mockReturnValueOnce(JSON.stringify({ tabs: [] })); // line 17: tabs
    mockExec.mockReturnValueOnce(JSON.stringify({ profiles: [{ name: "openclaw", running: true }] })); // line 25: profiles detail
    mockExec.mockReturnValueOnce(""); // line 31: open url
    mockExec.mockReturnValueOnce(""); // line 32: sleep
    mockExec.mockReturnValueOnce(JSON.stringify({ tabs: [{ type: "page", targetId: "opened-tab" }] })); // line 33: final tabs
    
    const result = manager.checkBrowserStatus();
    expect(result.targetId).toBe("opened-tab");
  });

  test("should use existing tab if available", () => {
    mockExec.mockReturnValueOnce(JSON.stringify({ tabs: [{ type: "page", targetId: "existing-tab" }] })); // line 17: tabs
    mockExec.mockReturnValueOnce(""); // line 22: navigate
    const result = manager.checkBrowserStatus();
    expect(result.targetId).toBe("existing-tab");
  });

  test("should handle start chrome failure (process not found)", () => {
    mockExec.mockReturnValueOnce(JSON.stringify({ tabs: [] })); // line 17: tabs
    mockExec.mockReturnValueOnce(JSON.stringify({ profiles: [] })); // line 25: profiles detail
    mockExec.mockReturnValueOnce(":0"); // line 45: getDisplay
    mockExec.mockReturnValueOnce(""); // line 52: google-chrome start
    mockExec.mockReturnValue("no-chrome-here"); // line 59: ps check (fails for all 5 attempts)
    
    expect(() => manager.checkBrowserStatus()).toThrow("BROWSER_START_FAILED: CHROME_PROCESS_NOT_FOUND_AFTER_START");
  });

  test("detectFlow should return correct flow version", async () => {
    mockExec.mockReturnValueOnce(JSON.stringify({ ok: true, result: "B" }));
    const flow = await manager.detectFlow("tid", "prof");
    expect(flow).toBe("B");
  });

  test("detectFlow should throw error for unknown flow", async () => {
    mockExec.mockReturnValueOnce(JSON.stringify({ ok: true, result: "UNKNOWN" }));
    await expect(manager.detectFlow("tid", "prof")).rejects.toThrow("ERROR_UNKNOWN_FLOW");
  });
});
