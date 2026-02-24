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
    // 1. First call (checkBrowserStatus)
    // getActiveProfile -> No running profiles
    mockExec.mockReturnValueOnce(JSON.stringify({ profiles: [] }));
    // tabs -> Should return empty (mocking the CLI failure/empty output)
    mockExec.mockReturnValueOnce(JSON.stringify({ tabs: [] }));
    // get profiles detail -> Still empty
    mockExec.mockReturnValueOnce(JSON.stringify({ profiles: [] }));
    // getDisplay
    mockExec.mockReturnValueOnce(":0");
    // google-chrome start call
    mockExec.mockReturnValueOnce("");
    // sleep call
    mockExec.mockReturnValueOnce("");

    // 2. Second call (recursive checkBrowserStatus)
    // getActiveProfile
    mockExec.mockReturnValueOnce(JSON.stringify({ profiles: [{ name: "openclaw", running: true, tabCount: 1 }] }));
    // tabs
    mockExec.mockReturnValueOnce(JSON.stringify({ tabs: [{ type: "page", targetId: "new-tab" }] }));
    // navigate
    mockExec.mockReturnValueOnce("");

    const result = manager.checkBrowserStatus();

    // Verify chrome was started
    const chromeStartCall = mockExec.mock.calls.find((call: any) => call[0].includes("google-chrome"));
    expect(chromeStartCall).toBeDefined();
    expect(chromeStartCall[0]).toContain("--remote-debugging-port=18800");
    expect(chromeStartCall[0]).toContain("--user-data-dir=/home/ubuntu/.openclaw/browsers/openclaw");
    expect(result.targetId).toBe("new-tab");
  });

  test("should use existing tab if available", () => {
    // getActiveProfile
    mockExec.mockReturnValueOnce(JSON.stringify({ profiles: [{ name: "openclaw", running: true, tabCount: 1 }] }));
    // tabs
    mockExec.mockReturnValueOnce(JSON.stringify({ tabs: [{ type: "page", targetId: "existing-tab" }] }));
    // navigate
    mockExec.mockReturnValueOnce("");

    const result = manager.checkBrowserStatus();

    expect(result.targetId).toBe("existing-tab");
    expect(mockExec).not.toHaveBeenCalledWith(expect.stringContaining("google-chrome"));
  });
});
