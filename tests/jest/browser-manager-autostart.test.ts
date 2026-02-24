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
    // getActiveProfile (in checkBrowserStatus line 13)
    // Forced "openclaw", but checkBrowserStatus calls getActiveProfile which is now hardcoded.
    
    // tabs -> Should return empty (line 17)
    mockExec.mockReturnValueOnce(JSON.stringify({ tabs: [] }));
    // get profiles detail (line 25)
    mockExec.mockReturnValueOnce(JSON.stringify({ profiles: [] }));
    // getDisplay (in line 45)
    mockExec.mockReturnValueOnce(":0");
    // google-chrome start call (line 52)
    mockExec.mockReturnValueOnce("");
    // ps check (line 59) -> Needs to return something containing "google-chrome"
    mockExec.mockReturnValueOnce("ubuntu 1234 0.0 0.0 1234 5678 ? Ss 00:00 0:00 google-chrome --port=18800");

    // sleep call (line 70)
    mockExec.mockReturnValueOnce("");

    // 2. Second call (recursive checkBrowserStatus line 71)
    // tabs (line 17)
    mockExec.mockReturnValueOnce(JSON.stringify({ tabs: [{ type: "page", targetId: "new-tab" }] }));
    // navigate (line 22)
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
    // getActiveProfile (hardcoded "openclaw")
    
    // tabs (line 17)
    mockExec.mockReturnValueOnce(JSON.stringify({ tabs: [{ type: "page", targetId: "existing-tab" }] }));
    // navigate (line 22)
    mockExec.mockReturnValueOnce("");

    const result = manager.checkBrowserStatus();

    expect(result.targetId).toBe("existing-tab");
    expect(mockExec).not.toHaveBeenCalledWith(expect.stringContaining("google-chrome"));
  });
});
