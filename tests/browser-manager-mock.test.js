import { jest } from "@jest/globals";
import { BrowserManager } from "../src/core/browser-manager.js";
describe("BrowserManager (Mocked Unit Test)", () => {
    let manager;
    let mockExec;
    beforeEach(() => {
        mockExec = jest.fn();
        manager = new BrowserManager(mockExec, false);
    });
    test("should return default profile when profiles call fails", () => {
        mockExec.mockImplementation(() => { throw new Error("CLI Error"); });
        const profile = manager.getActiveProfile();
        expect(profile.name).toBe("openclaw");
    });
    test("should detect running profile correctly", () => {
        const mockOutput = JSON.stringify({
            profiles: [
                { name: "chrome", running: false, tabCount: 0 },
                { name: "openclaw", running: true, tabCount: 1 }
            ]
        });
        mockExec.mockReturnValue(mockOutput);
        const profile = manager.getActiveProfile();
        expect(profile.name).toBe("openclaw");
        expect(profile.hasTabs).toBe(true);
    });
});
