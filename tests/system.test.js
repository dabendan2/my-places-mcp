import { cleanJson, getDisplay } from "../src/utils/system.js";
import { jest } from "@jest/globals";
describe("System Utils", () => {
    describe("cleanJson", () => {
        test("should extract JSON from dirty string", () => {
            const input = "Warning: something { \"ok\": true } trailing content";
            expect(JSON.parse(cleanJson(input))).toEqual({ ok: true });
        });
        test("should throw error if no JSON found", () => {
            expect(() => cleanJson("no json here")).toThrow("INVALID_JSON_OUTPUT");
        });
        test("should throw error if output is undefined", () => {
            expect(() => cleanJson(undefined)).toThrow("INVALID_JSON_OUTPUT");
        });
    });
    describe("getDisplay", () => {
        test("should parse X11 display correctly", () => {
            const mockExec = jest.fn().mockReturnValue("X0 X1 X10");
            expect(getDisplay(mockExec)).toBe(":0");
        });
        test("should fallback to :1 if no X11 files found", () => {
            const mockExec = jest.fn().mockReturnValue("");
            expect(getDisplay(mockExec)).toBe(":1");
        });
    });
});
