import { jest } from "@jest/globals";
import { BrowserManager } from "../src/core/browser-manager.js";

describe("BrowserManager Flow Detection", () => {
  let manager: BrowserManager;
  let mockExec: any;

  beforeEach(() => {
    mockExec = jest.fn();
    manager = new BrowserManager(mockExec, true);
  });

  test("should detect flow A when role=main exists", async () => {
    mockExec.mockReturnValueOnce(JSON.stringify({
      ok: true,
      result: "A"
    }));

    const flow = await (manager as any).detectFlow("test-tab", "openclaw");
    expect(flow).toBe("A");
  });

  test("should detect flow B when specific containers exist", async () => {
    mockExec.mockReturnValueOnce(JSON.stringify({
      ok: true,
      result: "B"
    }));

    const flow = await (manager as any).detectFlow("test-tab", "openclaw");
    expect(flow).toBe("B");
  });
});
