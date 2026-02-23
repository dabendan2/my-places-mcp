import { jest } from "@jest/globals";
import { BrowserManager } from "../src/core/browser-manager.js";
describe("BrowserManager Version Detection", () => {
    let manager;
    let mockExec;
    beforeEach(() => {
        mockExec = jest.fn();
        manager = new BrowserManager(mockExec, true);
    });
    test("should detect LEGACY version when .CsEnBe elements exist", async () => {
        mockExec.mockReturnValueOnce(JSON.stringify({
            ok: true,
            result: true // .CsEnBe exists
        }));
        const version = await manager.detectVersion("test-tab", "openclaw");
        expect(version).toBe("LEGACY");
    });
    test("should detect MODERN version when .CsEnBe missing and new elements exist", async () => {
        mockExec.mockReturnValueOnce(JSON.stringify({
            ok: true,
            result: false // .CsEnBe missing
        }));
        const version = await manager.detectVersion("test-tab", "openclaw");
        expect(version).toBe("MODERN");
    });
});
